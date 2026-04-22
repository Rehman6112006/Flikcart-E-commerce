'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, CreditCard, Smartphone, Banknote, ArrowLeft, Lock, MapPin, Save, Loader2, Upload, X, Package, Clock } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { API_ENDPOINTS, getApiUrl } from '@/lib/api'

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const pakistanData: Record<string, string[]> = {
  'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot'],
  'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Swat'],
  'Balochistan': ['Quetta', 'Gwadar'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu'],
  'Azad Jammu & Kashmir': ['Muzaffarabad', 'Mirpur']
}

const JazzCashQR = () => (
  <div className="bg-white p-3 rounded-xl border-2 border-red-500">
    <div className="text-center mb-2"><span className="text-red-600 font-bold">JazzCash</span></div>
    <svg viewBox="0 0 200 200" className="w-24 h-24 mx-auto">
      <rect fill="white" width="200" height="200"/>
      <g fill="black">
        <rect x="20" y="20" width="50" height="50" fill="none" stroke="black" strokeWidth="4"/>
        <rect x="30" y="30" width="30" height="30"/>
        <rect x="130" y="20" width="50" height="50" fill="none" stroke="black" strokeWidth="4"/>
        <rect x="140" y="30" width="30" height="30"/>
        <rect x="20" y="130" width="50" height="50" fill="none" stroke="black" strokeWidth="4"/>
        <rect x="30" y="140" width="30" height="30"/>
        <rect x="85" y="85" width="30" height="30"/>
      </g>
    </svg>
    <p className="text-center text-xs text-gray-600 mt-1">Scan to pay</p>
  </div>
)

const EasyPaisaQR = () => (
  <div className="bg-white p-3 rounded-xl border-2 border-green-500">
    <div className="text-center mb-2"><span className="text-green-600 font-bold">EasyPaisa</span></div>
    <svg viewBox="0 0 200 200" className="w-24 h-24 mx-auto">
      <rect fill="white" width="200" height="200"/>
      <g fill="black">
        <rect x="20" y="20" width="50" height="50" fill="none" stroke="black" strokeWidth="4"/>
        <rect x="30" y="30" width="30" height="30"/>
        <rect x="130" y="20" width="50" height="50" fill="none" stroke="black" strokeWidth="4"/>
        <rect x="140" y="30" width="30" height="30"/>
        <rect x="20" y="130" width="50" height="50" fill="none" stroke="black" strokeWidth="4"/>
        <rect x="30" y="140" width="30" height="30"/>
        <rect x="85" y="85" width="30" height="30"/>
      </g>
    </svg>
    <p className="text-center text-xs text-gray-600 mt-1">Scan to pay</p>
  </div>
)

// Card input styling for Stripe
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: true,
}

function CheckoutForm({ total, onSuccess, onError, onProcessing }: { total: number; onSuccess: (paymentIntentId: string) => void; onError: (msg: string) => void; onProcessing?: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [cardError, setCardError] = useState('')

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setCardError('Stripe is not loaded. Please refresh the page.')
      return
    }

    setProcessing(true)
    setCardError('')
    
    // Notify parent that payment is being processed - SHOW DIALOG
    if (onProcessing) onProcessing()

    try {
      // Create payment intent on server
      const response = await fetch(API_ENDPOINTS.PAYMENT_INTENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: total,
          email: (document.querySelector('input[name="email"]') as HTMLInputElement)?.value || 'test@example.com'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setCardError(data.message || 'Failed to create payment intent')
        setProcessing(false)
        if (onError) onError(data.message || 'Failed to create payment intent')
        return
      }

      const { clientSecret, paymentIntentId } = data

      if (!clientSecret) {
        setCardError('Failed to create payment intent. Please try again.')
        setProcessing(false)
        if (onError) onError('Failed to create payment intent')
        return
      }

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        setCardError('Card element not found. Please refresh the page.')
        setProcessing(false)
        if (onError) onError('Card element not found')
        return
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      })

      if (error) {
        const errorMsg = error.message || 'Payment failed. Please check your card details.'
        setCardError(errorMsg)
        if (onError) onError(errorMsg)
        setProcessing(false)
        return
      } 
      
      // Payment completed - call onSuccess with payment intent ID
      // Even if paymentIntent is null, we still call success to show dialog
      const intentId = paymentIntentId || (paymentIntent?.id) || 'pi_' + Date.now()
      console.log('Calling onSuccess with:', intentId)
      if (onSuccess) onSuccess(intentId)
      
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred. Please try again.'
      setCardError(errorMsg)
      if (onError) onError(errorMsg)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border-2 border-gray-200 rounded-xl bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      {cardError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {cardError}
        </div>
      )}
      <button
        type="button"
        disabled={!stripe || processing}
        onClick={handlePayment}
        className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock size={20} />
            Pay Rs. {total.toFixed(2)}
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
        <Lock size={12} />
        Secured by Stripe - PCI Compliant
      </p>
    </div>
  )
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [paymentError, setPaymentError] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  
  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showViewOrderBtn, setShowViewOrderBtn] = useState(false)
  const [formData, setFormData] = useState({
    email: '', firstName: '', lastName: '', phone: '', address: '', city: '', province: '', country: 'Pakistan'
  })
  
  // Transaction ID for JazzCash/EasyPaisa
  const [transactionId, setTransactionId] = useState('')
  const [transactionError, setTransactionError] = useState('')
  
  // JazzCash screenshot upload
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const { items, getTotal, clearCart } = useCartStore()
  const router = useRouter()
  const subtotal = getTotal()
  const shipping = 150 // Fixed shipping fee of Rs. 150
  const tax = subtotal * 0.02
  const discount = appliedCoupon ? appliedCoupon.discount : 0
  const total = subtotal + shipping + tax - discount

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/addresses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSavedAddresses(data) })
      .catch(console.error)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (name === 'province') setFormData(prev => ({ ...prev, city: '' }))
  }

  const handleAddressSelect = (addr: any) => {
    // Split fullName into firstName and lastName
    const nameParts = addr.fullName ? addr.fullName.split(' ') : []
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    
    setFormData({ 
      ...formData, 
      firstName,
      lastName,
      address: addr.address,
      city: addr.city,
      province: addr.state || '',
      phone: addr.phone || '',
      country: 'Pakistan'
    })
  }

  const saveAddressToAccount = async () => {
    if (!saveAddress) return
    const userStr = localStorage.getItem('user')
    if (!userStr) return
    const user = JSON.parse(userStr)
    try {
      // Replace existing address with new one (only one address allowed)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName: `${formData.firstName} ${formData.lastName}`,
          address: formData.address,
          city: formData.city,
          state: formData.province,
          country: 'Pakistan',
          phone: formData.phone,
          isDefault: true
        })
      })
    } catch (err) { console.error('Error saving address:', err) }
  }

  // Handle screenshot upload
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setPaymentScreenshot(base64)
        setScreenshotPreview(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeScreenshot = () => {
    setPaymentScreenshot(null)
    setScreenshotPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle coupon application
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }

    setApplyingCoupon(true)
    setCouponError('')

    try {
      const response = await fetch(API_ENDPOINTS.VALIDATE_COUPON, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount: subtotal
        })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          discount: data.discount
        })
        setCouponCode('')
      } else {
        setCouponError(data.message || 'Invalid coupon code')
      }
    } catch (error) {
      setCouponError('Failed to apply coupon. Please try again.')
    } finally {
      setApplyingCoupon(false)
    }
  }

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null)
  }

  // Helper: Create order (handles both authenticated and guest users)
  const createOrder = async (paymentMethodType: string, extraData: Record<string, any> = {}) => {
    const userStr = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    const userData = userStr ? JSON.parse(userStr) : null
    const isGuest = !userData || !token

    const orderBase = {
      orderItems: items.map(item => ({
        product: item.id, name: item.name, price: item.price,
        quantity: item.quantity, image: item.image
      })),
      shippingAddress: {
        fullName: `${formData.firstName} ${formData.lastName}`,
        address: formData.address, city: formData.city,
        state: formData.province, zipCode: formData.city || 'N/A', country: 'Pakistan', phone: formData.phone
      },
      paymentMethod: paymentMethodType,
      trackingNumber: `FK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      itemsPrice: subtotal, shippingPrice: shipping,
      taxPrice: tax, totalPrice: total,
      ...(appliedCoupon ? { couponCode: appliedCoupon.code, discountAmount: appliedCoupon.discount } : {}),
      ...extraData,
    }

    // Guest order - use public endpoint
    if (isGuest) {
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/guest-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderBase, email: formData.email }),
      })
    }

    // Authenticated user
    return fetch(API_ENDPOINTS.ORDERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...orderBase, user: userData._id || userData.id }),
    })
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('Payment success handler called with ID:', paymentIntentId)
    
    setShowPaymentDialog(true)
    setPaymentProcessing(true)
    setPaymentSuccess(false)
    setPaymentError('')
    
    try {
      const res = await createOrder('card', {
        paymentResult: {
          id: paymentIntentId,
          status: 'succeeded',
          email: formData.email
        },
        status: 'Processing',
        isPaid: true,
        paidAt: new Date(),
      })
      
      if (res.ok) {
        const data = await res.json()
        setOrderId(data._id)
        setOrderPlaced(true)
        clearCart()
        setPaymentProcessing(false)
        setPaymentSuccess(true)
        showViewOrderAfterDelay(2000)
      } else {
        setOrderPlaced(true)
        clearCart()
        setPaymentProcessing(false)
        setPaymentSuccess(true)
        showViewOrderAfterDelay(2000)
      }
    } catch (error: any) {
      console.error('Error creating order:', error)
      setOrderPlaced(true)
      clearCart()
      setPaymentProcessing(false)
      setPaymentSuccess(true)
      showViewOrderAfterDelay(2000)
    }
  }

  const handleViewMyOrders = () => {
    const isGuest = !localStorage.getItem('user') || !localStorage.getItem('token')
    if (orderId) {
      if (isGuest) {
        // Guest users go to track-order page
        router.push('/track-order')
      } else {
        router.push(`/dashboard?tab=orders&orderId=${orderId}&highlight=true`)
      }
    } else {
      isGuest ? router.push('/track-order') : router.push('/dashboard?tab=orders')
    }
  }

  // After payment success: wait 2 seconds then show "View Order" button
  const showViewOrderAfterDelay = (delayMs = 2000) => {
    setTimeout(() => {
      setShowViewOrderBtn(true)
    }, delayMs)
  }

  const handlePaymentError = (errorMsg: string) => {
    setPaymentError(errorMsg)
    setShowPaymentDialog(true)
    setPaymentProcessing(false)
    setPaymentSuccess(false)
    // Optionally redirect to failed page
    // window.location.href = '/payment-failed'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      if (step === 1 && saveAddress) await saveAddressToAccount()
      setStep(step + 1)
    } else {
      if (paymentMethod === 'card') {
        // For card payment, the form in step 3 will handle it
        return
      }
      
      setLoading(true)
      try {
        const isCOD = paymentMethod === 'cod'
        const res = await createOrder(paymentMethod, {
          status: isCOD ? 'Payment Pending' : 'Processing',
          isPaid: false,
        })
        
        const data = await res.json()
        
        console.log('[Checkout] Order response:', res.status, data)
        
        if (res.ok) {
          const savedOrderId = data._id
          setOrderId(savedOrderId)
          setOrderPlaced(true)
          clearCart()
          setShowPaymentDialog(true)
          setPaymentProcessing(false)
          setPaymentSuccess(true)
          showViewOrderAfterDelay(2000)
        } else {
          // Even on error, show success for UX (payment will be collected on delivery)
          // But log the error for debugging
          console.error('[Checkout] COD order failed:', data.message)
          alert(data.message || 'Failed to place order')
        }
      } catch (error: any) {
        alert(error.message || 'Error placing order')
      } finally {
        setLoading(false)
      }
    }
  }

  // Only show "cart empty" if no payment dialog/success state is active
  if (items.length === 0 && !orderPlaced && !showPaymentDialog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <Link href="/products" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  // Only show fallback success page if no payment dialog is active
  if (orderPlaced && !showPaymentDialog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-2">Order #{orderId.slice(-8)}</p>
          <div className="space-y-3 mt-6">
            <Link href="/dashboard" className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-xl">View Orders</Link>
            <Link href="/" className="block w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm lg:hidden">
        <div className="px-4 py-4">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600">
            <ArrowLeft size={20} /> Back to Cart
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mt-2">Checkout</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="bg-white shadow-sm hidden lg:block">
        <div className="container mx-auto px-4 py-6">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4">
            <ArrowLeft size={20} /> Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
        </div>
      </div>

      {/* Progress Steps - Mobile Responsive */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between lg:justify-center lg:gap-4">
            {['Shipping', 'Payment', 'Review'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step > index + 1 ? 'bg-green-500 text-white' : (step === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500')}`}>
                  {step > index + 1 ? <Check size={16} /> : index + 1}
                </div>
                <span className={`ml-2 text-xs lg:text-sm ${step >= index + 1 ? 'text-gray-800 font-medium' : 'text-gray-500'} hidden sm:inline`}>{label}</span>
                {index < 2 && <div className="w-8 lg:w-12 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Shipping */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Shipping Information</h2>
                  
                  {savedAddresses.length > 0 && (
                    <div className="mb-4 lg:mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><MapPin size={16} /> Saved Addresses</h3>
                      <div className="grid gap-3">
                        {savedAddresses.map((addr) => (
                          <button key={addr._id} type="button" onClick={() => handleAddressSelect(addr)}
                            className="p-3 lg:p-4 border-2 border-gray-200 rounded-xl text-left hover:border-blue-600 transition-all text-sm">
                            <p className="font-medium text-gray-800">{addr.firstName} {addr.lastName}</p>
                            <p className="text-gray-600">{addr.address}, {addr.city}</p>
                            <p className="text-gray-500">{addr.phone}</p>
                          </button>
                        ))}
                      </div>
                      <div className="my-4 border-t" />
                    </div>
                  )}

                  <div className="space-y-3 lg:space-y-4">
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="First Name" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Last Name" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                    </div>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Email" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="Phone (0300 1234567)" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="Full Address" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      <select name="province" value={formData.province} onChange={handleInputChange} required className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base bg-white">
                        <option value="">Select Province</option>
                        {Object.keys(pakistanData).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select name="city" value={formData.city} onChange={handleInputChange} required disabled={!formData.province} className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base bg-white disabled:bg-gray-100">
                        <option value="">Select City</option>
                        {formData.province && pakistanData[formData.province]?.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <input type="text" value="Pakistan" disabled className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 text-base" />
                    
                    <div className="flex items-center gap-3 p-3 lg:p-4 bg-blue-50 rounded-xl">
                      <input type="checkbox" id="saveAddress" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                      <label htmlFor="saveAddress" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"><Save size={18} /> Save address to my account</label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Payment Method</h2>
                  <div className="space-y-3 lg:space-y-4">
                    {[
                      { id: 'card', icon: CreditCard, label: 'Credit/Debit Card', desc: 'Visa, Mastercard - Secure Stripe Payment' },
                      { id: 'cod', icon: Banknote, label: 'Cash on Delivery', desc: 'Pay when you receive' }
                    ].map((method) => (
                      <label key={method.id} className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="w-5 h-5 text-blue-600" />
                        <method.icon className="w-5 lg:w-6 h-5 lg:h-6 text-gray-600" />
                        <div>
                          <p className="font-semibold text-gray-800 text-sm lg:text-base">{method.label}</p>
                          <p className="text-xs lg:text-sm text-gray-500">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="mt-4 lg:mt-6 space-y-3 lg:space-y-4">
                      <div className="p-3 lg:p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                          <Lock size={16} />
                          Secure Stripe Payment - Visa/Mastercard Accepted
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-green-700">Pay Rs. {total.toFixed(2)} in cash when your order is delivered.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Review & Pay */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Review & Pay</h2>
                  <div className="space-y-3 lg:space-y-4">
                    <div className="p-3 lg:p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base">Shipping Address</h3>
                      <p className="text-gray-600 text-sm">{formData.firstName} {formData.lastName}<br/>{formData.address}<br/>{formData.city}, {formData.province}<br/>Pakistan<br/>{formData.phone}</p>
                    </div>
                    <div className="p-3 lg:p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base">Payment Method</h3>
                      <p className="text-gray-600 text-sm capitalize">
                        {paymentMethod === 'card' ? 'Credit/Debit Card (Stripe)' : 'Cash on Delivery'}
                      </p>
                    </div>
                  </div>

                  {/* Card Payment Form */}
                  {paymentMethod === 'card' && (
                    <div className="mt-4 lg:mt-6">
                      <h3 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base flex items-center gap-2">
                        <CreditCard size={18} /> Enter Card Details
                      </h3>
                      <Elements stripe={stripePromise}>
                        <CheckoutForm 
                          total={total} 
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                          onProcessing={() => {
                            setShowPaymentDialog(true)
                            setPaymentProcessing(true)
                            setPaymentSuccess(false)
                            setPaymentError('')
                          }}
                        />
                      </Elements>
                      {paymentError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                          {paymentError}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 lg:gap-4 mt-4 lg:mt-6">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(step - 1)} className="px-4 lg:px-6 py-2.5 lg:py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-sm lg:text-base">
                    Back
                  </button>
                )}
                
                {step < 3 && (
                  <button type="submit" className="flex-1 px-4 lg:px-6 py-2.5 lg:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 text-sm lg:text-base">
                    {step === 1 ? 'Continue to Payment' : 'Continue to Review'}
                  </button>
                )}
                
                {step === 3 && paymentMethod !== 'card' && (
                  <button type="submit" disabled={loading} className="flex-1 px-4 lg:px-6 py-2.5 lg:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 text-sm lg:text-base">
                    {loading ? 'Processing...' : <><Lock size={18} /> Place Order</>}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Order Summary</h2>
              
              {/* Coupon Section */}
              <div className="mb-4">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon code"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                    <button 
                      onClick={applyCoupon}
                      disabled={applyingCoupon}
                      className="px-3 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <span className="text-green-700 font-medium text-sm">{appliedCoupon.code}</span>
                      <span className="text-green-600 text-xs ml-1">(-Rs. {appliedCoupon.discount})</span>
                    </div>
                    <button 
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-500 text-xs mt-1">{couponError}</p>
                )}
              </div>
              <div className="space-y-2 lg:space-y-3 border-t pt-3 lg:pt-4">
                <div className="flex justify-between text-gray-600 text-sm lg:text-base"><span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm lg:text-base"><span>Discount</span><span>-Rs. {discount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-gray-600 text-sm lg:text-base"><span>Shipping</span><span>Rs. {shipping.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600 text-sm lg:text-base"><span>Tax (2%)</span><span>Rs. {tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg lg:text-xl font-bold text-gray-800 pt-2 lg:pt-3 border-t"><span>Total</span><span>Rs. {total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog Box */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md text-center">
            {paymentProcessing && !paymentSuccess && (
              <>
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Payment</h3>
                <p className="text-gray-600">Please wait while we process your payment...</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Lock size={16} />
                  <span>Secure Payment</span>
                </div>
              </>
            )}
            
{paymentSuccess && (
  <>
    <motion.div 
      initial={{ scale: 0 }} 
      animate={{ scale: 1 }} 
      transition={{ delay: 0.2, type: 'spring' }}
      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
    >
      <Check className="w-10 h-10 text-green-600" />
    </motion.div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">
      {paymentMethod === 'card' ? 'Payment Successful!' : 'Order Placed - Payment Pending!'}
    </h3>
    <p className="text-gray-600 mb-1">
      {paymentMethod === 'card' 
        ? 'Thank you for your payment. Your order is confirmed.' 
        : 'Cash on Delivery order placed successfully. Pay upon delivery.'
      }
    </p>
                <p className="text-gray-600 mb-1">Your order has been placed successfully.</p>
                {!showViewOrderBtn ? (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                    <p className="text-sm text-green-600 font-medium">Preparing your order details...</p>
                  </div>
                ) : null}
                
                {orderId && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-5">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Order ID</p>
                    <p className="font-mono text-xl font-bold text-green-800 tracking-wider">{orderId.slice(-8).toUpperCase()}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                      <Clock size={14} />
                      <span>Status: Processing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
                      {paymentMethod === 'card' ? <CreditCard size={14} /> : <Banknote size={14} />}
                      <span>{paymentMethod === 'card' ? 'Paid via Card' : 'Cash on Delivery'} - Rs. {total.toFixed(0)}</span>
                    </div>
                  </div>
                )}
                
                {/* Order Items Quick Preview */}
                {items.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-5 max-h-32 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Order Summary ({items.length} item{items.length > 1 ? 's' : ''})</p>
                    <div className="space-y-1.5">
                      {items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">{item.quantity}x</span>
                          <span className="text-gray-700 truncate">{item.name}</span>
                          <span className="ml-auto text-gray-900 font-medium">Rs. {(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-xs text-gray-400 text-center">+{items.length - 3} more items</p>
                      )}
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold text-gray-800 text-sm">
                      <span>Total</span>
                      <span>Rs. {total.toFixed(0)}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {showViewOrderBtn ? (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={handleViewMyOrders}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Package size={18} />
                      View Order
                    </motion.button>
                  ) : (
                    <div className="w-full py-3 bg-gray-100 text-gray-400 font-semibold rounded-xl flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Please wait...
                    </div>
                  )}
                  <Link 
                    href="/products" 
                    className="block w-full py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-center transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </>
            )}
            
            {!paymentProcessing && !paymentSuccess && paymentError && (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Failed</h3>
                <p className="text-gray-600">{paymentError}</p>
                <button 
                  onClick={() => setShowPaymentDialog(false)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

