<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Mail\OtpMail;
use Illuminate\Support\Facades\Mail;

try {
    $otp = '123456';
    $userName = 'Test User';
    $email = 'bmwb95769@gmail.com'; // Test email
    
    Mail::to($email)->send(new OtpMail($otp, $userName));
    
    echo "✅ Email sent successfully to {$email}\n";
    echo "OTP Code: {$otp}\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
