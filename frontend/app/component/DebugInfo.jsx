"use client";

import { useState, useEffect } from "react";
import { request } from "../utils/request";

export default function DebugInfo() {
  const [apiStatus, setApiStatus] = useState("checking...");
  const [backendUrl, setBackendUrl] = useState("");

  useEffect(() => {
    const checkAPI = async () => {
      const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      setBackendUrl(url);
      
      try {
        // Try a simple request to check if backend is running
        const response = await fetch(`${url}/api/genres`);
        if (response.ok) {
          setApiStatus("✅ Backend is running");
        } else {
          setApiStatus(`❌ Backend responded with status: ${response.status}`);
        }
      } catch (error) {
        setApiStatus(`❌ Cannot connect to backend: ${error.message}`);
      }
    };

    checkAPI();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h4 className="font-semibold text-sm mb-2">Debug Info</h4>
      <div className="text-xs space-y-1">
        <div><strong>Backend URL:</strong> {backendUrl}</div>
        <div><strong>Status:</strong> {apiStatus}</div>
      </div>
    </div>
  );
}