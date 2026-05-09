"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import Image from "next/image";


export default function Login() {
  const router = useRouter();
  const { login, user, loading, error: storeError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") router.push("/admin/dashboard");
      else if (user.role === "author") router.push("/author/dashboard");
      else router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // login returns the user and token
      const data = await login(email, password);
      const loggedInUser = data.user; // get user directly from response



      // role-based redirect
      if (loggedInUser?.role === "admin") {
        router.push("/admin/dashboard");
      } else if (loggedInUser?.role === "author") {
        router.push("/author/dashboard");
      } else {
        router.push("/"); // normal user
      }
    } catch (err) {
      setError(err?.message || storeError || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4 sm:p-8 md:p-10">
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Left Section */}
        <div className="hidden md:flex md:w-1/2 bg-[#A98B76] flex-col justify-start items-center p-10 text-white relative">
          <div className="absolute top-8 left-8 flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-yellow-400" />
            <span className="text-2xl font-bold">BookHaven</span>
          </div>

          <div className="w-full flex justify-center mt-12">
            <div className="w-80 h-80 relative rounded-full overflow-hidden">
              <Image
                src="/login.png"
                alt="Book illustration"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <h2 className="text-3xl font-semibold mt-8 text-center leading-snug">
            Online Community For <br /> Readers
          </h2>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-10 bg-white">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="md:hidden flex justify-center items-center space-x-2 mb-6">
              <BookOpen className="h-8 w-8 text-[#A98B76]" />
              <span className="text-2xl font-bold text-[#A98B76]">BookHaven</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center text-gray-800">
              Welcome Back to <br /> BookHaven Community
            </h1>

            {(error || storeError) && (
              <p className="text-red-500 mb-4 text-center">
                {error || storeError}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <input
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-[#A98B76] text-lg"
                  required
                />
              </div>

              <div className="mb-6 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-b border-gray-300 focus:outline-none focus:border-[#A98B76] text-lg"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center text-gray-600">
                  <input
                    type="checkbox"
                    className="form-checkbox text-[#A98B76] mr-2 rounded"
                    defaultChecked
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[#A98B76] hover:text-[#A98B76] font-semibold text-sm"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#A98B76] hover:bg-[#896d59] text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>

            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => {
                  window.location.href =
                    "http://localhost:8000/auth/google/redirect";
                }}
                className="flex items-center border border-gray-300 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <img
                  src="/login/google.png"
                  alt="Google"
                  className="w-9 h-9 mr-2"
                />
                Login with Google
              </button>
            </div>

            <p className="text-center text-gray-600">
              No account yet?{" "}
              <Link
                href="/register"
                className="text-[#A98B76] font-semibold hover:underline"
              >
                SIGN UP
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
