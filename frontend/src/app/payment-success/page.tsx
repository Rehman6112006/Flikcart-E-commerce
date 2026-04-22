'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Home, Package, ShoppingBag, Clock, CreditCard } from 'lucide-react'

export default function PaymentSuccessPage() {
  const [orderId, setOrderId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const orderIdFromUrl = urlParams.get('orderId')
    const paymentMethodFromUrl = urlParams.get('paymentMethod')
    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl)
    }
    if (paymentMethodFromUrl) {
      setPaymentMethod(paymentMethodFromUrl)
    }
  }, [])

  const isCardPayment = paymentMethod === 'card'
  const isCOD = paymentMethod === 'cod'
  const isJazzCash = paymentMethod === 'jazzcash'

  // Conditional text based on payment method
  const getTitle = () => {
    if (isCardPayment) return 'Payment Successful!'
    if (isCOD) return 'Order Placed Successfully!'
    return 'Payment Pending Verification'
  }

  const getSubtitle = () => {
    if (isCardPayment) return 'Thank you for your payment'
    if (isCOD) return 'Your order has been placed successfully'
    return 'Your payment is being verified'
  }

  const getDescription = () => {
    if (isCardPayment) return 'Your order has been confirmed and is being processed'
    if (isCOD) return 'Payment will be collected upon delivery'
    return 'We will verify your payment shortly'
  }

  const getPaymentStatusText = () => {
    if (isCardPayment) return 'Payment confirmed via Stripe'
    if (isCOD) return 'Cash on Delivery - Pay on delivery'
    return 'Awaiting payment verification'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-6 lg:p-12 max-w-lg w-full text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <Check className="w-12 h-12 text-white" strokeWidth={4} />
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3"
        >
          {getTitle()}
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-2"
        >
          {getSubtitle()}
        </motion.p>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-gray-500 mb-6"
        >
          {getDescription()}
        </motion.p>

        {orderId && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-50 rounded-xl p-4 mb-6"
          >
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-mono text-lg font-bold text-gray-800">{orderId.slice(-8).toUpperCase()}</p>
          </motion.div>
        )}

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-3 mb-8"
        >
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Package size={18} className="text-green-500" />
            <span className="text-sm">Order will be delivered within 3-5 business days</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Check size={18} className="text-green-500" />
            <span className="text-sm">{getPaymentStatusText()}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <Link 
            href={`/dashboard?tab=orders&orderId=${orderId}&highlight=true`} 
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
          >
            <Package size={20} />
            View My Orders
          </Link>
          <Link 
            href="/products" 
            className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            <ShoppingBag size={20} />
            Continue Shopping
          </Link>
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-all"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

