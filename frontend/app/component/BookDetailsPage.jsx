"use client";

import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCartIcon,
  HeartIcon as HeartOutlineIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useBookStore } from "../store/useBookStore";
import { useGenreStore } from "../store/useGenreStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/authStore";
import { useAddToCartStore } from "../store/useAddToCardStore";
import BooksPage from "./BooksPage";

// ==================== CONSTANTS ====================
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

const TABS = {
  DESCRIPTION: "description",
  REVIEWS: "reviews",
  AUTHOR: "author",
};

// ==================== UTILITY FUNCTIONS ====================
const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <>
      {Array(fullStars)
        .fill(0)
        .map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400">
            ★
          </span>
        ))}
      {hasHalfStar && (
        <span key="half" className="text-yellow-400">
          ★
        </span>
      )}
      {Array(emptyStars)
        .fill(0)
        .map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300">
            ☆
          </span>
        ))}
    </>
  );
};

const calculateDiscountedPrice = (price, discountValue, discountType) => {
  if (!discountType || discountValue <= 0) return price;

  if (discountType === "percentage") {
    return price - (price * discountValue) / 100;
  }

  if (discountType === "fixed") {
    return Math.max(0, price - discountValue);
  }

  return price;
};

// ==================== SUB-COMPONENTS ====================
const LoginPromptModal = ({ onClose }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
    onClick={onClose}
  >
    <div
      className="bg-white dark:bg-blue-800 rounded-xl p-6 shadow-2xl w-full max-w-sm m-4 transform transition-all duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center">
        <HeartOutlineIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Login Required
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-200 mb-6">
          You need to be logged in to add items to your wishlist or cart.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/login" onClick={onClose}>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">
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

const Breadcrumb = ({ genre, title }) => (
  <div className="flex flex-wrap gap-2 mb-8 max-w-7xl mx-auto">
    <Link href="/" className="text-lg text-black hover:text-blue-500">
      Home
    </Link>
    <span>/</span>
    <span className="text-lg text-black hover:text-blue-500">{genre}</span>
    <span>/</span>
    <span className="text-lg font-medium">{title}</span>
  </div>
);

const BookImage = ({ image, title }) => (
  <div className="flex justify-center px-4">
    <div className="w-full max-w-md">
      <div
        className="aspect-[3/4] w-full bg-center bg-cover rounded-lg shadow-2xl"
        style={{ backgroundImage: `url('${image}')` }}
        role="img"
        aria-label={title}
      />
    </div>
  </div>
);

const BookHeader = ({ title, author, description, rating, reviews }) => (
  <div>
    <h2 className="font-serif text-4xl md:text-5xl font-bold">{title}</h2>
    <p className="mt-2 text-lg text-gray-600">
      by <span className="text-blue-500">{author}</span>
    </p>
    <p className="font-serif text-lg py-4">{description}</p>
    <div className="flex items-center gap-2 mt-4">
      <div className="flex text-xl">{renderStars(rating)}</div>
      <span className="text-sm text-gray-600">
        ({rating} stars) - {reviews.toLocaleString()} reviews
      </span>
    </div>
  </div>
);

const PriceSection = ({
  originalPrice,
  finalPrice,
  totalPrice,
  stock,
  hasDiscount,
}) => (
  <div>
    <p className="text-xl font-semibold">Price per unit: ${finalPrice}</p>
    <p className="text-3xl font-bold text-green-600">Total: ${totalPrice}</p>
    {hasDiscount && (
      <p className="text-sm text-gray-500 line-through">
        Original: ${originalPrice}
      </p>
    )}
    <p
      className={`text-sm font-semibold mt-1 ${
        stock > 0 ? "text-green-600" : "text-red-600"
      }`}
    >
      {stock > 0 ? `✓ In Stock (${stock})` : "✗ Out of Stock"}
    </p>
  </div>
);

const QuantitySelector = ({ quantity, onDecrease, onIncrease }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm text-gray-600">Quantity:</span>
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={onDecrease}
        className="px-4 py-2 hover:bg-gray-100 text-lg font-bold"
        disabled={quantity <= 1}
      >
        -
      </button>
      <input
        type="text"
        readOnly
        value={quantity}
        className="w-16 text-center py-2 border-x border-gray-300"
      />
      <button
        onClick={onIncrease}
        className="px-4 py-2 hover:bg-gray-100 text-lg font-bold"
      >
        +
      </button>
    </div>
  </div>
);

const ActionButtons = ({
  onAddToCart,
  onWishlistToggle,
  isWishlisted,
  isOutOfStock,
}) => (
  <div className="flex flex-col sm:flex-row gap-4">
    <button
      disabled={isOutOfStock}
      onClick={onAddToCart}
      className={`w-full flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
        isOutOfStock
          ? "bg-gray-400 text-gray-700 cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      <ShoppingCartIcon className="w-5 h-5" />
      Add to Cart
    </button>

    <button className="w-full flex-1 flex items-center justify-center px-6 py-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition-colors">
      Order Now
    </button>

    <button
      onClick={onWishlistToggle}
      className="p-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
    >
      {isWishlisted ? (
        <HeartSolidIcon className="w-6 h-6 text-red-500" />
      ) : (
        <HeartOutlineIcon className="w-6 h-6 text-red-500" />
      )}
    </button>
  </div>
);

const BookDetailsTable = ({ genre, publisher, publicationDate, pageCount }) => (
  <div className="border-t border-gray-300 pt-6">
    <h3 className="font-bold text-lg mb-4">Book Details</h3>
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <p className="text-gray-600">Genre:</p>
      <p>{genre}</p>
      <p className="text-gray-600">Publisher:</p>
      <p>{publisher}</p>
      <p className="text-gray-600">Publication Date:</p>
      <p>{publicationDate}</p>
      <p className="text-gray-600">Page Count:</p>
      <p>{pageCount}</p>
    </div>
  </div>
);

const TabNavigation = ({ activeTab, onTabChange }) => (
  <div className="border-b border-gray-300">
    <nav className="-mb-px flex gap-6">
      {Object.entries({
        [TABS.DESCRIPTION]: "Description",
        [TABS.REVIEWS]: "Reviews",
        [TABS.AUTHOR]: "About the Author",
      }).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`border-b-2 px-1 pb-4 transition-colors ${
            activeTab === key
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-gray-700 hover:text-blue-500"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  </div>
);

const TabContent = ({
  activeTab,
  description,
  reviewDistribution,
  aboutAuthor,
  title,
}) => (
  <div className="py-8 space-y-4">
    {activeTab === TABS.DESCRIPTION && (
      <p className="whitespace-pre-wrap">{description}</p>
    )}

    {activeTab === TABS.REVIEWS && (
      <div className="space-y-2">
        {reviewDistribution.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm font-medium">{r.stars} ★</span>
            <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="rounded-full bg-blue-500 transition-all"
                style={{ width: `${r.percent}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{r.percent}%</span>
          </div>
        ))}
      </div>
    )}

    {activeTab === TABS.AUTHOR && (
      <p className="whitespace-pre-wrap">
        {aboutAuthor ||
          `Author details for ${title} are currently unavailable.`}
      </p>
    )}
  </div>
);

// ==================== MAIN COMPONENT ====================
const BookDetailPage = ({ bookId = 1 }) => {
  const { fetchBook, loading: bookLoading } = useBookStore();
  const { genres = [], fetchGenres, loading: genreLoading } = useGenreStore();
  const { addWishlist, removeWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();
  const { addToCart } = useAddToCartStore();

  const [book, setBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(TABS.DESCRIPTION);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch data on mount
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
        });
      }
    };

    loadBook();
  }, [bookId, fetchBook, fetchGenres]);

  console.log("Book Details Page - Book Data:", book);

  // Calculate genre name
  const genreName = useMemo(() => {
    if (!book || genres.length === 0) return "Loading...";
    const match = genres.find((g) => g.id === book.genre_id);
    return match ? match.name : "Uncategorized";
  }, [book, genres]);

  // Calculate prices
  const prices = useMemo(() => {
    if (!book) return { original: "0.00", final: "0.00", total: "0.00" };

    const originalPrice = parseFloat(book.price) || 0;
    const discountValue = parseFloat(book.discount_value) || 0;
    const discountType = book.discount_type;

    const finalPrice = calculateDiscountedPrice(
      originalPrice,
      discountValue,
      discountType
    );
    const totalPrice = finalPrice * quantity;

    return {
      original: originalPrice.toFixed(2),
      final: finalPrice.toFixed(2),
      total: totalPrice.toFixed(2),
    };
  }, [book, quantity]);

  // Handlers
  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleWishlistToggle = async () => {
    if (!book) return;

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      if (isWishlisted(book.id)) {
        await removeWishlist(book.id);
        toast.info(`Removed "${book.title}" from wishlist.`);
      } else {
        await addWishlist(book.id);
        toast.success(`Added "${book.title}" to wishlist!`);
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

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

  // Loading state
  const isLoading = bookLoading || genreLoading || !book;
  if (isLoading) {
    return (
      <main className="container mx-auto py-12 text-center">
        <div className="animate-pulse">Loading book details...</div>
      </main>
    );
  }

  const currentStock = parseFloat(book.stock) || 0;
  const isOutOfStock = currentStock === 0;
  const hasDiscount = book.discount_value > 0;

  return (
    <>
      <main className="container mx-auto sm:px-6 lg:px-12 py-8 md:py-12 bg-white text-black">
        <Breadcrumb genre={genreName} title={book.title} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 max-w-7xl mx-auto">
          <BookImage image={book.image} title={book.title} />

          <div className="flex flex-col gap-6">
            <BookHeader
              title={book.title}
              author={book.author_name}
              description={book.description}
              rating={book.rating}
              reviews={book.reviews}
            />

            <div className="flex items-center justify-between gap-4 p-4">
              <PriceSection
                originalPrice={prices.original}
                finalPrice={prices.final}
                totalPrice={prices.total}
                stock={currentStock}
                hasDiscount={hasDiscount}
              />

              <QuantitySelector
                quantity={quantity}
                onDecrease={() => handleQuantityChange(-1)}
                onIncrease={() => handleQuantityChange(1)}
              />
            </div>

            <ActionButtons
              onAddToCart={handleAddToCart}
              onWishlistToggle={handleWishlistToggle}
              isWishlisted={isWishlisted(book.id)}
              isOutOfStock={isOutOfStock}
            />

            <BookDetailsTable
              genre={genreName}
              publisher={book.publisher || "N/A"}
              publicationDate={book.publication_date || "N/A"}
              pageCount={book.page_count || "N/A"}
            />
          </div>
        </div>

        <div className="mt-16 max-w-7xl mx-auto">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <TabContent
            activeTab={activeTab}
            description={book.description}
            reviewDistribution={book.reviewDistribution}
            aboutAuthor={book.about_author}
            title={book.title}
          />
        </div>
      </main>

      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}
    </>
  );
};

// ==================== PAGE WRAPPER ====================
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
