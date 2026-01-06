"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold">Admin Panel</div>
        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/author/dashboard"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            Dashboard
          </Link>
          <Link
            href="/author/books"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            Books
          </Link>
        </nav>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">{user.name}</span>
              <div className="w-10 h-10 relative rounded-full overflow-hidden">
                <Image
                  src={user.avatar_url || "/default-avatar.png"}
                  alt="Admin Avatar"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
