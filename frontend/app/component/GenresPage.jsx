"use client";
import { useEffect, useState } from "react";
import { useGenreStore } from "../store/useGenreStore";
import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2787&auto=format=fit=crop";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

const SkeletonCircle = () => (
  <div className="w-24 sm:w-28 aspect-square bg-gray-300 rounded-full animate-pulse mx-auto"></div>
);

export default function GenresList() {
  const { genres, fetchGenres, loading, error } = useGenreStore();
  const [startIndex, setStartIndex] = useState(0);
  const VISIBLE_COUNT = 6;

  useEffect(() => {
    if (genres.length === 0) fetchGenres();
  }, [fetchGenres, genres.length]);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - VISIBLE_COUNT, 0));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(prev + VISIBLE_COUNT, genres.length - VISIBLE_COUNT)
    );
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCircle key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-center p-12">
        <h3 className="text-xl font-bold text-red-800">Something Went Wrong</h3>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  const visibleGenres = genres.slice(startIndex, startIndex + VISIBLE_COUNT);

  return (
    <section className="py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4">
        {genres.length > VISIBLE_COUNT && (
          <div className="absolute top-0 right-0 flex gap-2 mt-2 z-10 mr-8">
            <button
              onClick={handlePrev}
              disabled={startIndex === 0}
              className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleNext}
              disabled={startIndex + VISIBLE_COUNT >= genres.length}
              className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {visibleGenres.map((genre) => {
            const imageUrl = genre.image
              ? `${API_URL}/storage/${genre.image}`
              : FALLBACK_IMAGE_URL;
            const href = `/genres/${slugify(genre.name)}`;

            return (
              <Link
                key={genre.id}
                href={href}
                className="flex flex-col items-center p-4 rounded-lg transition-all hover:scale-110 duration-300"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28  overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <Image 
                    src={imageUrl} 
                    alt={genre.name} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <h3 className="mt-3 text-sm sm:text-base font-medium text-gray-700 text-center">
                  {genre.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}