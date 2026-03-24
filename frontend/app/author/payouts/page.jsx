'use client';

import { useState, useEffect } from 'react';
import { request } from '../../utils/request';
import { useAuthStore } from '../../store/authStore';

export default function AuthorPayoutsPage() {
  const [balance, setBalance] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch balance
      const balanceResponse = await request('/api/payouts/balance', 'GET', {}, {}, token);
      console.log('Balance response:', balanceResponse);
      setBalance(balanceResponse?.data || balanceResponse || null);

      // Fetch payout history
      const payoutsResponse = await request('/api/payouts/my-payouts', 'GET', {}, {}, token);
      console.log('Payouts response:', payoutsResponse);
      const payoutsData = payoutsResponse?.data || payoutsResponse || [];
      setPayouts(Array.isArray(payoutsData) ? payoutsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Earnings & Payouts</h1>

      {!token ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please log in to view your earnings.
        </div>
      ) : loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-sm font-medium opacity-90 mb-2">Available Balance</h3>
              <p className="text-3xl font-bold">${Number(balance?.available_balance || 0).toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-2">Ready to withdraw</p>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-sm font-medium opacity-90 mb-2">Pending Balance</h3>
              <p className="text-3xl font-bold">${Number(balance?.pending_balance || 0).toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-2">Being processed</p>
            </div>

            <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-sm font-medium opacity-90 mb-2">Total Earned</h3>
              <p className="text-3xl font-bold">${Number(balance?.total_earned || 0).toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-2">All time earnings</p>
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-sm font-medium opacity-90 mb-2">Total Withdrawn</h3>
              <p className="text-3xl font-bold">${Number(balance?.total_withdrawn || 0).toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-2">Paid out to you</p>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">How Payouts Work</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You earn 90% from each book sale (10% platform commission)</li>
              <li>• Earnings are automatically added to your available balance when orders are completed</li>
              <li>• Admin will process payouts manually to your registered payment method</li>
              <li>• Make sure your payment information is up to date in Settings</li>
            </ul>
          </div>

          {/* Payout History */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-xl font-bold">Payout History</h2>
              <p className="text-sm text-gray-600">All your payout transactions</p>
            </div>

            {!Array.isArray(payouts) || payouts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No payout history yet. Your earnings will appear here once admin processes payments.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Ref</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          #{payout.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-green-600">
                            ${Number(payout.amount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payout.payment_method || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payout.status)}`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payout.transaction_reference || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payout.requested_at ? new Date(payout.requested_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {payout.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Info Reminder */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">💡 Payment Information</h3>
            <p className="text-sm text-yellow-800">
              Make sure your bank account or Bakong information is up to date so admin can process your payouts.
              You can update your payment information in the{' '}
              <a href="/author/payment" className="underline font-medium">Payment Settings</a> page.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
