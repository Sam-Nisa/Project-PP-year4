import { create } from "zustand";
import { request } from "../utils/request";
import { useAuthStore } from "./authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useBookStore = create((set, get) => ({
  books: [],
  loading: false,
  error: null,

  fetchBooks: async () => {
    set({ loading: true, error: null });
    try {
      const data = await request("/api/books", "GET");
      set({ books: data || [] });
      return data;
    } catch (err) {
      console.error("Failed to fetch books:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch books";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchBook: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await request(`/api/books/${id}`, "GET");
      return data || null;
    } catch (err) {
      console.error("Failed to fetch book:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch book";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  createBook: async (payload) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "Authentication required" });
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });

      const response = await fetch(`${API_URL}/api/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create book");
      }

      const data = await response.json();
      
      // Add the new book to the state
      set((state) => ({ 
        books: [...state.books, data],
        error: null 
      }));
      
      return data;
    } catch (err) {
      console.error("Failed to create book:", err);
      const errorMsg = err.message || "Failed to create book";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateBook: async (id, payload) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "Authentication required" });
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          // Only append cover_image if it's a File object
          if (key === "cover_image" && !(value instanceof File)) {
            return;
          }
          formData.append(key, value);
        }
      });

      const response = await fetch(`${API_URL}/api/books/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-HTTP-Method-Override": "PUT",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update book");
      }

      const data = await response.json();
      
      // Update the book in the state
      set((state) => ({
        books: state.books.map((b) => (b.id === id ? data : b)),
        error: null
      }));

      return data;
    } catch (err) {
      console.error("Failed to update book:", err);
      const errorMsg = err.message || "Failed to update book";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteBook: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "Authentication required" });
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/books/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete book");
      }

      // Remove the book from the state
      set((state) => ({ 
        books: state.books.filter((b) => b.id !== id),
        error: null
      }));
      
      return true;
    } catch (err) {
      console.error("Failed to delete book:", err);
      const errorMsg = err.message || "Failed to delete book";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchBooksByGenre: async (slug) => {
    set({ loading: true, error: null });
    try {
      const data = await request(`/api/books?genre=${slug}`, "GET");
      return data || [];
    } catch (err) {
      console.error("Failed to fetch books by genre:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch books";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));