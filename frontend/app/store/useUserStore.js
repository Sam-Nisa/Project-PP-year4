import { create } from "zustand";
import { request } from "../utils/request";
import { useAuthStore } from "./authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const useUserStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  // ========================
  // FETCH DASHBOARD STATS
  // ========================
   stats: null,
   fetchDashboardData: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      // Note the URL matches what we added in api.php
      const response = await request("/api/dashboard-stats", "GET", null, {}, token);

      if (response && response.data) {
        set({ stats: response.data });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      set({ error: "Failed to load stats" });
    } finally {
      set({ loading: false });
    }
  },

  // ========================
  // FETCH ALL USERS
  // ========================
  fetchUsers: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "No token available" });
      return [];
    }

    set({ loading: true, error: null });

    try {
      const response = await request("/api/users", "GET", null, {}, token);

      // Laravel response: { success, data }
      const usersData = response?.data || [];

      set({ users: usersData });
      return usersData;
    } catch (err) {
      console.error("Failed to fetch users:", err);
      set({
        error:
          err?.response?.data?.error || err?.message || "Failed to fetch users",
      });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  // ========================
  // FETCH USER BY ID
  // ========================
  fetchUserById: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ error: "No token available" });
      return null;
    }

    set({ loading: true, error: null });

    try {
      const response = await request(
        `/api/users/${id}`,
        "GET",
        null,
        {},
        token
      );

      return response?.data || null;
    } catch (err) {
      console.error("Failed to fetch user:", err);
      set({
        error: err?.response?.data?.error || "Failed to fetch user",
      });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // ========================
  // UPDATE USER
  // ========================
  updateUser: async (id, payload) => {
    const token = useAuthStore.getState().token;
    if (!token) return null;

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

      const updatedUser = await request(`/api/users/${id}`, "PUT", formData, {}, token);

      set((state) => {
        console.log("state.users", state);
        return {
          users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        };
      });

      return updatedUser;
    } catch (err) {
      console.error("Failed to update user:", err);
      set({
        error: err?.response?.data?.error || "Failed to update user",
      });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // inside useUserStore  "Update Role"
  changeUserRole: async (id, role) => {
    if (!["user", "author"].includes(role)) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ loading: true, error: null });

    try {
      const response = await request(
        `/api/users/${id}`,
        "PUT",
        { role },
        { "Content-Type": "application/json" },
        token
      );

      const updatedUser = response.data;

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
      }));
    } catch (err) {
      set({ error: "Failed to change role" });
    } finally {
      set({ loading: false });
    }
  },

  // ========================
  // DELETE USER
  // ========================
  deleteUser: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return false;

    set({ loading: true, error: null });

    try {
      await request(`/api/users/${id}`, "DELETE", null, {}, token);

      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
      }));

      return true;
    } catch (err) {
      console.error("Failed to delete user:", err);
      set({
        error: err?.response?.data?.error || "Failed to delete user",
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ========================
  // APPROVE USER
  // ========================
  approveUser: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return null;

    set({ loading: true, error: null });

    try {
      const response = await request(
        `/api/users/${id}/approve`,
        "PUT",
        null,
        {},
        token
      );

      const approvedUser = response?.data;

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? approvedUser : u)),
      }));

      return approvedUser;
    } catch (err) {
      console.error("Failed to approve user:", err);
      set({
        error: err?.response?.data?.error || "Failed to approve user",
      });
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));
