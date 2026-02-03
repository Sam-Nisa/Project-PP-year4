"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BookCard from "../../component/BookCard";
import LoadingSpinner from "../../component/LoadingSpinner";
import axios from "../../utils/axios";
import { 
  TrophyIcon, 
  FireIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

const BestSellerPage = () => {
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [genres, setGenres] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchGenres();
    fetchBestSellers();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchBestSellers();
  }, [searchTerm, selectedGenre, currentPage]);

  const fetchGenres = async () => {
    try {
      const response = await axios.get("/api/genres");
      setGenres(response.data || []);
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("/api/books/best-sellers/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching best sellers stats:", error);
    }
  };

  const fetchBestSellers = async () => {
    try {
      setLoading(true);
      
      const params = {
        paginate: 'true',
        page: currentPage,
        per_page: 12
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (selectedGenre) {
        params.genre = selectedGenre;
      }

      const response = await axios.get("/api/books/best-sellers", { params });
      
      if (response.data.success) {
        const booksData = response.data.data;
        setBooks(booksData.data || []);
        setTotalPages(booksData.last_page || 1);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error("Error fetching best sellers:", error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBestSellers();
  };

  const handleGenreChange = (genreSlug) => {
    setSelectedGenre(genreSlug);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGenre("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium border ${
            i === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50"
        >
          Next
        </button>
      );
    }

    return (
      <div className="flex justify-center mt-8">
        <nav className="flex">{pages}</nav>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r  from-blue-700 via-purple-800 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <TrophyIcon className="h-16 w-16 text-yellow-200" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Best Sellers
            </h1>
            <p className="text-xl md:text-2xl mb-6 opacity-90">
              Discover the most popular books with 3+ sales
            </p>
            
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search best sellers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center space-x-4">
              <select
                value={selectedGenre}
                onChange={(e) => handleGenreChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.slug}>
                    {genre.name}
                  </option>
                ))}
              </select>

              {(searchTerm || selectedGenre) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-4">
                <select
                  value={selectedGenre}
                  onChange={(e) => handleGenreChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.slug}>
                      {genre.name}
                    </option>
                  ))}
                </select>

                {(searchTerm || selectedGenre) && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Books Grid */}
        {!loading && books.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map((book, index) => (
                <div key={book.id} className="relative">
                  <BookCard book={book} />
                  {/* Best Seller Badge */}
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    #{index + 1 + (currentPage - 1) * 12} Best Seller
                  </div>
                  {/* Sales Count */}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {book.total_sold} sold
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}

        {/* Empty State */}
        {!loading && books.length === 0 && (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Best Sellers Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedGenre
                ? "Try adjusting your search or filters"
                : "No books have reached best seller status yet (3+ sales required)"}
            </p>
            {(searchTerm || selectedGenre) && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters and show all best sellers
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BestSellerPage;