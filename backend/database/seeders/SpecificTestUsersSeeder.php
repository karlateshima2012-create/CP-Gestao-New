<?php
namespace Database\Seeders;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SpecificTestUsersSeeder extends Seeder {
    public function run(): void {
        $users = [
            'admin@cpgestaonew.com' => 'Admin123!',
            'elite@cpgestaonew.com' => 'Elite123!',
            'pro@cpgestaonew.com'   => 'Pro123!',
            'suporte@cpgestaonew.com' => 'Senha123!'
        ];
        foreach ($users as $email => $password) {
            $user = User::where('email', $email)->first();
            if ($user) {
                $user->update(['password' => Hash::make($password)]);
            } else {
                // Se não existe, cria o básico para acesso
                User::create([
                    'name' => 'User ' . $email,
                    'email' => $email,
                    'password' => Hash::make($password),
                    'role' => ($email === 'admin@cpgestaonew.com' || $email === 'suporte@cpgestaonew.com') ? 'admin' : 'client',
                    'active' => true,
                    'onboarding_completed' => true
                ]);
            }
        }
    }
}
