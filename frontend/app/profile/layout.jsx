// UserLayout.jsx
"use client";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import Sidebar from "../component/Sidebar";
import { useAuthStore } from "../store/authStore";

export default function UserLayout({ children }) {
  const { user, logout } = useAuthStore(); // Get user and logout

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar with logout function */}
        <Sidebar user={user} onLogout={logout} />

        {/* Page content */}
        <main className="flex-1 p-6 bg-white">{children}</main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
