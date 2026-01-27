"use client";

import Link from "next/link";
import Image from "next/image";
import { HeartIcon as HeartOutlineIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import {ShoppingCartIcon as ShoppingCartIcon} from "@heroicons/react/24/outline";
import { useState, memo } from "react";
import { toast } from "react-toastify";



import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/authStore";
import StarRating from "./StarRating";
import { useAddToCartStore } from "../store/useAddToCardStore";

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

const BookCardComponent = ({ book }) => {
  if (!book) return null;

  console.log("book: ",book)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const title = book.title || "Untitled";
  const price = parseFloat(book.price || 0).toFixed(2);
 const coverImageUrl =
  book.images_url?.length > 0
    ? book.images_url[0]
    : "/images/book-placeholder.png";


  const { addWishlist, removeWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();
  const { addToCart } = useAddToCartStore();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const isCurrentlyWishlisted = isWishlisted(book.id);

const toggleWishlist = async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!user) {
    setShowLoginPrompt(true);
    return;
  }

  try {
    if (isCurrentlyWishlisted) {
      await removeWishlist(book.id);
      toast.info("Removed from wishlist");
    } else {
      await addWishlist(book.id);
      toast.success("Added to wishlist");
    }
  } catch {
    toast.error("Wishlist action failed");
  }
};

const handleAddToCart = async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!user) {
    setShowLoginPrompt(true);
    return;
  }

  try {
    await addToCart(book.id, 1); // quantity = 1 on card
    toast.success(`"${book.title}" added to cart`);
  } catch (err) {
    toast.error("Failed to add to cart");
  }
};




  return (
    <>
<div className="hover:scale-105 transition relative bg-white border rounded-lg shadow-sm mb-6 hover:shadow-md overflow-hidden">
  
  {/* Clickable area */}
  <Link href={`/book/${book.id}`}>
    <div className="relative h-56 w-full">
      <Image
        src={coverImageUrl}
        alt={title}
        fill
        className="object-contain"
      />
    </div>

    <div className="p-3">
      <h3 className="text-sm font-semibold line-clamp-2">{title}</h3>
      <p className="text-blue-600 font-bold text-sm">${price}</p>
    </div>
  </Link>

  {/* Actions (NOT inside Link) */}
  <div className="px-3 pb-3 flex justify-between items-center">
    
    {/* Wishlist */}
    <button
      onClick={toggleWishlist}
      className="bg-white p-2 rounded-lg shadow hover:bg-gray-200"
    >
      {isCurrentlyWishlisted ? (
        <HeartSolidIcon className="w-5 h-5 text-red-500" />
      ) : (
        <HeartOutlineIcon className="w-5 h-5 text-red-600" />
      )}
    </button>

    {/* Add to Cart */}
    <button
      onClick={handleAddToCart}
      className="flex items-center gap-2 px-10 py-2 rounded-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 text-white hover:shadow-xl"
    >
      <ShoppingCartIcon className="w-5 h-5" />
      <span className="text-sm">Add to Cart</span>
    </button>
  </div>
</div>



      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
const BookCard = memo(BookCardComponent);

export default BookCard;
