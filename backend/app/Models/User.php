<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory;

    protected $fillable = [
        'name', 'email', 'password_hash', 'role', 'avatar', 'avatar_url',
        'bank_name', 'bank_account_number', 'bank_account_name', 'bank_branch',
        'payment_method', 'payment_verified', 'payment_verified_at',
        'bakong_account_id', 'bakong_merchant_name', 'bakong_merchant_city',
        'bakong_merchant_id', 'bakong_acquiring_bank', 'bakong_mobile_number',
        'bakong_account_verified', 'bakong_verified_at',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'bakong_account_verified' => 'boolean',
        'bakong_verified_at' => 'datetime',
        'payment_verified' => 'boolean',
        'payment_verified_at' => 'datetime',
    ];

    // Accessor for avatar_url - prioritize avatar_url, fallback to avatar
    public function getAvatarUrlAttribute()
    {
        // If we have a direct URL in the avatar_url column, use it
        if (!empty($this->attributes['avatar_url'])) {
            return $this->attributes['avatar_url'];
        }
        
        // Fallback to legacy avatar path
        if (!empty($this->attributes['avatar'])) {
            return asset('storage/' . $this->attributes['avatar']);
        }
        
        return null;
    }

    // JWT methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }
}
