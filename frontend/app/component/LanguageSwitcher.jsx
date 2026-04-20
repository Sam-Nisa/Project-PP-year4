"use client";

import { useLanguageStore } from "../store/useLanguageStore";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// Inline Circular Flag SVGs
const USFlag = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 rounded-full object-cover shadow-sm bg-white border border-gray-100">
    <rect width="512" height="512" fill="#f0f0f0"/>
    <g fill="#d80027">
      <rect y="46" width="512" height="37"/>
      <rect y="129" width="512" height="37"/>
      <rect y="213" width="512" height="37"/>
      <rect y="297" width="512" height="37"/>
      <rect y="381" width="512" height="37"/>
      <rect y="465" width="512" height="37"/>
    </g>
    <rect width="256" height="256" fill="#0052b4"/>
    <g fill="#fff">
      <circle cx="42" cy="42" r="10"/><circle cx="92" cy="42" r="10"/><circle cx="142" cy="42" r="10"/><circle cx="192" cy="42" r="10"/><circle cx="242" cy="42" r="10"/>
      <circle cx="67" cy="85" r="10"/><circle cx="117" cy="85" r="10"/><circle cx="167" cy="85" r="10"/><circle cx="217" cy="85" r="10"/>
      <circle cx="42" cy="128" r="10"/><circle cx="92" cy="128" r="10"/><circle cx="142" cy="128" r="10"/><circle cx="192" cy="128" r="10"/><circle cx="242" cy="128" r="10"/>
      <circle cx="67" cy="170" r="10"/><circle cx="117" cy="170" r="10"/><circle cx="167" cy="170" r="10"/><circle cx="217" cy="170" r="10"/>
      <circle cx="42" cy="213" r="10"/><circle cx="92" cy="213" r="10"/><circle cx="142" cy="213" r="10"/><circle cx="192" cy="213" r="10"/><circle cx="242" cy="213" r="10"/>
    </g>
  </svg>
);

const KMFlag = () => (
  <svg viewBox="0 0 512 512" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 rounded-full object-cover shadow-sm bg-white border border-gray-100">
    <rect width="512" height="512" fill="#0052b4"/>
    <rect y="128" width="512" height="256" fill="#d80027"/>
    <g fill="#fff">
      <rect x="236" y="220" width="40" height="90"/>
      <path d="M236 220 L256 160 L276 220 Z"/>
      <rect x="176" y="240" width="30" height="70"/>
      <path d="M176 240 L191 200 L206 240 Z"/>
      <rect x="306" y="240" width="30" height="70"/>
      <path d="M306 240 L321 200 L336 240 Z"/>
      <rect x="160" y="310" width="192" height="15"/>
    </g>
  </svg>
);

const LANGUAGES = [
  { code: "en", label: "EN", icon: <USFlag /> },
  { code: "km", label: "KH", icon: <KMFlag /> },
];

export default function LanguageSwitcher({ variant = "light" }) {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isLight = variant === "light";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative inline-block text-left mx-1 sm:mx-2" ref={dropdownRef}>
      {/* Primary Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
          isLight 
            ? "bg-white border-gray-200 text-[#1A1A3A] hover:bg-gray-50" 
            : "bg-white text-[#1A1A3A] border-white focus:bg-gray-50 shadow-md"
        }`}
      >
        {currentLang.icon}
        <span className="hidden sm:block text-sm sm:text-base font-semibold tracking-wide">
          {currentLang.label}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"} ${isLight ? "text-gray-500" : "text-[#1A1A3A]"}`} />
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 overflow-hidden transform transition-all duration-200 origin-top-right ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="py-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`flex items-center w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 group ${
                language === lang.code ? "bg-gray-50/80" : ""
              }`}
            >
              {lang.icon}
              <span className={`text-base font-medium transition-colors ${
                language === lang.code ? "text-[#1A1A3A]" : "text-gray-600 group-hover:text-[#1A1A3A]"
              }`}>
                {lang.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
