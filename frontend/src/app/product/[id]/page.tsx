'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, Minus, Plus, Check, Ruler, Palette } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
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
  description: string
}

const fallbackImages: Record<string, string[]> = {
  'Electronics': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=300',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300',
  ],
  'Fashion': [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=300',
  ],
  'Home & Living': [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300',
    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=300',
    'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=300',
  ],
  'Books & Media': [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300',
  ],
  'Beauty': [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300',
  ],
}

const defaultImages = [
  '/placeholder-product.svg',
  '/placeholder-product.svg',
  '/placeholder-product.svg',
  '/placeholder-product.svg',
]

function normalizeImageUrl(url: string): string {
  if (!url) return ''
  const trimmed = String(url).trim()
  // Already a full URL → return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  // Relative path starting with /uploads or /api → needs backend base URL
  if (trimmed.startsWith('/')) return `${process.env.NEXT_PUBLIC_API_URL}${trimmed}`
  // Relative path without leading slash (e.g., 'uploads/x.jpg')
  return `${process.env.NEXT_PUBLIC_API_URL}/${trimmed}`
}

function getProductImages(product: Product): string[] {
  const rawImages = product.images && Array.isArray(product.images) ? product.images : []
  if (rawImages.length > 0) {
    const normalized = rawImages.map(normalizeImageUrl).filter(Boolean)
    if (normalized.length > 0) return normalized
  }
  // Return category fallback images with full URLs
  const categoryFallbacks = fallbackImages[product.category]
  if (categoryFallbacks && categoryFallbacks.length > 0) {
    return categoryFallbacks
  }
  // Fallback to default Unsplash images
  return [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600',
  ]
}

function needsSizeSelector(category: string): boolean {
  const fashionCategories = ['Fashion', 'Clothing', 'Shoes', 'Apparel']
  return fashionCategories.some(cat => category.toLowerCase().includes(cat.toLowerCase()))
}

function needsColorSelector(category: string): boolean {
  const colorCategories = ['Fashion', 'Electronics', 'Home & Living', 'Clothing', 'Shoes', 'Apparel', 'Beauty']
  return colorCategories.some(cat => category.toLowerCase().includes(cat.toLowerCase()))
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  
  // Review state
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  // Use cart store
  const addItemToCart = useCartStore((state) => state.addItem)

  const colors = ['Black', 'White', 'Blue', 'Red']
  const sizes = ['S', 'M', 'L', 'XL', 'XXL']

  const showSizeSelector = product ? needsSizeSelector(product.category) : false
  const showColorSelector = product ? needsColorSelector(product.category) : true

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
    }
  }, [])

  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlist.includes(product._id))
    }
  }, [product, wishlist])

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  // Fetch reviews when switching to reviews tab
  useEffect(() => {
    if (activeTab === 'reviews' && params.id) {
      fetchReviews()
    }
  }, [activeTab, params.id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${params.id}`)
      if (!response.ok) {
        throw new Error('Product not found')
      }
      const data = await response.json()
      setProduct(data)
      // Fetch related products after getting product
      fetchRelatedProducts(data.category)
    } catch (error) {
      console.error('Error fetching product:', error)
      setProduct(null)
    }
    setLoading(false)
  }

  const fetchRelatedProducts = async (category: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?limit=6&category=${encodeURIComponent(category)}`)
      const data = await response.json()
      const products = data.products || data
      // Filter out current product and get 4 related products
      setRelatedProducts(products.filter((p: Product) => p._id !== params.id).slice(0, 4))
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  // Check if user is logged in - MUST be defined before functions that use it
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  // Fetch reviews for this product
  const fetchReviews = async () => {
    if (!params.id) return
    setReviewsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/product/${params.id}`)
      const data = await response.json()
      setReviews(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    }
    setReviewsLoading(false)
  }

  // Submit a review
  const submitReview = async () => {
    if (!params.id || !isLoggedIn) {
      window.location.href = '/login?redirect=' + window.location.pathname
      return
    }

    if (!reviewComment.trim()) {
      setToast('Please write a review comment')
      setTimeout(() => setToast(null), 2000)
      return
    }

    setSubmittingReview(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(API_ENDPOINTS.createReview, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: params.id,
          rating: reviewRating,
          comment: reviewComment
        })
      })

      if (response.ok) {
        setToast('Review submitted successfully!')
        setReviewComment('')
        setReviewRating(5)
        fetchReviews()
        // Refresh product to get updated rating
        fetchProduct()
      } else {
        const data = await response.json()
        setToast(data.message || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      setToast('Error submitting review')
    }
    setSubmittingReview(false)
    setTimeout(() => setToast(null), 2000)
  }

  const toggleWishlist = () => {
    if (!product) return
    
    // Check if logged in
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=wishlist'
      return
    }
    
    let newWishlist
    if (isWishlisted) {
      newWishlist = wishlist.filter(id => id !== product._id)
      setToast('Removed from wishlist')
    } else {
      newWishlist = [...wishlist, product._id]
      setToast('Added to wishlist')
    }
    
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
    setIsWishlisted(!isWishlisted)
    
    setTimeout(() => setToast(null), 2000)
  }

  const addToCart = () => {
    if (!product) return
    
    // Check if logged in
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=cart'
      return
    }
    
    const cartItem: any = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: getProductImages(product)[0],
      quantity,
    }
    
    if (showColorSelector) {
      cartItem.variant = colors[selectedColor]
    }
    if (showSizeSelector) {
      cartItem.variant = sizes[selectedSize]
    }
    
    // Use Zustand cart store
    addItemToCart(cartItem)
    setToast('Added to cart!')
    setTimeout(() => setToast(null), 2000)
  }

  const buyNow = () => {
    // Check if logged in
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=checkout'
      return
    }
    
    // Add to cart without showing toast
    if (!product) return
    
    const cartItem: any = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: getProductImages(product)[0],
      quantity,
    }
    
    if (showColorSelector) {
      cartItem.variant = colors[selectedColor]
    }
    if (showSizeSelector) {
      cartItem.variant = sizes[selectedSize]
    }
    
    // Use Zustand cart store
    addItemToCart(cartItem)
    
    // Navigate to checkout without showing toast
    router.push('/checkout')
  }

const ProductSkeleton = () => (
  <div className="container mx-auto px-4 py-12 max-w-7xl">
    <div className="grid md:grid-cols-2 gap-8">
      {/* Image Skeleton - White background */}
      <div className="space-y-4">
        <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100"></div>
          </div>
        </div>
      </div>

      {/* Info Skeleton - Clean white design */}
      <div className="space-y-6">
        <div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-3 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded-lg w-3/4 animate-pulse"></div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          
          <div className="flex gap-3">
            <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <ProductSkeleton />
    </div>
  )
}

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <Link href="/products" className="text-blue-600 hover:underline">Back to Products</Link>
        </div>
      </div>
    )
  }

  const productImages = getProductImages(product)

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 50 }}
            className="fixed top-24 right-4 z-50 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check size={18} className="text-green-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/products" className="text-gray-500 hover:text-blue-600">Products</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Details - Match navbar width */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Gallery - Simple & Clean */}
          <div className="space-y-2">
            <div 
              className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            >
              {/* Image */}
              <img
                src={productImages[0] || fallbackImages[product.category]?.[0] || defaultImages[0]}
                alt={product.name}
                className="w-full h-full object-contain p-6"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              {/* Fallback - Only shown when image fails */}
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center bg-white hidden"
                id="product-image-fallback"
              >
                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <span className="text-4xl">🛍️</span>
                </div>
                <p className="text-gray-400 text-sm">Image not found</p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-blue-600 font-medium mb-1 text-sm">{product.category}</p>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">{product.name}</h1>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-gray-500 text-sm">{product.rating} ({product.reviews} reviews)</span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-blue-600">Rs. {product.price}</span>
                <span className="text-base text-gray-400 line-through">Rs. {product.originalPrice}</span>
                <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              </div>

              {showColorSelector && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                    <Palette size={16} />
                    Color: {colors[selectedColor]}
                  </h3>
                  <div className="flex gap-2">
                    {colors.map((color, index) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(index)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === index ? 'border-blue-600 scale-110' : 'border-gray-200 hover:border-blue-400'
                        }`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {showSizeSelector && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                    <Ruler size={16} />
                    Size: {sizes[selectedSize]}
                  </h3>
                  <div className="flex gap-2">
                    {sizes.map((size, index) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(index)}
                        className={`min-w-[40px] h-9 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                          selectedSize === index 
                            ? 'border-blue-600 bg-blue-600 text-white' 
                            : 'border-gray-200 hover:border-blue-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm">Quantity</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <span className="text-gray-500 text-sm">
                    {product.reviews} items in stock
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={addToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={buyNow}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Buy Now
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleWishlist}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-colors ${
                    isWishlisted ? 'border-orange-500 bg-orange-50 text-orange-500' : 'border-gray-200 hover:border-orange-500'
                  }`}
                >
                  <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
                </motion.button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Truck size={16} />
                  <span>Free Shipping</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Shield size={16} />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <RotateCcw size={16} />
                  <span>Easy Return</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-10">
          <div className="border-b border-gray-200">
            <nav className="flex gap-6">
              {['description', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 font-semibold border-b-2 transition-colors capitalize text-sm ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-5">
            {activeTab === 'description' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </motion.div>
            )}

            {activeTab === 'specifications' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Specifications</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    ['Category', product.category],
                    ['Material', 'Premium Quality'],
                    ['Weight', '350g'],
                    ['Warranty', '2 Years'],
                  ].map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{key}</span>
                      <span className="font-semibold text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Reviews</h3>
                
                {/* Review Submission Form - Only show if logged in */}
                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                  <p className="text-blue-700">
                    To write a review, please <Link href="/dashboard" className="font-semibold underline">go to your orders</Link> after the order is delivered.
                  </p>
                </div>

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((review, index) => (
                      <div key={index} className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800">{review.userName || 'Anonymous'}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                              ))}
                            </div>
                          </div>
                          <span className="text-gray-400 text-xs">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                        {review.isVerifiedPurchase && (
                          <span className="inline-block mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Products - Same Category */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Related Products in {product.category}</h2>
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => {
                const relImages = getProductImages(relProduct)
                return (
                  <Link key={relProduct._id} href={`/product/${relProduct._id}`}>
                    <motion.div 
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
                    >
                      <div className="aspect-square bg-white relative overflow-hidden p-3">
                        <img
                          src={relImages[0]}
                          alt={relProduct.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        {relProduct.originalPrice > relProduct.price && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {Math.round((1 - relProduct.price / relProduct.originalPrice) * 100)}% OFF
                          </div>
                        )}
                      </div>
                      <div className="p-3 pt-0">
                        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 text-sm">{relProduct.name}</h3>
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < Math.floor(relProduct.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-blue-600">Rs. {relProduct.price}</span>
                          <span className="text-gray-400 line-through text-xs">Rs. {relProduct.originalPrice}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-square bg-white p-3">
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-30">📦</span>
                    </div>
                  </div>
                  <div className="p-3 pt-0">
                    <h3 className="font-semibold text-gray-800 mb-1 text-sm">Product {i}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-blue-600">Rs. {99 + i * 50}</span>
                      <span className="text-gray-400 line-through text-xs">Rs. {149 + i * 50}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
