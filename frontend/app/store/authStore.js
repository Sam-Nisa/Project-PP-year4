"use client";
import { create } from "zustand";
import { request } from "../utils/request";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  isInitialized: false, // Track if store has loaded from sessionStorage

  // Load token + user from sessionStorage
initializeStore: () => {
  if (typeof window !== "undefined" && !get().isInitialized) {
    const storedToken = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");

    let user = null;
    if (storedUser && storedUser !== "undefined") {
      try {
        user = JSON.parse(storedUser);
      } catch {
        sessionStorage.removeItem("user");
      }
    }

    set({
      token: storedToken,
      user,
      isInitialized: true,
    });

    // ✅ ONLY fetch profile if token exists AND user is missing
    if (storedToken && !user) {
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

  // Handle Google OAuth login
  handleGoogleLogin: async (token) => {
    set({ loading: true, error: null });

    try {
      sessionStorage.setItem("token", token);
      set({ token });

      const response = await request("/api/profile", "GET", null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({
        user: response.data,
        isInitialized: true,
      });

      sessionStorage.setItem("user", JSON.stringify(response.data));

      return response.data;
    } finally {
      set({ loading: false });
    }
  },


  // Update user profile
  updateProfile: async (profileData) => {
    const token = get().token;
    if (!token) {
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });

    try {
      const formData = new FormData();
      
      // Append all fields to FormData, but skip empty strings and null values
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          // Only append files or non-empty strings
          if (value instanceof File || (typeof value === 'string' && value.trim() !== '')) {
            formData.append(key, value);
          }
        }
      });

      const response = await request("/api/profile", "POST", formData, {}, token);

      // Update user in state
      const updatedUser = response.data || response;
      set({ user: updatedUser });

      // Update sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }

      return updatedUser;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to update profile";
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ loading: false });
    }
  },

  // Delete avatar
  deleteAvatar: async () => {
    const token = get().token;
    if (!token) {
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });

    try {
      const response = await request("/api/profile/avatar", "DELETE", {}, {}, token);

      // Update user in state (remove avatar)
      const updatedUser = { ...get().user, avatar_url: null };
      set({ user: updatedUser });

      // Update sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }

      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to delete avatar";
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ loading: false });
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const token = get().token;
    if (!token) {
      throw new Error("Authentication required");
    }

    set({ loading: true, error: null });

    try {
      const response = await request(
        "/api/change-password",
        "POST",
        {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {},
        token
      );

      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to change password";
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));

// Auto-initialize when the module loads (client-side only)
if (typeof window !== "undefined") {
  useAuthStore.getState().initializeStore();
}
