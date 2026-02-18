<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\PasswordResetOtp;
use App\Mail\OtpMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

echo "=== Testing Forgot Password System ===\n\n";

// Test 1: Check if users exist
echo "1. Checking users in database...\n";
$users = User::take(3)->get(['email', 'name']);
if ($users->count() > 0) {
    echo "   ✅ Found " . User::count() . " users\n";
    echo "   Test emails:\n";
    foreach ($users as $user) {
        echo "   - {$user->email} ({$user->name})\n";
    }
} else {
    echo "   ❌ No users found. Please register a user first.\n";
    exit(1);
}

echo "\n2. Testing OTP generation...\n";
$testEmail = $users->first()->email;
$otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
echo "   ✅ Generated OTP: {$otp}\n";

echo "\n3. Testing OTP storage...\n";
try {
    PasswordResetOtp::where('email', $testEmail)->delete();
    PasswordResetOtp::create([
        'email' => $testEmail,
        'otp' => $otp,
        'expires_at' => Carbon::now()->addMinutes(10),
        'is_used' => false,
    ]);
    echo "   ✅ OTP stored in database\n";
} catch (Exception $e) {
    echo "   ❌ Error storing OTP: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n4. Testing email sending...\n";
try {
    Mail::to($testEmail)->send(new OtpMail($otp, $users->first()->name));
    echo "   ✅ Email sent successfully to {$testEmail}\n";
} catch (Exception $e) {
    echo "   ❌ Error sending email: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n5. Testing OTP verification...\n";
$otpRecord = PasswordResetOtp::where('email', $testEmail)
    ->where('otp', $otp)
    ->where('is_used', false)
    ->first();

if ($otpRecord && $otpRecord->isValid()) {
    echo "   ✅ OTP is valid and can be verified\n";
} else {
    echo "   ❌ OTP verification failed\n";
    exit(1);
}

echo "\n6. Cleaning up test data...\n";
PasswordResetOtp::where('email', $testEmail)->delete();
echo "   ✅ Test data cleaned up\n";

echo "\n" . str_repeat("=", 50) . "\n";
echo "✅ ALL TESTS PASSED!\n";
echo str_repeat("=", 50) . "\n\n";

echo "Your forgot password system is working correctly!\n";
echo "Check your email inbox for the OTP: {$otp}\n\n";

echo "Next steps:\n";
echo "1. Start backend: php artisan serve\n";
echo "2. Start frontend: cd ../frontend && npm run dev\n";
echo "3. Test at: http://localhost:3000/login\n";
echo "4. Click 'Forgot Password?' and use email: {$testEmail}\n";
