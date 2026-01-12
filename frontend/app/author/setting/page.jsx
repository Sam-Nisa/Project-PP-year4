"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { User, Mail, Camera, Save, Trash2, UserX } from "lucide-react";
import ConfirmationDialog from "../../component/ConfirmationDialog";

export default function AuthorSettings() {
  const { user, updateProfile, deleteAvatar, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar: null,
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Confirmation dialog states
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false);
  const [showDeleteProfileDialog, setShowDeleteProfileDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        avatar: null,
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await updateProfile(formData);
      setMessage("Profile updated successfully!");
      
      // Reset avatar file input and preview
      setFormData(prev => ({ ...prev, avatar: null }));
      setPreviewUrl(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      setMessage(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAvatarConfirm = async () => {
    try {
      await deleteAvatar();
      setMessage("Profile picture deleted successfully!");
      setPreviewUrl(null);
      setShowDeleteAvatarDialog(false);
    } catch (error) {
      setMessage(error.message || "Failed to delete profile picture.");
      setShowDeleteAvatarDialog(false);
    }
  };

  const handleDeleteProfileConfirm = async () => {
    try {
      setMessage("Profile deletion feature coming soon!");
      setShowDeleteProfileDialog(false);
      
    } catch (error) {
      setMessage(error.message || "Failed to delete profile.");
      setShowDeleteProfileDialog(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, avatar: null }));
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  // Get the image to display (preview, current avatar, or default)
  const getDisplayImage = () => {
    if (previewUrl) {
      return previewUrl;
    }
    return user?.avatar_url;
  };

  return (
    <div className="">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-gray-800">Author Settings</h2>
          <p className="text-gray-600 mt-2">Manage your profile and account settings</p>
        </div>

        {/* Profile Settings Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-4">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-semibold">Profile Information</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {getDisplayImage() ? (
                    <img
                      src={getDisplayImage()}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                {/* Upload Button */}
                <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Profile Picture</h4>
                <p className="text-sm text-gray-500 mb-2">Upload a new profile picture</p>
                
                {/* Preview Controls */}
                {previewUrl && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-green-600 font-medium">New image selected</span>
                    <button
                      type="button"
                      onClick={handleCancelPreview}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                {/* Delete Avatar Button */}
                {user?.avatar_url && !previewUrl && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteAvatarDialog(true)}
                    disabled={loading}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Picture
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                     disabled
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 text-gray-400 py-3 border focus:outline-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes("successfully") 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showDeleteAvatarDialog}
        onClose={() => setShowDeleteAvatarDialog(false)}
        onConfirm={handleDeleteAvatarConfirm}
        title="Delete Profile Picture"
        message="Are you sure you want to delete your profile picture? This action cannot be undone."
        confirmText="Delete Picture"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />

      <ConfirmationDialog
        isOpen={showDeleteProfileDialog}
        onClose={() => setShowDeleteProfileDialog(false)}
        onConfirm={handleDeleteProfileConfirm}
        title="Delete Account"
        message="Are you sure you want to delete your account? This will permanently remove all your data, books, and cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />
    </div>
  );
}