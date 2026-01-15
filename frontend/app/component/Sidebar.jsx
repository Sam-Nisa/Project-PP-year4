"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation"; // 👈 Import useRouter
import { 
  User, 
  Lock, 
  Heart, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  XCircle, 
  Loader2,
  ShoppingBag
} from "lucide-react"; 
import Image from "next/image";

// ====================================================================
// Logout Confirmation Modal Component (No change needed here)
// ====================================================================

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm, saving }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-transform duration-300 scale-100">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to log out of your account?
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className={`flex items-center px-4 py-2 font-semibold text-white rounded-lg transition ${
                saving
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Logout"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// Sidebar Component
// ====================================================================

export default function Sidebar({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter(); // 👈 Initialize useRouter

  // User-specific links only
  const userItems = user
    ? [
        { label: "My Profile", icon: <User className="h-5 w-5" />, href: `/profile/${user.id}/myprofile` },
        { label: "Edit Profile", icon: <User className="h-5 w-5" />, href: `/profile/${user.id}/edit` },
        { label: "Change Password", icon: <Lock className="h-5 w-5" />, href: `/profile/${user.id}/reset-password` },
        { label: "Order History", icon: <ShoppingBag className="h-5 w-5" />, href: `/profile/${user.id}/orders` },
        { label: "Wishlist", icon: <Heart className="h-5 w-5" />, href: `/profile/${user.id}/wishlist` },
      ]
    : [];

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
          await onLogout(); // now this is the zustand logout function
        } catch (err) {
          console.error("Logout failed:", err);
        } finally {
          setLoggingOut(false);
          setIsModalOpen(false);
        }
      };
      
      

  const SidebarLink = ({ item }) => {
    const isActive = pathname.startsWith(item.href);
    // ... (rest of SidebarLink component remains the same)
    const baseClasses =
      "flex items-center w-full gap-3 px-4 py-3 transition duration-150 ease-in-out cursor-pointer";
    const activeClasses = "bg-indigo-50 text-indigo-700 font-semibold border-r-4 border-indigo-600";
    const inactiveClasses = "text-gray-600 hover:bg-gray-100";

    return (
      <Link
        href={item.href}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      >
        {item.icon}
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      <aside
        className={`bg-white shadow-xl h-screen sticky top-0 transition-all duration-500 flex flex-col z-10 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* ... (Profile Header & Collapse Toggle remains the same) */}
        <div className="flex flex-col items-center py-6 border-b border-gray-100 relative">
          {user ? (
            <>
              {/* Avatar */}
              {user.avatar_url ? (
                <div className={`relative ${collapsed ? "w-10 h-10" : "w-16 h-16"} rounded-full overflow-hidden mb-2 transition-all duration-300 border-2 border-indigo-200`}>
                  <Image
                    src={user.avatar_url}
                    alt={user.name || "User"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div className={`flex items-center justify-center bg-indigo-500 text-white font-bold rounded-full mb-2 uppercase ${collapsed ? "w-10 h-10 text-xl" : "w-16 h-16 text-2xl"} transition-all duration-300`}>
                  {user.name ? user.name.charAt(0) : "?"}
                </div>
              )}
              {!collapsed && (
                <span className="font-semibold text-gray-800 truncate px-2 max-w-full">
                  {user.name}
                </span>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Login
            </Link>
          )}

          {/* Collapse toggle button */}
          <button
            className="absolute top-1/2 -right-4 transform -translate-y-1/2 p-1 bg-white border border-gray-200 rounded-full shadow-lg text-gray-500 hover:bg-gray-100 z-20"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* User Links */}
        <nav className="flex flex-col overflow-y-auto flex-grow">
          {userItems.map((item) => (
            <SidebarLink key={item.label} item={item} />
          ))}
        </nav>

        {/* Footer / Logout Button */}
        {user && (
          <div className="mt-auto px-4 py-4 border-t border-gray-100">
            <button
              onClick={() => setIsModalOpen(true)} // Open the modal on click
              className="flex items-center w-full gap-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
              disabled={loggingOut} // Prevent multiple clicks
            >
              <LogOut className="h-5 w-5 ml-0.5" />
              {!collapsed && <span className="font-semibold">Logout</span>}
            </button>
          </div>
        )}
      </aside>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogout}
        saving={loggingOut}
      />
    </>
  );
}