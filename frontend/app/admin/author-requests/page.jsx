"use client";

import { useState, useEffect } from "react";
import api from "../../utils/axios";
import { toast } from "react-toastify";
import { useAuthStore } from "../../store/authStore";

export default function AdminAuthorRequestsPage() {
  const { token } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/author-requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load author requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/admin/author-requests/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Request ${newStatus} successfully!`);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update request.");
    }
  };

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://localhost:8000/storage/${path}`;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8 bg-white rounded-lg shadow-sm min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-4">Author Requests</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{request.full_name}</div>
                  <div className="text-sm text-gray-500">ID: {request.user_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{request.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : request.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No author requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Details */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">Request Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1 text-lg text-gray-900">{selectedRequest.full_name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-lg text-gray-900">{selectedRequest.email}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Short Bio</h3>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">{selectedRequest.short_bio}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Reason / Purpose</h3>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">{selectedRequest.reason}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Experience</h3>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">{selectedRequest.experience || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">ID Card / Student Card</h3>
                  {selectedRequest.id_card_path ? (
                    <a href={getFullImageUrl(selectedRequest.id_card_path)} target="_blank" rel="noopener noreferrer" className="block p-4 border border-gray-200 rounded text-center text-blue-600 hover:bg-blue-50 transition">
                      View ID Card
                    </a>
                  ) : (
                    <p className="text-gray-500">Not provided</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Portfolio</h3>
                  {selectedRequest.portfolio_path ? (
                    <a href={getFullImageUrl(selectedRequest.portfolio_path)} target="_blank" rel="noopener noreferrer" className="block p-4 border border-gray-200 rounded text-center text-blue-600 hover:bg-blue-50 transition">
                      View Portfolio
                    </a>
                  ) : (
                    <p className="text-gray-500">Not provided</p>
                  )}
                </div>
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="mt-8 border-t pt-6 flex justify-end gap-4">
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                  className="px-6 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                >
                  Approve as Author
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
