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
        'cover_image',       // optional main cover
        'images',            // multiple images (JSON)
        'pdf_file',          // PDF path
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

    // Append extra attributes
    protected $appends = ['cover_image_url', 'images_url', 'pdf_file_url', 'discounted_price'];

    // Cast JSON field to array
    protected $casts = [
        'images' => 'array',
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
        return $this->cover_image ? asset('storage/' . $this->cover_image) : null;
    }

    // Accessor for multiple images URLs
    public function getImagesUrlAttribute()
    {
        if ($this->images && is_array($this->images)) {
            return array_map(fn($img) => asset('storage/' . $img), $this->images);
        }
        return [];
    }

    // Accessor for PDF file URL
    public function getPdfFileUrlAttribute()
    {
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
