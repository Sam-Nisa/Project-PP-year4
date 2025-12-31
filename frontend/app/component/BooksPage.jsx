"use client";

import { useEffect } from "react";
import { useBookStore } from "../store/useBookStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/authStore";
import BookCard from "./BookCard";
import LoadingSpinner from "./LoadingSpinner"; // ✅ IMPORT

export default function BooksPage() {
  const { books, loading, error, fetchBooks } = useBookStore();
  const { fetchWishlists } = useWishlistStore();
  const { token } = useAuthStore();

  useEffect(() => {
    fetchBooks();
    if (token) {
      fetchWishlists();
    }
  }, [token, fetchBooks, fetchWishlists]);

  // ✅ Fancy loading (full page)
  if (loading) {
    return <LoadingSpinner text="Loading books..." />;
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="py-10 text-center text-red-600 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="py-6 px-32">
      <div className="grid grid-cols-1 px-20 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
