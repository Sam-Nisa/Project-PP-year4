<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== TESTING ADMIN PAYOUT VIEW ===\n\n";

// Get admin user
$admin = App\Models\User::where('role', 'admin')->first();

if (!$admin) {
    echo "No admin found!\n";
    exit;
}

echo "Testing with Admin: {$admin->name} (ID: {$admin->id})\n\n";

// Test PayoutService
$payoutService = new App\Services\PayoutService();

echo "1. GET PENDING PAYOUTS:\n";
$pendingPayouts = $payoutService->getPendingPayouts();
echo "Count: {$pendingPayouts->count()}\n\n";

if ($pendingPayouts->count() > 0) {
    foreach ($pendingPayouts as $payout) {
        echo "Payout #{$payout->id}:\n";
        echo "- Owner: {$payout->owner->name} (ID: {$payout->owner_id})\n";
        echo "- Email: {$payout->owner->email}\n";
        echo "- Amount: \${$payout->amount}\n";
        echo "- Status: {$payout->status}\n";
        echo "- Payment Method: " . ($payout->payment_method ?? 'N/A') . "\n";
        echo "- Requested: {$payout->requested_at}\n\n";
    }
} else {
    echo "No pending payouts found\n\n";
}

echo "2. GET STATISTICS:\n";
$stats = $payoutService->getPayoutStatistics();
echo "Pending Count: {$stats['pending_count']}\n";
echo "Pending Amount: \${$stats['pending_amount']}\n";
echo "Processing Count: {$stats['processing_count']}\n";
echo "Total Completed: {$stats['total_completed']}\n\n";

echo "3. TEST API RESPONSE FORMAT:\n";
$response = [
    'success' => true,
    'data' => $pendingPayouts->toArray()
];
echo "Response structure:\n";
echo json_encode($response, JSON_PRETTY_PRINT) . "\n";
