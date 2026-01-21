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
        `/api/books?search=${encodeURIComponent(query)}`,
        "GET"
      );

      set({ 
        searchResults: data || [],
        loading: false,
        hasSearched: true
      });

      return data;
    } catch (err) {
      console.error("Failed to search books:", err);
      const errorMessage = err.response?.data?.message || "Failed to search books";
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