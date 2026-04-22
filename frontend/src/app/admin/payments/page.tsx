'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Clock, CreditCard, Eye, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface PaymentOrder {
  _id: string
  user: string
  orderItems: { name: string; quantity: number; price: number; image: string }[]
  totalPrice: number
  paymentMethod: string
  isPaid: boolean
  status: string
  createdAt: string
  shippingAddress?: { fullName: string; phone: string }
}

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const getAdminToken = () => localStorage.getItem('adminToken') || ''

  useEffect(() => {
    fetchPendingPayments()
  }, [])

  const fetchPendingPayments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/payments/pending`, {
        headers: { 'Authorization': `Bearer ${getAdminToken()}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({ orderId, isVerified: true })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Payment verified! Order status updated.' })
        fetchPendingPayments()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.message || 'Failed to verify' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Verification failed' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleReject = async (orderId: string) => {
    if (!confirm('Reject this payment? The order will remain unpaid.')) return

    setActionLoading(orderId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({ orderId, isVerified: false, notes: 'Payment verification rejected by admin' })
      })
      if (res.ok) {
        setMessage({ type: 'error', text: 'Payment rejected.' })
        fetchPendingPayments()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reject' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const openDetailModal = (order: PaymentOrder) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Verification</h1>
          <p className="text-gray-600 text-sm mt-1">Review and verify pending payments</p>
        </div>
        <button onClick={fetchPendingPayments} className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
          Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          {message.text}
        </motion.div>
      )}

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <CheckCircle2 size={48} className="mx-auto text-green-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">All caught up!</h3>
          <p className="text-gray-500">No pending payments to verify.</p>
        </div>
      )}

      {/* Pending Payments List */}
      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Order Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      order.paymentMethod === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.paymentMethod === 'card' ? 'Card' : order.paymentMethod.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="font-bold text-lg text-gray-900">Rs. {order.totalPrice.toFixed(0)}</h3>
                    <span className="text-xs text-gray-500">{order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}</span>
                  </div>

                  <p className="text-sm text-gray-600 truncate">
                    {order.orderItems.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                  </p>
                  {order.shippingAddress && (
                    <p className="text-xs text-gray-400 mt-1">{order.shippingAddress.fullName} - {order.shippingAddress.phone}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openDetailModal(order)} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors" title="View details">
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleVerify(order._id)}
                    disabled={actionLoading === order._id}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === order._id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Verify
                  </button>
                  <button
                    onClick={() => handleReject(order._id)}
                    disabled={actionLoading === order._id}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === order._id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                    Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                  <p className="text-lg font-bold text-gray-900">Rs. {selectedOrder.totalPrice.toFixed(0)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Method</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize flex items-center gap-1.5">
                    <CreditCard size={14} /> {selectedOrder.paymentMethod}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <p className="text-sm font-semibold text-yellow-600 flex items-center gap-1.5">
                    <Clock size={14} /> Pending Verification
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('en-PK')}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              {selectedOrder.shippingAddress && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.fullName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.phone}</p>
                </div>
              )}

              {/* Order Items */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} x Rs. {item.price}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 whitespace-nowrap">Rs. {(item.price * item.quantity).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowDetailModal(false); handleVerify(selectedOrder._id) }}
                  className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <Check size={16} /> Verify Payment
                </button>
                <button onClick={() => setShowDetailModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
