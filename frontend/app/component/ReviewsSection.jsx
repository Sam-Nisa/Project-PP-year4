"use client";

import { useState, useEffect } from "react";
import { ChevronDownIcon, FunnelIcon } from "@heroicons/react/24/outline";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import ReviewItem from "./ReviewItem";
import { useReviewStore } from "../store/useReviewStore";
import { useAuthStore } from "../store/authStore";

export default function ReviewsSection({ bookId }) {
  const { user } = useAuthStore();
  const {
    reviews,
    userReview,
    ratingStats,
    loading,
    hasMore,
    error,
    fetchReviews,
    fetchUserReview,
    loadMoreReviews,
    resetReviews
  } = useReviewStore();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filters, setFilters] = useState({
    rating: 'all',
    verifiedOnly: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // Initialize reviews when component mounts
  useEffect(() => {
    resetReviews();
    
    // Add a small delay to ensure the component is mounted
    const initializeReviews = async () => {
      try {
        await fetchReviews(bookId, filters);
        if (user) {
          await fetchUserReview(bookId);
        }
      } catch (error) {
        console.error("Failed to initialize reviews:", error);
        // Don't throw error, just log it - the component should still render
      }
    };

    initializeReviews();
  }, [bookId, user]);

  // Refetch when filters change
  useEffect(() => {
    const applyFilters = async () => {
      try {
        await fetchReviews(bookId, filters);
      } catch (error) {
        console.error("Failed to apply filters:", error);
      }
    };

    applyFilters();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleLoadMore = () => {
    loadMoreReviews(bookId, filters);
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    // Reviews will be updated automatically by the store
  };

  const handleEditReview = () => {
    setShowReviewForm(true);
  };

  const getRatingPercentage = (rating) => {
    const totalReviews = parseInt(ratingStats.total_reviews) || 0;
    if (totalReviews === 0) return 0;
    
    const distribution = ratingStats.rating_distribution || {};
    const count = parseInt(distribution[rating]) || 0;
    
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  {(parseFloat(ratingStats.average_rating) || 0).toFixed(1)}
                </div>
                <StarRating rating={parseFloat(ratingStats.average_rating) || 0} readonly size="lg" />
                <p className="text-sm text-gray-600 mt-2">
                  Based on {parseInt(ratingStats.total_reviews) || 0} review{(parseInt(ratingStats.total_reviews) || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const percentage = getRatingPercentage(rating);
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{rating}</span>
                    <StarRating rating={1} readonly size="sm" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write Review Section */}
      {user && !userReview && !showReviewForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Share Your Experience</h3>
              <p className="text-blue-700 text-sm">Help other readers by writing a review</p>
            </div>
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Write Review
            </button>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          bookId={bookId}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* User's Existing Review */}
      {userReview && !showReviewForm && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-900">Your Review</h3>
            <button
              onClick={handleEditReview}
              className="text-green-700 hover:text-green-800 text-sm font-medium"
            >
              Edit Review
            </button>
          </div>
          <ReviewItem 
            review={userReview} 
            bookId={bookId} 
            onEdit={handleEditReview}
            allowInlineEdit={true}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">All Reviews ({parseInt(ratingStats.total_reviews) || 0})</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange({ rating: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Verified Purchase Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Status
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => handleFilterChange({ verifiedOnly: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Verified purchases only</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading && reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-lg">Unable to load reviews</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <button
              onClick={() => fetchReviews(bookId, filters)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No reviews yet</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <>
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                bookId={bookId}
                onEdit={handleEditReview}
                allowInlineEdit={true}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Loading..." : "Load More Reviews"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}