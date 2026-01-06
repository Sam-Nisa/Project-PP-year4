"use client";

import { useEffect } from "react";
import { useBookStore } from "../../store/useBookStore";
import BookCard from "../../component/BookCard";
import LoadingSpinner from "../../component/LoadingSpinner";

export default function BestSellerPage() {
  const { books, loading, error, fetchBooks } = useBookStore();

  useEffect(() => {
    fetchBooks();
  }, []);

  if (loading) return <LoadingSpinner text="Loading best sellers..." />;

  if (error) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
  }

  // ✅ Filter best sellers
  const bestSellers = books.filter((book) => book.is_best_seller === true);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 py-10">
      <h1 className="text-2xl font-bold mb-6">Best Sellers</h1>

      {bestSellers.length === 0 ? (
        <p className="text-gray-500">No best sellers found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bestSellers.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}
