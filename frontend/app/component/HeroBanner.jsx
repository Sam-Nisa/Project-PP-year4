// components/HeroBanner.jsx
import Link from 'next/link';
import Image from 'next/image';

const HeroBanner = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-700 via-purple-800 to-pink-600 shadow-xl p-8 md:p-16 mb-12  overflow-hidden flex flex-col md:flex-row items-center justify-between text-white border border-transparent">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('/img_banner.png')", // Ensure this exists in public/images
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>

      {/* Content */}
      <div className="relative px-16 z-10 md:w-1/2 mb-6 md:mb-0 text-center md:text-left animate-fade-in-up">
        <h2 className="text-4xl pl-20 lg:text-4xl font-extrabold leading-tight tracking-tight mb-4 drop-shadow-lg">
          Unlock New Worlds, <br /> One Page at a Time
        </h2>
        <p className="text-lg pl-20 lg:text-xl text-purple-100 mb-6 drop-shadow-md">
          Discover a curated collection of bestsellers, hidden gems, and timeless classics.
        </p>
        {/* Fixed Link: no <a> tag inside */}
        <Link
          href="/browse"
          className="inline-flex ml-20 items-center bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out text-lg group"
        >
          Explore Our Collection
          <svg
            className="ml-3 h-6 w-6 transform group-hover:translate-x-2 transition-transform duration-300 ease-in-out"
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
      </div>

      {/* Image Illustration */}
      <div className="relative z-10 lg:w-1/2 flex justify-center animate-fade-in-right">
        <Image
          src="/img_banner.png" // Make sure this image exists in public/images
          alt="Stack of vibrant books"
          width={450} // adjust size
          height={350}
          className="drop-shadow-2xl"
          style={{ objectFit: 'contain' }} // modern Next.js uses style instead of objectFit prop
        />
      </div>
    </section>
  );
};

export default HeroBanner;
