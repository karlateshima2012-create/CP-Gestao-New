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

                // Determine new level — logically looping on the LAST available level
                $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->where('tenant_id', $request->tenant_id)->first();
                $levelsConfig = $loyalty ? ($loyalty->levels_config ?? []) : [];
                $currentLevel = (int)($customer->loyalty_level ?? 1);
                $totalLevels  = is_array($levelsConfig) ? count($levelsConfig) : 0;

                // Loop logic:
                // If there are no levels configured (fallback), use Level 1.
                // If currentLevel is at or beyond totalLevels, loop on the LAST one.
                if ($totalLevels === 0) {
                    $nextLevel = 1;
                } elseif ($currentLevel >= $totalLevels) {
                    $nextLevel = $totalLevels; // Stay/Loop on the final level
                } else {
                    $nextLevel = $currentLevel + 1;
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
                $loyalty = \App\Models\LoyaltySetting::withoutGlobalScopes()->where('tenant_id', $request->tenant_id)->first();
                $levelsConfig = $loyalty ? ($loyalty->levels_config ?? []) : [];
                $currentLevelIdx = max(0, (int)($customer->loyalty_level ?? 1) - 1);
                
                $goal = 10; // Default fallback
                if (isset($levelsConfig[$currentLevelIdx]) && isset($levelsConfig[$currentLevelIdx]['goal'])) {
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
