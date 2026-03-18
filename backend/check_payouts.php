<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING PAYOUT SYSTEM ===\n\n";

// Check latest order
$order = App\Models\Order::latest()->first();
if ($order) {
    echo "Latest Order:\n";
    echo "- ID: {$order->id}\n";
    echo "- Status: {$order->status}\n";
    echo "- Payment Status: {$order->payment_status}\n";
    echo "- Total: \${$order->total_amount}\n\n";
    
    echo "Order Items:\n";
    foreach ($order->items as $item) {
        echo "- Book: {$item->book->title}\n";
        echo "  Author: {$item->book->author->name} (ID: {$item->book->author_id}, Role: {$item->book->author->role})\n";
        echo "  Total: \${$item->total}\n";
        echo "  Commission Rate: {$item->commission_rate}%\n";
        echo "  Commission Amount: \${$item->commission_amount}\n";
        echo "  Owner Earnings: \${$item->owner_earnings}\n\n";
    }
} else {
    echo "No orders found\n\n";
}

// Check owner balances
echo "Owner Balances:\n";
$balances = App\Models\OwnerBalance::with('owner')->get();
if ($balances->count() > 0) {
    foreach ($balances as $balance) {
        echo "- Owner: {$balance->owner->name} (ID: {$balance->owner_id}, Role: {$balance->owner->role})\n";
        echo "  Available Balance: \${$balance->available_balance}\n";
        echo "  Pending Balance: \${$balance->pending_balance}\n";
        echo "  Total Earned: \${$balance->total_earned}\n";
        echo "  Total Withdrawn: \${$balance->total_withdrawn}\n\n";
    }
} else {
    echo "No owner balances found\n\n";
}

// Check payouts
echo "Payouts:\n";
$payouts = App\Models\Payout::with('owner')->get();
if ($payouts->count() > 0) {
    foreach ($payouts as $payout) {
        echo "- Payout ID: {$payout->id}\n";
        echo "  Owner: {$payout->owner->name} (ID: {$payout->owner_id})\n";
        echo "  Amount: \${$payout->amount}\n";
        echo "  Status: {$payout->status}\n";
        echo "  Requested: {$payout->requested_at}\n\n";
    }
} else {
    echo "No payouts found\n\n";
}

echo "=== SUMMARY ===\n";
echo "Total Orders: " . App\Models\Order::count() . "\n";
echo "Total Owner Balances: " . App\Models\OwnerBalance::count() . "\n";
echo "Total Payouts: " . App\Models\Payout::count() . "\n";
echo "Pending Payouts: " . App\Models\Payout::where('status', 'pending')->count() . "\n";
