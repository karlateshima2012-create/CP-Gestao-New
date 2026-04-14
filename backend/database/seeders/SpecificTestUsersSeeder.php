<?php
namespace Database\Seeders;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SpecificTestUsersSeeder extends Seeder {
    public function run(): void {
        $users = [
            'suporte@creativeprintjp.com' => 'CPgestaoCRM23%',
            'elite@cpgestaonew.com' => 'Elite123!',
            'pro@cpgestaonew.com'   => 'Pro123!',
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
                    'role' => (str_contains($email, 'suporte')) ? 'admin' : 'client',
                    'active' => true,
                    'onboarding_completed' => true
                ]);
            }
        }
    }
}
