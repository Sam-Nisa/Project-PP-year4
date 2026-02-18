<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\TelegramService;

echo "=== Telegram Bot Setup Helper ===\n\n";

$telegramService = new TelegramService();

// Step 1: Check bot info
echo "Step 1: Checking bot information...\n";
$botInfo = $telegramService->getMe();

if (!$botInfo['success']) {
    echo "❌ Error: " . $botInfo['message'] . "\n";
    echo "\nPlease check your TELEGRAM_BOT_TOKEN in .env file\n";
    exit(1);
}

$botData = $botInfo['data']['result'];
echo "✅ Bot connected successfully!\n";
echo "   Bot Name: {$botData['first_name']}\n";
echo "   Username: @{$botData['username']}\n";
echo "   Bot ID: {$botData['id']}\n\n";

// Step 2: Get updates to find chat ID
echo "Step 2: Looking for chat ID...\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$updates = $telegramService->getUpdates();

if (!$updates['success']) {
    echo "❌ Error getting updates: " . $updates['message'] . "\n";
    exit(1);
}

$result = $updates['data']['result'];

if (empty($result)) {
    echo "⚠️  No messages found yet!\n\n";
    echo "To get your Chat ID:\n";
    echo "1. Open Telegram app\n";
    echo "2. Search for: @{$botData['username']}\n";
    echo "3. Click 'START' or send any message to the bot\n";
    echo "4. Run this script again: php get_telegram_chat_id.php\n\n";
    echo "Bot link: https://t.me/{$botData['username']}\n";
    exit(0);
}

echo "✅ Found " . count($result) . " message(s)!\n\n";

// Extract unique chat IDs
$chatIds = [];
foreach ($result as $update) {
    if (isset($update['message']['chat']['id'])) {
        $chatId = $update['message']['chat']['id'];
        $chatType = $update['message']['chat']['type'];
        $firstName = $update['message']['chat']['first_name'] ?? 'N/A';
        $username = $update['message']['chat']['username'] ?? 'N/A';
        
        if (!isset($chatIds[$chatId])) {
            $chatIds[$chatId] = [
                'id' => $chatId,
                'type' => $chatType,
                'first_name' => $firstName,
                'username' => $username
            ];
        }
    }
}

if (empty($chatIds)) {
    echo "⚠️  No chat IDs found in messages\n";
    exit(0);
}

echo "Found Chat ID(s):\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

foreach ($chatIds as $chat) {
    echo "\n📱 Chat ID: {$chat['id']}\n";
    echo "   Type: {$chat['type']}\n";
    echo "   Name: {$chat['first_name']}\n";
    echo "   Username: @{$chat['username']}\n";
}

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Get the first chat ID
$firstChatId = array_values($chatIds)[0]['id'];

echo "✅ Your Chat ID is: {$firstChatId}\n\n";
echo "Next steps:\n";
echo "1. Add this to your .env file:\n";
echo "   TELEGRAM_CHAT_ID={$firstChatId}\n\n";
echo "2. Test the connection:\n";
echo "   php test_telegram.php\n\n";

// Offer to send a test message
echo "Would you like to send a test message now? (y/n): ";
$handle = fopen("php://stdin", "r");
$line = fgets($handle);
$answer = trim($line);

if (strtolower($answer) === 'y' || strtolower($answer) === 'yes') {
    echo "\nSending test message...\n";
    
    $testMessage = "🎉 <b>Telegram Bot Setup Complete!</b>\n\n";
    $testMessage .= "✅ Your bot is now connected and ready to send payment notifications!\n\n";
    $testMessage .= "Chat ID: <code>{$firstChatId}</code>\n";
    $testMessage .= "Bot: @{$botData['username']}\n";
    $testMessage .= "Time: " . date('Y-m-d H:i:s');
    
    $result = $telegramService->sendMessage($testMessage, $firstChatId);
    
    if ($result['success']) {
        echo "✅ Test message sent successfully!\n";
        echo "   Check your Telegram app to see the message.\n\n";
    } else {
        echo "❌ Failed to send test message: " . $result['message'] . "\n\n";
    }
}

echo "Setup complete! 🎊\n";
