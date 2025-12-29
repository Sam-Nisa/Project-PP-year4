// useWishlistStore.js

"use client";
import { create } from "zustand";
import { request } from "../utils/request";
import { useAuthStore } from "./authStore";

export const useWishlistStore = create((set, get) => ({
  wishlists: [], // Now stores an array of book objects
  loading: false,
  error: null,

  // Fetch wishlist for current user
  fetchWishlists: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ wishlists: [] }); 
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await request(
        "/api/wishlists",
        "GET",
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      let apiData = [];
      
      if (response && Array.isArray(response.data)) {
          apiData = response.data;
      } else if (response && Array.isArray(response)) {
          apiData = response;
      }
      
      // --- DIAGNOSTIC LOG (Check this in your browser console!) ---
      console.log("--- Wishlist Debugging ---");
      console.log("Raw API data received:", apiData); 
      // -----------------------------------------------------------

      let bookObjects = [];

      if (apiData.length > 0) {
        
        const firstItem = apiData[0];

        // Case 1: The response item contains a nested 'book' object (most common for pivot tables)
        if (firstItem.book && firstItem.book.id) {
            console.log("Structure A detected: Mapping nested 'book' objects.");
            // We map, and then filter out any items where the nested book object was null/missing
            bookObjects = apiData.map(item => item.book).filter(b => b && b.id);
        } 
        // Case 2: The response items are the book objects themselves
        else if (firstItem.id && firstItem.title) {
            console.log("Structure B detected: Mapping direct book objects.");
             bookObjects = apiData;
        }
        else {
            // If the backend only returned {id: 1, user_id: 1, book_id: 5} without the full book details, we cannot render.
            console.warn("API response does not contain required book details (title/price/cover_image). Check if the API is eager-loading the book relationship.");
        }
      }
      
      console.log("Processed Wishlist Book Objects for Rendering:", bookObjects);
      set({ wishlists: bookObjects });
      
    } catch (err) {
      console.error("Failed to fetch wishlists:", err);

      set({
        error:
          err?.response?.data?.error || err?.message || "Failed to load wishlist",
        wishlists: [],
      });
    } finally {
      set({ loading: false });
    }
  },

  // Add a book to wishlist
  addWishlist: async (book_id, tempBookData = {}) => { // Added tempBookData
    const token = useAuthStore.getState().token;
    if (!token) return;

    // Create a temporary stub object for immediate UI update
    const tempBook = { id: book_id, ...tempBookData };
    
    // Optimistic Update: Insert the temporary book object
    set(state => {
        // Prevent duplicates if multiple clicks happen fast, although unlikely with current setup
        if (state.wishlists.some(book => book.id === book_id)) return state;
        return { 
            wishlists: [...state.wishlists, tempBook],
            loading: true, 
            error: null 
        }
    });
    
    try {
      await request("/api/wishlists", "POST", { book_id }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Failed to add wishlist:", err);
      // Rollback state: filter by book ID
      set(state => ({ 
        wishlists: state.wishlists.filter(book => book.id !== book_id),
        error: err.response?.data?.error || "Failed to add wishlist" 
      }));
    } finally {
      set({ loading: false });
    }
  },

  // Remove a book from wishlist
  removeWishlist: async (book_id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    // Optimistic Update: filter by book ID
    const originalWishlists = get().wishlists;
    set(state => ({ 
        wishlists: state.wishlists.filter(book => book.id !== book_id),
        loading: true, 
        error: null 
    }));

    try {
      await request(`/api/wishlists/${book_id}`, "DELETE", {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Failed to remove wishlist:", err);
      // Rollback state if API call fails
      set({ 
        wishlists: originalWishlists,
        error: err.response?.data?.error || "Failed to remove wishlist" 
      });
    } finally {
      set({ loading: false });
    }
  },

  // Check if a book is in wishlist (Now checks object IDs)
  isWishlisted: (book_id) => {
    const { wishlists } = get();
    // Use .some() to check if any book object's ID matches
    return wishlists.some(book => book.id === book_id);
  },
}));