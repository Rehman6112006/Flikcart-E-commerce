'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp, AlertTriangle, Loader2 } from 'lucide-react'

export default function ReturnRefundPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [returnForm, setReturnForm] = useState({
    orderId: '',
    productName: '',
    reason: '',
    description: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [showOrderDropdown, setShowOrderDropdown] = useState(false)

  // Load user's orders on mount
  useState(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/myorders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setUserOrders(data.filter((o: any) => o.status === 'Delivered'))
        })
        .catch(() => {})
    }
  })

  const faqs = [
    {
      question: 'What is the return policy?',
      answer: 'We offer a 7-day return policy for most products. Items must be unused, in original packaging, and accompanied by the receipt. Certain items like cosmetics, personal care items, and opened electronics may not be eligible for return due to hygiene and safety reasons.'
    },
    {
      question: 'How do I initiate a return?',
      answer: 'To initiate a return, fill out the form above with your order ID and reason for return. Our team will review your request within 24-48 hours and respond with further instructions.'
    },
    {
      question: 'Who pays for return shipping?',
      answer: 'If the return is due to our error (damaged, defective, or wrong item), we will cover the return shipping costs. For other returns, the customer is responsible for the shipping fees.'
    },
    {
      question: 'How long does the refund take?',
      answer: 'Once we receive and inspect your returned item, the refund will be processed within 5-7 business days. The amount will be credited to your original payment method.'
    },
    {
      question: 'Can I exchange an item instead of returning it?',
      answer: 'Yes, we offer exchanges for different sizes, colors, or products of equal value. Please indicate your preference in the return form.'
    },
    {
      question: 'What if my item arrived damaged or defective?',
      answer: 'If your item arrived damaged or defective, please contact us immediately with photos of the damage. We will arrange for a replacement or full refund at no additional cost.'
    }
  ]

  const handleSelectOrder = (orderId: string) => {
    setReturnForm(prev => ({ ...prev, orderId }))
    setShowOrderDropdown(false)
    // Auto-fill product name from order
    const order = userOrders.find(o => o._id === orderId || (o.trackingNumber && o.trackingNumber === orderId))
    if (order?.orderItems?.length > 0) {
      setReturnForm(prev => ({ ...prev, productName: order.orderItems[0].name }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!returnForm.orderId || !returnForm.reason) {
      setError('Please fill in Order ID and Reason fields')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderId: returnForm.orderId,
          productName: returnForm.productName,
          reason: returnForm.reason,
          description: returnForm.description,
          status: 'Pending',
          userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?._id : null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to submit return request')

      setSubmitted(true)
      setReturnForm({ orderId: '', productName: '', reason: '', description: '' })
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Return & Refund Policy</h1>
          <p className="text-white/80">We want you to be completely satisfied with your purchase</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Return Process Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Package, title: 'Submit Request', desc: 'Fill out the return form with order details', color: 'bg-blue-100 text-blue-600' },
            { icon: Clock, title: 'Wait for Approval', desc: 'We review within 24-48 hours', color: 'bg-yellow-100 text-yellow-600' },
            { icon: CheckCircle, title: 'Get Refund', desc: 'Receive money back to your account', color: 'bg-green-100 text-green-600' }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm text-center"
            >
              <div className={`w-14 h-14 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <step.icon size={28} />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Return Request Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Request a Return</h2>
            
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Request Submitted!</h3>
                <p className="text-gray-600 mb-4">We have received your return request. Our team will contact you within 24-48 hours.</p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setReturnForm({ orderId: '', productName: '', reason: '', description: '' })
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Submit Another Request
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID *</label>
                  <input
                    type="text"
                    required
                    value={returnForm.orderId}
                    onChange={(e) => setReturnForm({ ...returnForm, orderId: e.target.value })}
                    placeholder="e.g., ORD-123456"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={returnForm.productName}
                    onChange={(e) => setReturnForm({ ...returnForm, productName: e.target.value })}
                    placeholder="Enter product name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return *</label>
                  <select
                    required
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="">Select a reason</option>
                    <option value="damaged">Item Damaged/Defective</option>
                    <option value="wrong">Wrong Item Received</option>
                    <option value="not">Not as Described</option>
                    <option value="size">Size doesn't fit</option>
                    <option value="quality">Quality not satisfactory</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={returnForm.description}
                    onChange={(e) => setReturnForm({ ...returnForm, description: e.target.value })}
                    placeholder="Please provide more details about your issue..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Submit Return Request
                </button>
              </form>
            )}
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-800">{faq.question}</span>
                    {expandedFaq === index ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  </button>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-start gap-3">
                <HelpCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Need More Help?</h4>
                  <p className="text-gray-600 text-sm mb-3">Contact our customer support team for any questions about returns.</p>
                  <Link href="/help" className="text-blue-600 font-medium hover:underline text-sm">
                    Contact Support →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Return Policy Details */}
        <div className="mt-12 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Return Policy Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                Eligible for Return
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Unused items in original packaging</li>
                <li>• Products with receipt/proof of purchase</li>
                <li>• Returns within 7 days of delivery</li>
                <li>• Damaged or defective items</li>
                <li>• Wrong item received</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <XCircle size={20} className="text-red-600" />
                Not Eligible for Return
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Used or washed items</li>
                <li>• Opened cosmetics/personal care</li>
                <li>• Downloadable software</li>
                <li>• Gift cards</li>
                <li>• Clearance/sale items</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
