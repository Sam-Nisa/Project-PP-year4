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

const SkeletonCard = () => (
  <div className="w-full h-28 bg-gray-200 rounded-xl animate-pulse"></div>
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
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
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
    <section className="py-10 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24">
        {/* Navigation Buttons */}
        {genres.length > VISIBLE_COUNT && (
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={handlePrev}
              disabled={startIndex === 0}
              className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 disabled:opacity-30 transition"
            >
              <FaChevronLeft className="text-gray-500 text-sm" />
            </button>
            <button
              onClick={handleNext}
              disabled={startIndex + VISIBLE_COUNT >= genres.length}
              className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 disabled:opacity-30 transition"
            >
              <FaChevronRight className="text-gray-500 text-sm" />
            </button>
          </div>
        )}

        {/* 6 Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {visibleGenres.map((genre) => {
            const imageUrl = genre.image
              ? `${API_URL}/storage/${genre.image}`
              : FALLBACK_IMAGE_URL;

            return (
              <Link
                key={genre.id}
                href={`/genres/${slugify(genre.name)}`}
                className="group flex flex-col items-center justify-center bg-[#E9EFF6] rounded-xl p-4 hover:shadow hover:-translate-y-0.5 transition"
              >
                <div className="relative w-10 h-8 mb-2">
                  <Image
                    src={imageUrl}
                    alt={genre.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 text-center line-clamp-1">
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
