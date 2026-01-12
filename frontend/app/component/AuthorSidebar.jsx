"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTachometerAlt, FaBook, FaCogs } from "react-icons/fa";

export default function AuthorSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/author/dashboard", icon: <FaTachometerAlt color="#4E8D7C" /> },
    { name: "Books", href: "/author/books", icon: <FaBook color="#EF4444" /> },
    { name: "Settings", href: "/author/setting", icon: <FaCogs color="#8B5CF6" /> },
  ];

  const isActive = (href) => pathname === href;

  return (
    <aside className="w-72 h-screen text-black flex flex-col shadow-2xl backdrop-blur-lg border-r border-blue-700/40 sticky">
      {/* Header */}
      <div className="p-6 text-3xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Author Panel
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg ${
              isActive(link.href)
                ? "bg-gradient-to-r from-blue-300 to-cyan-400 text-white shadow-lg scale-105"
                : "bg-white/5 hover:bg-gradient-to-r hover:from-gray-300 hover:to-cyan-400"
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span className="font-medium tracking-wide">{link.name}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 text-xs text-gray-400 text-center border-t border-blue-700/30">
        © 2026 Author Dashboard
      </div>
    </aside>
  );
}