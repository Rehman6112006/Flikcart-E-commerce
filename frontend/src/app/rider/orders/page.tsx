
'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  MapPin, 
  Clock,
  CheckCircle,
  Truck,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Save
} from 'lucide-react'
import { API_ENDPOINTS, getApiUrl } from '@/lib/api'

interface Order {
  _id: string
  trackingId: string
  orderItems: Array<{
    name: string
    price: number
    quantity: number
    image: string
  }>
  totalPrice: number
  status: string
  createdAt: string
  shippingAddress: {
    fullName: string
    address: string
    city: string
    phone: string
  }
}

interface RiderProfile {
  _id: string
  name: string
  email: string
  phone: string
  photo?: string
  vehicle: string
  rating: number
  totalDeliveries: number
  status: string
}

const ORDER_STATUSES = ['Out for Delivery', 'Delivered']

export default function RiderOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [profile, setProfile] = useState<RiderProfile | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [collectingOrder, setCollectingOrder] = useState<Order | null>(null)
  const [collectedAmount, setCollectedAmount] = useState('')

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const riderToken = localStorage.getItem('riderToken')
      const headers = { 
        'Authorization': `Bearer ${riderToken}`,
        'Content-Type': 'application/json'
      }

      // Fetch rider profile
      const profileRes = await fetch(API_ENDPOINTS.RIDER_PROFILE, { headers })
      const profileData = await profileRes.json()
      setProfile(profileData)

      // Fetch rider orders
      const ordersRes = await fetch(API_ENDPOINTS.RIDER_ORDERS, { headers })
      const ordersData = await ordersRes.json()
      
      // Always ensure data is an array (backend may return error object)
      const ordersArray = Array.isArray(ordersData) ? ordersData : []
      setOrders(ordersArray)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptOrder = async (orderId: string) => {
    setUpdating(true)
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(getApiUrl('/api/rider/accept-order'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${riderToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error accepting order:', error)
    } finally {
      setUpdating(false)
    }
  }

  const markDelivered = async (orderId: string) => {
    setUpdating(true)
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(getApiUrl('/api/rider/mark-delivered'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${riderToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, deliveryNotes: 'Delivered successfully' })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error marking delivered:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Open collect money modal for COD orders
  const openCollectModal = (order: Order) => {
    setCollectingOrder(order)
    setCollectedAmount(order.totalPrice.toString())
    setShowCollectModal(true)
  }

  // Submit collected amount
  const submitCollectedAmount = async () => {
    if (!collectingOrder || !collectedAmount) return
    
    setUpdating(true)
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(getApiUrl('/api/rider/mark-delivered'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${riderToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          orderId: collectingOrder._id, 
          deliveryNotes: `COD Collected: Rs. ${collectedAmount}`,
          collectedAmount: parseFloat(collectedAmount)
        })
      })

      if (res.ok) {
        setShowCollectModal(false)
        setCollectingOrder(null)
        setCollectedAmount('')
        fetchData()
      }
    } catch (error) {
      console.error('Error submitting collected amount:', error)
    } finally {
      setUpdating(false)
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const safeOrders = Array.isArray(orders) ? orders : []
  const filteredOrders = statusFilter === 'all' 
    ? safeOrders 
    : safeOrders.filter((o: Order) => o.status === statusFilter)

  const pendingOrders = safeOrders.filter((o: Order) => o.status === 'Out for Delivery')
  const deliveredOrders = safeOrders.filter((o: Order) => o.status === 'Delivered')

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Orders</h1>
        <p className="text-slate-400">Manage your delivery orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Orders</p>
              <p className="text-xl font-bold text-white">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-xl font-bold text-white">{pendingOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Delivered</p>
              <p className="text-xl font-bold text-white">{deliveredOrders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2"
          >
            <option value="all">All Orders</option>
            {ORDER_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-orange-400">{order.trackingId}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Delivered' ? 'bg-green-900 text-green-300' :
                      order.status === 'Out for Delivery' ? 'bg-blue-900 text-blue-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-white font-medium">{order.shippingAddress?.fullName}</p>
                  <p className="text-slate-400 text-sm">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
                  <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {order.shippingAddress?.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-green-400 font-bold">Rs {order.totalPrice.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">{order.orderItems?.length || 0} items</p>
                    <p className="text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => viewOrderDetails(order)}
                      className="px-3 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600"
                    >
                      Details
                    </button>
                    {order.status === 'Assigned to Rider' && (
                      <button
                        onClick={() => acceptOrder(order._id)}
                        disabled={updating}
                        className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
                      >
                        {updating ? 'Accepting...' : 'Accept'}
                      </button>
                    )}
                    {order.status === 'Out for Delivery' && (
                      <button
                        onClick={() => openCollectModal(order)}
                        disabled={updating}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {updating ? 'Processing...' : 'Collect & Deliver'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Order Details</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-2 text-slate-400 hover:text-white">
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Tracking ID</p>
                <p className="text-white font-mono">{selectedOrder.trackingId}</p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Delivery Address</p>
                <p className="text-white">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-slate-400 text-sm">{selectedOrder.shippingAddress?.address}</p>
                <p className="text-slate-400 text-sm">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.phone}</p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm mb-2">Items</p>
                {selectedOrder.orderItems?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-600 last:border-0">
                    <div className="w-10 h-10 bg-slate-600 rounded overflow-hidden">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{item.name}</p>
                      <p className="text-slate-400 text-xs">Qty: {item.quantity} × Rs {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <p className="text-slate-400">Total</p>
                  <p className="text-green-400 font-bold">Rs {selectedOrder.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collect Money Modal for COD */}
      {showCollectModal && collectingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Collect Payment</h3>
              <button onClick={() => setShowCollectModal(false)} className="p-2 text-slate-400 hover:text-white">
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Order Amount (COD)</p>
                <p className="text-white font-bold text-xl">Rs {collectingOrder.totalPrice.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount Collected from Customer
                </label>
                <input
                  type="number"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Enter amount received"
                />
              </div>

              {parseFloat(collectedAmount) < collectingOrder.totalPrice && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-sm">
                    Warning: Amount is less than order total!
                  </p>
                </div>
              )}

              {parseFloat(collectedAmount) > collectingOrder.totalPrice && (
                <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg">
                  <p className="text-green-300 text-sm">
                    Extra cash: Rs {parseFloat(collectedAmount) - collectingOrder.totalPrice}
                  </p>
                </div>
              )}

              <button
                onClick={submitCollectedAmount}
                disabled={updating || !collectedAmount}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? 'Submitting...' : 'Confirm Delivery & Collect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


