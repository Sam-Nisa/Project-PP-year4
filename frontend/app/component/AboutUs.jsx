// pages/about.js
import Head from 'next/head';
import Image from 'next/image'; // For optimized images

const AboutUs = () => {
  return (
    <>
      <Head>
        <title>About Us - Your Online Bookstore</title>
        <meta name="description" content="Learn about Your Online Bookstore, our mission, and our passion for books." />
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-800">
        {/* Hero Section */}
        <section className="relative h-64 md:h-96 flex items-center justify-center text-center bg-gradient-to-r from-blue-600 to-purple-600">
          {/* Background image overlay - you can use a book-themed image */}
          <Image
            src="/about1.png" // Replace with your image
            alt="Books on shelves"
            layout="fill"
            objectFit="cover"
            className="opacity-40"
          />
          <div className="relative z-10 p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
              Our Story, Our Passion
            </h1>
            <p className="mt-2 text-lg md:text-xl text-blue-100 font-medium">
              Connecting Readers with Timeless Tales
            </p>
          </div>
        </section>

        {/* Main Content Sections */}
        <main className="container mx-auto px-4 py-12 md:py-16 max-w-7xl">

          {/* Our Story */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-700 mb-6">
              More Than Just Books: Our Journey
            </h2>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-8 mb-6 md:mb-0">
                <p className="text-lg leading-relaxed mb-4">
                  Born from a lifelong love affair with literature and the quiet magic of turning a new page, <strong className="text-blue-600">[Your Bookstore Name]</strong> began as a dream to create a cozy corner in the vast digital world where book lovers could discover their next great read. We believe every book holds a universe, and our journey started with the simple desire to help you explore them all.
                </p>
                <p className="text-lg leading-relaxed">
                  From countless hours spent poring over literary classics to discovering hidden gems from independent authors, our passion for stories fuels everything we do. We're more than just an online shop; we're a community built by and for bibliophiles.
                </p>
              </div>
              <div className="md:w-1/2">
                {/* Placeholder for an image related to your story */}
                <Image
                  src="/about2.png" // Replace with a relevant image
                  alt="Person reading a book"
                  width={500}
                  height={350}
                  layout="responsive"
                  className="rounded-lg shadow-md"
                />
              </div>
            </div>
          </section>

          {/* Our Mission */}
          <section className="mb-12 md:mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-700 mb-6">
              Our Promise to You: Connecting Readers with Stories
            </h2>
            <p className="text-xl leading-relaxed text-gray-700 mb-8">
              Our mission is simple: to curate a diverse collection of books that inspire, educate, and entertain. We believe in the power of stories to transport, transform, and connect us, and we're dedicated to making your journey to find them seamless and joyful.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold text-blue-600 mb-3">Discover</h3>
                <p className="text-gray-700">Explore new authors, hidden gems, and beloved classics.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold text-blue-600 mb-3">Connect</h3>
                <p className="text-gray-700">Join a community passionate about reading and sharing ideas.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold text-blue-600 mb-3">Inspire</h3>
                <p className="text-gray-700">Find books that ignite your imagination and broaden your horizons.</p>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-700 mb-6">
              What Drives Us: The [Your Bookstore Name] Difference
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="text-5xl text-blue-500 mb-4">📚</div> {/* Icon */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Passion for Literature</h3>
                <p className="text-gray-700">We live and breathe books, constantly seeking out the best stories.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="text-5xl text-purple-500 mb-4">🤝</div> {/* Icon */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Focused</h3>
                <p className="text-gray-700">Building a welcoming space for readers to connect and share.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="text-5xl text-green-500 mb-4">📦</div> {/* Icon */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality & Care</h3>
                <p className="text-gray-700">Every book, every order, handled with love and attention.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="text-5xl text-indigo-500 mb-4">🌳</div> {/* Icon */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sustainable Practices</h3>
                <p className="text-gray-700">Mindful of our planet, striving for eco-friendly operations.</p>
              </div>
            </div>
          </section>

          {/* Meet the Team (Example with one person) */}
          <section className="mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-700 mb-6">
              Meet the Face Behind the Pages
            </h2>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg flex flex-col md:flex-row items-center text-center md:text-left">
              <div className="mb-6 md:mb-0 md:mr-8 flex-shrink-0">
                <Image
                  src="/about3.png" // Replace with your photo
                  alt="[Your Name]"
                  width={180}
                  height={180}
                  className="rounded-full object-cover mx-auto md:mx-0 shadow-md border-4 border-blue-200"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">[Your Name] - Founder</h3>
                <p className="text-lg leading-relaxed text-gray-700">
                  Hi, I'm [Your Name], the founder of <strong className="text-blue-600">[Your Bookstore Name]</strong>. My earliest memories involve getting lost in a good book, and that feeling is what I hope to share with you every day. When I'm not curating new titles, you can find me exploring hiking trails or sipping coffee at a local bookstore. My favorite genres include [Genre 1] and [Genre 2].
                </p>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center bg-blue-100 p-8 rounded-lg shadow-inner">
            <h2 className="text-3xl font-bold text-blue-700 mb-4">
              Ready for Your Next Literary Adventure?
            </h2>
            <p className="text-xl text-gray-700 mb-6">
              Dive into our carefully curated collections and discover stories that will captivate your heart and mind.
            </p>
            <a
              href="/books" // Link to your main books page
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
              Explore Our Books
            </a>
          </section>

        </main>
      </div>
    </>
  );
};

export default AboutUs;