"use client";

import { useEffect } from "react";
import { useBookStore } from "../store/useBookStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/authStore";
import BookCard from "./BookCard";
import LoadingSpinner from "./LoadingSpinner";

export default function BooksPage() {
  const { books, loading, error, fetchBooks } = useBookStore();
  const { fetchWishlists } = useWishlistStore();
  const { token } = useAuthStore();

  useEffect(() => {
    fetchBooks();
    if (token) fetchWishlists();
  }, []);

  if (loading) return <LoadingSpinner text="Loading books..." />;

  if (error) {
    return (
      <div className="py-10 text-center text-red-600 font-medium">{error}</div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
