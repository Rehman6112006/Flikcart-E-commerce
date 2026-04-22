'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X, Home, ShoppingBag, CreditCard, HelpCircle, RefreshCw } from 'lucide-react'

export default function PaymentFailedPage() {
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    if (error) {
      setErrorMessage(decodeURIComponent(error))
    }
  }, [])

  // Retry payment - go back to checkout
  const handleRetry = () => {
    router.push('/checkout')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
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
          className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <X className="w-12 h-12 text-white" strokeWidth={4} />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3"
        >
          Payment Failed
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-2"
        >
          Unfortunately, your payment could not be processed
        </motion.p>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-gray-500 mb-6"
        >
          Don&apos;t worry! Your items are safe. Try again or use a different payment method.
        </motion.p>

        {errorMessage && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
          >
            <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-2 mb-8 bg-gray-50 rounded-xl p-4"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What you can try:</p>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">1</span>
            <span>Check your card details and try again</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">2</span>
            <span>Try a different card or bank account</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">3</span>
            <span>Select Cash on Delivery as alternative</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg cursor-pointer"
          >
            <RefreshCw size={20} />
            Retry Payment
          </button>
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
