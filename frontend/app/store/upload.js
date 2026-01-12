import { create } from "zustand";
import { request } from "../utils/request";
import { useAuthStore } from "./authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useUploadStore = create((set, get) => ({
  uploading: false,
  uploadProgress: 0,
  error: null,

  // Upload single file
  uploadFile: async (file, folder = '/uploads') => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error("Authentication required");
    }

    set({ uploading: true, error: null, uploadProgress: 0 });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await request("/api/upload", "POST", formData, {}, token);

      set({ uploading: false, uploadProgress: 100 });
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Upload failed";
      set({ error: errorMsg, uploading: false });
      throw new Error(errorMsg);
    }
  },

  // Upload multiple files
  uploadMultipleFiles: async (files, folder = '/uploads') => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error("Authentication required");
    }

    set({ uploading: true, error: null, uploadProgress: 0 });

    try {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await request("/api/upload", "POST", formData, {}, token);
        
        // Update progress
        const progress = ((index + 1) / files.length) * 100;
        set({ uploadProgress: progress });
        
        return response;
      });

      const results = await Promise.all(uploadPromises);
      set({ uploading: false, uploadProgress: 100 });
      return results;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Upload failed";
      set({ error: errorMsg, uploading: false });
      throw new Error(errorMsg);
    }
  },

  // Reset upload state
  resetUpload: () => {
    set({ uploading: false, uploadProgress: 0, error: null });
  },
}));