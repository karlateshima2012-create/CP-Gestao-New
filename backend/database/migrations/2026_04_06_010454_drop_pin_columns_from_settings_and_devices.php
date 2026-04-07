<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenant_settings', function (Blueprint $table) {
            $table->dropColumn(['pin', 'pin_hash', 'pin_updated_at']);
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->dropColumn(['require_pin', 'current_pin_code', 'pin_generated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_settings', function (Blueprint $table) {
            $table->string('pin')->nullable();
            $table->string('pin_hash')->nullable();
            $table->timestamp('pin_updated_at')->nullable();
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->boolean('require_pin')->default(false);
            $table->string('current_pin_code')->nullable();
            $table->timestamp('pin_generated_at')->nullable();
        });
    }
};
