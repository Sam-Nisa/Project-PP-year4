"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "../../../utils/axios";
import { useAuthStore } from "../../../store/authStore";

export default function BecomeAuthorPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    short_bio: "",
    reason: "",
    experience: "",
  });

  const [files, setFiles] = useState({
    id_card: null,
    portfolio: null,
  });

  const [previews, setPreviews] = useState({
    id_card: null,
    portfolio: null,
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'pending', 'approved', 'rejected', or null

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, full_name: user.name }));
      fetchMyRequest();
    }
  }, [user]);

  const fetchMyRequest = async () => {
    try {
      const response = await api.get('/api/author-requests/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error fetching author request:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      setFiles((prev) => ({ ...prev, [name]: file }));

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviews((prev) => ({ ...prev, [name]: url }));
      } else {
        setPreviews((prev) => ({ ...prev, [name]: null }));
      }
    } else {
      setFiles((prev) => ({ ...prev, [name]: null }));
      setPreviews((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.id_card) {
      toast.error("ID Card / Student Card is required.");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("full_name", formData.full_name);
    data.append("email", user.email);
    data.append("short_bio", formData.short_bio);
    data.append("reason", formData.reason);
    if (formData.experience) {
      data.append("experience", formData.experience);
    }
    data.append("id_card", files.id_card);
    if (files.portfolio) {
      data.append("portfolio", files.portfolio);
    }

    try {
      await api.post("/api/author-requests", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Author request submitted successfully!");
      setStatus("pending");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  if (status === 'pending') {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow mt-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Request Pending</h2>
        <p className="text-gray-600">Your request to become an author is currently under review by our admin team. You will be notified once a decision has been made.</p>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow mt-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-green-600">Congratulations!</h2>
        <p className="text-gray-600">Your request has been approved. You are now an author!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-8">
      {status === 'rejected' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-bold text-lg mb-1">Request Rejected</h3>
          <p>Your previous request to become an author was rejected. You may submit a new request below with updated information.</p>
        </div>
      )}
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-4">Request to Become an Author</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email (Auto-filled) <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="mt-1 block w-full p-3 border border-gray-200 bg-gray-100 rounded-lg shadow-sm text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Short Bio <span className="text-red-500">*</span></label>
          <textarea
            name="short_bio"
            value={formData.short_bio}
            onChange={handleInputChange}
            required
            rows="3"
            placeholder="Tell us a little bit about yourself"
            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Reason / Purpose <span className="text-red-500">*</span></label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            required
            rows="3"
            placeholder="Why do you want to become an author?"
            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Experience (Optional)</label>
          <textarea
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            rows="3"
            placeholder="Any previous writing experience?"
            className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Required Documents</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">ID Card / Student Card <span className="text-red-500">*</span></label>
            <input
              type="file"
              name="id_card"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              required
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {previews.id_card && (
              <div className="mt-2">
                <img src={previews.id_card} alt="ID Card Preview" className="h-32 w-auto object-cover rounded border border-gray-200 shadow-sm" />
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">Max size: 5MB. Formats: JPG, PNG, PDF.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Portfolio / Sample Work (Optional)</label>
            <input
              type="file"
              name="portfolio"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {previews.portfolio && (
              <div className="mt-2">
                <img src={previews.portfolio} alt="Portfolio Preview" className="h-32 w-auto object-cover rounded border border-gray-200 shadow-sm" />
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">Max size: 10MB. Formats: JPG, PNG, PDF, DOC, DOCX.</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 transition-colors"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
