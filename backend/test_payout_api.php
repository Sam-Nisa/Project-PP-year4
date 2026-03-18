<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== TESTING PAYOUT API ===\n\n";

// Get author user
$author = App\Models\User::where('role', 'author')->first();

if (!$author) {
    echo "No author found!\n";
    exit;
}

echo "Testing with Author: {$author->name} (ID: {$author->id})\n\n";

// Simulate getting balance
echo "1. GET BALANCE:\n";
$commissionService = new App\Services\CommissionService();
$balance = $commissionService->getOwnerEarningsSummary($author->id);
echo "Available Balance: \${$balance['available_balance']}\n";
echo "Total Earned: \${$balance['total_earned']}\n\n";

// Simulate requesting a payout
if ($balance['available_balance'] > 0) {
    echo "2. REQUEST PAYOUT:\n";
    try {
        $payoutService = new App\Services\PayoutService();
        $payout = $payoutService->requestPayout($author->id, $balance['available_balance'], 'bank_transfer');
        echo "✅ Payout requested successfully!\n";
        echo "Payout ID: {$payout->id}\n";
        echo "Amount: \${$payout->amount}\n";
        echo "Status: {$payout->status}\n\n";
        
        // Check pending payouts
        echo "3. PENDING PAYOUTS (Admin View):\n";
        $pendingPayouts = $payoutService->getPendingPayouts();
        echo "Count: {$pendingPayouts->count()}\n";
        foreach ($pendingPayouts as $p) {
            echo "- Payout #{$p->id}: \${$p->amount} for {$p->owner->name}\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error: {$e->getMessage()}\n";
    }
} else {
    echo "No available balance to request payout\n";
}
