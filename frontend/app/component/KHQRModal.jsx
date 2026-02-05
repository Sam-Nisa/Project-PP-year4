"use client";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { QRCodeSVG } from "qrcode.react";

const KHQRModal = ({
  showModal,
  onClose,
  qrData,
  timeLeft,
  formatTime,
  paymentStatus,
  paymentError,
  onRetry,
  isGeneratingQR
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 py-4 px-24 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-[480px] w-full overflow-hidden relative">
        
        {/* Close Button - Increased z-index to stay above tail */}
        {paymentStatus !== "completed" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}

        {paymentStatus === "completed" ? (
          /* ... Success State code ... */
          <div className="p-8 text-center">
             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">Payment Successful</h3>
            <p className="text-gray-500 mb-6">Order #{qrData?.bill_number}</p>
          </div>
        ) : qrData ? (
          <div className="flex flex-col">

            {/* --- IMPROVED RED HEADER --- */}
            <div className="relative bg-[#E52128] h-[100px] flex items-center justify-center">
              {/* KHQR Logo Container */}
              <div className="relative w-28 h-8">
                <Image
                  src="/bakong/khqr-header.png" 
                  alt="KHQR Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* The "Tail" Triangle at bottom right */}
              {/* This creates a red triangle that points down-right exactly like the image */}
              <div 
                className="absolute bottom-0 right-0 transform translate-y-full w-0 h-0 
                border-t-[25px] border-t-[#E52128] 
                border-l-[25px] border-l-transparent"
              ></div>
            </div>

            {/* Account Info - Adjusted top margin to account for the tail height */}
            <div className="px-8 pt-12 pb-2 flex justify-between items-start">
              <div className="flex-1">
                <p className="text-gray-400 text-[12px] font-bold uppercase tracking-wider mb-1">
                  {qrData.merchant_name || 'MERCHANT NAME'}
                </p>
                <p className="text-gray-900 text-[18px] font-bold mb-5 tracking-tight">
                  {qrData.author_account || '000 000 000'}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 leading-none">
                  ${Number(qrData.amount).toLocaleString(undefined, { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 2 
                  })}
                </h1>
              </div>
              
              {/* Timer on the right */}
              <div className="text-right pt-1 ml-4">
                <p className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">Expires In</p>
                <p className={`text-sm font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            {/* Dashed Perforation Line */}
            <div className="px-4 py-8">
              <div className="border-t-2 border-dashed border-gray-100 w-full"></div>
            </div>

            {/* QR Code Section */}
            <div className="px-8 pb-12 flex flex-col items-center">
              <div className="relative p-1 bg-white">
                <QRCodeSVG
                  value={qrData.qr_string}
                  size={260}
                  level="M"
                  includeMargin={false}
                />

                {/* Center Logo Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-white rounded-full shadow-md border border-gray-50">
                    <div className="bg-[#E52128] rounded-full w-12 h-12 flex items-center justify-center overflow-hidden border-2 border-white">
                      <Image
                        src="/bakong/khqr-center.png"
                        alt="Bakong Logo"
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-300 mt-10 uppercase tracking-[0.2em] font-bold">
                Scan with any mobile banking app
              </p>
            </div>
          </div>
        ) : (
          /* Loading State */
          <div className="p-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium tracking-wide">GENERATING QR...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KHQRModal;