import { create } from "zustand";
import { request } from "../utils/request";
import { useAuthStore } from "./authStore";


export const useGenreStore = create((set, get) => ({
  genres: [],
  loading: false,
  error: null,

  // Fetch all genres (public)
  fetchGenres: async () => {
    set({ loading: true, error: null });
    try {
      const data = await request("/api/genres", "GET");
      set({ genres: data });
    } catch (err) {
      console.error("Failed to fetch genres:", err);
      set({ error: err.response?.data?.error || "Failed to fetch genres" });
    } finally {
      set({ loading: false });
    }
  },

  // Create new genre with optional image
  createGenre: async (payload) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("name", payload.name);
      if (payload.parent_id) formData.append("parent_id", payload.parent_id);
      if (payload.image) formData.append("image", payload.image);

      const data = await request("/api/genres", "POST", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      set((state) => ({ genres: [...state.genres, data.genre] }));
      return data.genre;
    } catch (err) {
      console.error("Failed to create genre:", err);
      set({ error: err.response?.data?.error || "Failed to create genre" });
    } finally {
      set({ loading: false });
    }
  },

  // Update genre by ID with optional image
  updateGenre: async (id, payload) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      if (payload.name) formData.append("name", payload.name);
      if (payload.parent_id) formData.append("parent_id", payload.parent_id);
      if (payload.image) formData.append("image", payload.image);

      const data = await request(`/api/genres/${id}`, "POST", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          "X-HTTP-Method-Override": "PUT", // important for Laravel to handle PUT
        },
      });

      set((state) => ({
        genres: state.genres.map((g) => (g.id === id ? data.genre : g)),
      }));
      return data.genre;
    } catch (err) {
      console.error("Failed to update genre:", err);
      set({ error: err.response?.data?.error || "Failed to update genre" });
    } finally {
      set({ loading: false });
    }
  },

  // Delete genre
  deleteGenre: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });
    try {
      await request(`/api/genres/${id}`, "DELETE", {}, { headers: { Authorization: `Bearer ${token}` } });
      set((state) => ({ genres: state.genres.filter((g) => g.id !== id) }));
    } catch (err) {
      console.error("Failed to delete genre:", err);
      set({ error: err.response?.data?.error || "Failed to delete genre" });
    } finally {
      set({ loading: false });
    }
  },
}));
