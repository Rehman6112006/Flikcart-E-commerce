'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, Minus, Plus, Check, Ruler, Palette } from 'lucide-react'

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
}

const defaultImages = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300',
]

function getProductImages(product: Product): string[] {
  if (product.images && product.images.length > 0) {
    return product.images
  }
  return fallbackImages[product.category] || defaultImages
}

function needsSizeSelector(category: string): boolean {
  const fashionCategories = ['Fashion', 'Clothing', 'Shoes', 'Apparel']
  return fashionCategories.some(cat => category.toLowerCase().includes(cat.toLowerCase()))
}

function needsColorSelector(category: string): boolean {
  const colorCategories = ['Fashion', 'Electronics', 'Home & Living', 'Clothing', 'Shoes', 'Apparel']
  return colorCategories.some(cat => category.toLowerCase().includes(cat.toLowerCase()))
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

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
      fetchRelatedProducts()
    }
  }, [params.id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/products/${params.id}`)
      if (!response.ok) {
        throw new Error('Product not found')
      }
      const data = await response.json()
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
      setProduct(null)
    }
    setLoading(false)
  }

  const fetchRelatedProducts = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products?limit=3&category=${product?.category || 'Electronics'}`)
      const data = await response.json()
      const products = data.products || data
      setRelatedProducts(products.filter((p: Product) => p._id !== params.id).slice(0, 3))
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  const toggleWishlist = () => {
    if (!product) return
    
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
    
    const cartItem: any = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: getProductImages(product)[0],
      quantity,
    }
    
    if (showColorSelector) {
      cartItem.color = colors[selectedColor]
    }
    if (showSizeSelector) {
      cartItem.size = sizes[selectedSize]
    }
    
    const savedCart = localStorage.getItem('cart')
    let cart = savedCart ? JSON.parse(savedCart) : []
    
    const existingIndex = cart.findIndex(
      (item: any) => item._id === cartItem._id && 
      item.color === cartItem.color && 
      item.size === cartItem.size
    )
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity
    } else {
      cart.push(cartItem)
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    setToast('Added to cart!')
    setTimeout(() => setToast(null), 2000)
  }

  const buyNow = () => {
    addToCart()
    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/products" className="text-gray-500 hover:text-blue-600">Products</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square max-h-[350px] bg-white rounded-xl overflow-hidden shadow-sm"
            >
              <Image
                src={productImages[selectedImage]}
                alt={product.name}
                fill
                className="object-contain p-3"
                priority
              />
            </motion.div>
            <div className="grid grid-cols-4 gap-2">
              {productImages.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-contain p-1" />
                </button>
              ))}
            </div>
          </div>

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
                <span className="text-gray-500 text-sm">{product.rating} ({product.reviews})</span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-blue-600">${product.price}</span>
                <span className="text-base text-gray-400 line-through">${product.originalPrice}</span>
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
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
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
                        className={`min-w-[36px] h-8 px-2 rounded-lg border-2 font-semibold text-xs transition-all ${
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
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {product.reviews} in stock
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={addToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={buyNow}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors text-sm"
                >
                  Buy Now
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleWishlist}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-colors ${
                    isWishlisted ? 'border-orange-500 bg-orange-50 text-orange-500' : 'border-gray-200 hover:border-orange-500'
                  }`}
                >
                  <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
                </motion.button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <Truck size={14} />
                  <span>Free Shipping</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <Shield size={14} />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                  <RotateCcw size={14} />
                  <span>Easy Return</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-10">
          <div className="border-b border-gray-200">
            <nav className="flex gap-5">
              {['description', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2.5 font-semibold border-b-2 transition-colors capitalize text-sm ${
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
                <h3 className="text-base font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
              </motion.div>
            )}

            {activeTab === 'specifications' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Specifications</h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {[
                    ['Category', product.category],
                    ['Material', 'Premium Quality'],
                    ['Weight', '350g'],
                    ['Warranty', '2 Years'],
                  ].map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray-600 text-sm">{key}</span>
                      <span className="font-semibold text-gray-800 text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Reviews</h3>
                <div className="space-y-3">
                  {[
                    { name: 'John D.', rating: 5, comment: 'Excellent product!', date: '2 days ago' },
                    { name: 'Sarah M.', rating: 4, comment: 'Great quality.', date: '1 week ago' },
                    { name: 'Mike R.', rating: 5, comment: 'Highly recommended!', date: '2 weeks ago' },
                  ].map((review, index) => (
                    <div key={index} className="bg-white p-3 rounded-xl shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm">{review.name}</h4>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                            ))}
                          </div>
                        </div>
                        <span className="text-gray-400 text-xs">{review.date}</span>
                      </div>
                      <p className="text-gray-600 text-xs">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Related Products</h2>
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedProducts.map((relProduct) => (
                <Link key={relProduct._id} href={`/product/${relProduct._id}`}>
                  <motion.div 
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden p-3">
                      <Image
                        src={getProductImages(relProduct)[0]}
                        alt={relProduct.name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                        {Math.round((1 - relProduct.price / relProduct.originalPrice) * 100)}% OFF
                      </div>
                    </div>
                    <div className="p-3 pt-0">
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 text-xs">{relProduct.name}</h3>
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} className={i < Math.floor(relProduct.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-blue-600">${relProduct.price}</span>
                        <span className="text-gray-400 line-through text-xs">${relProduct.originalPrice}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-square bg-gray-100 p-3">
                    <Image
                      src={defaultImages[i % defaultImages.length]}
                      alt="Related Product"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="p-3 pt-0">
                    <h3 className="font-semibold text-gray-800 mb-1 text-xs">Product {i}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-blue-600">${99 + i * 50}</span>
                      <span className="text-gray-400 line-through text-xs">${149 + i * 50}</span>
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
