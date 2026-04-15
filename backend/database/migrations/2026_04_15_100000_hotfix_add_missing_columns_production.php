<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * HOTFIX: Adiciona coluna instagram que estava faltando no banco de producao.
 * Este arquivo tem timestamp unico para garantir que o Laravel execute.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'instagram')) {
                $table->string('instagram', 100)->nullable()->after('address');
            }
        });

        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'preferences')) {
                $table->json('preferences')->nullable();
            }
        });

        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'attendance_count')) {
                $table->unsignedInteger('attendance_count')->default(0);
            }
        });

        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'last_activity_at')) {
                $table->timestamp('last_activity_at')->nullable();
            }
        });

        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'foto_perfil_url')) {
                $table->text('foto_perfil_url')->nullable();
            }
        });

        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'company_name')) {
                $table->string('company_name')->nullable();
            }
        });

        if (Schema::hasTable('visits') && !Schema::hasColumn('visits', 'is_seen')) {
            Schema::table('visits', function (Blueprint $table) {
                $table->boolean('is_seen')->default(false)->after('status');
            });
        }
    }

    public function down(): void
    {
        // Sem rollback destrutivo em producao
    }
};
