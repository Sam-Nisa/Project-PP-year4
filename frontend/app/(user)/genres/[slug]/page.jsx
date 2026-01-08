"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBookStore } from "../../../store/useBookStore";
import BookCard from "../../../component/BookCard";
import { ArrowLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../component/LoadingSpinner";

/* =======================
   Breadcrumb Component
======================= */
const Breadcrumb = ({ genre }) => (
  
  <div className="flex flex-wrap items-center gap-2 mb-10 px-4">
    <Link
      href="/"
      className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Home
    </Link>

    <ChevronRightIcon className="w-4 h-4 text-gray-400" />

    <span className="font-semibold text-gray-900 capitalize">
      {genre.replace(/-/g, " ")}
    </span>
  </div>
);

/* =======================
   Page Component
======================= */
export default function GenrePage({ params }) {
  const { slug } = params;
  const { fetchBooksByGenre } = useBookStore();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const data = await fetchBooksByGenre(slug);
        setBooks(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch books for this genre.");
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [slug]);

  if (loading) return <LoadingSpinner text="Loading books..." />;

  if (error) return <p className="text-center py-12 text-red-500">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto my-10 px-4">
      {/* Breadcrumb */}
      <Breadcrumb genre={slug} />

      {/* Books Grid */}
      {books.length ? (
        <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </main>
      ) : (
        <p className="text-center py-12">No books found in this genre.</p>
      )}
    </div>
  );
}
