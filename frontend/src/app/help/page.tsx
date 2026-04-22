'use client'

import { Header } from '@/components/Header'
import { motion } from 'framer-motion'
import { HelpCircle, MessageCircle, Phone, Mail, Clock, CreditCard, Truck, RotateCcw, Shield } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to frequently asked questions or get in touch with our support team.
            </p>
          </motion.div>

          {/* Contact Options */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with us', color: 'bg-green-100 text-green-600' },
              { icon: Phone, title: 'Call Us', desc: '1800-123-4567', color: 'bg-blue-100 text-blue-600' },
              { icon: Mail, title: 'Email', desc: 'support@flikcart.com', color: 'bg-purple-100 text-purple-600' },
              { icon: Clock, title: 'Working Hours', desc: '24/7 Available', color: 'bg-orange-100 text-orange-600' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-4 rounded-xl shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <item.icon size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Payments Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={28} className="text-blue-600" />
              Payments
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Flikcart offers multiple secure payment options to make your shopping experience seamless:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Credit/Debit Cards:</strong> We accept all major Visa, Mastercard, and RuPay cards</li>
                <li><strong>UPI:</strong> Pay instantly using UPI apps like Google Pay, PhonePe, Paytm</li>
                <li><strong>Net Banking:</strong> Direct bank transfer from 50+ Indian banks</li>
                <li><strong>Digital Wallets:</strong> Paytm, Amazon Pay, Mobikwik, FreeCharge</li>
                <li><strong>Cash on Delivery:</strong> Pay when you receive your order</li>
                <li><strong>EMI:</strong> Easy installments with 0% interest on select cards</li>
              </ul>
              <p className="mt-4">
                <strong>Security:</strong> All transactions are encrypted and secure. We never store your complete card details.
              </p>
            </div>
          </motion.div>

          {/* Shipping Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck size={28} className="text-green-600" />
              Shipping Information
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                We provide fast and reliable shipping across India:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Standard Delivery:</strong> 5-7 business days (Free on orders above ₹500)</li>
                <li><strong>Express Delivery:</strong> 2-3 business days (₹99 delivery charge)</li>
                <li><strong>Same Day Delivery:</strong> Available in select cities (₹199)</li>
                <li><strong>Next Day Delivery:</strong> Order before 6 PM for next day delivery (₹149)</li>
              </ul>
              <p className="mt-4">
                <strong>Tracking:</strong> You will receive tracking details via SMS and email once your order is shipped. 
                Track your order in real-time through the "My Orders" section.
              </p>
              <p className="mt-2">
                <strong>Delivery Areas:</strong> We deliver to 20,000+ pin codes across India. Enter your pin code on product pages to check delivery availability.
              </p>
            </div>
          </motion.div>

          {/* Cancellation & Returns */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RotateCcw size={28} className="text-orange-600" />
              Cancellation & Returns
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Cancellation Policy:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cancel orders before shipment for full refund</li>
                <li>Once shipped, cancellation may not be possible</li>
                <li>To cancel, go to "My Orders" and click "Cancel Order"</li>
                <li>Refunds processed within 5-7 business days</li>
              </ul>
              
              <p className="mt-4">
                <strong>Return Policy:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>30-day return window for most products</li>
                <li>Item must be unused and in original packaging</li>
                <li>Free return pickup for most items</li>
                <li>Refund to original payment method or bank account</li>
                <li>Replacement available for defective items</li>
              </ul>
              <p className="mt-4">
                <strong>How to Return:</strong> Visit "My Orders" - Select the order - Click "Return" - Schedule pickup - Pack the item
              </p>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle size={28} className="text-purple-600" />
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {[
                { q: 'How do I track my order?', a: 'You can track your order by logging into your account and visiting the "My Orders" section. You will find real-time tracking information for all your orders.' },
                { q: 'What is the return policy?', a: 'We offer a 30-day return policy for most products. If you are not satisfied with your purchase, you can return it within 30 days for a full refund or replacement.' },
                { q: 'How do I contact customer support?', a: 'You can reach our customer support team through the "Help" section on our website, or by calling our helpline at 1800-123-4567. We are available 24/7 to assist you.' },
                { q: 'What payment methods are accepted?', a: 'We accept all major credit cards, debit cards, UPI, net banking, and digital wallets. All transactions are secure and encrypted.' },
                { q: 'How do I cancel my order?', a: 'You can cancel your order before it is shipped by visiting the "My Orders" section and clicking on "Cancel Order". Once shipped, cancellation may not be possible.' },
                { q: 'Do you offer cash on delivery?', a: 'Yes, we offer Cash on Delivery (COD) for most locations. You can select this option during checkout.' },
                { q: 'How can I get a refund?', a: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method.' },
                { q: 'Is my personal information secure?', a: 'Yes, we use industry-standard encryption to protect your personal and payment information. We never share your data with third parties.' }
              ].map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                  <details className="group">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none bg-gray-50">
                      <span className="font-semibold text-gray-900">{faq.q}</span>
                      <span className="transition-transform group-open:rotate-180">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-4 pb-4 text-gray-600">
                      {faq.a}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Report Infringement */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-8 rounded-xl shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={28} className="text-red-600" />
              Report Infringement
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                We respect intellectual property rights and expect our sellers to do the same. 
                If you believe your intellectual property has been infringed:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email us at <span className="text-blue-600">legal@flikcart.com</span></li>
                <li>Provide detailed description of the infringement</li>
                <li>Include proof of ownership (trademark/copyright registration)</li>
                <li>Provide your contact details for communication</li>
                <li>We will investigate and take appropriate action within 48 hours</li>
              </ul>
              <p className="mt-4">
                <strong>Note:</strong> False claims may result in legal action. Please ensure all information provided is accurate.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
