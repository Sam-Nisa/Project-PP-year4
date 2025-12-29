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
    } catch (err) {
      console.error("Failed to fetch books:", err);
      set({ error: err.response?.data?.message || "Failed to fetch books" });
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
      set({ error: err.response?.data?.message || "Failed to fetch book" });
    } finally {
      set({ loading: false });
    }
  },

  createBook: async (payload) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null) formData.append(key, value);
      });

      const data = await request("/api/books", "POST", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      set((state) => ({ books: [...state.books, data] }));
      return data;
    } catch (err) {
      console.error("Failed to create book:", err);
      set({ error: err.response?.data?.message || "Failed to create book" });
    } finally {
      set({ loading: false });
    }
  },

  updateBook: async (id, payload) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null) formData.append(key, value);
      });

      const data = await request(`/api/books/${id}`, "POST", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          "X-HTTP-Method-Override": "PUT",
        },
      });

      set((state) => ({
        books: state.books.map((b) => (b.id === id ? data : b)),
      }));

      return data;
    } catch (err) {
      console.error("Failed to update book:", err);
      set({ error: err.response?.data?.message || "Failed to update book" });
    } finally {
      set({ loading: false });
    }
  },

  deleteBook: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });
    try {
      await request(`/api/books/${id}`, "DELETE", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set((state) => ({ books: state.books.filter((b) => b.id !== id) }));
    } catch (err) {
      console.error("Failed to delete book:", err);
      set({ error: err.response?.data?.message || "Failed to delete book" });
    } finally {
      set({ loading: false });
    }
  },

  // ✅ FIXED fetchBooksByGenre
fetchBooksByGenre: async (slug) => {
  try {
    const res = await fetch(`${API_URL}/api/books?genre=${slug}`);
    if (!res.ok) throw new Error("Failed to fetch books");
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err; // Let the component handle the error
  }
},
}));
