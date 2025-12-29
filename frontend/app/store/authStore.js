"use client";
import { create } from "zustand";
import { request } from "../utils/request";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  // Load token + user from sessionStorage (fixed)
  initializeStore: () => {
    if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("token");
      const storedUser = sessionStorage.getItem("user");

      if (storedToken) {
        set({
          token: storedToken,
          user: storedUser ? JSON.parse(storedUser) : null,
        });

        // Re-fetch profile to keep it fresh (optional)
        get().fetchProfile();
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await request("/api/login", "POST", { email, password });

      set({ user: data.user, token: data.token });

      if (typeof window !== "undefined") {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || "Login failed" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    const token = get().token;

    try {
      await request("/api/logout", "POST", {}, {}, token);
    } catch (err) {
      console.warn("Logout API failed, clearing client session anyway");
    }

    set({ user: null, token: null });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  fetchProfile: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const response = await request("/api/profile", "GET", null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ user: response.data });

      if (typeof window !== "undefined") {
        sessionStorage.setItem("user", JSON.stringify(response.data));
      }
    } catch (err) {
      console.error("Invalid token → clearing session", err);

      set({ user: null, token: null });

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      }
    }
  },

  register: async (name, email, password, password_confirmation) => {
    set({ loading: true, error: null });

    try {
      const data = await request("/api/register", "POST", {
        name,
        email,
        password,
        password_confirmation,
      });

      set({ user: data.user, token: data.token });

      if (typeof window !== "undefined") {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || "Registration failed" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));
