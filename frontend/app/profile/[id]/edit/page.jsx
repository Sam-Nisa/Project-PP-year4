"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import ProfileEdit from "../../../component/ProfileEdit";

export default function ProfilePage() {
  const { user: authUser, token, fetchProfile, updateProfile, loading: authLoading, error } = useAuthStore();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !authUser?.id) return;

    const getProfile = async () => {
      setLoading(true);
      try {
        await fetchProfile();
        setUser(authUser);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [token]);

  // Update local user state when authUser changes
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

  const handleSave = async (formData) => {
    if (!user) return;
    setSaving(true);
    console.log("Form Data to be saved:", formData);
    try {
      const updated = await updateProfile(formData);

      console.log("Profile updated successfully:", updated);
      
      // Update local state with new data
      if (updated) {
        setUser(updated);
      }
      
      // Always show success alert if no error was thrown
      alert("Profile updated successfully!");
      
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading profile...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!user) return <p className="p-6 text-gray-500">Profile not found.</p>;

  return (
    <ProfileEdit
      user={user}
      onSave={handleSave}
      onCancel={() => {}}
      saving={saving}
    />
  );
}
