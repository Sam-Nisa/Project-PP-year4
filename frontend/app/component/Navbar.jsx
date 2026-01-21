"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Search,
  Heart,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useGenreStore } from "../store/useGenreStore";
import { useAddToCartStore } from "../store/useAddToCardStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useSearchStore } from "../store/useSearchStore";

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

export default function Header() {
  const router = useRouter();
  const { user, isInitialized, loading, logout } = useAuthStore();
  const {
    genres,
    fetchGenres,
    loading: genresLoading,
    error: genresError,
  } = useGenreStore();
  const { cartItems, cartCount, fetchCartCount } = useAddToCartStore();
  const { wishlists } = useWishlistStore();
  const { clearSearch } = useSearchStore();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isGenresDropdownOpen, setIsGenresDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  // Fetch genres and cart count once on mount
  useEffect(() => {
    fetchGenres();
    if (isInitialized && user) {
      fetchCartCount();
    }
  }, [isInitialized, user]);

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

  // Handle search functionality
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Clear previous search results
      clearSearch();
      // Navigate to search page with query
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Close mobile search if open
      setIsMobileSearchOpen(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  // Close mobile menu when clicking on links
  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
      handleMobileMenuClose();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const genresWithHref = genres.map((g) => ({
    ...g,
    href: `/genres/${slugify(g.name)}`,
  }));

  return (
    <header className="bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-white hover:text-pink-100 transition-colors flex-shrink-0"
          >
            📚 BookHaven
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-6 flex-1 justify-center">
            <DropdownNavLink
              title="Genres"
              items={genresWithHref}
              isOpen={isGenresDropdownOpen}
              setIsOpen={setIsGenresDropdownOpen}
              dropdownRef={dropdownRef}
              isLoading={genresLoading}
              error={genresError}
            />
            <NavLink href="/best-seller">Bestsellers</NavLink>
            <NavLink href="/about-us">About Us</NavLink>
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search books by name..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                className="w-full py-2 pl-10 pr-4 rounded-full bg-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-200 hover:text-white transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-purple-700 transition-all md:hidden"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User/Login - Show skeleton while initializing or loading */}
            {!isInitialized || loading ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 animate-pulse"></div>
            ) : user ? (
              <Link
                href={`/profile/${user.id}/myprofile`}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="hidden xl:inline text-white font-medium text-sm">
                  {user.name}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-block px-4 py-2 text-sm font-semibold text-purple-600 bg-white rounded-full hover:bg-pink-50 transition-all shadow-md"
              >
                Login
              </Link>
            )}

            {/* Wishlist */}
            <IconWithBadge
              href="/wishlists"
              Icon={Heart}
              count={isInitialized && user ? wishlists.length : 0}
              label="Wishlist"
            />

            {/* Cart */}
            <IconWithBadge
              href="/add-to-cart"
              Icon={ShoppingCart}
              count={isInitialized && user ? cartCount : 0}
              label="Cart"
            />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-purple-700 transition-all lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobileSearchOpen && (
          <div className="pb-4 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search books by name..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                className="w-full py-2 pl-10 pr-10 rounded-full bg-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                autoFocus
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-200 hover:text-white transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-pink-300"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        genres={genresWithHref}
        user={user}
        isInitialized={isInitialized}
        loading={loading}
        cartCount={cartCount}
        wishlistCount={wishlists.length}
        onLogout={handleLogout}
      />
    </header>
  );
}

/* ================= Helper Components ================= */

const NavLink = ({ href, children }) => (
  <Link
    href={href}
    className="px-2 xl:px-3 py-2 text-base xl:text-lg font-semibold text-white hover:text-pink-100 transition-colors whitespace-nowrap"
  >
    {children}
  </Link>
);

const DropdownNavLink = ({
  title,
  items,
  isOpen,
  setIsOpen,
  dropdownRef,
  isLoading,
  error,
}) => (
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="inline-flex items-center px-2 xl:px-3 py-2 text-base xl:text-lg font-semibold text-white hover:text-pink-100 transition-colors"
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {title}
      <ChevronDown
        className={`ml-1 w-4 h-4 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>

    {isOpen && (
      <div className="absolute left-0 mt-2 w-64 bg-gradient-to-br from-purple-700 to-pink-600 rounded-xl shadow-2xl overflow-hidden z-50">
        <div className="px-4 py-3 bg-white/10 backdrop-blur-sm border-b border-white/20">
          <p className="text-xs font-bold text-pink-100 uppercase tracking-wider">
            Explore by
          </p>
          <p className="text-lg font-bold text-white">Book Genres</p>
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-white text-sm">
              Loading genres...
            </div>
          ) : error ? (
            <div className="px-4 py-4 text-center text-pink-100 text-sm">
              Error: {error}
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-white text-sm">
              No genres available.
            </div>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 text-base text-white hover:bg-white/20 hover:text-pink-100 transition-all"
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
    className="block px-4 py-3 text-base font-semibold text-white hover:bg-purple-700 hover:text-pink-100 transition-all rounded-lg"
  >
    {children}
  </Link>
);

const IconWithBadge = ({ href, Icon, count = 0, label }) => (
  <Link
    href={href}
    className="relative p-2 rounded-full hover:bg-white/10 transition-all"
    aria-label={label}
  >
    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-purple-600 shadow-md">
        {count > 99 ? "99+" : count}
      </span>
    )}
  </Link>
);

const MobileMenu = ({
  isOpen,
  onClose,
  genres,
  user,
  isInitialized,
  loading,
  cartCount,
  wishlistCount,
  onLogout,
}) => (
  <>
    {/* Backdrop */}
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
        isOpen ? "opacity-100 z-40" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    ></div>

    {/* Sidebar */}
    <div
      className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-purple-600 to-pink-500 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-all"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-4 space-y-2">
            {/* Genres Accordion */}
            <details className="group">
              <summary className="flex items-center justify-between px-4 py-3 text-base font-semibold text-white hover:bg-purple-700 hover:text-pink-100 transition-all rounded-lg cursor-pointer list-none">
                <span>Explore Books</span>
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2 ml-4 space-y-1">
                {genres.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className="block px-4 py-2 text-sm text-purple-100 hover:bg-purple-700 hover:text-white transition-all rounded-lg"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </details>

            <MobileNavLink href="/bestsellers" onClick={onClose}>
              Bestsellers
            </MobileNavLink>
            <MobileNavLink href="/authors" onClick={onClose}>
              Authors
            </MobileNavLink>
            <MobileNavLink href="/about-us" onClick={onClose}>
              About Us
            </MobileNavLink>
          </nav>

          {/* User Section */}
          <div className="mt-6 px-4 pt-6 border-t border-white/20">
            {!isInitialized || loading ? (
              <div className="px-4 py-3 bg-white/10 rounded-lg">
                <div className="h-6 bg-white/20 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <>
                <Link
                  href={`/profile/${user.id}/myprofile`}
                  onClick={onClose}
                  className="flex items-center space-x-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all mb-3"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold">{user.name}</p>
                    <p className="text-purple-100 text-sm">My Profile</p>
                  </div>
                </Link>

                <Link
                  href="/wishlists"
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 text-white hover:bg-purple-700 rounded-lg transition-all mb-2"
                >
                  <span className="font-semibold">My Wishlists</span>
                  {wishlistCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-0.5">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/add-to-cart"
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-3 text-white hover:bg-purple-700 rounded-lg transition-all mb-4"
                >
                  <span className="font-semibold">My Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-0.5">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={onLogout}
                  className="w-full px-4 py-3 text-purple-600 bg-white hover:bg-pink-50 font-semibold rounded-lg transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full px-4 py-3 text-center text-purple-600 bg-white hover:bg-pink-50 font-semibold rounded-lg transition-all"
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);
