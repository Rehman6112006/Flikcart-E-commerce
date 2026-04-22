'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Heart, SlidersHorizontal, X, Check } from 'lucide-react'
import { API_ENDPOINTS, getApiUrl } from '@/lib/api'

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

const categoriesList = ['all', 'Electronics', 'Fashion', 'Sports', 'Home & Living', 'Books & Media', 'Beauty', 'Automotive', 'Toys & Games', 'Pet Supplies', 'Groceries', 'Health & Fitness']

const fallbackImages: Record<string, string[]> = {
  'Electronics': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=300',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
  ],
  'Fashion': [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
    'https://images.unsplash.com/photo-1461896836934-4d463ece1c9c?w=300',
  ],
  'Home & Living': [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=300',
  ],
  'Books & Media': [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300',
  ],
  'Beauty': [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300',
  ],
  'Automotive': [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=300',
  ],
  'Toys & Games': [
    'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=300',
    'https://images.unsplash.com/photo-1606092195730-5d7b9af1ef4d?w=300',
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300',
  ],
  'Pet Supplies': [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300',
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300',
  ],
  'Groceries': [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300',
    'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=300',
  ],
  'Health & Fitness': [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300',
  ],
}

const defaultImages = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
]

function getProductImage(product: Product, index: number = 0): string {
  if (product.images && product.images.length > 0 && product.images[index]) {
    return product.images[index]
  }
  return fallbackImages[product.category]?.[index] || defaultImages[index % defaultImages.length]
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get('category')
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [wishlist, setWishlist] = useState<string[]>([])
const [filters, setFilters] = useState({
    category: urlCategory || 'all',
    search: '',
    minPrice: 0,
    maxPrice: 5000,
    rating: 0,
    sort: 'relevance'
  })
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [animatingWishlist, setAnimatingWishlist] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
    }
  }, [])

  useEffect(() => {
    if (urlCategory) {
      setFilters(prev => ({ ...prev, category: urlCategory }))
    }
  }, [urlCategory])

  useEffect(() => {
    setProducts([])
    setPage(1)
    setHasMore(true)
    fetchProducts()
  }, [filters])

const fetchProducts = async (append = false) => {
    if (loadingMore && append) return
    setLoading(!append)
    setLoadingMore(append)
    
    try {
      const params = new URLSearchParams()
      if (filters.category !== 'all') params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)
      params.append('minPrice', filters.minPrice.toString())
      params.append('maxPrice', filters.maxPrice.toString())
      params.append('sort', filters.sort)
      params.append('page', page.toString())
      params.append('limit', '500') // Load up to 500 products at once
      
      const response = await fetch(getApiUrl(`/api/products?${params.toString()}`))
      const data = await response.json()
      const newProducts = data.products || data
      
      setProducts(prev => append ? [...prev, ...newProducts] : newProducts)
      setHasMore(newProducts.length === 500) // Backend limit
      
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1)
      fetchProducts(true)
    }
  }

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=wishlist'
      return
    }
    
    setAnimatingWishlist(productId)
    
    let newWishlist: string[] = []
    if (wishlist.includes(productId)) {
      newWishlist = wishlist.filter((id: string) => id !== productId)
      setToast('Removed from wishlist')
    } else {
      newWishlist = [...wishlist, productId]
      setToast('Added to wishlist')
    }
    
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
    
    setTimeout(() => setAnimatingWishlist(null), 500)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">All Products</h1>
          <p className="text-gray-600 mt-2">Browse our collection of premium products</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <button 
            className="lg:hidden flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl"
            onClick={() => setShowMobileFilters(true)}
          >
            <SlidersHorizontal size={20} />
            Filters
          </button>

          <aside className={`lg:w-72 ${showMobileFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden lg:block'}`}>
            {showMobileFilters && (
              <button 
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-lg lg:hidden"
                onClick={() => setShowMobileFilters(false)}
              >
                <X size={24} />
              </button>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Search</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Category</h3>
                <div className="space-y-2">
                  {categoriesList.map((cat: string) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat}
                        onChange={() => setFilters({...filters, category: cat})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-600 capitalize">{cat === 'all' ? 'All Categories' : cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Price Range</h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                onClick={() => setFilters({
                  category: 'all',
                  search: '',
                  minPrice: 0,
                  maxPrice: 5000,
                  rating: 0,
                  sort: 'relevance'
                })}
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${products.length} products found`}
                {filters.category !== 'all' && (
                  <span className="ml-2 text-blue-600 font-medium">in {filters.category}</span>
                )}
              </p>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({...filters, sort: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

{loading ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    ))}
  </div>
) : products.length === 0 ? (
  <div className="col-span-full text-center py-16">
    <div className="text-6xl mb-4">🔍</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
    <p className="text-gray-600">Try adjusting your filters or search terms</p>
  </div>
) : (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, index) => (
        <motion.div
          key={product._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          whileHover={{ y: -8 }}
        >
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group h-full flex flex-col">
            <Link href={`/product/${product._id}`} className="flex-1">
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <Image
                  src={getProductImage(product)}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => toggleWishlist(product._id, e)}
                  className={`absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
                    wishlist.includes(product._id) ? 'text-orange-500' : 'hover:text-orange-500'
                  }`}
                >
                  <motion.div
                    animate={animatingWishlist === product._id ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart size={20} className={wishlist.includes(product._id) ? 'fill-current' : ''} />
                  </motion.div>
                </motion.button>
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
                    <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.reviews})</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold text-blue-600">Rs. {product.price}</span>
                <span className="text-sm text-gray-400 line-through">Rs. {product.originalPrice}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
    {hasMore && (
      <div className="text-center mt-8">
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {loadingMore ? (
            <>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
              Loading more...
            </>
          ) : (
            'Load More Products'
          )}
        </button>
      </div>
    )}
  </>
)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}

