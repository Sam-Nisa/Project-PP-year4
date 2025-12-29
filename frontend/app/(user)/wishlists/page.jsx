// WishlistPageContent.jsx

"use client";

import Link from "next/link";
import BookCard from "../../component/BookCard";
import { useWishlistStore } from "../../store/useWishlistStore";
import { Search } from "lucide-react";
import { useEffect } from "react";

export function WishlistPageContent() {
  const { wishlists, fetchWishlists } = useWishlistStore();

  useEffect(() => {
    // Fetch wishlists when the component mounts
    // This is crucial to populate the list when the user navigates here
    fetchWishlists();
  }, []);

  // 'wishlists' is now guaranteed to hold book objects
  const books = Array.isArray(wishlists) ? wishlists : [];

  return (
    // Adjusted container padding for better responsiveness
    <div className="layout-content-container flex flex-col w-full max-w-[1200px] mx-auto p-4 flex-1">
      {/* Header (Adjusted padding) */}
      <div className="flex flex-wrap justify-between items-center gap-3 px-4 sm:px-8 py-6">
        <h1 className="text-black text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
          My Wishlist Items
        </h1>
      </div>

      {/* Search Bar (Adjusted padding) */}
      <div className="px-4 sm:px-8 py-3">
        <label className="flex flex-col min-w-40 h-12 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div className="dark:text-gray-400 flex border-none bg-gray-100 dark:bg-background-dark/50 items-center justify-center pl-4 rounded-l-lg border-r-0">
              <Search className="w-5 h-5" />
            </div>
            <input
              className="form-input flex bg-gray-100 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black 
                focus:outline-none focus:ring-0 border-none dark:bg-background-dark/50 h-full dark:placeholder:text-gray-400 px-4 
                rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
              placeholder="Search books in my wishlist..."
            />
          </div>
        </label>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 sm:px-8">
        {books.length > 0 ? (
          books.map((book) => <BookCard key={book.id} book={book} />)
        ) : (
          // Empty state must span all grid columns
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-500">
              Your wishlist is currently empty. Start browsing to save books!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PageWrapper(props) {
  return (
    <div>
      <WishlistPageContent {...props} />
    </div>
  );
}
