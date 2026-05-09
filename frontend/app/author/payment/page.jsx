"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, XCircle, AlertCircle, RefreshCw, TestTube, Banknote } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { request } from "../../utils/request";

export default function AuthorPaymentPage() {
  const { user, token } = useAuthStore();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const [bakongFormData, setBakongFormData] = useState({
    bakong_account_id: '',
    bakong_merchant_name: '',
  });

  const [testAmount, setTestAmount] = useState('1.00');
  const [testCurrency, setTestCurrency] = useState('USD');

  useEffect(() => {
    fetchPaymentData();
  }, [token]);

  const fetchPaymentData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await request("/api/author/payment/info", "GET", null, {}, token);
      
      if (response && response.success) {
        setPaymentData(response.data);
        
        setBakongFormData({
          bakong_account_id: response.data.bakong_account_id || '',
          bakong_merchant_name: response.data.bakong_merchant_name || '',
        });
      }
    } catch (err) {
      console.error("Payment data fetch error:", err);
      setError("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const handleBakongInputChange = (e) => {
    const { name, value } = e.target;
    setBakongFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveBakong = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await request("/api/author/payment/bakong", "POST", bakongFormData, {}, token);
      
      if (response && response.success) {
        setPaymentData(prev => ({ ...prev, ...response.data }));
        setSuccess("Bakong information saved successfully!");
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      console.error("Save Bakong error:", err);
      setError(err.response?.data?.message || "Failed to save Bakong information");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyBakong = async () => {
    try {
      setVerifying(true);
      setError(null);
      setSuccess(null);
      
      const response = await request("/api/author/payment/verify-bakong", "POST", {}, {}, token);
      
      if (response && response.success) {
        setPaymentData(prev => ({
          ...prev,
          bakong_account_verified: response.data.bakong_account_verified,
          bakong_verified_at: response.data.bakong_verified_at,
        }));
        setSuccess("Bakong account verified successfully!");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response?.message || "Bakong verification failed");
      }
    } catch (err) {
      console.error("Verify Bakong error:", err);
      setError(err.response?.data?.message || "Failed to verify Bakong account");
    } finally {
      setVerifying(false);
    }
  };

  const handleTestQR = async () => {
    try {
      setTesting(true);
      setError(null);
      setTestResult(null);
      
      const response = await request("/api/author/payment/test-qr", "POST", {
        amount: parseFloat(testAmount),
        currency: testCurrency
      }, {}, token);
      
      if (response && response.success) {
        setTestResult(response.data);
        setSuccess("Test QR code generated successfully!");
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      console.error("Test QR error:", err);
      setError(err.response?.data?.message || "Failed to generate test QR code");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-background-dark">
        <div className="mx-auto max-w-4xl flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading Payment Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-background-dark text-black max-w-7xl mx-auto">
      <div className="mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Payment Settings
            </h2>
            <p className="text-gray-600">Configure your Bakong account to receive payments from book sales</p>
          </div>
          <button
            onClick={fetchPaymentData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Main Settings Form */}
        <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-800">
              <Banknote className="w-5 h-5" />
              Bakong Payment Setup
            </h3>
            <p className="text-sm text-blue-600">
              Receive instant payments directly to your Bakong account.
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              {/* Verification Status */}
              <div className={`p-4 rounded-lg border flex items-center gap-3 text-sm ${paymentData?.bakong_account_verified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                {paymentData?.bakong_account_verified ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <span className="font-bold block">Account Verified</span>
                      <span>Verified on {new Date(paymentData.bakong_verified_at).toLocaleDateString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <div>
                      <span className="font-bold block">Account Not Verified</span>
                      <span>Please verify your Bakong account to ensure you can receive payments.</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveBakong} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bakong Account ID *
                  </label>
                  <input
                    type="text"
                    name="bakong_account_id"
                    value={bakongFormData.bakong_account_id}
                    onChange={handleBakongInputChange}
                    placeholder="username@bank"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Your Bakong account ID (e.g., john@aba)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant Name *
                  </label>
                  <input
                    type="text"
                    name="bakong_merchant_name"
                    value={bakongFormData.bakong_merchant_name}
                    onChange={handleBakongInputChange}
                    placeholder="Your business name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    required
                  />
                </div>

              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>

                {bakongFormData.bakong_account_id && (
                  <button
                    type="button"
                    onClick={handleVerifyBakong}
                    disabled={verifying || paymentData?.bakong_account_verified}
                    className={`px-6 py-2.5 font-medium rounded-lg flex items-center gap-2 transition-colors ${
                      paymentData?.bakong_account_verified 
                        ? 'bg-green-100 text-green-700 cursor-default' 
                        : 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {verifying ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {paymentData?.bakong_account_verified ? 'Verified' : 'Verify Account'}
                  </button>
                )}
              </div>
            </form>

            {/* Test QR Generation for Bakong */}
            {paymentData?.bakong_account_verified && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                  <TestTube className="w-5 h-5 text-purple-500" />
                  Test Payment QR Setup
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={testCurrency}
                      onChange={(e) => setTestCurrency(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="KHR">KHR</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleTestQR}
                      disabled={testing}
                      className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {testing ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <TestTube className="w-5 h-5" />
                      )}
                      {testing ? 'Generating...' : 'Generate Test QR'}
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mt-4">
                    <h5 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Test QR Generated Successfully!
                    </h5>
                    <div className="text-sm text-purple-700 space-y-2">
                      <p><strong>Amount:</strong> {testResult.amount} {testResult.currency}</p>
                      <p><strong>QR Data Payload:</strong> <code className="bg-purple-100 px-2 py-1 rounded text-xs break-all">{testResult.qr_string}</code></p>
                      <p className="mt-3 font-medium text-purple-900 border-t border-purple-200 pt-3">
                        🎉 Great! Your Bakong account is correctly configured to receive payments.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="rounded-2xl bg-blue-50 p-6 shadow-sm border border-blue-100">
          <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            How Bakong Payments Work
          </h3>
          <div className="space-y-3 text-sm text-blue-700">
            <p className="flex gap-2">
              <span className="font-bold bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">1</span>
              <span>Fill out your Bakong account details above and click <strong>Save Settings</strong>.</span>
            </p>
            <p className="flex gap-2">
              <span className="font-bold bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">2</span>
              <span>Click <strong>Verify Account</strong> to confirm your details with the Bakong system.</span>
            </p>
            <p className="flex gap-2">
              <span className="font-bold bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">3</span>
              <span>Once verified, customers can pay for your books instantly via dynamic Bakong QR codes generated for each order.</span>
            </p>
            <p className="flex gap-2">
              <span className="font-bold bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">4</span>
              <span>Funds arrive instantly in your Bakong account when a customer makes a successful purchase.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}