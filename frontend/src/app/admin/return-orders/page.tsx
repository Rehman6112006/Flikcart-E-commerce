'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, X, Package } from 'lucide-react'

interface ReturnOrder {
  _id: string
  orderId: string
  userName: string
  userEmail: string
  product: { name: string; price: number; quantity: number; image: string }
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Refunded'
  refundAmount: number
  adminNotes?: string
  createdAt: Date
}

export default function ReturnOrdersPage() {
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<ReturnOrder | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [refundAmount, setRefundAmount] = useState(0)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { fetchReturnOrders() }, [])

  const fetchReturnOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/return-orders`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (response.ok) setReturnOrders(await response.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleViewDetails = (order: ReturnOrder) => {
    setSelectedOrder(order)
    setAdminNotes(order.adminNotes || '')
    setRefundAmount(order.refundAmount || order.product.price * order.product.quantity)
    setShowModal(true)
  }

  const handleUpdateStatus = async (status: 'Approved' | 'Rejected' | 'Refunded') => {
    if (!selectedOrder) return
    setUpdating(true)
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/return-orders/${selectedOrder._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, adminNotes, refundAmount })
      })
      if (res.ok) { fetchReturnOrders(); setShowModal(false); setSelectedOrder(null) }
    } catch (e) { console.error(e) }
    finally { setUpdating(false) }
  }

  const filteredOrders = returnOrders.filter(o => {
    const match = searchTerm === '' || o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || o.userName.toLowerCase().includes(searchTerm.toLowerCase())
    const statusMatch = statusFilter === 'all' || o.status === statusFilter
    return match && statusMatch
  })

  const getStatusColor = (s: string) => {
    if (s === 'Pending') return 'bg-yellow-100 text-yellow-800'
    if (s === 'Approved') return 'bg-green-100 text-green-800'
    if (s === 'Rejected') return 'bg-red-100 text-red-800'
    return 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-4 gap-4 p-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-xl font-bold">{returnOrders.filter(o => o.status === 'Pending').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-xl font-bold">{returnOrders.filter(o => o.status === 'Approved').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Refunded</p>
          <p className="text-xl font-bold">{returnOrders.filter(o => o.status === 'Refunded').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-xl font-bold">{returnOrders.filter(o => o.status === 'Rejected').length}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white p-4 rounded-xl shadow-sm flex gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border rounded-lg"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="all">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-2">No orders</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left text-xs">Order ID</th>
                  <th className="p-3 text-left text-xs">Customer</th>
                  <th className="p-3 text-left text-xs">Product</th>
                  <th className="p-3 text-left text-xs">Amount</th>
                  <th className="p-3 text-left text-xs">Status</th>
                  <th className="p-3 text-left text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono">{o.orderId.slice(-8)}</td>
                    <td className="p-3">
                      <p className="font-medium">{o.userName}</p>
                      <p className="text-xs text-gray-500">{o.userEmail}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm">{o.product.name}</p>
                    </td>
                    <td className="p-3 font-semibold">Rs.{o.product.price * o.product.quantity}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleViewDetails(o)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Details</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Order</p>
                <p className="font-mono">{selectedOrder.orderId.slice(-8)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Customer</p>
                <p>{selectedOrder.userName}</p>
                <p className="text-xs text-gray-500">{selectedOrder.userEmail}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Product</p>
                <p>{selectedOrder.product.name}</p>
                <p className="text-xs">Rs.{selectedOrder.product.price} x {selectedOrder.product.quantity}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Reason</p>
                <p>{selectedOrder.reason}</p>
              </div>
              {selectedOrder.status === 'Pending' && (
                <>
                  <div className="space-y-2">
                    <label>
                      <span className="text-sm">Refund Amount</span>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={e => setRefundAmount(Number(e.target.value))}
                        className="w-full mt-1 p-2 border rounded"
                      />
                    </label>
                    <label>
                      <span className="text-sm">Notes</span>
                      <textarea
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        className="w-full mt-1 p-2 border rounded"
                        rows={2}
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus('Approved')}
                      disabled={updating}
                      className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('Rejected')}
                      disabled={updating}
                      className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
              {selectedOrder.status === 'Approved' && (
                <button
                  onClick={() => handleUpdateStatus('Refunded')}
                  disabled={updating}
                  className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
