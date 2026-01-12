<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

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
        'average_rating',
        'total_reviews',
        'rating_distribution',
    ];

    // Append extra attributes (remove images_url since it's a direct column now)
    protected $appends = ['cover_image_url', 'pdf_file_url', 'discounted_price'];

    // Cast JSON fields to array
    protected $casts = [
        'images' => 'array',
        'images_url' => 'array',
        'rating_distribution' => 'array',
        'average_rating' => 'decimal:2',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function genre()
    {
        return $this->belongsTo(Genre::class, 'genre_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews()
    {
        return $this->hasMany(Review::class)->where('status', 'approved');
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

    // Rating calculation methods
    public function calculateRatingStats()
    {
        // Build query with proper column checks
        $query = $this->reviews();
        
        // Check if status column exists before filtering
        if (Schema::hasColumn('reviews', 'status')) {
            $query->where('status', 'approved');
        }
        
        $reviews = $query->get();
        $totalReviews = $reviews->count();
        
        if ($totalReviews === 0) {
            return [
                'average_rating' => (float) 0,
                'total_reviews' => (int) 0,
                'rating_distribution' => [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0]
            ];
        }

        $averageRating = $reviews->avg('rating');
        $distribution = [];
        
        for ($i = 1; $i <= 5; $i++) {
            $distribution[$i] = $reviews->where('rating', $i)->count();
        }

        return [
            'average_rating' => (float) round($averageRating, 2),
            'total_reviews' => (int) $totalReviews,
            'rating_distribution' => $distribution
        ];
    }

    public function updateRatingStats()
    {
        $stats = $this->calculateRatingStats();
        
        $this->update([
            'average_rating' => $stats['average_rating'],
            'total_reviews' => $stats['total_reviews'],
            'rating_distribution' => $stats['rating_distribution']
        ]);

        return $stats;
    }

    public function getUserReview($userId)
    {
        return $this->reviews()->where('user_id', $userId)->first();
    }

    public function hasUserReviewed($userId)
    {
        return $this->reviews()->where('user_id', $userId)->exists();
    }
}
