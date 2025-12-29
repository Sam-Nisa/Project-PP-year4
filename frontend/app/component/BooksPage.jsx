"use client";

import { useEffect } from "react";
import { useBookStore } from "../store/useBookStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useAuthStore } from "../store/authStore";
import BookCard from "./BookCard";

export default function BooksPage() {
  const { books, loading, error, fetchBooks } = useBookStore();
  const { fetchWishlists } = useWishlistStore();
  const { token } = useAuthStore(); // check if user logged in

  useEffect(() => {
    fetchBooks();
    if (token) {
      fetchWishlists();
    }
  }, [token]);

  return (
    <div className="py-6 px-32">
 

      {loading && <p>Loading books...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map(book => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
