"use client";
// components/Footer.js
import Link from "next/link";
import {
  Home,
  Info,
  Mail,
  Facebook,
  Twitter,
  Instagram,  
} from "lucide-react";
import { useLanguageStore } from "../store/useLanguageStore";
import { translations } from "../utils/translations";

const Footer = () => {
  const { language } = useLanguageStore();
  const t = translations[language];
  return (
    <footer className="bg-[#A47251] text-white py-10 px-6 sm:px-12 md:px-20 lg:px-32">
      <div className="max-w-8xl mx-auto lg:px-28">
        <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-20">
          {/* Book Haven Section */}
          <div className="text-center md:text-left md:flex-1">
            <h3 className="text-2xl font-semibold">Book Haven</h3>
            <img
              src="/logo.png"
              alt="Book Haven Logo"
              className="mx-auto md:mx-0 mt-3 w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-full border-2 border-white shadow-md"
            />
            <p className="mt-3 text-sm sm:text-base text-gray-100">
              {t.YourOneStopShopForAllBookLovers}
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="md:flex-1 text-center md:text-left">
            <h4 className="text-lg font-semibold mb-3">{t.QuickLinks}</h4>
            <ul className="space-y-2 text-gray-100">
              <li>
                <Link
                  href="/"
                  className="flex justify-center md:justify-start items-center gap-2 hover:text-yellow-300 transition"
                >
                  <Home size={18} />
                  {t.Home}
                </Link>
              </li>

              <li>
                <Link
                  href="/about-us"
                  className="flex justify-center md:justify-start items-center gap-2 hover:text-yellow-300 transition"
                >
                  <Info size={18} />
                  {t.AboutUs}
                </Link>
              </li>

              <li>
                <Link
                  href="/contact-us"
                  className="flex justify-center md:justify-start items-center gap-2 hover:text-yellow-300 transition"
                >
                  <Mail size={18} />
                  {t.ContactUs}
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us Section */}
          <div className="md:flex-1 text-center md:text-left">
            <h4 className="text-lg font-semibold mb-3">{t.FollowUs}</h4>
            <ul className="space-y-2 text-gray-100">
              <li className="flex justify-center md:justify-start items-center gap-2 hover:text-yellow-300 transition">
                <Facebook size={18} />
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.Facebook}
                </a>
              </li>
              <li className="flex justify-center md:justify-start items-center gap-2 hover:text-yellow-300 transition">
                <Twitter size={18} />
                <a
                  href="https://www.twitter.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.Twitter}
                </a>
              </li>
              <li className="flex justify-center md:justify-start items-center gap-2 hover:text-yellow-300 transition">
                <Instagram size={18} />
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.Instagram}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 border-t border-yellow-700 pt-4 text-center text-sm text-gray-200">
          <p>&copy; {new Date().getFullYear()} {t.BookHaven || "Book Haven"}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
