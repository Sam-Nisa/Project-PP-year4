<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'author_id',
        'genre_id',
        'price',
        'stock',
        'cover_image',
        'description',
        'status',
        'discount_type',   // NEW
        'discount_value',  // NEW
        'publication_date', // NEW
        'page_count',       // NEW
        'about_author',     // NEW
        'publisher',    // NEW
        'author_name',    // NEW
       
    ];

    // Combine all appended attributes in a single array
    protected $appends = ['cover_image_url', 'discounted_price'];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function genre()
    {
        return $this->belongsTo(Genre::class, 'genre_id');
    }

    // Accessor for full cover image URL
    public function getCoverImageUrlAttribute()
    {
        if ($this->cover_image) {
            return asset('storage/' . $this->cover_image);
        }
        return null; 
    }

    // Accessor for discounted price
    public function getDiscountedPriceAttribute()
    {
        if ($this->discount_type && $this->discount_value) {
            if ($this->discount_type === 'percentage') {
                return round($this->price * (1 - $this->discount_value / 100), 2);
            } elseif ($this->discount_type === 'fixed') {
                return max($this->price - $this->discount_value, 0);
            }
        }
        return $this->price;
    }
}
