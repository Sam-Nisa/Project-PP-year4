'use client';

import { useState, useEffect } from 'react';
import { request } from '../../utils/request';
import { useAuthStore } from '../../store/authStore';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingPayout, setProcessingPayout] = useState(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      fetchPayouts();
      fetchStatistics();
    } else {
      setLoading(false);
    }
  }, [filter, token]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'pending' 
        ? '/api/payouts/pending' 
        : `/api/payouts/all?status=${filter}`;
      
      const response = await request(endpoint, 'GET', {}, {}, token);
      console.log('Payouts response:', response);
      
      // Handle different response structures
      const payoutsData = response?.data?.data || response?.data || response || [];
      setPayouts(Array.isArray(payoutsData) ? payoutsData : []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      alert('Failed to fetch payouts: ' + (error.response?.data?.message || error.message));
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await request('/api/payouts/statistics', 'GET', {}, {}, token);
      console.log('Statistics response:', response);
      
      // Handle different response structures
      const statsData = response?.data || response;
      setStatistics(statsData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleProcessPayout = async (payoutId, status, transactionRef, notes) => {
    try {
      await request(`/api/payouts/${payoutId}/process`, 'POST', {
        status,
        transaction_reference: transactionRef,
        notes,
      }, {}, token);
      
      alert('Payout processed successfully!');
      setProcessingPayout(null);
      fetchPayouts();
      fetchStatistics();
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Failed to process payout: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeletePayout = async (payoutId) => {
    if (!confirm('Are you sure you want to delete this payout record? This action cannot be undone.')) {
      return;
    }

    try {
      await request(`/api/admin/payouts/${payoutId}`, 'DELETE', {}, {}, token);
      
      alert('Payout record deleted successfully!');
      fetchPayouts();
      fetchStatistics();
    } catch (error) {
      console.error('Error deleting payout:', error);
      alert('Failed to delete payout: ' + (error.response?.data?.error || error.message));
    }
  };

  const ProcessPayoutModal = ({ payout, onClose }) => {
    const [status, setStatus] = useState('completed');
    const [transactionRef, setTransactionRef] = useState('');
    const [notes, setNotes] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Process Payout</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">Owner: {payout.owner?.name}</p>
            <p className="text-sm text-gray-600">Amount: ${payout.amount}</p>
            <p className="text-sm text-gray-600">Method: {payout.payment_method}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Transaction Reference</label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="TXN123456789"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows="3"
              placeholder="Add any notes..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleProcessPayout(payout.id, status, transactionRef, notes)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Process
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Payout Management</h1>

      {!token ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please log in to view payouts.
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Pending</h3>
            <p className="text-2xl font-bold">{statistics.pending_count || 0}</p>
            <p className="text-sm text-gray-600">${Number(statistics.pending_amount || 0).toFixed(2)}</p>
          </div>
          
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Processing</h3>
            <p className="text-2xl font-bold">{statistics.processing_count || 0}</p>
            <p className="text-sm text-gray-600">${Number(statistics.processing_amount || 0).toFixed(2)}</p>
          </div>
          
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Completed Today</h3>
            <p className="text-2xl font-bold">{statistics.completed_today || 0}</p>
            <p className="text-sm text-gray-600">${Number(statistics.completed_today_amount || 0).toFixed(2)}</p>
          </div>
          
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Total Completed</h3>
            <p className="text-2xl font-bold">{statistics.total_completed || 0}</p>
            <p className="text-sm text-gray-600">${Number(statistics.total_completed_amount || 0).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['pending', 'processing', 'completed', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : !Array.isArray(payouts) || payouts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payouts found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{payout.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payout.owner?.name}</div>
                    <div className="text-sm text-gray-500">{payout.owner?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${Number(payout.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payout.payment_method || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payout.requested_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {payout.status === 'pending' && (
                        <button
                          onClick={() => setProcessingPayout(payout)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Process
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
                      {payout.transaction_reference && (
                        <div className="text-xs text-gray-500">
                          Ref: {payout.transaction_reference}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Process Payout Modal */}
      {processingPayout && (
        <ProcessPayoutModal
          payout={processingPayout}
          onClose={() => setProcessingPayout(null)}
        />
      )}
        </>
      )}
    </div>
  );
}
