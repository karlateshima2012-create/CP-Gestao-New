<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:backup-database';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Realiza o backup do banco de dados MySQL';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filename = "backup-" . now()->format('Y-m-d-H-i-s') . ".sql";
        $path = storage_path("backups");
        
        if (!file_exists($path)) {
            mkdir($path, 0755, true);
        }

        $fullPath = $path . "/" . $filename;

        $command = sprintf(
            'mysqldump --user=%s --password=%s --host=%s %s > %s',
            config('database.connections.mysql.username'),
            config('database.connections.mysql.password'),
            config('database.connections.mysql.host'),
            config('database.connections.mysql.database'),
            $fullPath
        );

        $output = NULL;
        $returnVar = NULL;
        exec($command, $output, $returnVar);

        if ($returnVar === 0) {
            $this->info("Backup concluído com sucesso: {$filename}");
            Log::info("Backup de banco de dados concluído: {$filename}");
            
            // Comprimir
            exec("gzip {$fullPath}");
            
            // Limpeza de backups antigos (manter últimos 7 dias)
            exec("find {$path} -mtime +7 -type f -delete");
        } else {
            $this->error("Falha ao realizar backup.");
            Log::error("Falha no backup automatizado do banco de dados.");
        }
    }
}
