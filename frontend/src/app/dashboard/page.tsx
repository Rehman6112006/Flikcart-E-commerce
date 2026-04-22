'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Package, User, Settings, EyeOff, Save, Trash2, Menu, X, Heart, MapPin, RotateCcw, ArrowRight, Check, Bell, Moon, Sun, Camera, Trash, Mail, Phone, Calendar, ShoppingBag, Truck, Clock, AlertTriangle, Download } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/api'

interface OrderItem {
  product: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface ShippingAddress {
  _id?: string
  fullName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

interface Order {
  _id: string
  orderItems: OrderItem[]
  totalPrice: number
  status: string
  createdAt: string
  shippingAddress: ShippingAddress
  paymentMethod: string
  trackingNumber?: string
  isPaid?: boolean
}

interface WishlistProduct {
  _id: string
  name: string
  price: number
  originalPrice: number
  category: string
  images: string[]
  rating: number
  reviews: number
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState('orders')
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewingProduct, setReviewingProduct] = useState<{ orderId: string; productId: string; productName: string; image: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState('')
  
  // Profile state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  
  // Settings state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')

  // New settings state
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(true)
  
  // State for new order banner
  const [newOrderId, setNewOrderId] = useState<string | null>(null)
  const [showNewOrderBanner, setShowNewOrderBanner] = useState(false)

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>([])
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([])

  // Return request state
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnOrder, setReturnOrder] = useState<Order | null>(null)
  const [returnForm, setReturnForm] = useState({ reason: '', description: '' })
  const [returnSubmitting, setReturnSubmitting] = useState(false)
  const [returnSuccess, setReturnSuccess] = useState('')

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelSuccess, setCancelSuccess] = useState(false)

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const userData = JSON.parse(userStr)
    setUser(userData)
    setName(userData.name || '')
    setPhone(userData.phone || '')
    setProfilePhoto(userData.avatar || null)
    fetchOrders()
    fetchWishlist()
    
    // Load dark mode from localStorage
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
    
    // Load notification preferences
    const savedEmailNotif = localStorage.getItem('emailNotifications')
    if (savedEmailNotif !== null) {
      setEmailNotifications(savedEmailNotif === 'true')
    }
    
    const savedSmsNotif = localStorage.getItem('smsNotifications')
    if (savedSmsNotif !== null) {
      setSmsNotifications(savedSmsNotif === 'true')
    }
    
    const tab = searchParams.get('tab') || 'orders'
    setActiveTab(tab)
    const highlightOrderId = searchParams.get('orderId')
    if (highlightOrderId) {
      setNewOrderId(highlightOrderId)
      setShowNewOrderBanner(true)
    }
  }, [searchParams, router])

  const getToken = () => localStorage.getItem('token')

  // Get removed order IDs from localStorage
  const getRemovedOrderIds = (): string[] => {
    const saved = localStorage.getItem('removedOrders')
    return saved ? JSON.parse(saved) : []
  }

  // Save removed order ID to localStorage
  const saveRemovedOrderId = (orderId: string) => {
    const removedIds = getRemovedOrderIds()
    if (!removedIds.includes(orderId)) {
      removedIds.push(orderId)
      localStorage.setItem('removedOrders', JSON.stringify(removedIds))
    }
  }

  // Filter out removed orders from the list
  const getFilteredOrders = (ordersList: Order[]): Order[] => {
    const removedIds = getRemovedOrderIds()
    return ordersList.filter(order => !removedIds.includes(order._id))
  }

  const fetchOrders = async () => {
    try {
      const token = getToken()
      if (!token) {
        console.warn('[Dashboard] No auth token found')
        return
      }
      
      // Use /myorders endpoint - it extracts user ID from JWT token directly
      // This avoids any field mismatch between localStorage (_id vs id) & DB
      console.log('[Dashboard] Fetching orders from /api/orders/myorders...')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/myorders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      console.log('[Dashboard] Fetch response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('[Dashboard] Orders received:', data.length, 'orders', data.map((o: any) => ({ _id: o._id, status: o.status, itemsCount: o.orderItems?.length })))
        // Filter out removed orders from localStorage
        const filteredOrders = getFilteredOrders(data)
        setOrders(filteredOrders)
        if (!filteredOrders.length && data.length > 0) {
          console.log('[Dashboard] All orders filtered as removed')
        }
      } else {
        const errData = await res.json().catch(() => null)
        console.error('[Dashboard] Fetch orders failed:', res.status, errData)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWishlist = () => {
    const saved = localStorage.getItem('wishlist')
    if (saved) {
      const ids = JSON.parse(saved)
      setWishlist(ids)
      fetchWishlistProducts(ids)
    }
  }

  const fetchWishlistProducts = async (ids: string[]) => {
    try {
      const res = await fetch(API_ENDPOINTS.products)
      const data = await res.json()
      const products = data.products || data
      const wishlistItems = products.filter((p: WishlistProduct) => ids.includes(p._id))
      setWishlistProducts(wishlistItems)
    } catch (error) {
      console.error('Error fetching wishlist products:', error)
    }
  }

  const removeFromWishlist = (productId: string) => {
    const newWishlist = wishlist.filter(id => id !== productId)
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
    setWishlistProducts(wishlistProducts.filter(p => p._id !== productId))
  }

  const addToCart = (product: WishlistProduct) => {
    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      quantity: 1
    }
    
    const savedCart = localStorage.getItem('cart')
    let cart = savedCart ? JSON.parse(savedCart) : []
    
    const existingIndex = cart.findIndex((item: any) => item._id === cartItem._id)
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1
    } else {
      cart.push(cartItem)
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    alert('Added to cart!')
  }

  const handleDeleteOrder = async (removeFromList: boolean = false) => {
    if (!cancellingOrder) return
    
    if (!cancelReason.trim() && !removeFromList) {
      alert('Please enter a reason for cancellation')
      return
    }
    
    try {
      const token = getToken()
      
      if (removeFromList) {
        // Just remove from local list without calling API
        const updatedOrders = orders.filter(o => o._id !== cancellingOrder._id)
        setOrders(updatedOrders)
        setShowCancelModal(false)
        setCancellingOrder(null)
        setCancelReason('')
        setCancelSuccess(false)
        return
      }
      
      // Use the dedicated cancel endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${cancellingOrder._id}/cancel`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          cancelReason: cancelReason 
        })
      })
      
      if (res.ok) {
        // Show success state in the dialog
        setCancelSuccess(true)
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Error cancelling order. Please try again.')
    }
  }

  const closeCancelModal = (removeOrder: boolean = false) => {
    if (removeOrder && cancellingOrder) {
      // Save to localStorage so it persists after refresh
      saveRemovedOrderId(cancellingOrder._id)
      // Use functional update to ensure we have the latest state
      setOrders(prevOrders => prevOrders.filter(o => o._id !== cancellingOrder._id))
    }
    setShowCancelModal(false)
    setCancellingOrder(null)
    setCancelReason('')
    setCancelSuccess(false)
  }
  
  const handleCloseCancelModal = () => {
    closeCancelModal()
  }

  const handleRemoveFromList = () => {
    closeCancelModal(true)
  }

  // Remove delivered order from local list only (not from database)
  const removeDeliveredOrder = (orderId: string) => {
    // Save to localStorage so it persists after refresh
    saveRemovedOrderId(orderId)
    // Optimistically update the state to remove the order immediately
    setOrders(prevOrders => prevOrders.filter(o => o._id !== orderId))
    // Force a re-render by temporarily setting loading state
    setLoading(true)
    setTimeout(() => setLoading(false), 100)
  }

  const handleDone = () => {
    closeCancelModal(false)
  }

  const openCancelModal = (order: Order) => {
    setCancellingOrder(order)
    setCancelReason('')
    setShowCancelModal(true)
  }

  // Return request handlers
  const openReturnModal = (order: Order) => {
    setReturnOrder(order)
    setReturnForm({ reason: '', description: '' })
    setReturnSuccess('')
    setShowReturnModal(true)
  }

  const submitReturnRequest = async () => {
    if (!returnOrder || !returnForm.reason) return
    
    setReturnSubmitting(true)
    try {
      // In production, this would send to backend
      // For now, just show success
      setReturnSuccess('Return request submitted successfully! We will contact you within 24-48 hours.')
      setTimeout(() => {
        setShowReturnModal(false)
        setReturnSuccess('')
      }, 3000)
    } catch (error) {
      console.error('Error submitting return:', error)
    } finally {
      setReturnSubmitting(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg('')
    if (name.length < 2 || phone.length < 10) {
      setProfileMsg('Please fill all fields correctly')
      return
    }
    setProfileLoading(true)
    try {
      const token = getToken()
      const res = await fetch(API_ENDPOINTS.profile, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('user', JSON.stringify(data))
        setUser(data)
        setProfileMsg('Profile updated successfully!')
      } else {
        setProfileMsg('Failed to update profile')
      }
    } catch (error) {
      setProfileMsg('Error updating profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsMsg('')
    if (newPassword !== confirmPassword) {
      setSettingsMsg('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setSettingsMsg('Password must be at least 6 characters')
      return
    }
    setSettingsLoading(true)
    try {
      const token = getToken()
      const res = await fetch(API_ENDPOINTS.changePassword, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to change password')
      setSettingsMsg('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setSettingsMsg(err.message)
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  // Profile photo upload handler
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }
    
    setUploadingPhoto(true)
    
    // Convert to base64 for local storage (in production, upload to cloud storage)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      setProfilePhoto(base64)
      
      // Save to localStorage
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        userData.avatar = base64
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
      }
      setUploadingPhoto(false)
    }
    reader.readAsDataURL(file)
  }

  // Dark mode toggle
  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Email notifications toggle
  const toggleEmailNotifications = () => {
    const newValue = !emailNotifications
    setEmailNotifications(newValue)
    localStorage.setItem('emailNotifications', String(newValue))
  }

  // SMS notifications toggle
  const toggleSmsNotifications = () => {
    const newValue = !smsNotifications
    setSmsNotifications(newValue)
    localStorage.setItem('smsNotifications', String(newValue))
  }

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm')
      return
    }
    
    setDeletingAccount(true)
    try {
      const token = getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        alert('Account deleted successfully')
        localStorage.clear()
        router.push('/')
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Error deleting account')
    } finally {
      setDeletingAccount(false)
    }
  }

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    pending: orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length
  }

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`)
  }

  const openReviewModal = (orderId: string, productId: string, productName: string, image: string) => {
    setReviewingProduct({ orderId, productId, productName, image })
    setReviewRating(5)
    setReviewComment('')
    setReviewSuccess('')
    setShowReviewModal(true)
  }

  const submitReview = async () => {
    if (!reviewingProduct || !reviewComment.trim()) return
    
    setSubmittingReview(true)
    try {
      const token = getToken()
      const res = await fetch(API_ENDPOINTS.createReview, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: reviewingProduct.productId,
          rating: reviewRating,
          comment: reviewComment.trim()
        })
      })

      if (res.ok) {
        setReviewSuccess('Review submitted successfully!')
        setTimeout(() => {
          setShowReviewModal(false)
          setReviewSuccess('')
        }, 2000)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmittingReview(false)
    }
  }

  const calculateOrderTotals = (order: Order) => {
    const subtotal = order.orderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
    const shipping = 150 // Fixed shipping fee of Rs. 150
    const total = subtotal + shipping
    return { subtotal, shipping, total }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Get delivered orders for return (filter out removed orders)
  const deliveredOrders = getFilteredOrders(orders).filter(o => o.status === 'Delivered')

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm lg:hidden sticky top-14 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{user?.name}</h1>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Tab Navigation */}
        {mobileMenuOpen && (
          <div className="border-t bg-white overflow-x-auto">
            <nav className="flex whitespace-nowrap">
            <button onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false) }} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 ${activeTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                <Package size={16} /> Orders
              </button>
              <button onClick={() => { setActiveTab('returns'); setMobileMenuOpen(false) }} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 ${activeTab === 'returns' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                <RotateCcw size={16} /> Returns
              </button>
              <button onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false) }} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                <User size={16} /> Profile
              </button>
              <button onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false) }} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                <Settings size={16} /> Settings
              </button>
            </nav>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop Header */}
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 mb-4 lg:mb-6 hidden lg:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Desktop Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
              <nav className="space-y-2">
                <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'orders' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <Package size={20} /> My Orders
                </button>
                <button onClick={() => setActiveTab('returns')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'returns' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <RotateCcw size={20} /> Returns & Refunds
                </button>
                <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <User size={20} /> My Profile
                </button>
                <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'settings' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <Settings size={20} /> Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">My Orders</h2>

                {/* New Order Banner - shows when user comes from checkout */}


                {orders.length === 0 ? (
                  <div className="text-center py-8 lg:py-12">
                    <div className="text-5xl lg:text-6xl mb-4">📦</div>
                    <p className="text-gray-500 text-lg">No orders yet</p>
                    <Link href="/products" className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isNewOrder = newOrderId === order._id
                      return (
                        <motion.div 
                          key={order._id} 
                          initial={isNewOrder ? { opacity: 0, scale: 0.95, y: 10 } : false}
                          animate={isNewOrder ? { opacity: 1, scale: 1, y: 0 } : false}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className={`rounded-xl lg:rounded-2xl overflow-hidden hover:border-blue-200 transition-all ${
                            isNewOrder
                              ? 'border-[3px] border-green-500 shadow-lg shadow-green-100'
                              : 'border-2 border-gray-100'
                          }`}>

                        {/* NEW Order Badge */}
                        {isNewOrder && (
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold text-sm">
                              <Check size={14} /> NEW ORDER
                            </span>
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Just Placed</span>
                          </div>
                        )}

                        {/* Order Header */}
                        <div className="p-4 lg:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 lg:mb-4">
                            <div className="order-2 sm:order-1">
                              <p className="font-mono text-sm text-gray-500">
                                Order #{order._id.slice(-8)}
                                {order.trackingNumber && (
                                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                    TRK: {order.trackingNumber}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()} • {order.paymentMethod?.toUpperCase() || 'CARD'}</p>
                            </div>
                            <div className="order-1 sm:order-2 text-left sm:text-right">
                              <p className="font-bold text-lg lg:text-xl text-gray-900">Rs. {order.totalPrice?.toFixed(2)}</p>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                                order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                order.status === 'Out for Delivery' ? 'bg-orange-100 text-orange-700' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.status || 'Processing'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Order Items with Images */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Order Items:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {order.orderItems?.map((item, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-2 flex gap-2">
                                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                      <Image src={item.image} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    <p className="text-xs font-semibold text-blue-600">Rs. {item.price}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Price Breakdown */}
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Original Price:</span>
                              <span>Rs. {order.totalPrice?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Shipping:</span>
                              <span>Rs. 150.00</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-800 pt-1 border-t">
                              <span>Total:</span>
                              <span>Rs. {(order.totalPrice + 150).toFixed(2)}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2">

                            {order.trackingNumber && (
                              <Link href={`/track-order?trackingId=${order.trackingNumber}`} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 flex items-center justify-center gap-2 font-semibold text-sm">
                                Track Order
                              </Link>
                            )}
                            {order.status === 'Delivered' && (
                              <button onClick={() => order.orderItems?.[0] && openReviewModal(order._id, order.orderItems[0].product, order.orderItems[0].name, order.orderItems[0].image || '')} className="flex-1 py-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 flex items-center justify-center gap-2 font-semibold text-sm">
                                Write Review
                              </button>
                            )}
                            {order.status === 'Delivered' && (
                              <button onClick={() => openReturnModal(order)} className="flex-1 py-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 flex items-center justify-center gap-2 font-semibold text-sm">
                                Request Return
                              </button>
                            )}
                            {order.status === 'Delivered' && (
                              <button onClick={() => removeDeliveredOrder(order._id)} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 font-semibold text-sm">
                                <Trash2 size={16} /> Remove
                              </button>
                            )}
                            {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                              <button onClick={() => openCancelModal(order)} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 font-semibold text-sm">
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Returns Tab */}
            {activeTab === 'returns' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Returns & Refunds</h2>
                
                {deliveredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="text-gray-500">No delivered orders to return</p>
                    <p className="text-sm text-gray-400 mt-2">You can only return delivered orders</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm mb-4">Select an order to request a return:</p>
                    {deliveredOrders.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-mono text-sm text-gray-500">Order #{order._id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">{order.orderItems?.length} items • Rs. {order.totalPrice}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{order.status}</span>
                        </div>
                        <button onClick={() => openReturnModal(order)} className="w-full py-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 flex items-center justify-center gap-2 font-semibold text-sm">
                          <RotateCcw size={18} /> Request Return
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 p-4 bg-blue-50 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">Return Policy</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 7-day return policy for most items</li>
                    <li>• Items must be unused and in original packaging</li>
                    <li>• Damaged/defective items can be returned at no cost</li>
                    <li>• Refund processed within 5-7 business days</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Photo & Basic Info */}
                <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                  <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">My Profile</h2>
                  
                  {/* Profile Photo Section */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                        {profilePhoto ? (
                          <Image src={profilePhoto} alt="Profile" width={128} height={128} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl lg:text-5xl text-white font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                        <Camera size={18} />
                        <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                      </label>
                    </div>
                    {uploadingPhoto && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                  </div>

                  {/* Account Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Member Since</p>
                        <p className="text-sm font-medium text-gray-800">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                      <ShoppingBag size={24} className="mx-auto text-blue-600 mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{orderStats.total}</p>
                      <p className="text-xs text-gray-600">Total Orders</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
                      <Truck size={24} className="mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
                      <p className="text-xs text-gray-600">Delivered</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl text-center">
                      <Clock size={24} className="mx-auto text-yellow-600 mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl text-center">
                      <AlertTriangle size={24} className="mx-auto text-red-600 mb-2" />
                      <p className="text-2xl font-bold text-red-600">{orderStats.cancelled}</p>
                      <p className="text-xs text-gray-600">Cancelled</p>
                    </div>
                  </div>

                  {profileMsg && <div className={`mb-4 p-3 lg:p-4 rounded-xl text-sm ${profileMsg.includes('success') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{profileMsg}</div>}
                  
                  {/* Profile Edit Form */}
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" placeholder="Enter phone number" required />
                      </div>
                    </div>
                    <button type="submit" disabled={profileLoading} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                      <Save size={18} /> {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Account Settings</h2>
                <div className="max-w-md">
                  <h3 className="text-base lg:text-lg font-medium mb-4">Change Password</h3>
                  {settingsMsg && <div className={`mb-4 p-3 lg:p-4 rounded-xl text-sm ${settingsMsg.includes('success') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{settingsMsg}</div>}
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base pr-12" required />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          <EyeOff size={18} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
                    </div>
                    <button type="submit" disabled={settingsLoading} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold disabled:opacity-50">
                      {settingsLoading ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && reviewingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Write a Review</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 text-sm">{reviewingProduct.productName}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)} className="text-2xl">
                    {star <= reviewRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your experience..." className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600" rows={4} required />
            </div>

            {reviewSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm">{reviewSuccess}</div>}

            <button onClick={submitReview} disabled={submittingReview || !reviewComment.trim()} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && returnOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Request Return</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {returnSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw size={32} className="text-green-600" />
                </div>
                <p className="text-green-600 font-semibold">{returnSuccess}</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Order #{returnOrder._id.slice(-8)}</p>
                  <p className="text-sm text-gray-600">Total: Rs. {returnOrder.totalPrice}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Return *</label>
                  <select value={returnForm.reason} onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white" required>
                    <option value="">Select a reason</option>
                    <option value="damaged">Item Damaged/Defective</option>
                    <option value="wrong">Wrong Item Received</option>
                    <option value="not">Not as Described</option>
                    <option value="size">Size doesn't fit</option>
                    <option value="quality">Quality not satisfactory</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={returnForm.description} onChange={(e) => setReturnForm({ ...returnForm, description: e.target.value })} placeholder="Please provide more details..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl" rows={3} />
                </div>

                <button onClick={submitReturnRequest} disabled={returnSubmitting || !returnForm.reason} className="w-full py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50">
                  {returnSubmitting ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && cancellingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            {cancelSuccess ? (
              // Success State
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Order Cancelled!</h3>
                  <p className="text-gray-600 mb-6">Your order has been cancelled successfully.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleRemoveFromList()} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">
                    Remove from List
                  </button>
                  <button onClick={() => handleDone()} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
                    Done
                  </button>
                </div>
              </>
            ) : (
              // Confirmation State
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Cancel Order</h3>
                  <button onClick={() => handleCloseCancelModal()} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm font-medium">Are you sure you want to cancel this order?</p>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-600 text-sm"><span className="font-medium">Order #:</span> {cancellingOrder._id.slice(-8)}</p>
                  <p className="text-gray-600 text-sm"><span className="font-medium">Total:</span> Rs. {cancellingOrder.totalPrice?.toFixed(2)}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for cancellation *</label>
                  <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Please enter the reason for cancellation..." className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500" rows={3} required />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => closeCancelModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">
                    Keep in List
                  </button>
                  <button onClick={() => closeCancelModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">
                    Keep Order
                  </button>
                  <button onClick={() => handleRemoveFromList()} className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700">
                    Yes, Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardContent />
    </Suspense>
  )
}

