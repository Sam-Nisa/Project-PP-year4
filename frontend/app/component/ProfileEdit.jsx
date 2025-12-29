"use client";

import { useState, useEffect } from "react";

export default function ProfileEdit({ user, onCancel, onSave, saving }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: null,
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        avatar: null,
      });
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files && files[0]) {
      const file = files[0];

      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      setFormData((prev) => ({ ...prev, [name]: file }));
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleSubmit = () => onSave(formData);

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Edit Profile</h2>

      <div className="flex flex-col items-center mb-6">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt={formData.name || "avatar"}
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 shadow-sm"
          />
        ) : (
          <div className="w-32 h-32 flex items-center justify-center bg-yellow-500 text-white text-3xl font-bold rounded-full border-2 border-gray-300">
            {formData.name ? formData.name.charAt(0) : "?"}
          </div>
        )}
        <label className="mt-4 cursor-pointer text-indigo-600 hover:underline text-sm">
          Change Avatar
          <input type="file" name="avatar" onChange={handleChange} className="hidden" />
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
<div className="mb-6">
  <label className="block text-gray-700 font-semibold mb-1">Email</label>
  <input
    type="email"
    name="email"
    value={formData.email}
    readOnly
    className="w-full px-4 py-2 border rounded-lg border-gray-300 bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
  />
</div>


      <div className="flex justify-between gap-4">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition ${
            saving ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
