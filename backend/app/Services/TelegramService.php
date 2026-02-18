<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    protected $botToken;
    protected $chatId;
    protected $apiUrl;

    public function __construct()
    {
        $this->botToken = env('TELEGRAM_BOT_TOKEN');
        $this->chatId = env('TELEGRAM_CHAT_ID');
        $this->apiUrl = "https://api.telegram.org/bot{$this->botToken}";
    }

    /**
     * Send a message to Telegram
     *
     * @param string $message
     * @param string|null $chatId
     * @param string $parseMode
     * @return array
     */
    public function sendMessage($message, $chatId = null, $parseMode = 'HTML')
    {
        try {
            $chatId = $chatId ?? $this->chatId;

            if (!$this->botToken) {
                Log::warning('Telegram bot token not configured');
                return [
                    'success' => false,
                    'message' => 'Telegram bot token not configured'
                ];
            }

            if (!$chatId) {
                Log::warning('Telegram chat ID not configured');
                return [
                    'success' => false,
                    'message' => 'Telegram chat ID not configured'
                ];
            }

            $response = Http::post("{$this->apiUrl}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => $parseMode,
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'data' => $response->json()
                ];
            }

            Log::error('Telegram API Error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to send message',
                'error' => $response->json()
            ];

        } catch (\Exception $e) {
            Log::error('Telegram Service Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while sending message',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send payment confirmation notification
     *
     * @param \App\Models\Order $order
     * @return array
     */
    public function sendPaymentConfirmation($order)
    {
        try {
            // Load relationships if not already loaded
            if (!$order->relationLoaded('user')) {
                $order->load('user');
            }
            if (!$order->relationLoaded('items')) {
                $order->load('items.book');
            }

            // Format order items
            $itemsList = '';
            foreach ($order->items as $index => $item) {
                $itemNumber = $index + 1;
                $bookTitle = $item->book ? $item->book->title : 'Unknown Book';
                $itemsList .= "\n{$itemNumber}. {$bookTitle}";
                $itemsList .= "\n   Qty: {$item->quantity} × \${$item->price} = \${$item->total}";
            }

            // Build message
            $message = "🎉 <b>New Payment Received!</b>\n\n";
            $message .= "📦 <b>Order Details:</b>\n";
            $message .= "━━━━━━━━━━━━━━━━━━━━\n";
            $message .= "Order ID: <code>#{$order->id}</code>\n";
            
            if ($order->payment_transaction_id) {
                $message .= "Transaction ID: <code>{$order->payment_transaction_id}</code>\n";
            }
            $message .= "\n";
            
            $message .= "👤 <b>Customer:</b>\n";
            $message .= "Name: {$order->user->name}\n";
            $message .= "Email: {$order->user->email}\n\n";
            
            $message .= "📚 <b>Items:</b>{$itemsList}\n\n";
            
            $message .= "💰 <b>Payment Summary:</b>\n";
            $message .= "Subtotal: \${$order->subtotal}\n";
            
            if ($order->discount_amount && $order->discount_amount > 0) {
                $message .= "Discount: -\${$order->discount_amount}";
                if ($order->discount_code) {
                    $message .= " ({$order->discount_code})";
                }
                $message .= "\n";
            }
            
            if ($order->shipping_cost && $order->shipping_cost > 0) {
                $message .= "Shipping: \${$order->shipping_cost}\n";
            }
            
            if ($order->tax_amount && $order->tax_amount > 0) {
                $message .= "Tax: \${$order->tax_amount}\n";
            }
            
            $message .= "<b>Total: \${$order->total_amount}</b>\n\n";
            
            $message .= "💳 <b>Payment Method:</b> " . ucfirst($order->payment_method) . "\n";
            $message .= "✅ <b>Status:</b> Paid\n";
            $message .= "📅 <b>Date:</b> " . $order->created_at->format('M d, Y H:i:s') . "\n";
            
            // Add shipping address if available
            if ($order->shipping_address) {
                $address = is_array($order->shipping_address) 
                    ? $order->shipping_address 
                    : json_decode($order->shipping_address, true);
                
                if ($address && is_array($address)) {
                    $message .= "\n📍 <b>Shipping Address:</b>\n";
                    
                    if (isset($address['address'])) {
                        $message .= "{$address['address']}\n";
                    }
                    
                    if (isset($address['city']) && isset($address['state']) && isset($address['zip'])) {
                        $message .= "{$address['city']}, {$address['state']} {$address['zip']}\n";
                    }
                    
                    if (isset($address['phone'])) {
                        $message .= "Phone: {$address['phone']}\n";
                    }
                }
            }

            return $this->sendMessage($message);

        } catch (\Exception $e) {
            Log::error('Error sending payment confirmation: ' . $e->getMessage(), [
                'order_id' => $order->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'success' => false,
                'message' => 'Failed to send payment confirmation',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get bot information
     *
     * @return array
     */
    public function getMe()
    {
        try {
            if (!$this->botToken) {
                return [
                    'success' => false,
                    'message' => 'Telegram bot token not configured'
                ];
            }

            $response = Http::get("{$this->apiUrl}/getMe");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to get bot info',
                'error' => $response->json()
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get updates (to find chat ID)
     *
     * @return array
     */
    public function getUpdates()
    {
        try {
            if (!$this->botToken) {
                return [
                    'success' => false,
                    'message' => 'Telegram bot token not configured'
                ];
            }

            $response = Http::get("{$this->apiUrl}/getUpdates");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to get updates',
                'error' => $response->json()
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Test the Telegram bot connection
     *
     * @return array
     */
    public function testConnection()
    {
        try {
            $botInfo = $this->getMe();
            
            if (!$botInfo['success']) {
                return $botInfo;
            }

            $testMessage = "🤖 <b>Bot Connection Test</b>\n\n";
            $testMessage .= "✅ Bot is connected and working!\n";
            $testMessage .= "Bot Name: {$botInfo['data']['result']['first_name']}\n";
            $testMessage .= "Username: @{$botInfo['data']['result']['username']}\n";
            $testMessage .= "Time: " . now()->format('Y-m-d H:i:s');

            return $this->sendMessage($testMessage);

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection test failed',
                'error' => $e->getMessage()
            ];
        }
    }
}
