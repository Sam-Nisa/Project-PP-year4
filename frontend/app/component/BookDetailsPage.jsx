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


const BookHeader = ({ title, author, description, rating, totalReviews }) => (
  <div className="space-y-4">
    {/* Rating First */}
    <div className="flex items-center gap-2">
      <div className="flex text-teal-600 gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-bold text-gray-900">{rating} ({totalReviews} reviews)</span>
    </div>

    <div>
      <h1 className="font-serif text-5xl font-bold text-gray-900 leading-tight">
        {title}
      </h1>
      <p className="mt-2 text-xl text-teal-700 font-serif italic">
        by <span className="font-semibold cursor-pointer hover:underline">{author}</span>
      </p>
    </div>

    <div className="prose prose-lg text-gray-500 leading-relaxed text-base pt-2">
      {description}
    </div>
  </div>
);


const PurchaseCard = ({
  originalPrice,
  finalPrice,
  stock,
  hasDiscount,
  quantity,
  onQuantityChange,
  onAddToCart,
  onWishlistToggle,
  isWishlisted,
  loading
}) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 mt-8">
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <p className="text-sm text-gray-500 mb-1">Total Price</p>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-gray-900">${finalPrice}</span>
          {hasDiscount && (
            <span className="text-lg text-gray-400 line-through decoration-1">${originalPrice}</span>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
        <div className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
        {stock > 0 ? 'In Stock' : 'Out of Stock'}
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-4">
      {/* Minimized Quantity Selector */}
      <div className="flex items-center border border-gray-300 rounded-lg h-12 w-32 shrink-0">
        <button
          onClick={() => onQuantityChange(-1)}
          disabled={quantity <= 1}
          className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 rounded-l-lg"
        >
          <MinusIcon className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center font-bold text-gray-900">{quantity}</div>
        <button
          onClick={() => onQuantityChange(1)}
          className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-r-lg"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Add To Cart */}
      <button
        onClick={onAddToCart}
        disabled={stock <= 0}
        className="flex-1 bg-[#2C5F6D] hover:bg-[#234b56] text-white font-bold rounded-lg h-12 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <ShoppingCartIcon className="w-5 h-5" />
        Add to Cart
      </button>

      {/* Wishlist */}
      <button
        onClick={onWishlistToggle}
        className={`h-12 w-12 flex items-center justify-center rounded-lg border-2 transition-all ${isWishlisted
          ? 'border-red-200 bg-red-50 text-red-500'
          : 'border-gray-200 hover:border-gray-300 text-gray-400 hover:text-gray-600'
          }`}
      >
        {isWishlisted ? (
          <HeartSolidIcon className="w-6 h-6" />
        ) : (
          <HeartOutlineIcon className="w-6 h-6" />
        )}
      </button>
    </div>
  </div>
);








const BookDetailsTable = ({ genre, publisher, publicationDate, pageCount }) => (
  <div className="bg-gray-50 rounded-xl p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8">
    <div className="flex flex-col">
      <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Genre</span>
      <span className="text-sm sm:text-base font-bold text-gray-900">{genre}</span>
    </div>

    <div className="flex flex-col">
      <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Publisher</span>
      <span className="text-sm sm:text-base font-bold text-gray-900">{publisher}</span>
    </div>

    <div className="flex flex-col">
      <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Publication Date</span>
      <span className="text-sm sm:text-base font-bold text-gray-900">{publicationDate}</span>
    </div>

    <div className="flex flex-col">
      <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pages Count</span>
      <span className="text-sm sm:text-base font-bold text-gray-900">{pageCount}</span>
    </div>
  </div>
);

const TabNavigation = ({ onScrollToAuthor, onScrollToReviews }) => {
  return (
    <div className="flex gap-4 mb-8">
      <button
        onClick={onScrollToAuthor}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-sm transition-all"
      >
        <span>✍️</span>
        About Author
      </button>

      <button
        onClick={onScrollToReviews}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-sm transition-all"
      >
        <span>⭐</span>
        Reviews & Ratings
      </button>
    </div>
  );
};



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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
            {/* Left Column: Image */}
            <div className="lg:col-span-5 lg:start-1">
              <ImageGallery images={book.images_url} title={book.title} hasPDF={!!(book.pdf_file_url)} />
            </div>

            {/* Right Column: Details */}
            <div className="lg:col-span-6 lg:col-start-7 flex flex-col">
              <BookHeader
                title={book.title}
                author={book.author_name}
                description={book.description ? book.description.substring(0, 180) + "..." : ""}
                rating={book.average_rating}
                totalReviews={book.total_reviews}
              />

              <PurchaseCard
                originalPrice={prices.original}
                finalPrice={prices.final}
                stock={currentStock}
                hasDiscount={hasDiscount}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
                onAddToCart={handleAddToCart}
                onWishlistToggle={handleWishlistToggle}
                isWishlisted={isWishlisted(book.id)}
              />

              <div className="border-t border-gray-100 pt-8 mb-8">
                <BookDetailsTable
                  genre={genreName}
                  publisher={book.publisher || "N/A"}
                  publicationDate={book.created_at ? book.created_at.split("T")[0] : "N/A"}
                  pageCount={book.page_count || "N/A"}
                  hasPDF={!!(book.pdf_file_url)}
                />

                <TabNavigation
                  onScrollToAuthor={() => document.getElementById('author-section')?.scrollIntoView({ behavior: 'smooth' })}
                  onScrollToReviews={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                />

                {/* Description (Always Visible) */}
                <div className="prose prose-lg text-gray-500 mb-12">
                  <h3 className="text-gray-900 font-bold text-lg mb-2 font-serif">Description</h3>
                  <p className="leading-relaxed">{book.description}</p>
                </div>

                {/* Author Section */}
                <div id="author-section" className="bg-gray-50 p-6 rounded-xl mb-12 scroll-mt-24">
                  <h4 className="font-bold text-gray-900 mb-2">About {book.author_name}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{book.about_author || "Author biography not available."}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Reviews Section at bottom */}
          <div id="reviews-section" className="max-w-7xl mx-auto mt-16 pt-16 border-t border-gray-100 scroll-mt-24">
            <ReviewsSection bookId={book.id} />
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