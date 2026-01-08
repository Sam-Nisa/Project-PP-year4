"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";

export default function AuthorNavbar() {
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
      <h1 className="text-2xl font-bold text-gray-800"></h1>

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
              alt="Author Avatar"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-14 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <Link
                href="/author/setting"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Profile Settings
              </Link>
              <hr className="my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}