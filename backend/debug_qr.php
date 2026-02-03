<?php

require_once __DIR__ . '/vendor/autoload.php';

// Load Laravel environment
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\BakongPaymentController;
use App\Services\BakongPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

echo "Debug QR Generation Issue...\n\n";

// Test the service directly
echo "1. Testing BakongPaymentService directly:\n";
try {
    $service = new BakongPaymentService();
    $result = $service->generateQRCode(0.99999999999999, 'USD', 'ORD-pending_17700957739', 'NISA SAM');
    
    echo "Service Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n\n";
} catch (Exception $e) {
    echo "Service Error: " . $e->getMessage() . "\n\n";
}

// Test with the exact same parameters from the logs
echo "2. Testing with exact parameters from logs:\n";
try {
    $service = new BakongPaymentService();
    
    // These are the exact parameters from the logs
    $result = $service->generateQRCode(
        0.99999999999999,  // amount from logs
        'USD',             // currency
        'ORD-pending_17700957739',  // bill number from logs
        'NISA SAM'         // store label from logs
    );
    
    echo "Exact Parameters Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n\n";
    
    if (!$result['success']) {
        echo "Error details:\n";
        echo "Message: " . ($result['message'] ?? 'No message') . "\n";
        echo "Error: " . ($result['error'] ?? 'No error') . "\n";
    }
    
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nDebug completed!\n";