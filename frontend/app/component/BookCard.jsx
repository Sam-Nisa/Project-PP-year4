// ./components/BookCard.jsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { HeartIcon as HeartOutlineIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { toast } from 'react-toastify'; 


import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/authStore";

// --- Custom Login Prompt Modal Component (Keep as is) ---
const LoginPromptModal = ({ onClose }) => {
  // ... (Modal implementation is unchanged)
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-blue-800 rounded-xl p-6 shadow-2xl w-full max-w-sm m-4 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <HeartOutlineIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Login Required
          </h3>
          <p className="text-sm text-white mb-6">
            You need to be logged in to add items to your wishlist.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Link href="/login" onClick={onClose}>
            <button className="w-full bg-accent bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">
              Log In Now
            </button>
          </Link>
          <Link href="/register" onClick={onClose}>
            <button className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 rounded-lg transition-colors border border-transparent hover:border-blue-600">
              Create Account
            </button>
          </Link>
          <button
            onClick={onClose}
            className="mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

// --- BookCard Component ---
export default function BookCard({ book }) {
  // Add defensive checks immediately
  if (!book || typeof book.id === 'undefined') {
    return null; 
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  // Use safe access with default values
  const title = book.title || "Untitled Book";
  const price = parseFloat(book.price || 0).toFixed(2);
  const description = book.description;
  
  const coverImageUrl = book.cover_image
    ? `${API_URL}/storage/${book.cover_image}`
    : "/no-image.png";

  const { wishlists, addWishlist, removeWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();

  // Use the store state directly as the source of truth
  const isCurrentlyWishlisted = isWishlisted(book.id);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);


  const toggleWishlist = async () => {
    // 1. Check if user is authenticated
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    // We get the current status right before the action
    const currentlyInWishlist = isWishlisted(book.id);

    // 2. Call the appropriate store action
    if (currentlyInWishlist) {
      // Optimistically remove (Zustand updates state immediately)
      await removeWishlist(book.id);
      
      // Display toast
      toast.info(`Removed "${title}" from wishlist.`);

    } else {
      // Optimistically add (Zustand updates state immediately)
      await addWishlist(book.id);
      
      // Display toast
      toast.success(`Added "${title}" to wishlist!`);
    }
    
  };

  // Truncate description to 2 lines (Keep as is)
  const truncateDescription = (text, maxLength = 80) => {
    if (!text) return "No description available";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <>
      <div className="group flex flex-col h-full bg-white rounded-lg border border-border-light dark:border-border-dark shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
        
        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 p-1 bg-white rounded-full shadow hover:scale-110 transition-transform z-10"
          aria-label={isCurrentlyWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {/* Use the derived state from the store directly */}
          {isCurrentlyWishlisted ? (
            <HeartSolidIcon className="w-6 h-6 text-red-500" />
          ) : (
            <HeartOutlineIcon className="w-6 h-6 text-gray-400 hover:text-red-500" />
          )}
        </button>

        {/* Image Section (Keep as is) */}
        <div className="relative overflow-hidden bg-slate-100 h-48 w-full flex-shrink-0">
          <Image
            src={coverImageUrl}
            alt={`Cover of ${title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Content Section (Keep as is) */}
        <div className="flex flex-1 flex-col p-4 gap-2">
          
          {/* Title and Price Row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-text-light dark:text-text-dark line-clamp-2 group-hover:text-accent transition-colors duration-200 flex-grow">
              {title}
            </h3>
            <p className="text-lg font-bold text-accent whitespace-nowrap">
              ${price}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-text-light/70 dark:text-text-dark/70 line-clamp-2 flex-grow">
            {truncateDescription(description)}
          </p>

          {/* View Details Button */}
          <Link
            href={`/book/${book.id}`}
            className="w-full bg-accent bg-blue-500 hover:bg-opacity-90 text-white mt-3 flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition-all duration-300 group-hover:gap-3"
          >
            View Details
          </Link>
        </div>
      </div>

      {/* Render the Modal when showLoginPrompt is true */}
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}
    </>
  );
}