"use client";

import { useEffect } from "react";
import { useUserStore } from "../../store/useUserStore";
import { Trash2 } from "lucide-react";

export default function UsersPage() {
  const {
    users,
    fetchUsers,
    deleteUser,
    changeUserRole,
    loading,
    error,
  } = useUserStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Users List</h1>

      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No users found
                </td>
              </tr>
            )}

            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-2">{user.id}</td>
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">
                  {user.role === "admin" ? (
                    <span className="font-semibold text-red-600">Admin</span>
                  ) : (
              <select
                value={user.role}
                onChange={(e) => changeUserRole(user.id, e.target.value)}
                className="border rounded px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 m-1"
              >
                <option value="user" style={{ textIndent: "20px" }}>User</option>
                <option value="author" style={{ textIndent: "20px" }}>Author</option>
              </select>


                  )}
                </td>
                <td className="px-4 py-2 flex items-center gap-2">
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
