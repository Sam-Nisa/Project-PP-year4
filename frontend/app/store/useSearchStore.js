import { create } from "zustand";
import { request } from "../utils/request";

export const useSearchStore = create((set, get) => ({
  searchResults: [],
  searchQuery: "",
  loading: false,
  error: null,
  hasSearched: false,

  // ---------------------- SEARCH BOOKS ----------------------
  searchBooks: async (query) => {
    if (!query.trim()) {
      set({ 
        searchResults: [], 
        searchQuery: "", 
        hasSearched: false,
        error: null 
      });
      return;
    }

    set({ loading: true, error: null, searchQuery: query });

    try {
      const data = await request(
        `/api/books`,
        "GET",
        { search: query }
      );

      // Ensure data is an array
      const results = Array.isArray(data) ? data : [];

      set({ 
        searchResults: results,
        loading: false,
        hasSearched: true
      });

      return results;
    } catch (err) {
      console.error("Failed to search books:", err);
      let errorMessage = "Failed to search books";
      
      if (err.response?.status === 404) {
        errorMessage = "No books found matching your search";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error occurred while searching";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      set({ 
        error: errorMessage,
        loading: false,
        searchResults: [],
        hasSearched: true
      });
      throw new Error(errorMessage);
    }
  },

  // ---------------------- CLEAR SEARCH ----------------------
  clearSearch: () => {
    set({ 
      searchResults: [], 
      searchQuery: "", 
      hasSearched: false,
      error: null,
      loading: false
    });
  },

  // ---------------------- CLEAR ERROR ----------------------
  clearError: () => {
    set({ error: null });
  },
}));