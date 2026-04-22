'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Trash2, ShoppingCart, Star, ArrowRight } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/api'

interface Product {
  _id: string
  name: string
  price: number
  originalPrice: number
  category: string
  images: string[]
  rating: number
  reviews: number
}

const fallbackImages: Record<string, string[]> = {
  'Electronics': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300',
  ],
  'Fashion': [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300',
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300',
  ],
  'Home & Living': [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300',
    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=300',
  ],
  'Books & Media': [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300',
  ],
}

const defaultImages = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300',
]

function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) {
    return product.images[0]
  }
  return fallbackImages[product.category]?.[0] || defaultImages[0]
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
      fetchProducts(JSON.parse(savedWishlist))
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProducts = async (wishlistIds: string[]) => {
    try {
      const response = await fetch(API_ENDPOINTS.products)
      const data = await response.json()
      const allProducts = data.products || data
      
      const wishlistProducts = allProducts.filter((p: Product) => wishlistIds.includes(p._id))
      setProducts(wishlistProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
    setLoading(false)
  }

  const removeFromWishlist = (productId: string) => {
    const newWishlist = wishlist.filter(id => id !== productId)
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
    setProducts(products.filter(p => p._id !== productId))
    setToast('Removed from wishlist')
    setTimeout(() => setToast(null), 2000)
  }

  // Check if user is logged in
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  const addToCart = (product: Product) => {
    // Check if logged in - redirect to login if not
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=cart'
      return
    }
    
    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: getProductImage(product),
      quantity: 1
    }
    
    const savedCart = localStorage.getItem('cart')
    let cart = savedCart ? JSON.parse(savedCart) : []
    
    const existingIndex = cart.findIndex((item: any) => item.id === cartItem.id)
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1
    } else {
      cart.push(cartItem)
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    setToast('Added to cart!')
    setTimeout(() => setToast(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 50 }}
            className="fixed top-24 right-4 z-50 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Heart className="text-orange-500 fill-current" size={32} />
            My Wishlist
          </h1>
          <p className="text-gray-600 mt-2">{products.length} products in your wishlist</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">💝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Start adding products you love to your wishlist</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Browse Products <ArrowRight size={20} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <Link href={`/product/${product._id}`}>
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.preventDefault()
                          removeFromWishlist(product._id)
                        }}
                        className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                      </div>
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                    <Link href={`/product/${product._id}`}>
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">({product.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-blue-600">${product.price}</span>
                        <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(product)}
                        className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <ShoppingCart size={18} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
