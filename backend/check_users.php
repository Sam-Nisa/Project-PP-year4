<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "=== Users in Database ===\n\n";

$users = User::take(10)->get(['id', 'name', 'email', 'role']);

if ($users->count() === 0) {
    echo "No users found in database.\n";
    echo "Please register a user first at: http://localhost:3000/register\n";
} else {
    echo "Total users: " . User::count() . "\n\n";
    echo "First 10 users:\n";
    echo str_repeat("-", 80) . "\n";
    printf("%-5s %-20s %-30s %-10s\n", "ID", "Name", "Email", "Role");
    echo str_repeat("-", 80) . "\n";
    
    foreach ($users as $user) {
        printf("%-5s %-20s %-30s %-10s\n", 
            $user->id, 
            substr($user->name, 0, 20), 
            substr($user->email, 0, 30), 
            $user->role
        );
    }
    echo str_repeat("-", 80) . "\n";
    echo "\nYou can test forgot password with any of these emails!\n";
}
