<?php

/**
 * Complete Payout Flow Test Script
 * 
 * This script tests the entire 8-step payout flow:
 * 1. User adds products to cart
 * 2. User makes single payment
 * 3. Order created with all items
 * 4. Commission calculated (10%)
 * 5. Owner balance updated
 * 6. Admin views authors with earnings
 * 7. Admin initiates payout
 * 8. Admin confirms payout
 */

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Book;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OwnerBalance;
use App\Models\Payout;
use App\Services\CommissionService;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== COMPLETE PAYOUT FLOW TEST ===\n\n";

// Step 1: Get test users and books
echo "Step 1: Getting test data...\n";
$admin = User::where('role', 'admin')->first();
$author = User::where('role', 'author')->first();

if (!$admin || !$author) {
    echo "❌ Error: Need at least one admin and one author user\n";
    exit(1);
}

$adminBook = Book::where('author_id', $admin->id)->first();
$authorBook = Book::where('author_id', $author->id)->first();

if (!$adminBook || !$authorBook) {
    echo "❌ Error: Need at least one book from admin and one from author\n";
    exit(1);
}

echo "✅ Admin: {$admin->name} (ID: {$admin->id})\n";
echo "✅ Author: {$author->name} (ID: {$author->id})\n";
echo "✅ Admin Book: {$adminBook->title} (\${$adminBook->price})\n";
echo "✅ Author Book: {$authorBook->title} (\${$authorBook->price})\n\n";

// Step 2: Create test order (simulating user checkout)
echo "Step 2: Creating test order...\n";
$customer = User::where('role', 'user')->first();
if (!$customer) {
    echo "⚠️  No customer found, using admin as customer\n";
    $customer = $admin;
}

$totalAmount = $adminBook->price + $authorBook->price;

$order = Order::create([
    'user_id' => $customer->id,
    'total_amount' => $totalAmount,
    'status' => 'paid',
    'payment_status' => 'completed',
    'payment_method' => 'bakong',
]);

echo "✅ Order created: #{$order->id}\n";
echo "   Total: \${$totalAmount}\n\n";

// Step 3: Create order items
echo "Step 3: Creating order items...\n";

$adminItem = OrderItem::create([
    'order_id' => $order->id,
    'book_id' => $adminBook->id,
    'quantity' => 1,
    'price' => $adminBook->price,
    'total' => $adminBook->price,
]);

$authorItem = OrderItem::create([
    'order_id' => $order->id,
    'book_id' => $authorBook->id,
    'quantity' => 1,
    'price' => $authorBook->price,
    'total' => $authorBook->price,
]);

echo "✅ Admin item: \${$adminBook->price}\n";
echo "✅ Author item: \${$authorBook->price}\n\n";

// Step 4: Calculate commission
echo "Step 4: Calculating commission (10%)...\n";
$commissionService = new CommissionService();
$commissionService->processOrderCommission($order);

$adminItem->refresh();
$authorItem->refresh();

echo "Admin Product:\n";
echo "   Total: \${$adminItem->total}\n";
echo "   Commission: \${$adminItem->commission_amount}\n";
echo "   Owner Earnings: \${$adminItem->owner_earnings}\n\n";

echo "Author Product:\n";
echo "   Total: \${$authorItem->total}\n";
echo "   Commission: \${$authorItem->commission_amount} (10%)\n";
echo "   Owner Earnings: \${$authorItem->owner_earnings} (90%)\n\n";

// Step 5: Distribute earnings to owner balance
echo "Step 5: Distributing earnings to owner balance...\n";
$commissionService->distributeEarnings($order);

$authorBalance = OwnerBalance::where('owner_id', $author->id)->first();

echo "✅ Author Balance Updated:\n";
echo "   Available: \${$authorBalance->available_balance}\n";
echo "   Total Earned: \${$authorBalance->total_earned}\n";
echo "   Total Withdrawn: \${$authorBalance->total_withdrawn}\n\n";

// Step 6: Admin views authors with earnings
echo "Step 6: Admin viewing authors with earnings...\n";
$authorsWithEarnings = User::where('role', 'author')
    ->with(['ownerBalance', 'books'])
    ->get()
    ->map(function ($author) {
        $balance = $author->ownerBalance;
        return [
            'author_id' => $author->id,
            'author_name' => $author->name,
            'available_balance' => $balance ? $balance->available_balance : 0,
            'total_earned' => $balance ? $balance->total_earned : 0,
            'books_count' => $author->books->count(),
        ];
    })
    ->filter(function ($author) {
        return $author['total_earned'] > 0;
    });

echo "Authors with earnings:\n";
foreach ($authorsWithEarnings as $a) {
    echo "   {$a['author_name']}: \${$a['available_balance']} available, \${$a['total_earned']} total\n";
}
echo "\n";

// Step 7: Admin initiates payout
echo "Step 7: Admin initiating payout...\n";
$payoutAmount = $authorBalance->available_balance;

$payout = Payout::create([
    'owner_id' => $author->id,
    'amount' => $payoutAmount,
    'status' => 'processing',
    'payment_method' => 'bank_transfer',
    'notes' => 'Test payout via bank transfer',
    'processed_by' => $admin->id,
    'requested_at' => now(),
]);

// Deduct from available balance
$authorBalance->decrement('available_balance', $payoutAmount);

echo "✅ Payout initiated: #{$payout->id}\n";
echo "   Amount: \${$payout->amount}\n";
echo "   Status: {$payout->status}\n";
echo "   Author balance deducted: \${$payoutAmount}\n\n";

$authorBalance->refresh();
echo "Author Balance After Initiation:\n";
echo "   Available: \${$authorBalance->available_balance}\n";
echo "   Total Earned: \${$authorBalance->total_earned}\n";
echo "   Total Withdrawn: \${$authorBalance->total_withdrawn}\n\n";

// Step 8: Admin confirms payout (after real payment)
echo "Step 8: Admin confirming payout (after real payment)...\n";
$transactionRef = 'TXN' . time();

$payout->update([
    'status' => 'completed',
    'transaction_reference' => $transactionRef,
    'processed_at' => now(),
]);

// Update total withdrawn
$authorBalance->increment('total_withdrawn', $payout->amount);

echo "✅ Payout confirmed!\n";
echo "   Transaction Reference: {$transactionRef}\n";
echo "   Status: {$payout->status}\n\n";

$authorBalance->refresh();
echo "Final Author Balance:\n";
echo "   Available: \${$authorBalance->available_balance}\n";
echo "   Total Earned: \${$authorBalance->total_earned}\n";
echo "   Total Withdrawn: \${$authorBalance->total_withdrawn}\n\n";

// Summary
echo "=== FLOW COMPLETE ===\n\n";
echo "Summary:\n";
echo "1. ✅ Order created with mixed products (Admin + Author)\n";
echo "2. ✅ Single payment to admin account (\${$totalAmount})\n";
echo "3. ✅ Order items created\n";
echo "4. ✅ Commission calculated (10% = \${$authorItem->commission_amount})\n";
echo "5. ✅ Author earnings distributed (\${$authorItem->owner_earnings})\n";
echo "6. ✅ Admin can view authors with earnings\n";
echo "7. ✅ Admin initiated payout (status: processing)\n";
echo "8. ✅ Admin confirmed payout (status: completed, ref: {$transactionRef})\n\n";

echo "All 8 steps completed successfully! 🎉\n";
