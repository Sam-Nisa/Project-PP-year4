"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";

export default function AdminNavbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white shadow-md flex items-center justify-between px-6 border-b border-gray-200">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

      {user && (
        <div className="relative flex items-center gap-3" ref={dropdownRef}>
          {/* User Name */}
          <span className="font-medium text-gray-700">{user.name}</span>

          {/* Profile Image */}
          <div
            className="w-12 h-12 relative rounded-full overflow-hidden cursor-pointer ring-2 ring-blue-500 hover:ring-blue-700 transition-all duration-300"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Image
              src={user.avatar_url ? user.avatar_url : "/default-avatar.png"}
              alt="Admin Avatar"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-16 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
              <div className="flex flex-col">
                <Link
                  href="/admin/profile"
                  className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors w-full"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
