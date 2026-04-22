'use client'

import { Header } from '@/components/Header'
import { motion } from 'framer-motion'
import { Store, Truck, Shield, Award, Users, Globe, Mail, Phone, MapPin } from 'lucide-react'

export default function AboutPage() {
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About Flikcart</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Flikcart is your one-stop destination for all your shopping needs. We bring you the best products at the most affordable prices.
            </p>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">1800-123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">support@flikcart.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">Bangalore, Karnataka, India</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Why Choose Us */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {[
              { icon: Store, title: 'Wide Range of Products', desc: 'From electronics to fashion, we have everything you need' },
              { icon: Truck, title: 'Fast Delivery', desc: 'Get your products delivered within 2-3 business days' },
              { icon: Shield, title: 'Secure Payments', desc: '100% secure payment processing with buyer protection' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm text-center"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon size={28} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Our Mission */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-4">
              At Flikcart, we believe shopping should be simple, enjoyable, and accessible to everyone. 
              Our mission is to provide a seamless online shopping experience with the widest selection of products, 
              competitive prices, and exceptional customer service.
            </p>
            <p className="text-gray-600">
              We are committed to offering authentic products, ensuring fast delivery, and providing 
              round-the-clock customer support to make your shopping experience delightful.
            </p>
          </motion.div>

          {/* Careers */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 rounded-xl shadow-sm mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Careers at Flikcart</h2>
            <p className="text-gray-600 mb-4">
              Join our team and be part of India's fastest-growing e-commerce platform. 
              We offer exciting career opportunities in various departments:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Software Development',
                'Data Science & Analytics',
                'Product Management',
                'Marketing & Sales',
                'Customer Service',
                'Logistics & Supply Chain',
                'Finance & Accounting',
                'Human Resources'
              ].map((role) => (
                <div key={role} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Award size={18} className="text-green-600" />
                  <span className="text-gray-700">{role}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-gray-600">
              To apply, send your resume to <span className="text-blue-600">careers@flikcart.com</span>
            </p>
          </motion.div>

          {/* Flikcart Stories */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-xl shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Flikcart Stories</h2>
            <p className="text-gray-600 mb-4">
              Flikcart Stories is our initiative to share inspiring stories from our customers, 
              partners, and team members. We believe in celebrating success and learning from 
              experiences that shape our journey.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Customer Success</h3>
                <p className="text-gray-600 text-sm">Thousands of customers trust Flikcart for their daily shopping needs. Read their experiences and reviews.</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Seller Stories</h3>
                <p className="text-gray-600 text-sm">Our seller partners grow their businesses with Flikcart. Discover their success journeys.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
