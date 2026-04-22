'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Truck, 
  RefreshCw, 
  Filter, 
  Eye,
  X,
  ShoppingBag,
  Check,
  XCircle,
  CreditCard,
  Banknote,
  DollarSign,
  AlertTriangle,
  LogIn,
  WifiOff,
  Inbox,
  Loader2
} from 'lucide-react'

interface Order {
  _id: string
  trackingNumber?: string
  orderItems: Array<{
    name: string
    price: number
    quantity: number
    image: string
  }>
  totalPrice: number
  status: string
  createdAt: string
  user: string
  shippingAddress: {
    fullName: string
    address: string
    city: string
    phone: string
  }
  riderId?: string
  assignedRider?: string
  riderName?: string
  riderPhone?: string
  paymentMethod?: string
  isPaid?: boolean
  paymentResult?: {
    id?: string
    status?: string
    screenshot?: string
  }
  deliveryProof?: {
    deliveryNotes?: string
    collectedAmount?: number
  }
}

interface Rider {
  _id: string
  name: string
  email: string
  phone: string
  photo?: string
  vehicleType?: string
  status: string
  rating: number
  totalDeliveries: number
  activeOrders?: number
  isActive?: boolean
}

const ORDER_STATUSES = [
  'Order Received',
  'Payment Pending',
  'Processing',
  'Shipped',
  'Assigned to Rider',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedRiderId, setSelectedRiderId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)
  
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [statusFilter, paymentFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      
      if (!adminToken) {
        console.warn('[AdminOrders] No admin token found!')
        setOrders([])
        setRiders([])
        return
      }
      
      const headers = { 
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }

      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (paymentFilter && paymentFilter !== 'all') params.set('payment', paymentFilter)
      const queryString = params.toString()
      console.log('[AdminOrders] Fetching data...', { statusFilter, paymentFilter, queryString })

      // Fetch RIDERS first (needed for rider name enrichment in orders)
      const ridersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/all-riders`, { headers })
      const ridersDataRaw = await ridersRes.json()
      const ridersList = Array.isArray(ridersDataRaw) ? ridersDataRaw : []
      setRiders(ridersList)

      // Then fetch ORDERS
      const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/all-orders${queryString ? '?' + queryString : ''}`, { headers })
      const ordersData = await ordersRes.json()
      
      console.log('[AdminOrders] Orders response:', ordersRes.status, Array.isArray(ordersData) ? `${ordersData.length} orders` : typeof ordersData)
      
      // Backend returns array directly, NOT wrapped in { orders: [] }
      const parsedOrders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || ordersData.data || [])
      
      // Populate rider name from riders list (frontend-side fallback + primary method)
      // Build lookup map for O(1) matching instead of O(n*m) find-inside-map
      const riderMap = new Map<string, Rider>()
      ridersList.forEach((r: Rider) => riderMap.set(r._id, r))
      const enrichedOrders = parsedOrders.map((order: Order) => {
        if (order.assignedRider && !order.riderName) {
          const matchedRider = riderMap.get(order.assignedRider)
          if (matchedRider) {
            return { ...order, riderName: matchedRider.name, riderPhone: matchedRider.phone }
          }
        }
        return order
      })
      
      console.log('[AdminOrders] Setting orders:', enrichedOrders.length, 'items')
      setOrders(enrichedOrders)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set empty arrays on error
      setOrders([])
      setRiders([])
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/update-order-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, status: newStatus })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const assignRider = async () => {
    if (!selectedOrder || !selectedRiderId) return

    setAssigning(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/update-order-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          orderId: selectedOrder._id, 
          status: 'Assigned to Rider',
          riderId: selectedRiderId
        })
      })

      if (res.ok) {
        setShowAssignModal(false)
        setSelectedOrder(null)
        setSelectedRiderId('')
        fetchData()
      }
    } finally {
      setAssigning(false)
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrderDetails(order)
    setShowOrderModal(true)
  }

  const viewScreenshot = (screenshot: string) => {
    setScreenshotImage(screenshot)
    setShowScreenshotModal(true)
  }

  const getPaymentStatus = (order: Order) => {
    if (order.isPaid) {
      return { label: 'Paid (Stripe)', color: 'text-green-600', bg: 'bg-green-100' }
    }
    if (order.paymentMethod === 'cod') {
      if (order.status === 'Delivered') {
        return { label: 'COD Collected', color: 'text-green-600', bg: 'bg-green-100' }
      }
      return { label: 'COD Pending', color: 'text-purple-600', bg: 'bg-purple-100' }
    }
    if (order.status === 'Cancelled') {
      return { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100' }
    }
    return { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-100' }
  }

  const totalSales = orders.reduce((sum: number, order: Order) => sum + order.totalPrice, 0)
  const totalOrders = orders.length
  
  // Ensure riders is always an array before filtering
  const ridersArray = Array.isArray(riders) ? riders : []
  const availableRiders = ridersArray.filter((r: Rider) => r.status === 'active' || r.status === 'busy')

  let filteredOrders = orders
  if (paymentFilter !== 'all') {
    filteredOrders = filteredOrders.filter((o: Order) => o.paymentMethod === paymentFilter)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">Rs {totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Riders</p>
              <p className="text-xl font-bold text-gray-900">{ridersArray.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Riders</p>
              <p className="text-xl font-bold text-gray-900">
                {ridersArray.filter((r: Rider) => r.status === 'active' || r.status === 'busy').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700 font-medium">Filters:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            {ORDER_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Payments</option>
            <option value="card">Credit Card</option>
            <option value="cod">Cash on Delivery</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="p-4 font-medium">Tracking ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Payment</th>
                  <th className="p-4 font-medium">Rider</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const paymentStatus = getPaymentStatus(order);
                  return (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm text-indigo-600 font-mono">{order.trackingNumber || order._id.slice(-8)}</td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.shippingAddress?.fullName || 'Guest'}</p>
                        <p className="text-xs text-gray-500">{order.shippingAddress?.city}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-900">{order.orderItems?.length || 0} items</td>
                    <td className="p-4 text-sm font-semibold text-green-600">Rs {order.totalPrice.toLocaleString()}</td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bg} ${paymentStatus.color}`}>
                        {order.paymentMethod === 'card' && <CreditCard className="w-3 h-3 mr-1" />}
                        {order.paymentMethod === 'cod' && <Banknote className="w-3 h-3 mr-1" />}
                        {paymentStatus.label}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.riderName ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-600 font-medium">{order.riderName}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Assigned</span>
                        </div>
                      ) : order.status === 'Assigned to Rider' ? (
                        <button
                          onClick={() => { setSelectedOrder(order); setShowAssignModal(true); }}
                          className="text-sm bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg font-medium"
                        >
                          ⚠ Select Rider
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSelectedOrder(order); setShowAssignModal(true); }}
                          className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                        >
                          Assign
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Rider Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Rider</h3>
            <p className="text-gray-600 mb-4">
              Order: <span className="text-indigo-600 font-mono">{selectedOrder.trackingNumber || selectedOrder._id.slice(-8)}</span>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Rider</label>
              <select
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Choose a rider...</option>
                {availableRiders.map((rider) => (
                  <option key={rider._id} value={rider._id}>
                    {rider.name} - {rider.vehicleType || 'N/A'} ({rider.rating}★)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedOrder(null); setSelectedRiderId(''); }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={assignRider}
                disabled={!selectedRiderId || assigning}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign Rider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Tracking ID</p>
                <p className="text-gray-900 font-mono">{selectedOrderDetails.trackingNumber || selectedOrderDetails._id}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Customer</p>
                <p className="text-gray-900">{selectedOrderDetails.shippingAddress?.fullName}</p>
                <p className="text-sm text-gray-600">{selectedOrderDetails.shippingAddress?.address}, {selectedOrderDetails.shippingAddress?.city}</p>
                <p className="text-sm text-gray-600">{selectedOrderDetails.shippingAddress?.phone}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Items</p>
                {selectedOrderDetails.orderItems?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-0">
                    <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">No image</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity} × Rs {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <p className="text-gray-600">Total</p>
                  <p className="text-green-600 font-bold">Rs {selectedOrderDetails.totalPrice.toLocaleString()}</p>
                </div>
                {selectedOrderDetails.status === 'Delivered' && selectedOrderDetails.deliveryProof?.collectedAmount && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <p className="text-gray-600">Collected by Rider</p>
                      <p className="text-green-600 font-bold">Rs {selectedOrderDetails.deliveryProof.collectedAmount.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Payment Method</p>
                <div className="flex items-center mt-1">
                  {selectedOrderDetails.paymentMethod === 'card' && <CreditCard className="w-4 h-4 mr-2 text-gray-600" />}
                  {selectedOrderDetails.paymentMethod === 'cod' && <Banknote className="w-4 h-4 mr-2 text-gray-600" />}
                  <span className="text-gray-900 capitalize">
                    {selectedOrderDetails.paymentMethod} {selectedOrderDetails.isPaid ? '(Paid)' : ''}
                  </span>
                </div>
              </div>

              {selectedOrderDetails.riderName && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Assigned Rider</p>
                  <p className="text-gray-900">{selectedOrderDetails.riderName}</p>
                  {selectedOrderDetails.riderPhone && (
                    <p className="text-sm text-gray-600">{selectedOrderDetails.riderPhone}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Screenshot Modal */}
      {showScreenshotModal && screenshotImage && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50" onClick={() => setShowScreenshotModal(false)}>
          <div className="relative max-w-2xl w-full">
            <button 
              onClick={() => setShowScreenshotModal(false)}
              className="absolute -top-12 right-0 text-white p-2 hover:bg-gray-700 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={screenshotImage} alt="Payment Screenshot" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}