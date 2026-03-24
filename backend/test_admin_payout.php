<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== TESTING ADMIN PAYOUT PROCESS ===\n\n";

// Get admin and author
$admin = App\Models\User::where('role', 'admin')->first();
$author = App\Models\User::where('role', 'author')->first();

if (!$admin || !$author) {
    echo "Admin or Author not found!\n";
    exit;
}

echo "Admin: {$admin->name} (ID: {$admin->id})\n";
echo "Author: {$author->name} (ID: {$author->id})\n\n";

// Check author balance
$balance = App\Models\OwnerBalance::where('owner_id', $author->id)->first();
echo "Author Balance:\n";
echo "- Available: \${$balance->available_balance}\n";
echo "- Total Earned: \${$balance->total_earned}\n\n";

if ($balance->available_balance <= 0) {
    echo "No available balance to payout\n";
    exit;
}

// Test initiate payout
echo "1. INITIATING PAYOUT...\n";
try {
    $controller = new App\Http\Controllers\AdminPayoutController(new App\Services\PayoutService());
    
    // Create mock request
    $request = new Illuminate\Http\Request();
    $request->merge([
        'author_id' => $author->id,
        'amount' => $balance->available_balance,
        'payment_method' => 'bank_transfer',
        'notes' => 'Test payout from script'
    ]);
    
    // Mock auth
    Auth::shouldReceive('user')->andReturn($admin);
    
    $response = $controller->initiatePayout($request);
    $data = json_decode($response->getContent(), true);
    
    if ($data['success']) {
        echo "✅ Payout initiated successfully!\n";
        echo "Payout ID: {$data['data']['id']}\n";
        echo "Amount: \${$data['data']['amount']}\n";
        echo "Status: {$data['data']['status']}\n\n";
        
        $payoutId = $data['data']['id'];
        
        // Check updated balance
        $balance->refresh();
        echo "Updated Author Balance:\n";
        echo "- Available: \${$balance->available_balance}\n\n";
        
        // Test confirm payout
        echo "2. CONFIRMING PAYOUT...\n";
        $confirmRequest = new Illuminate\Http\Request();
        $confirmRequest->merge([
            'transaction_reference' => 'TEST-TXN-' . time(),
            'notes' => 'Payment completed via test'
        ]);
        
        $confirmResponse = $controller->confirmPayout($confirmRequest, $payoutId);
        $confirmData = json_decode($confirmResponse->getContent(), true);
        
        if ($confirmData['success']) {
            echo "✅ Payout confirmed successfully!\n";
            echo "Transaction Ref: {$confirmData['data']['transaction_reference']}\n";
            echo "Status: {$confirmData['data']['status']}\n\n";
            
            // Check final balance
            $balance->refresh();
            echo "Final Author Balance:\n";
            echo "- Available: \${$balance->available_balance}\n";
            echo "- Total Withdrawn: \${$balance->total_withdrawn}\n";
        } else {
            echo "❌ Failed to confirm payout: {$confirmData['error']}\n";
        }
        
    } else {
        echo "❌ Failed to initiate payout: {$data['error']}\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: {$e->getMessage()}\n";
    echo "Trace: {$e->getTraceAsString()}\n";
}
