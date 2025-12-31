import Link from "next/link";
import {
  Home,
  Info,
  Mail,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-blue-800 text-white py-10 md:px-20 lg:px-32">
      <div className="container mx-auto px-20">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Book Haven Section */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-semibold">Book Haven</h3>
            <img
              src="/logo.png" // Ensure your image is inside /public
              alt="Book Haven Logo"
              className="mx-auto md:mx-0 mt-3 w-28 h-28 object-cover rounded-full border-2 border-white shadow-md"
            />
            <p className="mt-3 text-sm text-gray-100">
              Your one-stop shop for all book lovers!
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Quick Links</h4>
           <ul className="space-y-2 text-gray-100">
            <li>
              <Link href="/" className="flex items-center gap-2 hover:text-yellow-300 transition">
                <Home size={18} />
                Home
              </Link>
            </li>

            <li>
              <Link href="/about-us" className="flex items-center gap-2 hover:text-yellow-300 transition">
                <Info size={18} />
                About Us
              </Link>
            </li>

            <li>
              <Link href="/contact" className="flex items-center gap-2 hover:text-yellow-300 transition">
                <Mail size={18} />
                Contact
              </Link>
            </li>
          </ul>

          </div>

          {/* Follow Us Section */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Follow Us</h4>
            <ul className="space-y-2 text-gray-100">
              <li className="flex items-center gap-2 hover:text-yellow-300 transition">
                <Facebook size={18} />
                <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              </li>
              <li className="flex items-center gap-2 hover:text-yellow-300 transition">
                <Twitter size={18} />
                <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">
                  Twitter
                </a>
              </li>
              <li className="flex items-center gap-2 hover:text-yellow-300 transition">
                <Instagram size={18} />
                <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 border-t border-yellow-700 pt-4 text-center text-sm text-gray-200">
          <p>&copy; {new Date().getFullYear()} Book Haven. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
