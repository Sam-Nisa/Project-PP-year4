"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, XCircle, AlertCircle, RefreshCw, TestTube, Building, Banknote } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { request } from "../../utils/request";

export default function AuthorPaymentPage() {
  const { user, token } = useAuthStore();
  const [paymentData, setPaymentData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [bakongBanks, setBakongBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState('bank'); // 'bank' or 'bakong'

  const [bankFormData, setBankFormData] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    bank_branch: '',
  });

  const [bakongFormData, setBakongFormData] = useState({
    bakong_account_id: '',
    bakong_merchant_name: '',
    bakong_merchant_city: '',
    bakong_merchant_id: '',
    bakong_acquiring_bank: '',
    bakong_mobile_number: '',
  });

  const [testAmount, setTestAmount] = useState('1.00');
  const [testCurrency, setTestCurrency] = useState('USD');

  useEffect(() => {
    fetchPaymentData();
    fetchBanks();
    fetchBakongBanks();
  }, [token]);

  const fetchPaymentData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await request("/api/author/payment/info", "GET", null, {}, token);
      
      if (response && response.success) {
        setPaymentData(response.data);
        
        // Set form data
        setBankFormData({
          bank_name: response.data.bank_name || '',
          bank_account_number: response.data.bank_account_number || '',
          bank_account_name: response.data.bank_account_name || '',
          bank_branch: response.data.bank_branch || '',
        });

        setBakongFormData({
          bakong_account_id: response.data.bakong_account_id || '',
          bakong_merchant_name: response.data.bakong_merchant_name || '',
          bakong_merchant_city: response.data.bakong_merchant_city || '',
          bakong_merchant_id: response.data.bakong_merchant_id || '',
          bakong_acquiring_bank: response.data.bakong_acquiring_bank || '',
          bakong_mobile_number: response.data.bakong_mobile_number || '',
        });

        // Set active tab based on payment method
        if (response.data.payment_method === 'bakong') {
          setActiveTab('bakong');
        }
      }
    } catch (err) {
      console.error("Payment data fetch error:", err);
      setError("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    if (!token) return;

    try {
      const response = await request("/api/author/payment/banks", "GET", null, {}, token);
      if (response && response.success) {
        setBanks(response.data);
      }
    } catch (err) {
      console.error("Banks fetch error:", err);
    }
  };

  const fetchBakongBanks = async () => {
    if (!token) return;

    try {
      const response = await request("/api/author/payment/bakong-banks", "GET", null, {}, token);
      if (response && response.success) {
        setBakongBanks(response.data);
      }
    } catch (err) {
      console.error("Bakong banks fetch error:", err);
    }
  };

  const handleBankInputChange = (e) => {
    const { name, value } = e.target;
    setBankFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBakongInputChange = (e) => {
    const { name, value } = e.target;
    setBakongFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate merchant_id from account_id
    if (name === 'bakong_account_id') {
      const merchantId = value.split('@')[0];
      setBakongFormData(prev => ({
        ...prev,
        bakong_merchant_id: merchantId
      }));
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await request("/api/author/payment/bank", "POST", bankFormData, {}, token);
      
      if (response && response.success) {
        setPaymentData(prev => ({ ...prev, ...response.data }));
        setSuccess("Bank information saved successfully!");
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      console.error("Save bank error:", err);
      setError(err.response?.data?.message || "Failed to save bank information");
    } finally {
      setSaving(false);
    }
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

  const handleVerifyBank = async () => {
    try {
      setVerifying(true);
      setError(null);
      setSuccess(null);
      
      const response = await request("/api/author/payment/verify-bank", "POST", {}, {}, token);
      
      if (response && response.success) {
        setPaymentData(prev => ({
          ...prev,
          payment_verified: response.data.payment_verified,
          payment_verified_at: response.data.payment_verified_at,
        }));
        setSuccess("Bank account verified successfully!");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response?.message || "Bank verification failed");
      }
    } catch (err) {
      console.error("Verify bank error:", err);
      setError(err.response?.data?.message || "Failed to verify bank account");
    } finally {
      setVerifying(false);
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
    <div className="flex-1 p-6 bg-background-dark text-black">
      <div className="mx-auto max-w-4xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Payment Settings
            </h2>
            <p className="text-gray-600">Configure how you want to receive payments from book sales</p>
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

        {/* Payment Method Tabs */}
        <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'bank'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="w-4 h-4" />
              Bank Account
            </button>
            <button
              onClick={() => setActiveTab('bakong')}
              className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'bakong'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Banknote className="w-4 h-4" />
              Bakong Payment
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'bank' ? (
              /* Bank Account Form */
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Bank Account Information</h3>
                  <p className="text-sm text-gray-600">
                    Set up your bank account to receive payments from book sales
                  </p>
                  
                  {/* Verification Status */}
                  <div className="mt-4 p-3 rounded-lg border flex items-center gap-2 text-sm">
                    {paymentData?.payment_verified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-700">
                          Bank account verified on {new Date(paymentData.payment_verified_at).toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-700">Bank account not verified</span>
                      </>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSaveBank} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name *
                      </label>
                      <select
                        name="bank_name"
                        value={bankFormData.bank_name}
                        onChange={handleBankInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select your bank</option>
                        {banks.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        name="bank_account_number"
                        value={bankFormData.bank_account_number}
                        onChange={handleBankInputChange}
                        placeholder="1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name *
                      </label>
                      <input
                        type="text"
                        name="bank_account_name"
                        value={bankFormData.bank_account_name}
                        onChange={handleBankInputChange}
                        placeholder="Your full name as on bank account"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch (Optional)
                      </label>
                      <input
                        type="text"
                        name="bank_branch"
                        value={bankFormData.bank_branch}
                        onChange={handleBankInputChange}
                        placeholder="Branch name or code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {saving ? 'Saving...' : 'Save Bank Information'}
                    </button>

                    {bankFormData.bank_account_number && (
                      <button
                        type="button"
                        onClick={handleVerifyBank}
                        disabled={verifying || paymentData?.payment_verified}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {verifying ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {paymentData?.payment_verified ? 'Verified' : 'Verify Account'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              /* Bakong Account Form */
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Bakong Payment Information</h3>
                  <p className="text-sm text-gray-600">
                    Set up your Bakong account to receive instant payments via QR codes
                  </p>
                  
                  {/* Verification Status */}
                  <div className="mt-4 p-3 rounded-lg border flex items-center gap-2 text-sm">
                    {paymentData?.bakong_account_verified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-700">
                          Bakong account verified on {new Date(paymentData.bakong_verified_at).toLocaleDateString()}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-700">Bakong account not verified</span>
                      </>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSaveBakong} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Merchant City *
                      </label>
                      <input
                        type="text"
                        name="bakong_merchant_city"
                        value={bakongFormData.bakong_merchant_city}
                        onChange={handleBakongInputChange}
                        placeholder="Phnom Penh"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Merchant ID
                      </label>
                      <input
                        type="text"
                        name="bakong_merchant_id"
                        value={bakongFormData.bakong_merchant_id}
                        onChange={handleBakongInputChange}
                        placeholder="Auto-generated from account ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-generated from your account ID</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Acquiring Bank *
                      </label>
                      <select
                        name="bakong_acquiring_bank"
                        value={bakongFormData.bakong_acquiring_bank}
                        onChange={handleBakongInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select your bank</option>
                        {bakongBanks.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        name="bakong_mobile_number"
                        value={bakongFormData.bakong_mobile_number}
                        onChange={handleBakongInputChange}
                        placeholder="+855 12 345 678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {saving ? 'Saving...' : 'Save Bakong Information'}
                    </button>

                    {bakongFormData.bakong_account_id && (
                      <button
                        type="button"
                        onClick={handleVerifyBakong}
                        disabled={verifying || paymentData?.bakong_account_verified}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {verifying ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {paymentData?.bakong_account_verified ? 'Verified' : 'Verify Account'}
                      </button>
                    )}
                  </div>
                </form>

                {/* Test QR Generation for Bakong */}
                {paymentData?.bakong_account_verified && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TestTube className="w-5 h-5" />
                      Test QR Generation
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Currency
                        </label>
                        <select
                          value={testCurrency}
                          onChange={(e) => setTestCurrency(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="USD">USD</option>
                          <option value="KHR">KHR</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleTestQR}
                          disabled={testing}
                          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                          {testing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                          {testing ? 'Generating...' : 'Generate Test QR'}
                        </button>
                      </div>
                    </div>

                    {testResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="font-medium text-green-800 mb-2">Test QR Generated Successfully!</h5>
                        <div className="text-sm text-green-700">
                          <p><strong>Amount:</strong> {testResult.amount} {testResult.currency}</p>
                          <p><strong>QR String:</strong> <code className="bg-green-100 px-1 rounded text-xs">{testResult.qr_string.substring(0, 50)}...</code></p>
                          <p className="text-xs text-green-600 mt-2">This confirms your Bakong account is properly configured for payments.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="rounded-2xl bg-blue-50 p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">How Payment Works</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>1.</strong> Set up your preferred payment method (Bank Account or Bakong)</p>
            <p><strong>2.</strong> Verify your account information</p>
            <p><strong>3.</strong> When customers buy your books, payments go directly to your account</p>
            <p><strong>4.</strong> For Bakong: Customers pay via QR code and you receive instant payments</p>
            <p><strong>5.</strong> For Bank: Payments are processed through traditional bank transfers</p>
            <p className="mt-4 text-blue-600">
              <strong>Note:</strong> You can switch between payment methods anytime. Bakong offers instant payments while bank transfers may take 1-3 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}