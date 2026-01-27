# Author Bakong Payment Frontend Integration Example

## React Component Example

Here's an example of how to create a frontend component for authors to manage their Bakong payment information:

```jsx
"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { request } from "../utils/request";

export default function AuthorBakongPaymentPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [bakongInfo, setBakongInfo] = useState({
    bakong_account_id: '',
    bakong_merchant_name: '',
    bakong_merchant_city: '',
    bakong_merchant_id: '',
    bakong_acquiring_bank: '',
    bakong_mobile_number: '',
    bakong_account_verified: false,
    bakong_verified_at: null
  });
  const [banks, setBanks] = useState([]);
  const [testResult, setTestResult] = useState(null);

  // Load existing Bakong info and banks list
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load existing Bakong info
        const infoResponse = await request("/api/author/bakong/info", "GET", null, {}, token);
        if (infoResponse.success) {
          setBakongInfo(infoResponse.data);
        }

        // Load banks list
        const banksResponse = await request("/api/author/bakong/banks", "GET", null, {}, token);
        if (banksResponse.success) {
          setBanks(banksResponse.data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    if (token) {
      loadData();
    }
  }, [token]);

  // 