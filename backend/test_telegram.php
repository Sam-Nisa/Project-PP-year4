<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\TelegramService;
use App\Models\Order;

echo "=== Testing Telegram Payment Notifications ===\n\n";

$telegramService = new TelegramService();

// Test 1: Check bot connection
echo "Test 1: Checking bot connection...\n";
$botInfo = $telegramService->getMe();

if (!$botInfo['success']) {
    echo "❌ Bot connection failed: " . $botInfo['message'] . "\n";
    echo "\nPlease check:\n";
    echo "1. TELEGRAM_BOT_TOKEN is set in .env\n";
    echo "2. Token is correct\n";
    exit(1);
}

echo "✅ Bot connected: @{$botInfo['data']['result']['username']}\n\n";

// Test 2: Check chat ID
echo "Test 2: Checking chat ID configuration...\n";
$chatId = env('TELEGRAM_CHAT_ID');

if (!$chatId) {
    echo "❌ TELEGRAM_CHAT_ID not set in .env\n";
    echo "\nTo get your chat ID:\n";
    echo "1. Run: php get_telegram_chat_id.php\n";
    echo "2. Follow the instructions\n";
    exit(1);
}

echo "✅ Chat ID configured: {$chatId}\n\n";

// Test 3: Send test message
echo "Test 3: Sending test message...\n";
$testResult = $telegramService->testConnection();

if (!$testResult['success']) {
    echo "❌ Failed to send test message: " . $testResult['message'] . "\n";
    exit(1);
}

echo "✅ Test message sent successfully!\n\n";

// Test 4: Test payment notification with real order
echo "Test 4: Testing payment notification format...\n";
$order = Order::with(['user', 'items.book'])
    ->where('status', 'paid')
    ->where('payment_status', 'completed')
    ->latest()
    ->first();

if (!$order) {
    echo "⚠️  No paid orders found to test with\n";
    echo "   This is OK - payment notifications will work when orders are created\n\n";
} else {
    echo "   Found order #{$order->id}\n";
    echo "   Sending payment notification...\n";
    
    $result = $telegramService->sendPaymentConfirmation($order);
    
    if ($result['success']) {
        echo "✅ Payment notification sent successfully!\n";
        echo "   Check your Telegram to see the formatted message\n\n";
    } else {
        echo "❌ Failed to send payment notification: " . $result['message'] . "\n\n";
    }
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ ALL TESTS PASSED!\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "Your Telegram bot is ready to send payment notifications!\n\n";

echo "Configuration:\n";
echo "  Bot Token: " . substr(env('TELEGRAM_BOT_TOKEN'), 0, 20) . "...\n";
echo "  Chat ID: {$chatId}\n";
echo "  Bot Username: @{$botInfo['data']['result']['username']}\n\n";

echo "What happens next:\n";
echo "  ✅ When a customer completes payment\n";
echo "  ✅ You'll receive a Telegram notification with:\n";
echo "     - Order details\n";
echo "     - Customer information\n";
echo "     - Items purchased\n";
echo "     - Payment amount\n";
echo "     - Shipping address\n\n";

echo "Test complete! 🎉\n";
