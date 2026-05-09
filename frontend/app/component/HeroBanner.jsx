"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '../store/authStore';

const HeroBanner = () => {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const becomeAuthorLink = user ? `/profile/${user.id}/become-author` : `/login`;

  return (
    <section className="relative bg-[#FEFDDF] shadow-xl mb-12 overflow-hidden border border-transparent">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('/banner.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:px-12 md:py-20 lg:py-24 flex flex-col md:flex-row items-center justify-between gap-10">

        {/* Content Side */}
        <div className="w-full md:w-1/2 flex flex-col text-center md:text-left items-center md:items-start animate-fade-in-up z-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4 text-gray-800 drop-shadow-sm">
            Unlock New Worlds, <br className="hidden sm:block" /> One Page at a Time
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-8 max-w-lg drop-shadow-sm">
            Discover a curated collection of bestsellers, hidden gems, and timeless classics.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center bg-[#A98B76] text-white font-semibold py-3 px-6 md:py-4 md:px-8 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 w-full sm:w-auto text-sm md:text-base group"
            >
              Explore Our Collection
              <svg
                className="ml-2 h-4 w-4 md:h-5 md:w-5 transform group-hover:translate-x-2 transition-transform duration-300 ease-in-out"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>

            {mounted && (!user || user.role === 'user') && (
              <Link
                href={becomeAuthorLink}
                className="inline-flex items-center justify-center bg-[#E9C49D] text-gray-800 font-semibold py-3 px-6 md:py-4 md:px-8 rounded-full shadow-lg hover:scale-105 transition-transform duration-300 w-full sm:w-auto text-sm md:text-base group"
              >
                Become an Author
                <svg
                  className="ml-2 h-4 w-4 md:h-5 md:w-5 transform group-hover:translate-x-2 transition-transform duration-300 ease-in-out"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Image Side */}
        <div className="w-full md:w-1/2 flex justify-center items-center animate-fade-in-right z-10">
          <div className="relative w-full max-w-[250px] sm:max-w-[350px] lg:max-w-[450px]">
            <Image
              src="/img_banner.png"
              alt="Stack of vibrant books"
              width={450}
              height={350}
              priority // High priority for hero image
              className="drop-shadow-2xl w-full h-auto"
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;