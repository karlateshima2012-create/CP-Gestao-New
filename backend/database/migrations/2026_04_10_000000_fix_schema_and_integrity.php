<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Fix visits table (missing device_id)
        if (Schema::hasTable('visits') && !Schema::hasColumn('visits', 'device_id')) {
            Schema::table('visits', function (Blueprint $table) {
                $table->uuid('device_id')->nullable()->after('points_granted');
                // Em MariaDB/MySQL, podemos adicionar a FK. Em SQLite, cuidamos no código ou recriamos a tabela.
                // Mas como visits é uma tabela log, permitimos o campo sem constraint rígida se necessário.
            });
        }

        // 2. Fix point_movements table (ghost loyalty_cards reference)
        // SQLite doesn't support dropping foreign keys easily, so we have to recreate the table.
        // This is safe for a SaaS as both MySQL and SQLite will end up with the correct structure.
        
        $isSQLite = DB::connection()->getDriverName() === 'sqlite';

        if ($isSQLite) {
            // No SQLite, o erro "no such table: loyalty_cards" acontece porque a constraint 
            // no esquema do banco aponta para um nome deletado. 
            // Recriar a tabela PointMovements resolve permanentemente.
            
            Schema::rename('point_movements', 'point_movements_old');

            Schema::create('point_movements', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('tenant_id');
                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->uuid('customer_id');
                $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
                $table->string('type'); // earn | redeem | adjustment
                $table->integer('points');
                $table->string('origin'); // nfc | qr | manual | online
                $table->uuid('device_id')->nullable();
                $table->foreign('device_id')->references('id')->on('devices')->onDelete('set null');
                $table->string('description')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();
            });

            // Migrar dados da antiga para a nova (se houver)
            DB::statement('INSERT INTO point_movements (id, tenant_id, customer_id, type, points, origin, device_id, description, meta, created_at, updated_at) 
                           SELECT id, tenant_id, customer_id, type, points, origin, device_id, description, meta, created_at, updated_at FROM point_movements_old');

            Schema::dropIfExists('point_movements_old');
        } else {
            // Em MariaDB/MySQL, apenas corrigimos a estrutura se necessário
            Schema::table('point_movements', function (Blueprint $table) {
                // Garantir que os enums agora são strings para flexibilidade (SaaS Roadmap)
                $table->string('type')->change();
                $table->string('origin')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Inversão não necessária para este hotfix estrutural
    }
};
