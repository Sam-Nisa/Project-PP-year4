"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSearchStore } from "../../store/useSearchStore";
import BookCard from "../../component/BookCard";
import LoadingSpinner from "../../component/LoadingSpinner";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { 
    searchResults, 
    loading, 
    error, 
    hasSearched, 
    searchBooks, 
    clearError 
  } = useSearchStore();

  useEffect(() => {
    if (query) {
      searchBooks(query);
    }
  }, [query, searchBooks]);

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
  }, [clearError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Searching for "{query}"...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Search Error</h2>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => searchBooks(query)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          {query && (
            <p className="text-gray-600">
              {hasSearched ? (
                <>
                  {searchResults.length > 0 ? (
                    <>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for <span className="font-semibold">"{query}"</span></>
                  ) : (
                    <>No results found for <span className="font-semibold">"{query}"</span></>
                  )}
                </>
              ) : (
                <>Searching for <span className="font-semibold">"{query}"</span>...</>
              )}
            </p>
          )}
        </div>

        {/* Search Results */}
        {hasSearched && searchResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No books found
              </h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any books matching your search. Try different keywords or browse our categories.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
                <a
                  href="/"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse All Books
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {searchResults.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}

        {/* Search Tips */}
        {hasSearched && searchResults.length === 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Search Tips
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Try different keywords or phrases</li>
              <li>• Check your spelling</li>
              <li>• Use more general terms</li>
              <li>• Search by author name or book title</li>
              <li>• Browse our genre categories</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}