<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanupExpiredOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:cleanup-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired orders that were not paid within 10 minutes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting cleanup of expired orders...');

        // Get expired orders with pending payment status
        $expiredOrders = Order::where('qr_expires_at', '<', now())
                             ->where('payment_status', 'pending') // Only pending payments
                             ->whereNull('payment_transaction_id') // No transaction ID
                             ->get();

        if ($expiredOrders->isEmpty()) {
            $this->info('No expired orders found.');
            return 0;
        }

        $count = $expiredOrders->count();
        $this->info("Found {$count} expired orders to delete.");

        // Delete expired orders and their items
        foreach ($expiredOrders as $order) {
            try {
                // Delete order items first (due to foreign key constraints)
                $order->items()->delete();
                
                // Delete the order completely
                $order->delete();
                
                Log::info("Deleted expired order", [
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                    'expired_at' => $order->qr_expires_at,
                    'payment_status' => $order->payment_status,
                    'total_amount' => $order->total_amount
                ]);
                
            } catch (\Exception $e) {
                Log::error("Failed to delete expired order {$order->id}: " . $e->getMessage());
                $this->error("Failed to delete order {$order->id}: " . $e->getMessage());
            }
        }

        $this->info("Successfully cleaned up {$count} expired orders.");
        return 0;
    }
}
