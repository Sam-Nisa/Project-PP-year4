<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'total_amount',
        'subtotal',
        'shipping_cost',
        'tax_amount',
        'status',
        'payment_method',
        'payment_qr_code',
        'payment_qr_md5',
        'payment_status',
        'payment_transaction_id',
        'shipping_address',
        'discount_code_id',
        'discount_code',
        'discount_amount',
        'qr_expires_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_address' => 'array',
        'qr_expires_at' => 'datetime',
    ];

    /**
     * Get the user that owns the order
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the order items
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the total number of items in the order
     */
    public function getTotalItemsAttribute()
    {
        return $this->items->sum('quantity');
    }

    /**
     * Get the discount code used in this order
     */
    public function discountCode()
    {
        return $this->belongsTo(DiscountCode::class);
    }

    /**
     * Check if the QR code has expired
     */
    public function isQRExpired()
    {
        return $this->qr_expires_at?->isPast() ?? false;
    }

    /**
     * Check if the order is expired and should be deleted
     */
    public function shouldBeDeleted()
    {
        return $this->isQRExpired() && $this->payment_status === 'failed' && !$this->payment_transaction_id;
    }
}