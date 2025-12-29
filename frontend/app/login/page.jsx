"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const { login, user, loading, error: storeError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) router.push("/");
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
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-10">
      <div className="flex w-full max-w-6xl bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Left Section */}
        <div className="w-1/2 bg-gradient-to-br from-blue-600 to-pink-800 flex flex-col justify-start items-center p-10 text-white relative">
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
        <div className="w-1/2 flex flex-col justify-center items-center p-10 bg-white">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
              Welcome Back to <br /> BookHub Community
            </h1>

            {(error || storeError) && (
              <p className="text-red-500 mb-4 text-center">{error || storeError}</p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <input
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-purple-500 text-lg"
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
                  className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-purple-500 text-lg pr-10"
                  required
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>

              <div className="flex items-center justify-between mb-8">
                <label className="flex items-center text-gray-600">
                  <input type="checkbox" className="form-checkbox text-yellow-600 mr-2 rounded" defaultChecked />
                  Remember me
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </div>
            </form>

           <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => {
                  window.location.href = "http://localhost:8000/auth/google/redirect";
                }}
                className="flex items-center border border-gray-300 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <img src="/login/google.png" alt="Google" className="w-9 h-9 mr-2" />
                Login with Google
              </button>

              <button className="flex items-center border border-gray-300 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                <img src="/login/facebook.png" alt="GitHub" className="w-8 h-8 mr-2" />
                login with facebook
              </button>
            </div>

            <p className="text-center text-gray-600">
              No account yet?{" "}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                SIGN UP
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
