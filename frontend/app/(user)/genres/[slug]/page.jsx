"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBookStore } from "../../../store/useBookStore";
import BookCard from "../../../component/BookCard";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid"; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GenrePage({ params }) {
  const { slug } = params;
  const { fetchBooksByGenre } = useBookStore();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const data = await fetchBooksByGenre(slug);
        setBooks(data);
        setFilteredBooks(data); // initially all books
      } catch (err) {
        console.error(err);
        setError("Failed to fetch books for this genre.");
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [slug, fetchBooksByGenre]);

  // Search handler
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);

    const filtered = books.filter((book) =>
      book.title.toLowerCase().includes(query)
    );
    setFilteredBooks(filtered);
  };

  if (loading) return <p className="text-center py-12">Loading books...</p>;
  if (error) return <p className="text-center py-12 text-red-500">{error}</p>;
  if (!books.length) return <p className="text-center py-12">No books found in this genre.</p>;

  return (
    <div>

<div className="layout-content-container flex flex-col w-full max-w-[1200px] mx-auto p-4 flex-1">
  {/* Breadcrumb */}
  <nav className="text-gray-600  mb-4 text-lg sm:text-xl md:text-2xl">
    <Link href="/">
      <span className="hover:underline cursor-pointer text-blue-600">Home</span>
    </Link>{" "}
    /{" "}
    <span className="font-bold text-gray-800">{slug}</span>
  </nav>

  {/* Search Input */}
<div className="mb-6 relative w-full max-w-md">
  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
  <input
    type="text"
    value={search}
    onChange={handleSearch}
    placeholder="Search books..."
    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
</div>

      <main className="max-w-7xl mx-auto py-12 px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredBooks.length ? (
          filteredBooks.map((book) => <BookCard key={book.id} book={book} />)
        ) : (
          <p className="text-center col-span-full">No books found.</p>
        )}
      </main>
    </div>
  );
}
