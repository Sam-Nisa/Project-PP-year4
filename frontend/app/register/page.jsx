"use client";
import React, { useState } from "react";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore"; // ✅ make sure path is correct

const Register = () => {
  const router = useRouter();
  const { register, loading, error } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update input fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password);
      alert("Registration successful!");
      router.push("/login"); // redirect after successful register
    } catch (err) {
      alert(err.message || "Registration failed!");
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
            Join the Online Community <br /> For Readers
          </h2>
        </div>

        {/* Right Section */}
        <div className="w-1/2 flex flex-col justify-center items-center p-10 bg-white">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
              Create Your Account
            </h1>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div className="mb-4">
                <input
                  type="text"
                  id="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-purple-500 text-lg"
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <input
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-purple-500 text-lg"
                  required
                />
              </div>

              {/* Password */}
              <div className="mb-4 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-purple-500 text-lg pr-10"
                  required
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>

              {/* Confirm Password */}
              <div className="mb-6 relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-b border-gray-300 focus:outline-none focus:border-purple-500 text-lg pr-10"
                  required
                />
                <span
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </span>
              </div>

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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors mb-6"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>

              {/* Error */}
              {error && (
                <p className="text-red-600 text-center mb-4">{error}</p>
              )}
            </form>

            {/* Login link */}
            <p className="text-center text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 font-semibold hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
