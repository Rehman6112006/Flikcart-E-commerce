'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  Truck,
  User,
  RefreshCw,
  Home
} from 'lucide-react'

// Order status type
interface OrderData {
  trackingId: string
  status: string
  statusUpdatedAt: string
  isDelivered: boolean
  totalPrice: number
  orderItems: Array<{
    name: string
    quantity: number
    price: number
    image?: string
  }>
  shippingAddress: {
    fullName: string
    address: string
    city: string
    state: string
    phone: string
  }
  riderInfo?: {
    name: string
    phone: string
    photo?: string
    vehicle?: string
  } | null
  riderLocation?: {
    lat: number
    lng: number
    updatedAt: string
  } | null
  estimatedDeliveryTime?: string
  createdAt: string
  orderReceivedAt?: string
  processingAt?: string
  shippedAt?: string
  assignedToRiderAt?: string
  outForDeliveryAt?: string
  deliveredAt?: string
  cancelledAt?: string
}

// Status step interface
interface StatusStep {
  label: string
  completed: boolean
  current: boolean
  timestamp?: string
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const [trackingId, setTrackingId] = useState('')
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Check for trackingId in URL on mount
  useEffect(() => {
    const urlTrackingId = searchParams.get('trackingId')
    if (urlTrackingId) {
      setTrackingId(urlTrackingId)
      fetchOrder(urlTrackingId)
    }
  }, [searchParams])

  const fetchOrder = async (trackId: string) => {
    if (!trackId.trim()) {
      setError('Please enter a tracking ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/track-order?trackingId=${encodeURIComponent(trackId.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch order')
      }

      setOrderData(data)
      setLastUpdated(new Date())
    } catch (err: any) {
      setError(err.message)
      setOrderData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrder(trackingId)
  }

  // Auto-refresh every 30 seconds when order is out for delivery
  useEffect(() => {
    if (orderData && (orderData.status === 'Out for Delivery' || orderData.status === 'Assigned to Rider')) {
      const interval = setInterval(() => {
        fetchOrder(orderData.trackingId)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [orderData?.status, orderData?.trackingId])

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Delivered': return 'bg-green-500'
      case 'Out for Delivery': return 'bg-orange-500'
      case 'Assigned to Rider': return 'bg-blue-500'
      case 'Shipped': return 'bg-purple-500'
      case 'Processing': return 'bg-yellow-500'
      case 'Cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'Out for Delivery': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Assigned to Rider': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Shipped': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get status steps based on current status
  const getStatusSteps = (): StatusStep[] => {
    if (!orderData) return []

    const steps: StatusStep[] = [
      { label: 'Order Received', completed: true, current: orderData.status === 'Order Received', timestamp: orderData.orderReceivedAt },
      { label: 'Processing', completed: ['Processing', 'Shipped', 'Assigned to Rider', 'Out for Delivery', 'Delivered'].includes(orderData.status), current: orderData.status === 'Processing', timestamp: orderData.processingAt },
      { label: 'Shipped', completed: ['Shipped', 'Assigned to Rider', 'Out for Delivery', 'Delivered'].includes(orderData.status), current: orderData.status === 'Shipped', timestamp: orderData.shippedAt },
      { label: 'Out for Delivery', completed: ['Out for Delivery', 'Delivered'].includes(orderData.status), current: orderData.status === 'Out for Delivery', timestamp: orderData.outForDeliveryAt },
      { label: 'Delivered', completed: orderData.status === 'Delivered', current: orderData.status === 'Delivered', timestamp: orderData.deliveredAt }
    ]

    if (orderData.status === 'Cancelled') {
      steps.push({ label: 'Cancelled', completed: true, current: true, timestamp: orderData.cancelledAt })
    }

    return steps
  }

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FlikCart</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors">
              <Home size={20} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
            <p className="text-gray-600">Enter your tracking ID to get real-time updates on your order</p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <form onSubmit={handleTrack} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  placeholder="Enter Tracking ID (e.g., TRK-ABC123)"
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Track
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-3 text-center">
              Your tracking ID is in your order confirmation email. It starts with "TRK-"
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
              <p className="text-red-600 flex items-center gap-2">
                <Package className="w-5 h-5" />
                {error}
              </p>
            </div>
          )}

          {/* Order Details */}
          {orderData && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className={`${getStatusColor(orderData.status)} px-6 py-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {orderData.status === 'Delivered' ? <CheckCircle className="w-8 h-8 text-white" /> : orderData.status === 'Out for Delivery' ? <Truck className="w-8 h-8 text-white" /> : <Package className="w-8 h-8 text-white" />}
                      <div>
                        <h2 className="text-xl font-bold text-white">{orderData.status}</h2>
                        <p className="text-white/80 text-sm">Tracking ID: {orderData.trackingId}</p>
                      </div>
                    </div>
                    <button onClick={() => fetchOrder(orderData.trackingId)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition" title="Refresh">
                      <RefreshCw className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Status Progress */}
                <div className="p-6">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
                      <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${((getStatusSteps().findIndex(s => s.current) || 0) / (getStatusSteps().length - 1)) * 100}%` }} />
                    </div>
                    {getStatusSteps().map((step, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step.completed ? 'bg-orange-500 text-white' : step.current ? 'bg-orange-100 text-orange-500 border-2 border-orange-500' : 'bg-gray-200 text-gray-400'}`}>
                          {step.completed ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                        </div>
                        <span className={`text-xs mt-2 text-center ${step.current ? 'font-semibold text-orange-600' : 'text-gray-500'}`}>{step.label}</span>
                        {step.timestamp && <span className="text-xs text-gray-400">{new Date(step.timestamp).toLocaleDateString()}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Info & Rider Info */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Order Details */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-2xl font-bold text-orange-600">Rs. {orderData.totalPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium">{formatDate(orderData.createdAt)}</p>
                    </div>
                    {orderData.estimatedDeliveryTime && (
                      <div>
                        <p className="text-sm text-gray-500">Estimated Delivery</p>
                        <p className="font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" />{formatDate(orderData.estimatedDeliveryTime)}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-3">Items</p>
                    <div className="space-y-2">
                      {orderData.orderItems.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">Rs. {item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">{orderData.shippingAddress.fullName}</p>
                        <p className="text-sm text-gray-500">{orderData.shippingAddress.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-600">{orderData.shippingAddress.address}</p>
                        <p className="text-gray-600">{orderData.shippingAddress.city}, {orderData.shippingAddress.state}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rider Info */}
                  {orderData.riderInfo && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3">Delivery Rider</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {orderData.riderInfo.photo ? <img src={orderData.riderInfo.photo} alt={orderData.riderInfo.name} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{orderData.riderInfo.name}</p>
                          {orderData.riderInfo.vehicle && <p className="text-sm text-gray-500">{orderData.riderInfo.vehicle}</p>}
                        </div>
                        <a href={`tel:${orderData.riderInfo.phone}`} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition">
                          <Phone className="w-5 h-5" />
                        </a>
                      </div>
                      {orderData.riderLocation && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />Live Location Available</p>
                          <p className="text-xs text-blue-500 mt-1">Lat: {orderData.riderLocation.lat}, Lng: {orderData.riderLocation.lng}</p>
                          <p className="text-xs text-blue-400">Updated: {formatDate(orderData.riderLocation.updatedAt)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {lastUpdated && <p className="text-center text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TrackOrderContent />
    </Suspense>
  )
}

