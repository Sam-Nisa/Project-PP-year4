"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { useUserStore } from "../../store/useUserStore";

export default function AdminSettingsPage() {
  const { user, fetchProfile, initializeStore, token } = useAuthStore();
  const { updateUser, loading: isUpdating } = useUserStore();

  // Create a ref for the hidden file input
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        description: user.description || "",
        avatar: user.avatar_url || "",
      });
      // Set initial preview from user object
      setPreviewUrl(user.avatar_url || "");
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Triggered when user selects a file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData((prev) => ({ ...prev, avatar: file }));
      // Create a local URL for the preview
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Function to open file browser
  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!user?.id) return;

    try {
      /**
       * We use FormData because we are sending a file.
       * Even if your backend uses PUT, some frameworks (like Laravel)
       * require 'Method Spoofing' or POST for multipart data.
       */
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);

      if (selectedFile) {
        data.append("image", selectedFile);
      }

      // 1. Update the user via Store
      // Note: Make sure your useUserStore.updateUser supports FormData
      const result = await updateUser(user.id, formData);

      if (result) {
        await fetchProfile();
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile." });
    }
  };

  if (!user && token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Loading admin data...</p>
      </div>
    );
  }

  if (!user && !token) {
    return (
      <div className="p-10 text-center text-red-500">
        Access Denied. Please log in.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-8 p-6 rounded-lg ">
      <section>
        <h3 className="text-xl font-bold text-black mb-4 flex items-center">
          Admin Profile
        </h3>

        <form
          onSubmit={handleSave}
          className="p-6 shadow-lg bg-white rounded-lg"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Profile Image Section */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-6 pb-6 border-b border-gray-100">
              <div
                onClick={triggerFileSelect}
                className="relative rounded-full h-24 w-24 shrink-0 overflow-hidden shadow-lg border-2 border-white bg-gray-200 cursor-pointer group"
              >
                <img
                  src={
                    previewUrl ||
                    `https://ui-avatars.com/api/?name=${user.name}&background=random`
                  }
                  alt="Admin"
                  className="h-full w-full object-cover transition duration-200 group-hover:opacity-75"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-black font-bold">
                    CHANGE
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-black">
                  Admin Profile Picture
                </h4>
                <p className="text-sm text-slate-400 mt-1">
                  Click the photo or "Change" to upload a new profile picture.
                </p>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="text-sm font-medium text-blue-500 hover:text-blue-600"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl("");
                      setSelectedFile(null);
                    }}
                    className="text-sm font-medium text-red-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* User Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-500">
                User Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 px-3 py-3 text-base rounded-md text-gray-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                type="text"
                placeholder="Enter admin name"
                required
              />
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-500">
                Email (Read Only)
              </label>
              <input
                className="w-full bg-gray-200 cursor-not-allowed px-3 py-3 text-base text-gray-500 rounded-md shadow-sm outline-none"
                type="email"
                value={user.email || ""}
                disabled
              />
            </div>

            {/* Store Description */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-500">
                Store Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-md bg-gray-50 border border-gray-300 px-3 py-3 text-base text-gray-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                placeholder="The best online bookstore..."
              ></textarea>
            </div>

            {/* Status Messages */}
            {message.text && (
              <div
                className={`col-span-2 p-3 rounded-md ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-md transition duration-200 disabled:opacity-50 shadow-md"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
