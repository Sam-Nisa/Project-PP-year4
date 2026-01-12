"use client";
import StarRating from "./StarRating";

export default function RatingSummary({
  rating = 0,
  totalReviews = 0,
}) {
  const safeRating = Number(rating) || 0;
  const safeTotalReviews = Number(totalReviews) || 0;

  return (
    <div className="flex items-center gap-2 mt-3">
      <StarRating rating={safeRating} readonly size="sm" />
      <span className="text-sm text-gray-600">
        {safeRating.toFixed(1)} • {safeTotalReviews} review
        {safeTotalReviews !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
