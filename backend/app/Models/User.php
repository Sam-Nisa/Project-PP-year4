<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory;

    protected $fillable = [
        'name', 'email', 'password_hash', 'role', 'avatar', 'avatar_url', 'bio',
    ];

    protected $hidden = [
        'password_hash',
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
