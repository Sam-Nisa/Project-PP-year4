"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { TrashIcon, PencilIcon, CheckBadgeIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import StarRating from "./StarRating";
import { useReviewStore } from "../store/useReviewStore";
import { useAuthStore } from "../store/authStore";

export default function ReviewItem({ review, bookId, onEdit, allowInlineEdit = false }) {
  const { user } = useAuthStore();
  const { deleteReview, updateReview, loading } = useReviewStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment || "");

  const isOwner = user && user.id === review.user_id;
  const canEdit = isOwner && review.created_at && 
    new Date(review.created_at).getTime() > Date.now() - (24 * 60 * 60 * 1000); // 24 hours

  const handleDelete = async () => {
    try {
      await deleteReview(bookId, review.id);
      toast.success("Review deleted successfully");
      setShowDeleteConfirm(false);
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const handleEditClick = () => {
    if (allowInlineEdit) {
      setIsEditing(true);
      setEditRating(review.rating);
      setEditComment(review.comment || "");
    } else if (onEdit) {
      onEdit(review);
    }
  };

  const handleSaveEdit = async () => {
    if (editRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      await updateReview(bookId, review.id, {
        rating: editRating,
        comment: editComment.trim()
      });
      toast.success("Review updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update review");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {review.user?.avatar_url ? (
              <img
                src={review.user.avatar_url}
                alt={review.user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                {review.user?.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">
                {review.user?.name || "Anonymous"}
              </h4>
              {review.is_verified_purchase && (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  <CheckBadgeIcon className="w-3 h-3" />
                  Verified Purchase
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <StarRating 
                    rating={editRating}
                    onRatingChange={setEditRating}
                    size="sm"
                  />
                  <span className="text-sm text-blue-600 font-medium">
                    Editing...
                  </span>
                </div>
              ) : (
                <>
                  <StarRating rating={review.rating} readonly size="sm" />
                  <span className="text-sm text-gray-500">
                    {getTimeAgo(review.created_at)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isOwner && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading || editRating === 0}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Save changes"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cancel editing"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {canEdit && (
                  <button
                    onClick={handleEditClick}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit review"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete review"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Review Content */}
      {isEditing ? (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Edit your comment
          </label>
          <textarea
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Share your thoughts about this book..."
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {editComment.length}/1000 characters
          </div>
        </div>
      ) : (
        review.comment && (
          <div className="mt-3">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          </div>
        )
      )}

      {/* Edit Notice */}
      {isOwner && !canEdit && (
        <div className="mt-3 text-xs text-gray-500 italic">
          Reviews can only be edited within 24 hours of posting
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-3">Delete Review</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your review? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}