"use client";

import Link from "next/link";
import Image from "next/image";
import { HeartIcon as HeartOutlineIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { toast } from "react-toastify";

import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/authStore";

const LoginPromptModal = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-white/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-5 shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <HeartOutlineIcon className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h3 className="text-lg font-bold">Login Required</h3>
          <p className="text-sm text-gray-500">
            Please login to add wishlist
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/login" onClick={onClose}>
            <button className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-semibold">
              Login
            </button>
          </Link>
          <Link href="/register" onClick={onClose}>
            <button className="w-full bg-gray-200 py-2 rounded-md text-sm font-semibold">
              Register
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function BookCard({ book }) {
  if (!book) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const title = book.title || "Untitled";
  const price = parseFloat(book.price || 0).toFixed(2);
  const coverImageUrl = book.cover_image
    ? `${API_URL}/storage/${book.cover_image}`
    : "/no-image.png";

  const { addWishlist, removeWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const isCurrentlyWishlisted = isWishlisted(book.id);

  const toggleWishlist = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (isCurrentlyWishlisted) {
      await removeWishlist(book.id);
      toast.info("Removed from wishlist");
    } else {
      await addWishlist(book.id);
      toast.success("Added to wishlist");
    }
  };

  return (
    <>
      <div className="relative bg-white border rounded-lg shadow-sm mb-6 hover:shadow-md transition overflow-hidden">
        
        {/* Wishlist */}
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow z-10 hover:bg-gray-200 transition"
        >
          {isCurrentlyWishlisted ? (
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          ) : (
            <HeartOutlineIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Image */}
        <div className="relative h-56 w-full bg-gray-100">
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-1">
          <h3 className="text-sm font-semibold line-clamp-2">{title}</h3>
          <p className="text-blue-600 font-bold text-sm">${price}</p>

          <Link
            href={`/book/${book.id}`}
            className="mt-2 text-center text-sm bg-blue-500 text-white py-1.5 rounded-md hover:bg-blue-600 transition"
          >
            View Details
          </Link>
        </div>
      </div>

      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}
    </>
  );
}
