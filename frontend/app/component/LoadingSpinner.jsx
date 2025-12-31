export default function LoadingSpinner({ text = "Loading your cart..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      
      {/* Spinner */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>

      {/* Text */}
      <p className="text-lg font-medium text-gray-700 animate-pulse">
        {text}
      </p>
    </div>
  );
}
