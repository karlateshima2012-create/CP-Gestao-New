<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * V2 Safety Guard Migration
 * 
 * Esta migration garante que TODAS as colunas novas da V2
 * existam na V1 para evitar Server Error 500 após o upgrade.
 * É idempotente: pode ser executada múltiplas vezes com segurança.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. CUSTOMERS ─────────────────────────────────────────
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'instagram')) {
                $table->string('instagram', 100)->nullable()->after('address');
            }
            if (!Schema::hasColumn('customers', 'preferences')) {
                $table->json('preferences')->nullable()->after('tags');
            }
            if (!Schema::hasColumn('customers', 'attendance_count')) {
                $table->unsignedInteger('attendance_count')->default(0)->after('preferences');
            }
            if (!Schema::hasColumn('customers', 'last_activity_at')) {
                $table->timestamp('last_activity_at')->nullable()->after('attendance_count');
            }
            if (!Schema::hasColumn('customers', 'foto_perfil_url')) {
                $table->text('foto_perfil_url')->nullable();
            }
            if (!Schema::hasColumn('customers', 'company_name')) {
                $table->string('company_name')->nullable();
            }
        });

        // ── 2. VISITS ─────────────────────────────────────────────
        if (Schema::hasTable('visits')) {
            Schema::table('visits', function (Blueprint $table) {
                if (!Schema::hasColumn('visits', 'is_seen')) {
                    $table->boolean('is_seen')->default(false)->after('status');
                }
                if (!Schema::hasColumn('visits', 'points_granted')) {
                    $table->integer('points_granted')->default(1)->after('is_seen');
                }
                if (!Schema::hasColumn('visits', 'meta')) {
                    $table->json('meta')->nullable();
                }
                if (!Schema::hasColumn('visits', 'origin')) {
                    $table->string('origin')->default('terminal');
                }
            });

            // Marcar visitas já resolvidas como vistas
            \DB::table('visits')
                ->where('status', '!=', 'pendente')
                ->whereNull('is_seen')
                ->update(['is_seen' => true]);
        }

        // ── 3. LOYALTY SETTINGS ───────────────────────────────────
        if (Schema::hasTable('loyalty_settings')) {
            Schema::table('loyalty_settings', function (Blueprint $table) {
                if (!Schema::hasColumn('loyalty_settings', 'cooldown_seconds')) {
                    $table->integer('cooldown_seconds')->default(43200); // 12h
                }
                if (!Schema::hasColumn('loyalty_settings', 'levels_config')) {
                    $table->json('levels_config')->nullable();
                }
                if (!Schema::hasColumn('loyalty_settings', 'redeem_bonus_points')) {
                    $table->integer('redeem_bonus_points')->default(0);
                }
                if (!Schema::hasColumn('loyalty_settings', 'vip_initial_points')) {
                    $table->integer('vip_initial_points')->default(0);
                }
                if (!Schema::hasColumn('loyalty_settings', 'vip_points_per_scan')) {
                    $table->integer('vip_points_per_scan')->default(1);
                }
                if (!Schema::hasColumn('loyalty_settings', 'regular_points_per_scan')) {
                    $table->integer('regular_points_per_scan')->default(1);
                }
                if (!Schema::hasColumn('loyalty_settings', 'signup_bonus_points')) {
                    $table->integer('signup_bonus_points')->default(1);
                }
            });
        }

        // ── 4. TENANTS ────────────────────────────────────────────
        if (Schema::hasTable('tenants')) {
            Schema::table('tenants', function (Blueprint $table) {
                if (!Schema::hasColumn('tenants', 'extra_contacts_quota')) {
                    $table->integer('extra_contacts_quota')->default(0);
                }
                if (!Schema::hasColumn('tenants', 'plan_started_at')) {
                    $table->timestamp('plan_started_at')->nullable();
                }
                if (!Schema::hasColumn('tenants', 'loyalty_active')) {
                    $table->boolean('loyalty_active')->default(true);
                }
            });
        }

        // ── 5. DEVICES ────────────────────────────────────────────
        if (Schema::hasTable('devices')) {
            Schema::table('devices', function (Blueprint $table) {
                if (!Schema::hasColumn('devices', 'require_pin')) {
                    $table->boolean('require_pin')->default(false);
                }
                if (!Schema::hasColumn('devices', 'telegram_notify')) {
                    $table->boolean('telegram_notify')->default(true);
                }
            });
        }
    }

    public function down(): void
    {
        // Esta migration de segurança não tem rollback destrutivo intencional
        // para não correr o risco de apagar dados de produção
    }
};
