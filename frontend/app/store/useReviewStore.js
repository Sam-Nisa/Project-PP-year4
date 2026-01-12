import { create } from "zustand";
import { request } from "../utils/request";
import { useAuthStore } from "./authStore";

export const useReviewStore = create((set, get) => ({
  reviews: [],
  userReview: null,
  ratingStats: {
    average_rating: 0,
    total_reviews: 0,
    rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  },
  loading: false,
  error: null,
  currentPage: 1,
  hasMore: true,

  // ---------------------- FETCH REVIEWS ----------------------
  fetchReviews: async (bookId, filters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      if (filters.rating && filters.rating !== 'all') {
        params.append('rating', filters.rating);
      }
      if (filters.verifiedOnly) {
        params.append('verified_only', 'true');
      }
      if (filters.page) {
        params.append('page', filters.page);
      }

      const queryString = params.toString();
      const url = `/api/books/${bookId}/reviews${queryString ? `?${queryString}` : ''}`;
      
      // Public endpoint - no authentication needed
      const data = await request(url, "GET");
      
      const isFirstPage = !filters.page || filters.page === 1;
      
      // Ensure rating stats have proper defaults
      const safeRatingStats = {
        average_rating: parseFloat(data.rating_stats?.average_rating) || 0,
        total_reviews: parseInt(data.rating_stats?.total_reviews) || 0,
        rating_distribution: data.rating_stats?.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
      
      set({
        reviews: isFirstPage ? (data.reviews?.data || []) : [...get().reviews, ...(data.reviews?.data || [])],
        ratingStats: safeRatingStats,
        currentPage: data.reviews?.current_page || 1,
        hasMore: data.reviews ? (data.reviews.current_page < data.reviews.last_page) : false,
        loading: false
      });
      
      return data;
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch reviews";
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // ---------------------- FETCH USER'S REVIEW ----------------------
  fetchUserReview: async (bookId) => {
    const token = useAuthStore.getState().token;
    if (!token) return null;

    try {
      const data = await request(`/api/books/${bookId}/reviews/user`, "GET", {}, {}, token);
      set({ userReview: data.review });
      return data.review;
    } catch (err) {
      console.error("Failed to fetch user review:", err);
      set({ userReview: null });
      return null;
    }
  },

  // ---------------------- CREATE REVIEW ----------------------
  createReview: async (bookId, reviewData) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });

    try {
      const data = await request(
        `/api/books/${bookId}/reviews`,
        "POST",
        reviewData,
        { 'Content-Type': 'application/json' },
        token
      );

      // Add new review to the beginning of the list
      set((state) => ({
        reviews: [data.review, ...state.reviews],
        userReview: data.review,
        ratingStats: data.rating_stats ? {
          average_rating: parseFloat(data.rating_stats.average_rating) || 0,
          total_reviews: parseInt(data.rating_stats.total_reviews) || 0,
          rating_distribution: data.rating_stats.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        } : state.ratingStats,
        loading: false
      }));

      return data.review;
    } catch (err) {
      console.error("Failed to create review:", err);
      let errorMsg = "Failed to create review";
      
      if (err.response?.status === 409) {
        errorMsg = "You have already reviewed this book";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },

  // ---------------------- UPDATE REVIEW ----------------------
  updateReview: async (bookId, reviewId, reviewData) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });

    try {
      const data = await request(
        `/api/books/${bookId}/reviews/${reviewId}`,
        "PUT",
        reviewData,
        { 'Content-Type': 'application/json' },
        token
      );

      // Update review in the list and user review
      set((state) => ({
        reviews: state.reviews.map(review => 
          review.id === reviewId ? data.review : review
        ),
        userReview: data.review,
        ratingStats: data.rating_stats ? {
          average_rating: parseFloat(data.rating_stats.average_rating) || 0,
          total_reviews: parseInt(data.rating_stats.total_reviews) || 0,
          rating_distribution: data.rating_stats.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        } : state.ratingStats,
        loading: false
      }));

      return data.review;
    } catch (err) {
      console.error("Failed to update review:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to update review";
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // ---------------------- DELETE REVIEW ----------------------
  deleteReview: async (bookId, reviewId) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });

    try {
      const data = await request(
        `/api/books/${bookId}/reviews/${reviewId}`,
        "DELETE",
        {},
        {},
        token
      );

      // Remove review from list and clear user review
      set((state) => ({
        reviews: state.reviews.filter(review => review.id !== reviewId),
        userReview: null,
        ratingStats: data.rating_stats ? {
          average_rating: parseFloat(data.rating_stats.average_rating) || 0,
          total_reviews: parseInt(data.rating_stats.total_reviews) || 0,
          rating_distribution: data.rating_stats.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        } : state.ratingStats,
        loading: false
      }));

      return true;
    } catch (err) {
      console.error("Failed to delete review:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to delete review";
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // ---------------------- LOAD MORE REVIEWS ----------------------
  loadMoreReviews: async (bookId, filters = {}) => {
    const { currentPage, hasMore, loading } = get();
    
    if (!hasMore || loading) return;

    return get().fetchReviews(bookId, { ...filters, page: currentPage + 1 });
  },

  // ---------------------- RESET STATE ----------------------
  resetReviews: () => {
    set({
      reviews: [],
      userReview: null,
      ratingStats: {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      loading: false,
      error: null,
      currentPage: 1,
      hasMore: true
    });
  },

  // ---------------------- HELPER METHODS ----------------------
  getAverageRating: () => get().ratingStats.average_rating,
  getTotalReviews: () => get().ratingStats.total_reviews,
  getRatingDistribution: () => get().ratingStats.rating_distribution,
  hasUserReviewed: () => !!get().userReview,
}));