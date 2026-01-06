import GenresPage from "./component/GenresPage";
import BooksPage from "./component/BooksPage";
import HeroBanner from "./component/HeroBanner";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";


export default function Home() {
  return (
    <div>
      
      <Navbar />
      <HeroBanner />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 mt-10">
        <h2 className="text-2xl font-bold ">Find Your Favourite books by Genres!</h2>
      </section>
        <GenresPage />
      {/* New Arrival Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 mt-10">
        <h2 className="text-2xl font-bold mb-4">New Arrival</h2>
        <BooksPage />
      </section>
      <Footer />
    </div>
  );
}
