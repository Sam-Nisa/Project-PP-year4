"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import StarRating from "./StarRating";
import { useReviewStore } from "../store/useReviewStore";
import { useAuthStore } from "../store/authStore";

export default function QuickRating({ bookId, currentRating = 0, totalReviews = 0, onRatingUpdate }) {
  const { user } = useAuthStore();
  const { userReview, createReview, updateReview, loading } = useReviewStore();
  
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [comment, setComment] = useState(userReview?.comment || "");

  // Ensure we have valid numbers
  const safeCurrentRating = parseFloat(currentRating) || 0;
  const safeTotalReviews = parseInt(totalReviews) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please login to rate this book");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      const reviewData = { rating, comment: comment.trim() };

      if (userReview) {
        await updateReview(bookId, userReview.id, reviewData);
        toast.success("Rating updated successfully!");
      } else {
        await createReview(bookId, reviewData);
        toast.success("Rating submitted successfully!");
      }

      setShowForm(false);
      
      // Notify parent component to refresh data
      if (onRatingUpdate) {
        onRatingUpdate();
      }
    } catch (err) {
      console.error("Rating submission error:", err);
      
      // Show specific error message
      if (err.message.includes("already reviewed")) {
        toast.error("You have already reviewed this book");
      } else if (err.message.includes("Authentication")) {
        toast.error("Please login to submit a rating");
      } else {
        toast.error(err.message || "Failed to submit rating");
      }
    }
  };

  const handleCancel = () => {
    setRating(userReview?.rating || 0);
    setComment(userReview?.comment || "");
    setShowForm(false);
  };

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={safeCurrentRating} readonly size="sm" />
              <span className="text-sm text-gray-600">
                ({safeTotalReviews} review{safeTotalReviews !== 1 ? 's' : ''})
              </span>
            </div>
            <p className="text-sm text-gray-600">Rate this book</p>
          </div>
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Login to Rate
          </a>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">
          {userReview ? "Update Your Rating" : "Rate This Book"}
        </h4>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <StarRating 
              rating={rating}
              onRatingChange={setRating}
              size="md"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : (userReview ? "Update" : "Submit")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StarRating rating={safeCurrentRating} readonly size="sm" />
            <span className="text-sm text-gray-600">
              ({safeTotalReviews} review{safeTotalReviews !== 1 ? 's' : ''})
            </span>
          </div>
          {userReview ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600 font-medium">You rated:</span>
              <StarRating rating={userReview.rating} readonly size="sm" />
            </div>
          ) : (
            <p className="text-sm text-gray-600">Rate this book</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          {userReview ? "Edit Rating" : "Rate Book"}
        </button>
      </div>
    </div>
  );
}