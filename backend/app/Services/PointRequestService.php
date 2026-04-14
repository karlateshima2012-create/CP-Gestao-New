<?php

namespace App\Services;

use App\Models\PointRequest;
use App\Models\PointMovement;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

class PointRequestService
{
    /**
     * Apply points/redemption from a PointRequest or Visit to a Customer.
     */
    public function applyPoints($request)
    {
        return DB::transaction(function () use ($request) {
            $customer = Customer::withoutGlobalScopes()->findOrFail($request->customer_id);
            $meta = $request->meta ?? [];
            $isVisit = $request instanceof \App\Models\Visit;
            $pointsToAddRaw = $isVisit ? $request->points_granted : $request->requested_points;
            $isRedemption = $meta['is_redemption'] ?? false;

            if ($isRedemption) {
                $goal = $meta['goal'] ?? 0;

                // Determine new level — logically skipping inactive levels
                $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->where('tenant_id', $request->tenant_id)->first();
                $levelsConfig = $loyalty ? ($loyalty->levels_config ?? []) : [];
                $currentLevelIdx = (int)($customer->loyalty_level ?? 1) - 1;
                $totalLevels = count($levelsConfig);

                $nextLevel = $currentLevelIdx + 1; // Default next candidate

                // If we have levels, find the next one that is ACTIVE
                if ($totalLevels > 0) {
                    $foundNext = false;
                    for ($i = $currentLevelIdx + 1; $i < $totalLevels; $i++) {
                        if (isset($levelsConfig[$i]['active']) && $levelsConfig[$i]['active'] === true) {
                            $nextLevel = $i + 1;
                            $foundNext = true;
                            break;
                        }
                    }

                    // If NO active level found ahead, either loop back to first active or stay at last active
                    // Rule: Stay at the current level or loop on the final one if no more actives exist.
                    if (!$foundNext) {
                        // If current level was already at/past total, stay there.
                        // Otherwise, we keep the last candidate or just stay at current.
                        $nextLevel = min($currentLevelIdx + 1, $totalLevels);
                    }
                } else {
                    $nextLevel = 1; // Fallback
                }

                // Update customer state
                // Reset balance to the visit points of the NEW level (the point of THIS visit)
                $customer->points_balance = $pointsToAddRaw;
                $customer->loyalty_level  = $nextLevel;
                $customer->attendance_count = ($customer->attendance_count ?? 0) + 1;
                $customer->last_activity_at = now();

                // Flag for frontend notification
                $prefs = $customer->preferences ?? [];
                $prefs['pending_level_up_announcement'] = true;
                $customer->preferences = $prefs;

                $customer->save();

                $source = $isVisit ? $request->origin : $request->source;

                // Log Redemption Movement
                try {
                    PointMovement::create([
                        'tenant_id' => $request->tenant_id,
                        'customer_id' => $customer->id,
                        'type' => 'redeem',
                        'points' => -$goal,
                        'origin' => $source,
                        'device_id' => ($request instanceof \App\Models\PointRequest) ? $request->device_id : null,
                        'description' => 'Resgate de prêmio via: ' . $request->id,
                        'meta' => [
                            'request_id' => $request->id,
                            'goal' => $goal,
                            'new_level' => $customer->loyalty_level,
                        ]
                    ]);
                } catch (\Exception $e) {
                    \Log::warning("PointMovement REDEEM failed logs: " . $e->getMessage());
                }

                // Log Earn Movement
                try {
                    PointMovement::create([
                        'tenant_id' => $request->tenant_id,
                        'customer_id' => $customer->id,
                        'type' => 'earn',
                        'points' => $pointsToAddRaw,
                        'origin' => $source,
                        'device_id' => ($request instanceof \App\Models\PointRequest) ? $request->device_id : null,
                        'description' => 'Pontos da visita (Resgate) via: ' . $request->id,
                        'meta' => [
                            'request_id' => $request->id,
                        ]
                    ]);
                } catch (\Exception $e) {
                    \Log::warning("PointMovement EARN (resgate) failed logs: " . $e->getMessage());
                }
            } else {
                // Determine the goal to ensure we never exceed it
                // Atomic DB lookup to bypass Scope/Cache issues in CI
                $tenantData = DB::table('tenants')->where('id', $request->tenant_id)->first();
                $loyaltyData = DB::table('loyalty_settings')->where('tenant_id', $request->tenant_id)->first();
                
                $levelsConfig = $loyaltyData ? json_decode($loyaltyData->levels_config ?? '[]', true) : [];
                $currentLevelIdx = max(0, (int)($customer->loyalty_level ?? 1) - 1);
                
                $goal = (int)($tenantData->points_goal ?? 10);
                if (is_array($levelsConfig) && isset($levelsConfig[$currentLevelIdx]) && isset($levelsConfig[$currentLevelIdx]['goal'])) {
                    $goal = (int)$levelsConfig[$currentLevelIdx]['goal'];
                }

                // Simple Credit with capping at Meta
                $newBalance = ($customer->points_balance ?? 0) + $pointsToAddRaw;
                
                // Rule: Balance can NEVER be higher than meta.
                if ($newBalance > $goal) {
                    $newBalance = $goal;
                }
                
                $customer->points_balance = $newBalance;
                
                // Only increment attendance if it's NOT a manual adjustment or removal
                $isAdjustment = in_array($isVisit ? $request->origin : $request->source, ['ajuste_manual', 'correcao', 'extra']);
                
                if (!$isAdjustment) {
                    $customer->increment('attendance_count');
                }
                
                $customer->update(['last_activity_at' => now(), 'points_balance' => $newBalance]);

                $source = $isVisit ? $request->origin : $request->source;
                $reason = $meta['reason'] ?? null;
                $finalDescription = $isAdjustment 
                    ? ($reason ? "Ajuste manual: $reason" : 'Ajuste manual de pontos')
                    : ($reason ? "Lojista: $reason" : 'Pontos creditados via: ' . $request->id);

                // Log Adjustment Movement
                try {
                    PointMovement::create([
                        'tenant_id' => $request->tenant_id,
                        'customer_id' => $customer->id,
                        'type' => $isAdjustment ? 'adjustment' : 'earn',
                        'points' => $pointsToAddRaw,
                        'origin' => $source,
                        'device_id' => ($request instanceof \App\Models\PointRequest) ? $request->device_id : null,
                        'description' => $finalDescription,
                        'meta' => [
                            'request_id' => $request->id,
                            'reason' => $reason
                        ]
                    ]);
                } catch (\Exception $e) {
                    \Log::warning("PointMovement LOGGING failed: " . $e->getMessage());
                }
            }

            return true;
        });
    }
}
