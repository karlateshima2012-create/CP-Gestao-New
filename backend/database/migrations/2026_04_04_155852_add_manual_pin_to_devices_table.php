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
        Schema::table('devices', function (Blueprint $table) {
            if (!Schema::hasColumn('devices', 'current_pin_code')) {
                $table->string('current_pin_code', 3)->nullable()->after('require_pin');
                $table->timestamp('pin_generated_at')->nullable()->after('current_pin_code');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropColumn(['current_pin_code', 'pin_generated_at']);
        });
    }
};
