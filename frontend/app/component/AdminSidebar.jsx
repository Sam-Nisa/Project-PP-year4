"use client";

import Link from "next/link";

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white flex flex-col shadow-lg">
      <div className="p-6 text-2xl font-bold tracking-wider border-b border-blue-600">
        Admin Panel
      </div>

      <nav className="flex-1 px-4 py-6 space-y-3">
        {[
          { name: "Dashboard", href: "/admin/dashboard" },
          { name: "Users", href: "/admin/users" },
          { name: "Genres", href: "/admin/genres" },
          { name: "Books", href: "/admin/books" },
           { name: "Settings", href: "/admin/settings" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
