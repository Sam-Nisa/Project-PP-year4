"use client";

import { useState } from "react";
import { Lock, AlertCircle, CheckCircle, Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { request } from "../utils/request";

// Move PasswordInput outside to prevent re-creation on every render
const PasswordInput = ({ label, name, value, error, showPassword, toggleShow, onChange, disabled }) => (
  <div className="mb-5">
    <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-2">
      {label}
    </label>
    <div className="relative">
      <input
        id={name}
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete="off"
        disabled={disabled}
        placeholder={`Enter ${label.toLowerCase()}`}
        className={`w-full px-4 py-3 pr-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 ${
          error 
            ? "border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500" 
            : "border-gray-300 bg-white hover:border-gray-400"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      />
      <button
        type="button"
        onClick={toggleShow}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50"
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
    {error && (
      <p className="mt-2 text-sm text-red-600 flex items-center">
        <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

export default function ResetPassword() {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    // Clear message
    if (message) {
      setMessage(null);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!token) {
      setMessage({ 
        type: "error", 
        text: "You must be logged in to change your password" 
      });
      return;
    }

    setSaving(true);
    setErrors({});
    setMessage(null);

    try {
      const response = await request(
        "/api/change-password",
        "POST",
        {
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        },
        {},
        token
      );

      if (response.success) {
        setMessage({
          type: "success",
          text: response.message || "Password successfully updated!",
        });
        
        // Reset form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        
        // Reset password visibility
        setShowPasswords({
          current: false,
          new: false,
          confirm: false,
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = {};
        const errorData = error.response.data.errors;
        
        if (errorData.current_password) {
          backendErrors.currentPassword = errorData.current_password[0];
        }
        if (errorData.new_password) {
          backendErrors.newPassword = errorData.new_password[0];
        }
        if (errorData.confirm_password) {
          backendErrors.confirmPassword = errorData.confirm_password[0];
        }
        
        setErrors(backendErrors);
      }
      
      // Set error message
      const errorMessage = error.response?.data?.message || 
                          "Failed to update password. Please try again.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-lg mr-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Change Password</h2>
              <p className="text-purple-100 text-sm mt-1">
                Keep your account secure with a strong password
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6">
          {/* Status Message */}
          {message && (
            <div
              className={`p-4 mb-6 rounded-lg flex items-start animate-in fade-in duration-300 ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-600" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {/* Password Fields */}
          <PasswordInput
            label="Current Password"
            name="currentPassword"
            value={formData.currentPassword}
            error={errors.currentPassword}
            showPassword={showPasswords.current}
            toggleShow={() => togglePasswordVisibility("current")}
            onChange={handleChange}
            disabled={saving}
          />

          <PasswordInput
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            error={errors.newPassword}
            showPassword={showPasswords.new}
            toggleShow={() => togglePasswordVisibility("new")}
            onChange={handleChange}
            disabled={saving}
          />

          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            error={errors.confirmPassword}
            showPassword={showPasswords.confirm}
            toggleShow={() => togglePasswordVisibility("confirm")}
            onChange={handleChange}
            disabled={saving}
          />

          {/* Password Requirements */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                At least 6 characters long
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                Different from your current password
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full flex items-center justify-center px-6 py-3.5 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}