"use client";

import Link from "next/link";
// Import Toast components
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingCartIcon,
  HeartIcon as HeartOutlineIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useBookStore } from "../store/useBookStore";
import { useGenreStore } from "../store/useGenreStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/authStore";
import { useAddToCartStore } from "../store/useAddToCardStore"; // <- Import your cart store
import BooksPage from "./BooksPage";

// --- Login Prompt Modal ---
const LoginPromptModal = ({ onClose }) => (
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
        <p className="text-sm text-gray-700 dark:text-gray-200 mb-6">
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

// --- MOCK DATA ---
const MOCK_PLACEHOLDERS = {
  rating: 4.5,
  reviews: 1245,
  reviewDistribution: [
    { stars: 5, percent: 75 },
    { stars: 4, percent: 15 },
    { stars: 3, percent: 5 },
    { stars: 2, percent: 3 },
    { stars: 1, percent: 2 },
  ],
};

const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const stars = [];

  for (let i = 0; i < fullStars; i++) stars.push(<span key={`full-${i}`} className="text-yellow-400">★</span>);
  if (hasHalfStar) stars.push(<span key="half" className="text-yellow-400">★</span>);
  for (let i = 0; i < 5 - fullStars - (hasHalfStar ? 1 : 0); i++)
    stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
  return stars;
};

const BookDetailPage = ({ bookId = 1 }) => {
  const { fetchBook, loading: bookLoading, error: bookError } = useBookStore();
  const { genres = [], fetchGenres, loading: genreLoading } = useGenreStore();
  const { addWishlist, removeWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();

  const { addToCart } = useAddToCartStore(); // <- Use your store method

  const [book, setBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [genreName, setGenreName] = useState("Loading...");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // --- PRICE CALCULATION ---
  const calculateFinalPrice = useCallback(() => {
    if (!book) return "0.00";
    const price = parseFloat(book.price) || 0;
    const discountValue = parseFloat(book.discount_value) || 0;
    const discountType = book.discount_type;
    if (!discountType || discountValue <= 0) return price.toFixed(2);
    if (discountType === "percentage") return (price - price * (discountValue / 100)).toFixed(2);
    if (discountType === "fixed") return (price - discountValue).toFixed(2);
    return price.toFixed(2);
  }, [book]);

  const calculateTotalPrice = useCallback(() => {
    const singlePrice = parseFloat(calculateFinalPrice()) || 0;
    return (singlePrice * quantity).toFixed(2);
  }, [quantity, calculateFinalPrice]);

  // Fetch Data
  useEffect(() => {
    fetchGenres();
    if (!bookId) return;

    const loadBook = async () => {
      const fetched = await fetchBook(bookId);
      if (fetched) {
        setBook({
          ...fetched,
          image: fetched.cover_image_url,
          rating: MOCK_PLACEHOLDERS.rating,
          reviews: MOCK_PLACEHOLDERS.reviews,
          reviewDistribution: MOCK_PLACEHOLDERS.reviewDistribution,
          details: {
            publisher: fetched.publisher || "N/A",
            publicationDate: fetched.publication_date || "N/A",
            pageCount: fetched.page_count || "N/A",
            genre: "Loading...",
          },
        });
      }
    };
    loadBook();
  }, [bookId, fetchBook, fetchGenres]);

  // Map Genre
  useEffect(() => {
    if (book && genres.length > 0) {
      const match = genres.find((g) => g.id === book.genre_id);
      const name = match ? match.name : "Uncategorized";
      setGenreName(name);
      setBook((prev) => ({ ...prev, details: { ...prev.details, genre: name } }));
    }
  }, [genres]);

  const decreaseQuantity = () => quantity > 1 && setQuantity(quantity - 1);
  const increaseQuantity = () => setQuantity(quantity + 1);

  const toggleWishlist = async () => {
    if (!book) return;
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (isWishlisted(book.id)) {
      await removeWishlist(book.id);
      toast.info(`Removed "${book.title}" from wishlist.`);
    } else {
      await addWishlist(book.id);
      toast.success(`Added "${book.title}" to wishlist!`);
    }
  };

  // --- Add to Cart with Store ---
  const handleAddToCart = async () => {
    if (!book) return;
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      await addToCart(book.id, quantity);
      toast.success(`Added ${quantity} x "${book.title}" to cart!`);
    } catch (err) {
      toast.error(`Failed to add to cart: ${err.message}`);
    }
  };

  const isLoading = bookLoading || genreLoading || !book;
  if (isLoading) return <main className="container mx-auto py-12 text-center">Loading...</main>;

  const currentStock = parseFloat(book.stock) || 0;

  return (
    <>
      <main className="container mx-auto sm:px-6 lg:px-12 py-8 md:py-12 bg-white text-black">
        {/* BREADCRUMB */}
        <div className="flex flex-wrap gap-2 mb-8 max-w-7xl mx-auto">
          <Link href="/" className="text-lg text-black hover:text-blue-500">Home</Link>
          <span>/</span>
          <span className="text-lg text-black hover:text-blue-500">{genreName}</span>
          <span>/</span>
          <span className="text-lg font-medium">{book.title}</span>
        </div>

        {/* LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 max-w-7xl mx-auto">
          {/* IMAGE */}
          <div className="flex justify-center px-4">
            <div className="w-full max-w-md">
              <div className="aspect-[3/4] w-full bg-center bg-cover rounded-lg shadow-2xl"
                style={{ backgroundImage: `url('${book.image}')` }} />
            </div>
          </div>

          {/* DETAILS */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold">{book.title}</h2>
              <p className="mt-2 text-lg text-gray-600">by <span className="text-blue-500">{book.author_name}</span></p>
              <p className="font-serif text-lg py-4">{book.description}</p>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex text-xl">{renderStars(book.rating)}</div>
                <span className="text-sm text-gray-600">({book.rating} stars) - {book.reviews.toLocaleString()} reviews</span>
              </div>
            </div>

            {/* PRICE & QUANTITY */}
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-xl font-semibold">Price per unit: ${calculateFinalPrice()}</p>
                <p className="text-3xl font-bold text-green-600">Total: ${calculateTotalPrice()}</p>
                {book.discount_value > 0 && <p className="text-sm text-gray-500 line-through">Original: ${parseFloat(book.price).toFixed(2)}</p>}
                <p className={`text-sm font-semibold mt-1 ${currentStock > 0 ? "text-green-600" : "text-red-600"}`}>
                  {currentStock > 0 ? `✓ In Stock (${currentStock})` : "✗ Out of Stock"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button onClick={decreaseQuantity} className="px-4 py-2 hover:bg-gray-100 text-lg font-bold">-</button>
                  <input type="text" readOnly value={quantity} className="w-16 text-center py-2 border-x border-gray-300" />
                  <button onClick={increaseQuantity} className="px-4 py-2 hover:bg-gray-100 text-lg font-bold">+</button>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                disabled={currentStock === 0}
                onClick={handleAddToCart}
                className={`w-full flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold ${currentStock > 0 ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-400 text-gray-700"}`}
              >
                <ShoppingCartIcon className="w-5 h-5" />
                Add to Cart
              </button>

              <button className="w-full flex-1 flex items-center justify-center px-6 py-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600">Order Now</button>

              <button onClick={toggleWishlist} className="p-3 rounded-lg border border-gray-300 hover:bg-gray-100">
                {isWishlisted(book.id) ? <HeartSolidIcon className="w-6 h-6 text-red-500" /> : <HeartOutlineIcon className="w-6 h-6 text-red-500" />}
              </button>
            </div>

            {/* DETAILS TABLE */}
            <div className="border-t border-gray-300 pt-6">
              <h3 className="font-bold text-lg mb-4">Book Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p className="text-gray-600">Genre:</p> <p>{genreName}</p>
                <p className="text-gray-600">Publisher:</p> <p>{book.details.publisher}</p>
                <p className="text-gray-600">Publication Date:</p> <p>{book.details.publicationDate}</p>
                <p className="text-gray-600">Page Count:</p> <p>{book.page_count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-16 max-w-7xl mx-auto">
          <div className="border-b border-gray-300">
            <nav className="-mb-px flex gap-6">
              <button onClick={() => setActiveTab("description")} className={`border-b-2 px-1 pb-4 ${activeTab === "description" ? "border-blue-500 text-blue-500" : "text-gray-700"}`}>Description</button>
              <button onClick={() => setActiveTab("reviews")} className={`border-b-2 px-1 pb-4 ${activeTab === "reviews" ? "border-blue-500 text-blue-500" : "text-gray-700"}`}>Reviews</button>
              <button onClick={() => setActiveTab("author")} className={`border-b-2 px-1 pb-4 ${activeTab === "author" ? "border-blue-500 text-blue-500" : "text-gray-700"}`}>About the Author</button>
            </nav>
          </div>
          <div className="py-8 space-y-4">
            {activeTab === "description" && <p className="whitespace-pre-wrap">{book.description}</p>}
            {activeTab === "reviews" && (
              <div className="space-y-2">
                {(book.reviewDistribution || []).map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.stars} ★</span>
                    <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div className="rounded-full bg-blue-500" style={{ width: `${r.percent}%` }} />
                    </div>
                    <span className="text-sm text-gray-600">{r.percent}%</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "author" && <p className="whitespace-pre-wrap">{book.about_author || `Author details for ${book.title} are currently unavailable.`}</p>}
          </div>
        </div>
      </main>

      {showLoginPrompt && <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />}
    </>
  );
};

export default function PageWrapper(props) {
  return (
<div>
      <BookDetailPage {...props} />

      <div className="mt-12">
        <BooksPage />
      </div>

      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      </div>
  );
}
