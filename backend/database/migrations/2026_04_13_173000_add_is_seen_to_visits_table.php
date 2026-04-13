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
        if (Schema::hasTable('visits')) {
            Schema::table('visits', function (Blueprint $table) {
                if (!Schema::hasColumn('visits', 'is_seen')) {
                    $table->boolean('is_seen')->default(false)->after('status');
                }
            });
            
            // Mark existing approved/denied visits as seen
            \DB::table('visits')->where('status', '!=', 'pendente')->update(['is_seen' => true]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('visits') && Schema::hasColumn('visits', 'is_seen')) {
            Schema::table('visits', function (Blueprint $table) {
                $table->dropColumn('is_seen');
            });
        }
    }
};
