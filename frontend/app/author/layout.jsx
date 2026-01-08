"use client";

import AuthorNavbar from "../component/AuthorNavbar";
import AuthorSidebar from "../component/AuthorSidebar";

export default function AuthorLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AuthorSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <AuthorNavbar />

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
