'use client'

import { Header } from '@/components/Header'
import { motion } from 'framer-motion'
import { Shield, Lock, FileText, Eye, RotateCcw, Truck, CreditCard, CheckCircle } from 'lucide-react'

export default function PolicyPage() {
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Privacy Policy & Terms</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your privacy is important to us. This policy outlines how we collect, use, and protect your information.
            </p>
          </motion.div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: RotateCcw, title: 'Return Policy', color: 'bg-green-100 text-green-600' },
              { icon: FileText, title: 'Terms of Use', color: 'bg-blue-100 text-blue-600' },
              { icon: Shield, title: 'Security', color: 'bg-purple-100 text-purple-600' },
              { icon: Eye, title: 'Privacy', color: 'bg-orange-100 text-orange-600' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-4 rounded-xl shadow-sm text-center"
              >
                <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <item.icon size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
              </motion.div>
            ))}
          </div>

          {/* Return Policy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <RotateCcw size={28} className="text-green-600" />
              Return Policy
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                We want you to be completely satisfied with your purchase. If for any reason you are not happy with a product, you can return it within 30 days.
              </p>
              
              <h3 className="font-semibold text-gray-900 mt-4">Eligibility for Returns:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Item must be unused, unworn, and in original packaging</li>
                <li>All tags, accessories, and freebies must be intact</li>
                <li>Product must be in resalable condition</li>
                <li>Original invoice or receipt must be presented</li>
                <li>Returns accepted within 30 days of delivery</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">Non-Returnable Items:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Personal care items, cosmetics, and fragrances</li>
                <li>Innerwear, socks, and lingerie</li>
                <li>Digital products and software</li>
                <li>Customized or personalized products</li>
                <li>Perishable items (food, flowers)</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">Refund Process:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Refund initiated within 5-7 business days after return pickup</li>
                <li>Amount credited to original payment method</li>
                <li>For COD orders, refund via bank account transfer</li>
                <li>Shipping charges non-refundable (unless product is defective)</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">How to Return:</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Go to "My Orders" in your account</li>
                <li>Select the order you want to return</li>
                <li>Click on "Return Item" button</li>
                <li>Select reason for return</li>
                <li>Schedule pickup (free for most items)</li>
                <li>Pack the item securely with original packaging</li>
              </ol>
            </div>
          </motion.div>

          {/* Terms of Use */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={28} className="text-blue-600" />
              Terms of Use
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                By accessing and using the Flikcart website and mobile application, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
              
              <h3 className="font-semibold text-gray-900 mt-4">1. Account Registration:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account confidentiality</li>
                <li>You must be at least 18 years of age to make purchases</li>
                <li>One account per user - multiple accounts not allowed</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">2. Product Information:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We strive for accurate product descriptions and pricing</li>
                <li>We reserve the right to correct any errors or omissions</li>
                <li>Product images are for representation purposes only</li>
                <li>Availability subject to change without notice</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">3. Order Acceptance:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We reserve the right to accept or refuse any order</li>
                <li>Order confirmation does not guarantee shipment</li>
                <li>We may cancel orders for any reason with full refund</li>
                <li>Pricing errors may be corrected at our discretion</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">4. Prohibited Activities:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violating any applicable laws or regulations</li>
                <li>Infringing upon intellectual property rights</li>
                <li>Submitting false or fraudulent information</li>
                <li>Interfering with the proper functioning of the site</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">5. Limitation of Liability:</h3>
              <p className="ml-4">
                Flikcart shall not be liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use our website or products. Our total liability shall not exceed the amount paid for the specific product.
              </p>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={28} className="text-purple-600" />
              Security
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                We take the security of your information seriously and implement various measures to protect your data.
              </p>
              
              <h3 className="font-semibold text-gray-900 mt-4">Data Protection:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SSL (Secure Socket Layer) encryption for all data transmission</li>
                <li>PCI-DSS compliant payment processing</li>
                <li>Secure data centers with 24/7 monitoring</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Multi-factor authentication for admin access</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">Payment Security:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We do not store your complete credit/debit card details</li>
                <li>All transactions are processed through secure payment gateways</li>
                <li>3D Secure verification for card transactions</li>
                <li>Tokenization for saved cards</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">Account Security:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Strong password requirements</li>
                <li>Login alerts for new devices</li>
                <li>Session timeout after inactivity</li>
                <li>Two-factor authentication option</li>
              </ul>

              <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-green-800">
                  Flikcart is PCI-DSS certified and follows industry best practices for data security.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Privacy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Eye size={28} className="text-orange-600" />
              Privacy Policy
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                This Privacy Policy describes how Flikcart collects, uses, and protects your personal information.
              </p>
              
              <h3 className="font-semibold text-gray-900 mt-4">Information We Collect:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personal Information:</strong> Name, email, phone number, address</li>
                <li><strong>Payment Information:</strong> Card details, UPI ID, bank account</li>
                <li><strong>Device Information:</strong> IP address, browser type, device ID</li>
                <li><strong>Usage Data:</strong> Pages visited, search history, preferences</li>
                <li><strong>Location Data:</strong> Approximate location for delivery</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">How We Use Your Information:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and fulfill your orders</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send order updates and delivery notifications</li>
                <li>Personalize your shopping experience</li>
                <li>Send promotional emails about new products and offers</li>
                <li>Improve our services and website functionality</li>
                <li>Prevent fraud and ensure security</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">Information Sharing:</h3>
              <p className="ml-4">
                We do not sell, trade, or otherwise transfer your personal information to outside parties except:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Trusted service providers who assist in our operations</li>
                <li>Delivery partners for order fulfillment</li>
                <li>Payment gateways for transaction processing</li>
                <li>Legal authorities when required by law</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">Your Rights:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Opt-out of promotional communications</li>
                <li>Request deletion of your account and data</li>
                <li>Lodge complaints with data protection authorities</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">Cookies:</h3>
              <p className="ml-4">
                We use cookies to enhance your browsing experience. You can choose to disable cookies through your browser settings, but this may affect certain features of our website.
              </p>

              <h3 className="font-semibold text-gray-900 mt-4">Contact Us:</h3>
              <p className="ml-4">
                For privacy-related concerns, contact us at <span className="text-blue-600">privacy@flikcart.com</span>
              </p>
            </div>
          </motion.div>

          {/* Sitemap */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-8 rounded-xl shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sitemap</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Shopping</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><a href="/products" className="hover:text-blue-600">All Products</a></li>
                  <li><a href="/products?category=Electronics" className="hover:text-blue-600">Electronics</a></li>
                  <li><a href="/products?category=Fashion" className="hover:text-blue-600">Fashion</a></li>
                  <li><a href="/products?category=Home" className="hover:text-blue-600">Home & Living</a></li>
                  <li><a href="/products?category=Sports" className="hover:text-blue-600">Sports</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Account</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><a href="/login" className="hover:text-blue-600">Login</a></li>
                  <li><a href="/signup" className="hover:text-blue-600">Sign Up</a></li>
                  <li><a href="/dashboard" className="hover:text-blue-600">My Account</a></li>
                  <li><a href="/cart" className="hover:text-blue-600">Shopping Cart</a></li>
                  <li><a href="/wishlist" className="hover:text-blue-600">Wishlist</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><a href="/help" className="hover:text-blue-600">Help Center</a></li>
                  <li><a href="/about" className="hover:text-blue-600">About Us</a></li>
                  <li><a href="/policy" className="hover:text-blue-600">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-blue-600">Contact Us</a></li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Contact Info */}
          <div className="mt-8 bg-blue-50 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Questions?</h3>
            <p className="text-gray-600 text-sm">
              If you have any questions about this Privacy Policy or Terms of Service, please contact us at 
              <span className="text-blue-600"> support@flikcart.com</span> or call 
              <span className="text-blue-600"> 1800-123-4567</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
