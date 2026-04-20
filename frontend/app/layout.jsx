
"use client";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import { useLanguageStore } from "./store/useLanguageStore";

export default function RootLayout({ children }) {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (language === 'km') {
        document.body.classList.remove('font-en');
        document.body.classList.add('font-km');
      } else {
        document.body.classList.remove('font-km');
        document.body.classList.add('font-en');
      }
    }
  }, [language, mounted]);

  return (
    <html lang={mounted ? language : 'en'}>
      <body className="font-en transition-colors duration-300">
        <main>{children}</main>
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          limit={3}
        />
      </body>
    </html>
  );
}