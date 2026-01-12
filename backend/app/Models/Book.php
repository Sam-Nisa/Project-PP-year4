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
        'cover_image',       // optional main cover (legacy)
        'cover_image_url',   // direct URL for cover image
        'images',            // multiple images (JSON) (legacy)
        'images_url',        // multiple image URLs (JSON)
        'pdf_file',          // PDF path (legacy)
        'pdf_file_url',      // direct URL for PDF
        'description',
        'status',
        'discount_type',
        'discount_value',
        'publication_date',
        'page_count',
        'about_author',
        'publisher',
        'author_name',
    ];

    // Append extra attributes (remove images_url since it's a direct column now)
    protected $appends = ['cover_image_url', 'pdf_file_url', 'discounted_price'];

    // Cast JSON fields to array
    protected $casts = [
        'images' => 'array',
        'images_url' => 'array',
    ];

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
        // If we have a direct URL, use it
        if (!empty($this->attributes['cover_image_url'])) {
            return $this->attributes['cover_image_url'];
        }
        
        // Fallback to legacy storage path
        return $this->cover_image ? asset('storage/' . $this->cover_image) : null;
    }

    // Accessor for PDF file URL
    public function getPdfFileUrlAttribute()
    {
        // If we have a direct URL, use it
        if (!empty($this->attributes['pdf_file_url'])) {
            return $this->attributes['pdf_file_url'];
        }
        
        // Fallback to legacy storage path
        return $this->pdf_file ? asset('storage/' . $this->pdf_file) : null;
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
