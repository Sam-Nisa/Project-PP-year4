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
      <div>
        <h2 className="text-2xl px-52 font-bold mb-4">New Arrival</h2>
        <BooksPage />
      </div>
      <GenresPage />
      <Footer />
    </div>
  );
}
