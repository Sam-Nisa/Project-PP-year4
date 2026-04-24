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


// Inlined UI components for custom layout
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
    if (!book) return { original: "0.00", final: "0.00", total: "0.00", totalOriginal: "0.00" };

    const originalPrice = parseFloat(book.price) || 0;
    const discountValue = parseFloat(book.discount_value) || 0;
    const discountType = book.discount_type;

    const finalPrice = calculateDiscountedPrice(
      originalPrice,
      discountValue,
      discountType
    );
    const totalPrice = finalPrice * quantity;
    const totalOriginal = originalPrice * quantity;

    return {
      original: originalPrice.toFixed(2),
      final: finalPrice.toFixed(2),
      total: totalPrice.toFixed(2),
      totalOriginal: totalOriginal.toFixed(2)
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
            <div className="lg:col-span-6 lg:col-start-7 flex flex-col pt-4">
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-[#362a1a] leading-tight mb-4 tracking-tight">
                {book.title.includes(':') ? (
                  <>
                    <span className="italic">{book.title.split(':')[0]}:</span>
                    <span>{book.title.split(':').slice(1).join(':')}</span>
                  </>
                ) : (
                  <span className="italic">{book.title}</span>
                )}
              </h1>

              <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
                <span>By <span className="text-gray-800">{book.author_name}</span></span>
                <span className="text-gray-400">•</span>
                <div className="flex text-[#EAB308]">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < Math.round(book.average_rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                      <path className="" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-bold text-gray-800">{book.average_rating}</span>
                <span className="text-gray-400">({book.total_reviews} Reviews)</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl font-bold text-[#1a362d]">${prices.total}</span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-gray-400 line-through">${prices.totalOriginal}</span>
                    <span className="bg-[#A98B76] text-white text-xs font-bold px-3 py-1 rounded-full">
                      Save {Math.round(((prices.original - prices.final) / prices.original) * 100)}%
                    </span>
                  </>
                )}
              </div>

              <div className="mb-6">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold ${currentStock > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  <CheckIcon className="w-4 h-4" />
                  {currentStock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">
                {book.description || "No description available."}
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-8">
                {/* Quantity */}
                <div className="flex items-center border border-gray-300 rounded-full h-12 w-32 shrink-0 overflow-hidden">
                  <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50"><MinusIcon className="w-4 h-4" /></button>
                  <div className="flex-1 text-center font-bold text-gray-900">{quantity}</div>
                  <button onClick={() => handleQuantityChange(1)} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50"><PlusIcon className="w-4 h-4" /></button>
                </div>

                {/* Add To Cart */}
                <button onClick={handleAddToCart} disabled={currentStock <= 0} className="bg-[#8d705b] hover:bg-[#7b583d] text-white font-bold rounded-full px-8 h-12 transition-colors flex items-center justify-center min-w-[140px] shadow-sm hover:shadow">
                  Add to Cart
                </button>

                {/* Buy Now */}
                <button onClick={handleBuyNow} disabled={currentStock <= 0} className="border-2 border-[#E5DFD5] bg-[#FDFBF7] hover:bg-[#E5DFD5] text-[#8d705b] font-bold rounded-full px-8 h-12 transition-colors flex items-center justify-center min-w-[140px]">
                  Buy Now
                </button>

                {/* Wishlist */}
                <button onClick={handleWishlistToggle} className="text-red-500 hover:text-red-600 p-2 ml-2 transition-transform hover:scale-110">
                  {isWishlisted(book.id) ? <HeartSolidIcon className="w-8 h-8" /> : <HeartSolidIcon className="w-8 h-8 text-red-500 opacity-90" />}
                </button>

                {/* Contact Author/Admin */}
                <button 
                  onClick={() => user ? router.push(`/profile/${user.id}/messages?contact=${book.author_id}`) : setShowLoginPrompt(true)} 
                  className="flex items-center gap-2 text-[#8B5CF6] border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white font-bold rounded-full px-6 h-12 transition-colors ml-auto sm:ml-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                  </svg>
                  Message Author
                </button>
              </div>

              <button onClick={handleReadSample} className="flex items-center gap-2 text-[#1a362d] font-bold hover:text-gray-600 mb-10 w-fit">
                <DocumentTextIcon className="w-5 h-5" />
                Read Preview
              </button>

              <div className="grid grid-cols-4 gap-4 border-t border-gray-200 pt-8 pb-8">
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">Published</span>
                  <span className="text-sm font-bold text-gray-800">{book.created_at ? new Date(book.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">Pages Count</span>
                  <span className="text-sm font-bold text-gray-800">{book.page_count ? `${book.page_count} Pages` : "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">Publisher</span>
                  <span className="text-sm font-bold text-gray-800 break-words">{book.publisher || "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">Author Name</span>
                  <span className="text-sm font-bold text-gray-800 break-words">{book.author_name}</span>
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