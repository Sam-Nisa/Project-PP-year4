import { create } from "zustand";
import { request } from "../utils/request";
import { useAuthStore } from "./authStore";

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
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to fetch books";
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
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to fetch book";
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
      // If payload contains uploaded URLs, send as JSON
      if (payload.images_url || payload.pdf_file_url) {
        const data = await request("/api/books", "POST", payload, {
          'Content-Type': 'application/json'
        }, token);
        
        // Add the new book to the state
        set((state) => ({
          books: [...state.books, data],
          error: null,
        }));

        return data;
      }

      // Fallback to FormData for direct file uploads (legacy support)
      const formData = new FormData();

      // Handle images separately
      if (payload.images && Array.isArray(payload.images)) {
        payload.images.forEach((image) => {
          formData.append('images[]', image);
        });
        delete payload.images; // Remove from payload to avoid double processing
      }

      // Append all other fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });

      const data = await request("/api/books", "POST", formData, {}, token);
      

      // Add the new book to the state
      set((state) => ({
        books: [...state.books, data],
        error: null,
      }));

      return data;
    } catch (err) {
      console.error("Failed to create book:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to create book";
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
      // If payload contains uploaded URLs, send as JSON
      if (payload.images_url || payload.pdf_file_url || payload.cover_image_url) {
        // Send as JSON when we have URLs
        const data = await request(`/api/books/${id}`, "PUT", payload, {
          'Content-Type': 'application/json'
        }, token);

        // Update the book in the state
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? data : b)),
          error: null,
        }));

        return data;
      }

      // Fallback to FormData for direct file uploads (legacy support)
      const formData = new FormData();

      // Handle images separately
      if (payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
        // Only append if there are actual File objects
        const hasFiles = payload.images.some(img => img instanceof File);
        if (hasFiles) {
          payload.images.forEach((image) => {
            if (image instanceof File) {
              formData.append('images[]', image);
            }
          });
        }
        delete payload.images; // Remove from payload to avoid double processing
      }

      // Append all other fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          // Only append cover_image if it's a File object
          if (key === "cover_image" && !(value instanceof File)) {
            return;
          }
          formData.append(key, value);
        }
      });

      // Add method override for Laravel
      formData.append('_method', 'PUT');

      const data = await request(`/api/books/${id}`, "POST", formData, {}, token);

      // Update the book in the state
      set((state) => ({
        books: state.books.map((b) => (b.id === id ? data : b)),
        error: null,
      }));

      return data;
    } catch (err) {
      console.error("Failed to update book:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to update book";
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
      await request(`/api/books/${id}`, "DELETE", {}, {}, token);

      // Remove the book from the state
      set((state) => ({
        books: state.books.filter((b) => b.id !== id),
        error: null,
      }));

      return true;
    } catch (err) {
      console.error("Failed to delete book:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to delete book";
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
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to fetch books";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchBooksByAuthor: async (authorId) => {
    const token = useAuthStore.getState().token;
    const user = useAuthStore.getState().user;
    
    set({ loading: true, error: null });
    try {
      let data;
      
      // If the current user is fetching their own books and they're an author,
      // use the author endpoint to get all their books (including pending)
      if (user && user.role === 'author' && user.id === parseInt(authorId)) {
        console.log('Using author endpoint for own books:', { userId: user.id, authorId });
        data = await request("/api/author/books", "GET", {}, {}, token);
      } else {
        // For other cases (public view, admin view), use the regular endpoint
        console.log('Using public endpoint for author books:', { userId: user?.id, authorId });
        data = await request(`/api/books?author_id=${authorId}`, "GET");
      }
      
      console.log('Fetched books for author:', { authorId, count: data?.length, books: data });
      return data || [];
    } catch (err) {
      console.error("Failed to fetch books by author:", err);
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to fetch books";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  // Admin method to fetch all books regardless of author
  fetchAllBooks: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "Authentication required" });
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });
    try {
      // Admin endpoint to get all books
      const data = await request("/api/admin/books", "GET", {}, {}, token);
      return data || [];
    } catch (err) {
      console.error("Failed to fetch all books:", err);
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to fetch books";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));
