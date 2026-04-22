'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Bike, 
  Package, 
  MapPin, 
  Phone, 
  LogOut, 
  Star, 
  CheckCircle, 
  Clock,
  Navigation,
  Camera,
  User,
  ChevronRight,
  AlertCircle,
  X,
  RefreshCw,
  Locate
} from 'lucide-react'
import { API_ENDPOINTS, getApiUrl } from '@/lib/api'

interface Order {
  _id: string
  trackingId: string
  status: string
  shippingAddress: {
    fullName: string
    address: string
    city: string
    state: string
    phone: string
  }
  totalPrice: number
  orderItems: Array<{
    name: string
    quantity: number
    price: number
    image?: string
  }>
  riderLocation?: {
    lat: number
    lng: number
    updatedAt: string
  }
  estimatedDeliveryTime?: string
  createdAt: string
}

interface Rider {
  id: string
  name: string
  email: string
  phone: string
  vehicle: string
  photo?: string
  rating: number
  totalDeliveries: number
  status: string
}

export default function RiderDashboardPage() {
  const router = useRouter()
  const [rider, setRider] = useState<Rider | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationSharing, setLocationSharing] = useState(false)
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const riderData = localStorage.getItem('riderData')
    const token = localStorage.getItem('riderToken')
    
    if (!riderData || !token) {
      router.push('/rider/login')
      return
    }

    setRider(JSON.parse(riderData))
    fetchRiderOrders(token)
  }, [])

  const fetchRiderOrders = async (token: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.RIDER_ORDERS, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      // Always ensure data is an array (backend may return error object)
      const ordersArray = Array.isArray(data) ? data : []
      setOrders(ordersArray)
      
      // Separate pending orders (Assigned to Rider)
      const pending = ordersArray.filter((o: Order) => o.status === 'Assigned to Rider')
      setPendingOrders(pending)
      
      // Find active order (Out for Delivery)
      const active = ordersArray.find((o: Order) => o.status === 'Out for Delivery')
      setActiveOrder(active || null)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshOrders = () => {
    const token = localStorage.getItem('riderToken')
    if (token) {
      fetchRiderOrders(token)
    }
  }

  const acceptOrder = async (orderId: string) => {
    const token = localStorage.getItem('riderToken')
    if (!token) return

    setActionLoading(true)
    try {
      const res = await fetch(getApiUrl('/api/rider/accept-order'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      })

      if (res.ok) {
        setShowAcceptModal(false)
        setSelectedOrder(null)
        refreshOrders()
      }
    } catch (error) {
      console.error('Error accepting order:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const updateLocation = async (lat: number, lng: number) => {
    const token = localStorage.getItem('riderToken')
    if (!token) return

    try {
      await fetch(getApiUrl('/api/rider/update-location'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      })
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setLocationSharing(true)
    navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error('Location error:', error)
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    )
  }

  const stopLocationSharing = () => {
    setLocationSharing(false)
  }

  const markAsDelivered = async () => {
    if (!activeOrder) return
    
    const token = localStorage.getItem('riderToken')
    if (!token) return

    try {
      const res = await fetch(getApiUrl('/api/rider/mark-delivered'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: activeOrder._id,
          deliveryNotes,
          photo: deliveryPhoto
        })
      })

      if (res.ok) {
        setShowDeliveryModal(false)
        setDeliveryPhoto(null)
        setDeliveryNotes('')
        refreshOrders()
        alert('Delivery completed successfully!')
      }
    } catch (error) {
      console.error('Error marking delivered:', error)
    }
  }

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDeliveryPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const logout = () => {
    localStorage.removeItem('riderToken')
    localStorage.removeItem('riderData')
    router.push('/rider/login')
  }

  // Get completed orders count
  const completedOrders = orders.filter(o => o.status === 'Delivered').length
  const todayDeliveries = orders.filter(o => 
    o.status === 'Delivered' && 
    new Date(o.createdAt).toDateString() === new Date().toDateString()
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Bike className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Rider Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {rider?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshOrders}
                className="p-2 text-gray-600 hover:text-orange-500 transition"
                title="Refresh"
              >
                <RefreshCw size={24} />
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-500 transition"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-500">
              {rider?.totalDeliveries || 0}
            </div>
            <div className="text-sm text-gray-600">Total Deliveries</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-500">
              {todayDeliveries}
            </div>
            <div className="text-sm text-gray-600">Completed Today</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-500">
              {pendingOrders.length}
            </div>
            <div className="text-sm text-gray-600">Pending Accept</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1 text-2xl font-bold text-yellow-500">
              {rider?.rating || 4.5}
              <Star size={20} className="fill-current" />
            </div>
            <div className="text-sm text-gray-600">Your Rating</div>
          </div>
        </div>

        {/* Pending Orders (To Accept) */}
        {pendingOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-100 bg-yellow-50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Orders Waiting for Acceptance
              </h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {pendingOrders.map((order) => (
                <div key={order._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Order #{order.trackingId || order._id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.orderItems.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={16} />
                      <span>{order.shippingAddress.city}</span>
                    </div>
                    <span className="font-semibold text-gray-900">Rs. {order.totalPrice.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowAcceptModal(true)
                      }}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Accept Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Sharing Toggle */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                locationSharing ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Navigation className={`w-5 h-5 ${locationSharing ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Location Sharing</h3>
                <p className="text-sm text-gray-500">
                  {locationSharing ? 'Active - Customers can track you' : 'Inactive - Enable to share location'}
                </p>
              </div>
            </div>
            <button
              onClick={locationSharing ? stopLocationSharing : startLocationSharing}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                locationSharing 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              {locationSharing ? 'Stop Sharing' : 'Start Sharing'}
            </button>
          </div>
        </div>

        {/* Active Delivery */}
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Active Delivery</h2>
                <p className="text-orange-100">Order #{activeOrder.trackingId || activeOrder._id.slice(-8)}</p>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {activeOrder.orderItems.length} items
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <User size={20} className="text-orange-200" />
                <span>{activeOrder.shippingAddress.fullName}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-orange-200" />
                <span>{activeOrder.shippingAddress.address}, {activeOrder.shippingAddress.city}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={20} className="text-orange-200" />
                <a href={`tel:${activeOrder.shippingAddress.phone}`} className="hover:underline">
                  {activeOrder.shippingAddress.phone}
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={`tel:${activeOrder.shippingAddress.phone}`}
                className="flex-1 bg-white text-orange-500 py-3 rounded-lg font-semibold text-center hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                Call Customer
              </a>
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Mark Delivered
              </button>
            </div>
          </motion.div>
        )}

        {/* All Orders List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">My Deliveries</h2>
          </div>
          
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No orders assigned yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <div key={order._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Order #{order.trackingId || order._id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.orderItems.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Delivered' 
                        ? 'bg-green-100 text-green-600'
                        : order.status === 'Out for Delivery'
                        ? 'bg-orange-100 text-orange-600'
                        : order.status === 'Assigned to Rider'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{order.shippingAddress.city}</span>
                    <span className="font-semibold text-gray-900">Rs. {order.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accept Order Modal */}
      {showAcceptModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Accept Order</h3>
              <button
                onClick={() => {
                  setShowAcceptModal(false)
                  setSelectedOrder(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-medium">{selectedOrder.trackingId || selectedOrder._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items:</span>
                <span className="font-medium">{selectedOrder.orderItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="font-bold text-green-600">Rs. {selectedOrder.totalPrice.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-gray-500 text-sm mb-2">Delivery Address:</p>
                <p className="text-gray-900">
                  {selectedOrder.shippingAddress.fullName}<br />
                  {selectedOrder.shippingAddress.address}<br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAcceptModal(false)
                  setSelectedOrder(null)
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Reject
              </button>
              <button
                onClick={() => acceptOrder(selectedOrder._id)}
                disabled={actionLoading}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Accept & Start
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && activeOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Delivery</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Photo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {deliveryPhoto ? (
                    <img src={deliveryPhoto} alt="Delivery" className="w-full h-48 object-cover rounded-lg" />
                  ) : (
                    <label className="cursor-pointer block">
                      <Camera size={48} className="mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-500">Click to take photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoCapture}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Notes (Optional)
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Any special instructions or notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={markAsDelivered}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Confirm Delivery
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

