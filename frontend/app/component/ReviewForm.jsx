"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import StarRating from "./StarRating";
import { useReviewStore } from "../store/useReviewStore";
import { useAuthStore } from "../store/authStore";

export default function ReviewForm({ bookId, onSuccess, onCancel }) {
  const { user } = useAuthStore();
  const { 
    userReview, 
    createReview, 
    updateReview, 
    loading, 
    error 
  } = useReviewStore();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form with existing review data
  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment || "");
      setIsEditing(true);
    } else {
      setRating(0);
      setComment("");
      setIsEditing(false);
    }
  }, [userReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    try {
      const reviewData = { rating, comment: comment.trim() };

      if (isEditing && userReview) {
        await updateReview(bookId, userReview.id, reviewData);
        toast.success("Review updated successfully!");
      } else {
        await createReview(bookId, reviewData);
        toast.success("Review submitted successfully!");
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(error || "Failed to submit review");
    }
  };

  const handleCancel = () => {
    if (userReview) {
      // Reset to original values
      setRating(userReview.rating);
      setComment(userReview.comment || "");
    } else {
      // Clear form
      setRating(0);
      setComment("");
    }
    
    if (onCancel) onCancel();
  };

  if (!user) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">Please login to write a review</p>
        <a 
          href="/login" 
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Login
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? "Edit Your Review" : "Write a Review"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating *
          </label>
          <StarRating 
            rating={rating}
            onRatingChange={setRating}
            size="lg"
            showValue={true}
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this book..."
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {comment.length}/1000 characters
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEditing ? "Updating..." : "Submitting..."}
              </div>
            ) : (
              isEditing ? "Update Review" : "Submit Review"
            )}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}