'use client';

import { useState, useEffect } from 'react';
import { request } from '../../utils/request';
import { useAuthStore } from '../../store/authStore';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function AdminPayoutsNewPage() {
  const [authors, setAuthors] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('authors');
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      if (activeTab === 'authors') {
        fetchAuthors();
      } else {
        fetchPayoutHistory();
      }
    }
  }, [activeTab, token]);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const response = await request('/api/admin/payouts/authors', 'GET', {}, {}, token);
      console.log('Authors response:', response);
      
      const authorsData = response?.data || response || [];
      setAuthors(Array.isArray(authorsData) ? authorsData : []);
    } catch (error) {
      console.error('Error fetching authors:', error);
      alert('Failed to fetch authors: ' + (error.response?.data?.message || error.message));
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutHistory = async () => {
    try {
      setLoading(true);
      const response = await request('/api/admin/payouts/history', 'GET', {}, {}, token);
      console.log('History response:', response);
      
      const historyData = response?.data?.data || response?.data || response || [];
      setPayoutHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Failed to fetch history: ' + (error.response?.data?.message || error.message));
      setPayoutHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayout = async (authorId, amount, paymentMethod, notes) => {
    try {
      await request('/api/admin/payouts/initiate', 'POST', {
        author_id: authorId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        notes: notes,
      }, {}, token);
      
      alert('Payout initiated! Please complete the payment in real life, then confirm it.');
      setShowPayoutModal(false);
      setSelectedAuthor(null);
      fetchAuthors();
      setActiveTab('history');
    } catch (error) {
      console.error('Error initiating payout:', error);
      alert('Failed to initiate payout: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeletePayout = async (payoutId) => {
    if (!confirm('Are you sure you want to delete this payout record? This action cannot be undone.')) {
      return;
    }

    try {
      await request(`/api/admin/payouts/${payoutId}`, 'DELETE', {}, {}, token);
      
      alert('Payout record deleted successfully!');
      fetchPayoutHistory();
    } catch (error) {
      console.error('Error deleting payout:', error);
      alert('Failed to delete payout: ' + (error.response?.data?.error || error.message));
    }
  };

  const PayoutModal = ({ author, onClose }) => {
    const [amount, setAmount] = useState(author.available_balance);
    const [paymentMethod, setPaymentMethod] = useState(author.payment_method || 'bank_transfer');
    const [notes, setNotes] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Initiate Payout to {author.author_name}</h3>
          
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Author Information</h4>
            <p className="text-sm"><strong>Email:</strong> {author.author_email}</p>
            <p className="text-sm"><strong>Available Balance:</strong> ${Number(author.available_balance).toFixed(2)}</p>
            <p className="text-sm"><strong>Total Earned:</strong> ${Number(author.total_earned).toFixed(2)}</p>
            <p className="text-sm"><strong>Books:</strong> {author.books_count}</p>
          </div>

          <div className="mb-4 p-4 bg-blue-50 rounded">
            <h4 className="font-semibold mb-2">Payment Information</h4>
            {author.bank_name && (
              <>
                <p className="text-sm"><strong>Bank:</strong> {author.bank_name}</p>
                <p className="text-sm"><strong>Account Number:</strong> {author.bank_account_number}</p>
                <p className="text-sm"><strong>Account Name:</strong> {author.bank_account_name}</p>
              </>
            )}
            {author.bakong_account_id && (
              <p className="text-sm"><strong>Bakong ID:</strong> {author.bakong_account_id}</p>
            )}
            {!author.has_payment_info && (
              <p className="text-sm text-red-600">⚠️ No payment information provided by author</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={author.available_balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="aba">ABA Bank</option>
              <option value="wing">Wing</option>
              <option value="bakong">Bakong</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows="3"
              placeholder="Add any notes about this payout..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> After clicking "Initiate", you must complete the actual payment to the author's account. Then come back and confirm the payout with the transaction reference.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleInitiatePayout(author.author_id, amount, paymentMethod, notes)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Initiate Payout
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmModal = ({ payout, onClose }) => {
    const [transactionRef, setTransactionRef] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [loadingQR, setLoadingQR] = useState(false);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('File size must be less than 5MB');
          return;
        }
        setPaymentProof(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    };

    const handleGenerateQR = async () => {
      if (!payout.owner?.bakong_account_id) {
        alert('Author has not set up Bakong account');
        return;
      }

      try {
        setLoadingQR(true);
        const response = await request(
          `/api/admin/payouts/generate-qr/${payout.owner_id}`,
          'POST',
          { amount: payout.amount },
          {},
          token
        );

        if (response.success) {
          setQrData(response.data);
          setShowQR(true);
        } else {
          alert('Failed to generate QR: ' + response.error);
        }
      } catch (error) {
        console.error('Error generating QR:', error);
        alert('Failed to generate QR code');
      } finally {
        setLoadingQR(false);
      }
    };

    const handleSubmit = async () => {
      if (!transactionRef) {
        alert('Transaction reference is required');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('transaction_reference', transactionRef);
        if (notes) formData.append('notes', notes);
        if (paymentProof) formData.append('payment_proof', paymentProof);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/payouts/${payout.id}/confirm`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const data = await response.json();

        if (data.success) {
          alert('Payout confirmed successfully!');
          onClose();
          fetchPayoutHistory();
        } else {
          alert('Failed to confirm payout: ' + data.error);
        }
      } catch (error) {
        console.error('Error confirming payout:', error);
        alert('Failed to confirm payout');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Confirm Payout</h3>
          
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <p className="text-sm"><strong>Author:</strong> {payout.owner?.name}</p>
            <p className="text-sm"><strong>Amount:</strong> ${Number(payout.amount).toFixed(2)}</p>
            <p className="text-sm"><strong>Method:</strong> {payout.payment_method}</p>
            
            {payout.owner?.bakong_account_id && (
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-1">Bakong Account</p>
                <p className="text-sm text-blue-800">
                  <strong>Account ID:</strong> {payout.owner.bakong_account_id}
                </p>
                {payout.owner.bakong_merchant_name && (
                  <p className="text-sm text-blue-800">
                    <strong>Name:</strong> {payout.owner.bakong_merchant_name}
                  </p>
                )}
                <button
                  onClick={handleGenerateQR}
                  disabled={loadingQR}
                  className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loadingQR ? 'Generating...' : 'Generate QR Code'}
                </button>
              </div>
            )}

            {payout.owner?.bank_account_number && (
              <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-semibold text-green-900 mb-1">Bank Account</p>
                <p className="text-sm text-green-800">
                  <strong>Bank:</strong> {payout.owner.bank_name}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Account:</strong> {payout.owner.bank_account_number}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Name:</strong> {payout.owner.bank_account_name}
                </p>
              </div>
            )}
          </div>

          {showQR && qrData && (
            <div className="mb-4 p-4 bg-purple-50 rounded border border-purple-200">
              <h4 className="font-semibold mb-2 text-purple-900">Bakong QR Code</h4>
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.qr_string)}`}
                    alt="Bakong QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">Scan with Bakong app to pay</p>
                <p className="text-xs text-gray-500 mt-1">Amount: ${qrData.amount} {qrData.currency}</p>
                <button
                  onClick={() => setShowQR(false)}
                  className="mt-2 text-sm text-purple-600 hover:text-purple-800"
                >
                  Hide QR Code
                </button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Transaction Reference *</label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., TXN123456789"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Payment Proof (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border rounded px-3 py-2"
            />
            {previewUrl && (
              <div className="mt-2">
                <img src={previewUrl} alt="Preview" className="max-w-xs rounded border" />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Upload screenshot or photo of payment confirmation (Max 5MB)</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows="2"
              placeholder="Payment completed via..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!transactionRef}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Confirm Payment
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Author Payout Management</h1>

      {!token ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please log in as admin to manage payouts.
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('authors')}
              className={`px-6 py-3 rounded-lg font-medium ${
                activeTab === 'authors'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Authors to Pay
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-lg font-medium ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Payout History
            </button>
          </div>

          {activeTab === 'authors' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-xl font-bold">Authors with Earnings</h2>
                <p className="text-sm text-gray-600">Authors who have available balance to be paid</p>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">Loading...</div>
              ) : !Array.isArray(authors) || authors.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No authors with earnings found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earned</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Withdrawn</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Books</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Info</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {authors.map((author) => (
                        <tr key={author.author_id} className={Number(author.available_balance) > 0 ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{author.author_name}</div>
                            <div className="text-sm text-gray-500">{author.author_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-lg font-bold ${Number(author.available_balance) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              ${Number(author.available_balance || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            ${Number(author.total_earned || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            ${Number(author.total_withdrawn || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {author.books_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {author.has_payment_info ? (
                              <span className="text-green-600">✓ Provided</span>
                            ) : (
                              <span className="text-red-600">✗ Missing</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {Number(author.available_balance) > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedAuthor(author);
                                  setShowPayoutModal(true);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                              >
                                Pay Now
                              </button>
                            ) : (
                              <span className="text-gray-400">No balance</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-xl font-bold">Payout History</h2>
                <p className="text-sm text-gray-600">All payout transactions</p>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">Loading...</div>
              ) : !Array.isArray(payoutHistory) || payoutHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No payout history found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Ref</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proof</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payoutHistory.map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">#{payout.id}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{payout.owner?.name}</div>
                            <div className="text-sm text-gray-500">{payout.owner?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                            ${Number(payout.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {payout.payment_method || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payout.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              payout.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {payout.transaction_reference || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {payout.payment_proof ? (
                              <a
                                href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${payout.payment_proof}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payout.requested_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              {payout.status === 'processing' && (
                                <button
                                  onClick={() => setShowConfirmModal(payout)}
                                  className="text-green-600 hover:text-green-800 font-medium"
                                >
                                  Confirm
                                </button>
                              )}
                              {(payout.status === 'completed' || payout.status === 'cancelled') && (
                                <button
                                  onClick={() => handleDeletePayout(payout.id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                  title="Delete payout record"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {showPayoutModal && selectedAuthor && (
            <PayoutModal
              author={selectedAuthor}
              onClose={() => {
                setShowPayoutModal(false);
                setSelectedAuthor(null);
              }}
            />
          )}

          {showConfirmModal && (
            <ConfirmModal
              payout={showConfirmModal}
              onClose={() => setShowConfirmModal(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
