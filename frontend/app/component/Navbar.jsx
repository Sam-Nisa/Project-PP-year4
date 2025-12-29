"use client";

import Link from "next/link";
import { ShoppingCart, Search, Heart, Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useGenreStore } from "../store/useGenreStore";

export default function Header() {
  const [cartCount] = useState(3);
  const [favoriteCount] = useState(5);
  const { user, fetchProfile } = useAuthStore();
  const { genres, fetchGenres } = useGenreStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isGenresDropdownOpen, setIsGenresDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Fetch user profile
  useEffect(() => {
    if (user === undefined) fetchProfile();
  }, [user, fetchProfile]);

  // Fetch genres
  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsGenresDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const genresWithHref = genres.map((g) => ({
    ...g,
    href: `/genres/${g.name.toLowerCase().replace(/\s+/g, "-")}`,
  }));

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-blue-700 via-purple-800 to-pink-600 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-1">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer transform hover:scale-105 transition-all duration-300 ease-in-out"
          >
            <span className="text-white pr-7 text-3xl sm:text-4xl font-extrabold tracking-tight">
              BookHaven
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center pl-7 gap-6 lg:gap-10 font-inter text-white">
            <DropdownNavLink
              title="Genres"
              items={genresWithHref}
              isOpen={isGenresDropdownOpen}
              setIsOpen={setIsGenresDropdownOpen}
              dropdownRef={dropdownRef}
              isLoading={useGenreStore.getState().isLoading}
              error={useGenreStore.getState().error}
            />
            <NavLink href="/bestsellers">Bestsellers</NavLink>
            <NavLink href="/about-us">About Us</NavLink>
          </nav>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-200" />
              <input
                type="search"
                placeholder="Search books, authors, genres..."
                className="pl-12 pr-4 py-2 w-full rounded-full bg-white/10 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-pink-300 border border-transparent hover:border-pink-300 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            
            {/* Mobile Search */}
            <button
              className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-purple-700 transition-all lg:hidden"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="h-6 w-6" />
            </button>

            {/* User/Login */}
            {user ? (
              <Link
                href={`/profile/${user.id}/myprofile`}
                className="block w-10 h-10 relative rounded-full overflow-hidden border-2 border-pink-400 hover:border-white transition-all"
              >
                {user.avatar ? (
                  <img src={user.avatar_url} alt={user.name ?? "User"} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-semibold uppercase">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:block p-2 sm:px-5 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-all font-semibold shadow-md"
              >
                Login
              </Link>
            )}

            {/* Wishlist & Cart */}
            <IconWithBadge href="/wishlists" Icon={Heart} />
            <IconWithBadge href="/add-to-cart" Icon={ShoppingCart} />

            {/* Mobile Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-purple-700 transition-all md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {isMobileSearchOpen && (
        <div className="bg-purple-900 px-4 py-3 flex items-center gap-2 md:hidden">
          <Search className="h-5 w-5 text-purple-200" />
          <input
            type="search"
            placeholder="Search books..."
            className="flex-1 bg-transparent border-b border-purple-400 text-white placeholder-purple-300 focus:outline-none"
          />
          <button onClick={() => setIsMobileSearchOpen(false)} className="text-white hover:text-pink-300">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        genres={genresWithHref}
        user={user}
      />
    </header>
  );
}

/* ================= Helper Components ================= */

const NavLink = ({ href, children }) => (
  <Link
    href={href}
    className="inline-flex items-center px-1 text-lg font-semibold text-white border-b-2 border-transparent hover:border-pink-300 hover:text-pink-100 transition"
  >
    {children}
  </Link>
);

const DropdownNavLink = ({ title, items, isOpen, setIsOpen, dropdownRef, isLoading, error }) => (
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="inline-flex items-center px-1 text-lg font-semibold text-white hover:text-pink-100"
    >
      {title}
      <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>

    {isOpen && (
      <div className="absolute left-0 mt-3 w-60 rounded-lg shadow-xl bg-gradient-to-br from-purple-800 to-pink-700 z-50">
        <div className="px-4 py-3 border-b border-purple-600/50">
          <p className="text-pink-200 text-xs uppercase font-bold">Explore by</p>
          <p className="text-white text-xl font-extrabold mt-1">Book Genres</p>
        </div>

        <div className="py-2 max-h-80 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-white animate-pulse">Loading genres...</div>
          ) : error ? (
            <div className="px-4 py-2 text-sm text-red-300">Error: {error}</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-2 text-sm text-white">No genres available.</div>
          ) : (
            items.map((item) => (
              <Link
                key={item.id || item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-base text-white hover:bg-purple-600 hover:text-pink-100 transition"
              >
                {item.name}
              </Link>
            ))
          )}
        </div>
      </div>
    )}
  </div>
);

const MobileNavLink = ({ href, children, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-purple-700 hover:text-pink-100 transition"
  >
    {children}
  </Link>
);

const IconWithBadge = ({ href, Icon }) => (
  <Link
    href={href}
    className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-purple-700 transition-all transform hover:scale-105"
  >
    <Icon className="h-6 w-6" />
  </Link>
);

const MobileMenu = ({ isOpen, onClose, genres, user }) => (
  <>
    <div
      className={`fixed inset-0 bg-black bg-opacity-70 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 block" : "opacity-0 hidden"}`}
      onClick={onClose}
    ></div>

    <div
      className={`fixed top-0 right-0 h-full w-64 bg-purple-900 shadow-lg p-6 transform transition-transform duration-300 z-50 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="flex justify-between items-center mb-8 border-b border-purple-700 pb-4">
        <span className="text-white text-2xl font-bold">Menu</span>
        <button onClick={onClose} className="text-white hover:text-pink-300">✕</button>
      </div>

      <nav className="flex flex-col space-y-4">
        <MobileNavLink href="/browse" onClick={onClose}>Explore Books</MobileNavLink>

        {genres.map((item) => (
          <MobileNavLink key={item.id || item.href} href={item.href} onClick={onClose}>
            {item.name}
          </MobileNavLink>
        ))}

        <MobileNavLink href="/bestsellers" onClick={onClose}>Bestsellers</MobileNavLink>
        <MobileNavLink href="/authors" onClick={onClose}>Authors</MobileNavLink>

        <div className="pt-6 border-t border-purple-700 mt-6">
          {user ? (
            <>
              <MobileNavLink href={`/profile/${user.id}/myprofile`} onClick={onClose}>
                My Profile
              </MobileNavLink>
              <MobileNavLink href="/wishlists" onClick={onClose}>My Wishlists</MobileNavLink>
              <MobileNavLink href="/add-to-cart" onClick={onClose}>My Cart</MobileNavLink>
              <MobileNavLink href="/logout" onClick={onClose}>Logout</MobileNavLink>
            </>
          ) : (
            <MobileNavLink href="/login" onClick={onClose}>Login / Register</MobileNavLink>
          )}
        </div>
      </nav>
    </div>
  </>
);
