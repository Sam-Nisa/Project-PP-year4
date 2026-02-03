<?php

require_once __DIR__ . '/vendor/autoload.php';

// Load Laravel environment
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\BakongPaymentService;
use Illuminate\Support\Facades\Log;

echo "Testing Bakong QR Generation...\n\n";

// Test 1: Check configuration
echo "1. Checking Configuration:\n";
echo "BAKONG_API_TOKEN: " . (config('services.bakong.api_token') ? 'SET' : 'NOT SET') . "\n";
echo "BAKONG_ACCOUNT_ID: " . config('services.bakong.account_id') . "\n";
echo "BAKONG_MERCHANT_NAME: " . config('services.bakong.merchant_name') . "\n";
echo "BAKONG_MERCHANT_CITY: " . config('services.bakong.merchant_city') . "\n";
echo "BAKONG_MERCHANT_ID: " . config('services.bakong.merchant_id') . "\n";
echo "BAKONG_ACQUIRING_BANK: " . config('services.bakong.acquiring_bank') . "\n";
echo "BAKONG_MOBILE_NUMBER: " . config('services.bakong.mobile_number') . "\n\n";

// Test 2: Check KHQR library
echo "2. Checking KHQR Library:\n";
try {
    if (class_exists('KHQR\BakongKHQR')) {
        echo "✓ BakongKHQR class found\n";
    } else {
        echo "✗ BakongKHQR class NOT found\n";
    }
    
    if (class_exists('KHQR\Models\MerchantInfo')) {
        echo "✓ MerchantInfo class found\n";
    } else {
        echo "✗ MerchantInfo class NOT found\n";
    }
} catch (Exception $e) {
    echo "✗ Error checking KHQR classes: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 3: Test QR generation
echo "3. Testing QR Generation:\n";
try {
    $service = new BakongPaymentService();
    
    $result = $service->generateQRCode(
        10.00,
        'USD',
        'TEST-001',
        'Test Store'
    );
    
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    
    if ($result['success']) {
        echo "✓ QR Generation SUCCESSFUL\n";
        echo "QR String Length: " . strlen($result['qr_string']) . "\n";
        echo "MD5: " . $result['md5'] . "\n";
    } else {
        echo "✗ QR Generation FAILED\n";
        echo "Error: " . $result['error'] . "\n";
    }
    
} catch (Exception $e) {
    echo "✗ Exception during QR generation: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
echo "\n";

// Test 4: Check account existence
echo "4. Testing Account Verification:\n";
try {
    $service = new BakongPaymentService();
    $accountId = config('services.bakong.account_id');
    
    if ($accountId) {
        $exists = $service->checkAccountExists($accountId);
        echo "Account '$accountId' exists: " . ($exists ? 'YES' : 'NO') . "\n";
    } else {
        echo "No account ID configured\n";
    }
} catch (Exception $e) {
    echo "✗ Error checking account: " . $e->getMessage() . "\n";
}

echo "\nTest completed!\n";
echo "Check storage/logs/laravel.log for detailed logs.\n";