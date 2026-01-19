"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ShoppingCartIcon,
  HeartIcon as HeartOutlineIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  CheckIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useBookStore } from "../store/useBookStore";
import { useGenreStore } from "../store/useGenreStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/authStore";
import { useAddToCartStore } from "../store/useAddToCardStore";
import { useReviewStore } from "../store/useReviewStore";
import BooksPage from "./BooksPage";
import ImageGallery from "./ImageGallery";
import PDFViewer from "./PDFViewer";
import ReviewsSection from "./ReviewsSection";
import QuickRating from "./QuickRating";
import RatingSummary from "./RatingSummary";

// ==================== CONSTANTS ====================

const TABS = {
  DESCRIPTION: "description",
  REVIEWS: "reviews",
  AUTHOR: "author",
};

// ==================== UTILITY FUNCTIONS ====================

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
    className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn"
    onClick={onClose}
  >
    <div
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 animate-scaleIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-pink-100 to-red-100 dark:from-pink-900/30 dark:to-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <HeartOutlineIcon className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
          Welcome to BookHaven
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Sign in to save books to your wishlist, track orders, and get personalized recommendations.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Link href="/login" onClick={onClose}>
          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
            Sign In to Continue
          </button>
        </Link>
        <Link href="/register" onClick={onClose}>
          <button className="w-full bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200 font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400">
            Create New Account
          </button>
        </Link>
        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Continue browsing as guest
        </button>
      </div>
    </div>
  </div>
);

const Breadcrumb = ({ genre, title }) => (
  <div className="flex flex-wrap items-center gap-2 mb-8 md:mb-12 max-w-7xl mx-auto px-4 sm:px-6">
    <Link
      href="/"
      className="flex items-center gap-1 text-black  hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm sm:text-base"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Home
    </Link>
    <ChevronRightIcon className="w-4 h-4 text-black" />
    <Link
      href={`/genres/${genre.toLowerCase().replace(/\s+/g, "-")}`}
      className="font-semibold text-gray-900 capitalize hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm sm:text-base"
    >
      {genre}
    </Link>
    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
    <span className="font-semibold text-black truncate max-w-[200px] sm:max-w-xs text-sm sm:text-base">
      {title}
    </span>
  </div>
);


const BookHeader = ({ title, author, description }) => (
  <div className="space-y-4">
    <div>
      <h2 className="font-serif text-3xl sm:text-2xl md:text-2xl font-bold text-black ">
        {title}
      </h2>
      <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
        by{" "}
        <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer">
          {author}
        </span>
      </p>
    </div>
    <p className="font-serif text-gray-700  text-base sm:text-lg leading-relaxed line-clamp-3">
      {description}
    </p>
  </div>
);


const PriceSection = ({
  originalPrice,
  finalPrice,
  totalPrice,
  stock,
  hasDiscount,
}) => (
  <div className="space-y-3 p-4 rounded-md shadow-sm">
    <div className="flex items-baseline gap-3">
      <span className="text-gray-600 text-lg dark:text-gray-400">Price:</span>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl md:text-2xl font-bold text-gray-900">
          ${finalPrice}
        </span>
        {hasDiscount && (
          <span className="text-lg text-gray-500 line-through">${originalPrice}</span>
        )}
      </div>
    </div>

    {hasDiscount && (
      <div className="inline-block text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-green-700">
        🎉 Save ${(parseFloat(originalPrice) - parseFloat(finalPrice)).toFixed(2)}
      </div>
    )}

    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 ${stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        <div className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="font-semibold">
          {stock > 0 ? `In Stock (${stock} available)` : 'Out of Stock'}
        </span>
      </div>
      {stock > 0 && stock < 10 && (
        <span className="text-xs  dark:text-orange-300 px-2 py-1 rounded border border-orange-300 dark:border-orange-600">
          Low stock
        </span>
      )}
    </div>

    <div className="pt-4 border-t border-gray-300 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-gray-600 dark:text-gray-400">Total:</span>
        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
          ${totalPrice}
        </span>
      </div>
    </div>
  </div>
);



const QuantitySelector = ({ quantity, onDecrease, onIncrease }) => (
  <div className="flex flex-col sm:flex-row sm:items-center  gap-4 p-4 rounded-xl">
    <span className="text-sm font-medium text-gray-700">Quantity:</span>
    <div className="flex items-center gap-4">
      <button
        onClick={onDecrease}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-500 dark:to-gray-500 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-500 dark:hover:to-gray-400 border border-gray-300 dark:border-gray-700 transition-all duration-300 active:scale-95 disabled:opacity-50"
        disabled={quantity <= 1}
      >
        <MinusIcon className="w-5 h-5" />
      </button>
      <div className="w-20 h-12 flex items-center justify-center bg-white border-2 border-blue-500 rounded-lg font-bold text-lg">
        {quantity}
      </div>
      <button
        onClick={onIncrease}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-500/30 dark:to-blue-800/30 hover:from-blue-200 hover:to-blue-100 dark:hover:from-blue-800 dark:hover:to-blue-700 border border-blue-300 dark:border-blue-700 transition-all duration-300 active:scale-95"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const ActionButtons = ({
  onAddToCart,
  onBuyNow,
  onWishlistToggle,
  onReadSample,
  isWishlisted,
  isOutOfStock,
  hasPDF,
}) => (
  <div className="grid grid-cols-2 gap-4">
    {/* First row - Add to Cart and Buy Now */}
    <button
      disabled={isOutOfStock}
      onClick={onAddToCart}
      className={`flex items-center justify-center gap-3 px-2 py-2 rounded-xl font-bold transition-all duration-300 ${isOutOfStock
          ? "bg-gray-400 text-gray-700 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl hover:-translate-y-1"
        }`}
    >
      <ShoppingCartIcon className="w-6 h-6" />
      <span className="text-lg">Add to Cart</span>
    </button>

    <button 
      disabled={isOutOfStock}
      onClick={onBuyNow}
      className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isOutOfStock
          ? "bg-gray-400 text-gray-700 cursor-not-allowed"
          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
        }`}
    >
      <CheckIcon className="w-5 h-5" />
      <span className="text-lg">Buy Now</span>
    </button>

    {/* Second row - Read Sample and Wishlist */}
    {hasPDF ? (
      <button
        onClick={onReadSample}
        className="flex items-center justify-center gap-2 px-2 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        <DocumentTextIcon className="w-6 h-6" />
        <span className="text-lg">Read Sample</span>
      </button>
    ) : (
      <button
        disabled
        className="flex items-center justify-center gap-2 px-2 py-2 rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed"
      >
        <DocumentTextIcon className="w-6 h-6" />
        <span className="text-lg">No Sample</span>
      </button>
    )}

    <button
      onClick={onWishlistToggle}
      className="flex items-center justify-center gap-2 px-2 py-2 rounded-xl bg-gray-200 border-2  text-black  hover:border-red-300 dark:hover:border-red-700 transition-all duration-300"
    >
      {isWishlisted ? (
        <>
          <HeartSolidIcon className="w-7 h-7 text-red-500 animate-pulse" />
          <span className="ml-2 font-semibold text-black">
            In Wishlist
          </span>
        </>
      ) : (
        <>
          <HeartOutlineIcon className="w-7 h-7 text-red-500" />
          <span className="ml-2 font-semibold text-gray-700">
            Add to Wishlist
          </span>
        </>
      )}
    </button>
  </div>
);


const BookDetailsTable = ({ genre, publisher, publicationDate, pageCount, hasPDF }) => (
  <div className=" dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200">
    <h3 className="text-xl font-bold mb-6  text-black bg-clip-text ">
      📚 Book Details
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Genre</p>
          <p className="font-medium">{genre}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Publisher</p>
          <p className="font-medium">{publisher}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Publication Date</p>
          <p className="font-medium">{publicationDate}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pages Count</p>
          <p className="font-medium">{pageCount}</p>
        </div>
      </div>
    </div>

    {/* PDF Availability */}
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-2">
        <DocumentTextIcon className="w-5 h-5 text-gray-500" />
        <span className="text-sm text-gray-500">Sample Preview:</span>
        <span className={`text-sm font-medium ${hasPDF ? 'text-green-600' : 'text-gray-400'}`}>
          {hasPDF ? '✓ Available' : '✗ Not Available'}
        </span>
      </div>
    </div>
  </div>
);

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: TABS.DESCRIPTION, label: "📖 Description" },
    { key: TABS.REVIEWS, label: "⭐ Reviews & Ratings" },
    { key: TABS.AUTHOR, label: "✍️ About Author" },
  ];

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 md:gap-6 border-b border-gray-300 dark:border-gray-700 pb-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`relative px-4 py-3 rounded-lg font-medium transition-all duration-300 ${activeTab === key
                ? "text-blue-800 bg-blue-50 dark:bg-blue-900/30"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-black hover:bg-gray-100 dark:hover:bg-gray-200"
              }`}
          >
            {label}
            {activeTab === key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transform -translate-y-2" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const TabContent = ({
  activeTab,
  description,
  aboutAuthor,
  title,
  bookId,
}) => (
  <div className="py-8 animate-fadeIn">
    {activeTab === TABS.DESCRIPTION && (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line shadow-lg py-14 px-5 rounded-lg">
          {description}
        </p>
      </div>
    )}

    {activeTab === TABS.REVIEWS && (
      <ReviewsSection bookId={bookId} />
    )}

    {activeTab === TABS.AUTHOR && (
      <div className=" text-black rounded-2xl shadow-lg p-8">
        <h4 className="text-xl font-bold mb-6">About the Author</h4>
        <p className=" leading-relaxed">
          {aboutAuthor ||
            `The author of "${title}" is an accomplished writer with several
            bestselling titles to their name. Known for their captivating
            storytelling and rich character development, they have earned
            critical acclaim and a dedicated readership worldwide.`}
        </p>
      </div>
    )}
  </div>
);

// ==================== MAIN COMPONENT ====================
const BookDetailsPage = ({ bookId = 1 }) => {
  const router = useRouter();
  const { fetchBook, loading: bookLoading } = useBookStore();
  const { genres = [], fetchGenres, loading: genreLoading } = useGenreStore();
  const { addWishlist, removeWishlist, isWishlisted } = useWishlistStore();
  const { user } = useAuthStore();
  const { addToCart } = useAddToCartStore();
  const { fetchUserReview } = useReviewStore();

  const [book, setBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(TABS.DESCRIPTION);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);

  // Fetch data on mount - optimized to reduce API calls
  useEffect(() => {
    // Only fetch genres if not already loaded
    if (genres.length === 0) {
      fetchGenres();
    }
  }, [fetchGenres, genres.length]);

  useEffect(() => {
    if (!bookId) return;

    const loadBook = async () => {
      try {
        const fetched = await fetchBook(bookId);
        if (fetched) {
          // Process images_url to ensure it's an array - optimized
          let processedImages = [];
          if (fetched.images_url) {
            if (typeof fetched.images_url === 'string') {
              try {
                processedImages = JSON.parse(fetched.images_url);
              } catch (e) {
                console.warn('Failed to parse images_url, using empty array');
                processedImages = [];
              }
            } else if (Array.isArray(fetched.images_url)) {
              processedImages = fetched.images_url;
            }
          }

          setBook({
            ...fetched,
            images_url: processedImages,
            image: processedImages, // Keep for backward compatibility
          });
        }
      } catch (error) {
        console.error('Failed to load book:', error);
      }
    };

    loadBook();
  }, [bookId, fetchBook]);

  // Separate effect for user review to avoid unnecessary calls
  useEffect(() => {
    if (user && bookId) {
      fetchUserReview(bookId);
    }
  }, [user, bookId, fetchUserReview]);

  // Calculate genre name

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

  // Handlers - memoized for better performance
  const handleQuantityChange = useCallback((delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  }, []);

  const handleWishlistToggle = useCallback(async () => {
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
  }, [book, user, isWishlisted, removeWishlist, addWishlist]);

  const handleAddToCart = useCallback(async () => {
    if (!book) return;

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      // Optimized: Don't wait for full cart refresh, just add the item
      await addToCart(book.id, quantity);
      toast.success(`Added ${quantity} x "${book.title}" to cart!`);
    } catch (err) {
      toast.error(`Failed to add to cart: ${err.message}`);
    }
  }, [book, user, addToCart, quantity]);

  const handleBuyNow = useCallback(async () => {
    if (!book) return;

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      // Optimized: Add to cart and redirect immediately without waiting for full refresh
      const addPromise = addToCart(book.id, quantity);
      
      // Show success message immediately
      toast.success(`Added ${quantity} x "${book.title}" to cart!`);
      
      // Redirect immediately while add to cart completes in background
      router.push('/checkout');
      
      // Ensure the add to cart completes
      await addPromise;
    } catch (err) {
      toast.error(`Failed to proceed to checkout: ${err.message}`);
    }
  }, [book, user, addToCart, quantity, router]);

  const handleReadSample = useCallback(() => {
    if (book?.pdf_file_url) {
      setShowPDFViewer(true);
    }
  }, [book?.pdf_file_url]);

  // Loading state
  const isLoading = bookLoading || genreLoading || !book;
  if (isLoading) {
    return (
      <main className="min-h-screen  bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl aspect-[3/4]"></div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentStock = parseFloat(book.stock) || 0;
  const isOutOfStock = currentStock === 0;
  const hasDiscount = book.discount_value > 0;

  return (
    <>
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Breadcrumb genre={genreName} title={book.title} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 max-w-7xl mx-auto">
            <ImageGallery images={book.images_url} title={book.title} hasPDF={!!(book.pdf_file_url)} />

            <div className="flex flex-col gap-8 px-4 sm:px-6 lg:px-0">
              <BookHeader
                title={book.title}
                author={book.author_name}
                description={book.description}
              />
              {/* ⭐ Rating summary under description */}
              <RatingSummary
                rating={book.average_rating || 0}
                totalReviews={book.total_reviews || 0}
              />

              <div className="space-y-6 bg-white  rounded-2xl p-6 shadow-lg border border-gray-300 ">
                <PriceSection
                  originalPrice={prices.original}
                  finalPrice={prices.final}
                  totalPrice={prices.total}
                  stock={currentStock}
                  hasDiscount={hasDiscount}
                />

                {/* Quick Rating Section */}
                <QuickRating
                  bookId={book.id}
                  currentRating={book.average_rating || 0}
                  totalReviews={book.total_reviews || 0}
                  onRatingUpdate={() => {
                    // Refresh book data when rating is updated
                    fetchBook(bookId).then(updatedBook => {
                      if (updatedBook) {
                        setBook(prev => ({
                          ...prev,
                          average_rating: updatedBook.average_rating,
                          total_reviews: updatedBook.total_reviews,
                          rating_distribution: updatedBook.rating_distribution
                        }));
                      }
                    });
                  }}
                />

                <QuantitySelector
                  quantity={quantity}
                  onDecrease={() => handleQuantityChange(-1)}
                  onIncrease={() => handleQuantityChange(1)}
                />

                <ActionButtons
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onWishlistToggle={handleWishlistToggle}
                  onReadSample={handleReadSample}
                  isWishlisted={isWishlisted(book.id)}
                  isOutOfStock={isOutOfStock}
                  hasPDF={!!(book.pdf_file_url)}
                />
              </div>

              <BookDetailsTable
                genre={genreName}
                publisher={book.publisher || "N/A"}
                publicationDate={book.created_at ? book.created_at.split("T")[0] : "N/A"}
                pageCount={book.page_count || "N/A"}
                hasPDF={!!(book.pdf_file_url)}
              />
            </div>
          </div>

          <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <TabContent
              activeTab={activeTab}
              description={book.description}
              aboutAuthor={book.about_author}
              title={book.title}
              bookId={book.id}
            />
          </div>

        </div>
      </main>

      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}

      {showPDFViewer && (
        <PDFViewer
          pdfUrl={book?.pdf_file_url}
          title={book?.title}
          isOpen={showPDFViewer}
          onClose={() => setShowPDFViewer(false)}
        />
      )}
    </>
  );
};

// ==================== PAGE WRAPPER ====================
export default function BookDetailsPageWrapper(props) {
  return (
    <div className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bg-" />

      <BookDetailsPage {...props} />

      <div className="mt-5 md:mt-3 relative z-1 max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24">
        <p className="text-2xl font-bold mb-4">Find more books.</p>
        <BooksPage />
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastClassName="rounded-xl"
        bodyClassName="font-sans"
      />
    </div>
  );
}