'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star, Truck, Shield, Zap, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'

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

const categories = [
  { id: 1, name: 'Mobiles', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80', filter: 'Electronics' },
  { id: 2, name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80', filter: 'Fashion' },
  { id: 3, name: 'Electronics', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80', filter: 'Electronics' },
  { id: 4, name: 'Home', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', filter: 'Home & Living' },
  { id: 5, name: 'Appliances', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&q=80', filter: 'Home & Living' },
  { id: 6, name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80', filter: 'Beauty' },
]

// New hero slides with fresh, attractive images (using reliable CDN sources)
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
    title: 'Mega Sale',
    subtitle: 'Up to 70% Off',
    cta: 'Shop Now',
    color: 'from-blue-600 to-indigo-800',
    category: null
  },
  {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
    title: 'Fashion Fest',
    subtitle: 'Min 50% Off',
    cta: 'Explore',
    color: 'from-pink-500 to-rose-500',
    category: 'Fashion'
  },
  {
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&q=80',
    title: 'Tech Festival',
    subtitle: 'Best Deals on Gadgets',
    cta: 'Buy Now',
    color: 'from-indigo-600 to-blue-600',
    category: 'Electronics'
  },
  {
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
    title: 'Smart Watches',
    subtitle: 'Starting from Rs. 1999',
    cta: 'Shop Now',
    color: 'from-purple-600 to-pink-600',
    category: 'Electronics'
  },
]

export default function Home() {
  const [row1Products, setRow1Products] = useState<Product[]>([])
  const [row2Products, setRow2Products] = useState<Product[]>([])
  const [row1Page, setRow1Page] = useState(1)
  const [row2Page, setRow2Page] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore1, setLoadingMore1] = useState(false)
  const [loadingMore2, setLoadingMore2] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const scrollRef1 = useRef<HTMLDivElement>(null)
  const scrollRef2 = useRef<HTMLDivElement>(null)
  const scrollIntervalRef1 = useRef<NodeJS.Timeout | null>(null)
  const scrollIntervalRef2 = useRef<NodeJS.Timeout | null>(null)
  const userInteractedRef1 = useRef(false)
  const userInteractedRef2 = useRef(false)

  useEffect(() => {
    fetchProducts()
    // Change slide every 5 seconds for better UX
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => {
      clearInterval(slideTimer)
      if (scrollIntervalRef1.current) clearInterval(scrollIntervalRef1.current)
      if (scrollIntervalRef2.current) clearInterval(scrollIntervalRef2.current)
    }
  }, [])

  // Stop auto-scroll after 1 minute (60000ms) of page load
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAutoScrolling(false)
    }, 60000) // Auto-scroll runs for 1 minute then stops
    return () => clearTimeout(timeout)
  }, [])

  // Auto-scroll for Row 1 (Top Rated Products) - 1 minute interval with manual override
  useEffect(() => {
    if (!scrollRef1.current || row1Products.length === 0 || !isAutoScrolling) return
    
    const container = scrollRef1.current
    let scrollPos = 0
    
    // Clear any existing interval
    if (scrollIntervalRef1.current) clearInterval(scrollIntervalRef1.current)
    
    scrollIntervalRef1.current = setInterval(() => {
      // Only auto-scroll if user hasn't manually interacted
      if (userInteractedRef1.current) {
        if (scrollIntervalRef1.current) clearInterval(scrollIntervalRef1.current)
        return
      }
      
      scrollPos += 1
      container.scrollTo({ left: scrollPos, behavior: 'auto' })
      
      // Reset to beginning when reaching the end
      if (scrollPos >= container.scrollWidth / 2) {
        scrollPos = 0
        container.scrollTo({ left: 0, behavior: 'auto' })
      }
    }, 50) // Smooth scroll speed
    
    return () => {
      if (scrollIntervalRef1.current) clearInterval(scrollIntervalRef1.current)
    }
  }, [row1Products, isAutoScrolling])

  // Auto-scroll for Row 2 (Best Deals) - 1 minute interval with manual override
  useEffect(() => {
    if (!scrollRef2.current || row2Products.length === 0 || !isAutoScrolling) return
    
    const container = scrollRef2.current
    let scrollPos = container.scrollWidth / 2
    container.scrollTo({ left: scrollPos, behavior: 'auto' })
    
    // Clear any existing interval
    if (scrollIntervalRef2.current) clearInterval(scrollIntervalRef2.current)
    
    scrollIntervalRef2.current = setInterval(() => {
      // Only auto-scroll if user hasn't manually interacted
      if (userInteractedRef2.current) {
        if (scrollIntervalRef2.current) clearInterval(scrollIntervalRef2.current)
        return
      }
      
      scrollPos -= 1
      container.scrollTo({ left: scrollPos, behavior: 'auto' })
      
      // Reset to end when reaching the beginning
      if (scrollPos <= 0) {
        scrollPos = container.scrollWidth / 2
        container.scrollTo({ left: scrollPos, behavior: 'auto' })
      }
    }, 50) // Smooth scroll speed
    
    return () => {
      if (scrollIntervalRef2.current) clearInterval(scrollIntervalRef2.current)
    }
  }, [row2Products, isAutoScrolling])

  const fetchProducts = async () => {
    try {
      const [res1, res2] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?sort=rating&limit=100&page=1`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?sort=price&limit=100&page=1`)
      ])
      const data1 = await res1.json()
      const data2 = await res2.json()
      setRow1Products(Array.isArray(data1) ? data1 : (data1?.products || []))
      setRow2Products(Array.isArray(data2) ? data2 : (data2?.products || []))
    } catch (error) { console.error('Error:', error); setRow1Products([]); setRow2Products([]) }
    finally { setLoading(false) }
  }

  const loadMoreRow1 = async () => {
    if (loadingMore1) return; setLoadingMore1(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?sort=rating&limit=100&page=${row1Page + 1}`)
      if (res.ok) { const data = await res.json(); const newProducts = Array.isArray(data) ? data : (data?.products || [])
        if (newProducts.length > 0) { setRow1Products(prev => [...prev, ...newProducts]); setRow1Page(prev => prev + 1) }
      }
    } catch (error) { console.error(error) }
    setLoadingMore1(false)
  }

  const loadMoreRow2 = async () => {
    if (loadingMore2) return; setLoadingMore2(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?sort=price&limit=100&page=${row2Page + 1}`)
      if (res.ok) { const data = await res.json(); const newProducts = Array.isArray(data) ? data : (data?.products || [])
        if (newProducts.length > 0) { setRow2Products(prev => [...prev, ...newProducts]); setRow2Page(prev => prev + 1) }
      }
    } catch (error) { console.error(error) }
    setLoadingMore2(false)
  }

  // Handle manual scroll - disable auto-scroll temporarily when user scrolls manually
  const handleManualScroll = (ref: React.RefObject<HTMLDivElement>, rowNum: number) => {
    if (rowNum === 1) {
      userInteractedRef1.current = true
      setIsAutoScrolling(false)
      // Re-enable auto-scroll after 1 minute of inactivity
      setTimeout(() => {
        userInteractedRef1.current = false
        setIsAutoScrolling(true)
      }, 60000)
    } else {
      userInteractedRef2.current = true
      setIsAutoScrolling(false)
      // Re-enable auto-scroll after 1 minute of inactivity
      setTimeout(() => {
        userInteractedRef2.current = false
        setIsAutoScrolling(true)
      }, 60000)
    }
  }

  const scrollRow = async (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right', rowNum: number) => {
    if (!ref.current) return
    
    // Handle manual scroll interaction
    handleManualScroll(ref, rowNum)
    
    const container = ref.current
    if (direction === 'right' && container.scrollLeft + container.clientWidth >= container.scrollWidth - 500) {
      if (rowNum === 1) await loadMoreRow1(); else await loadMoreRow2()
    }
    container.scrollBy({ left: direction === 'left' ? -400 : 400, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-6">
          <div className="flex gap-4">
            <div className="flex-1 relative h-[300px] rounded-2xl overflow-hidden shadow-lg">
              <AnimatePresence mode="wait">
                {heroSlides.map((slide, index) => currentSlide === index && (
                  <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
                    <Link href={slide.category ? `/products?category=${encodeURIComponent(slide.category)}` : '/products'}>
                      <Image src={slide.image} alt={slide.title} fill className="object-cover cursor-pointer" priority={index === 0} />
                    </Link>
                    <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-70`} />
                    <div className="absolute inset-0 flex items-center px-8 md:px-12">
                      <div className="text-white max-w-md">
                        <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-3xl md:text-4xl font-bold mb-2">{slide.title}</motion.h2>
                        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-xl md:text-2xl font-semibold mb-4">{slide.subtitle}</motion.p>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                          <Link href={slide.category ? `/products?category=${encodeURIComponent(slide.category)}` : '/products'}>
                            <button className="px-6 py-2.5 bg-white text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center gap-2">{slide.cta} <ArrowRight size={18} /></button>
                          </Link>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {heroSlides.map((_, i) => <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition-all ${currentSlide === i ? 'bg-white w-6' : 'bg-white/50 w-2'}`} />)}
              </div>
            </div>
            <div className="hidden lg:flex flex-col gap-4 w-72">
              <Link href="/products?category=Sports" className="flex-1 relative rounded-2xl overflow-hidden shadow-md group cursor-pointer">
                <Image src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&q=80" alt="Sports" fill className="object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white"><p className="text-sm font-medium">New Arrivals</p><p className="text-lg font-bold">Sports Shoes</p></div>
              </Link>
              <Link href="/products?category=Electronics" className="flex-1 relative rounded-2xl overflow-hidden shadow-md group cursor-pointer">
                <Image src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" alt="Smart" fill className="object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white"><p className="text-sm font-medium">Trending</p><p className="text-lg font-bold">Smart Watches</p></div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ icon: Truck, title: 'Free Shipping', desc: 'On orders over Rs. 5000', color: 'text-blue-600' }, { icon: Shield, title: 'Secure Payment', desc: '100% protected', color: 'text-green-600' }, { icon: Zap, title: 'Fast Delivery', desc: '2-3 business days', color: 'text-orange-600' }, { icon: Star, title: 'Best Quality', desc: 'Premium products', color: 'text-purple-600' }].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <f.icon size={28} className={f.color} />
                <div><h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3><p className="text-xs text-gray-500">{f.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
            <Link href="/products" className="text-blue-600 font-medium flex items-center gap-1 text-sm">View All <ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/products?category=${encodeURIComponent(cat.filter)}`}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 shadow-md group-hover:shadow-lg transition-all">
                    <Image src={cat.image} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-center font-medium text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><Sparkles className="text-orange-500" size={24} /><h2 className="text-xl font-bold text-gray-900">Top Rated Products</h2></div>
            <Link href="/products" className="text-blue-600 font-medium text-sm">View All <ArrowRight size={16} /></Link>
          </div>
          {loading ? (
            <div className="flex gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded-2xl animate-pulse" />)}</div>
          ) : (
            <div className="relative group">
              <button onClick={() => scrollRow(scrollRef1, 'left', 1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center -translate-x-2 hover:scale-110"><ChevronLeft size={24} /></button>
              <button onClick={() => scrollRow(scrollRef1, 'right', 1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center translate-x-2 hover:scale-110"><ChevronRight size={24} /></button>
              <div 
                ref={scrollRef1} 
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2" 
                style={{ scrollbarWidth: 'none' }}
                onScroll={() => handleManualScroll(scrollRef1, 1)}
              >
                {(row1Products || []).map((p, i) => (
                  <Link key={`r1-${p._id}-${i}`} href={`/product/${p._id}`}>
                    <div className="flex-shrink-0 w-48 group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100">
                      <div className="relative aspect-[3/4] bg-gray-100">
                        <Image src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                        {p.originalPrice > p.price && <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">{Math.round((1 - p.price / p.originalPrice) * 100)}% OFF</div>}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500 mb-1">{p.category}</p>
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm">{p.name}</h3>
                        <div className="flex items-center gap-1 mb-2"><div className="flex items-center bg-green-600 px-1.5 py-0.5 rounded text-xs"><span className="text-white font-bold">{p.rating}</span><Star size={10} className="text-white fill-white ml-0.5" /></div><span className="text-xs text-gray-500">({p.reviews})</span></div>
                        <div className="flex items-center gap-2"><span className="text-lg font-bold">Rs. {p.price}</span>{p.originalPrice > p.price && <span className="text-sm text-gray-400 line-through">Rs. {p.originalPrice}</span>}</div>
                      </div>
                    </div>
                  </Link>
                ))}
                {loadingMore1 && <div className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded-2xl animate-pulse flex items-center justify-center"><span className="text-gray-500">Loading...</span></div>}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><Sparkles className="text-purple-500" size={24} /><h2 className="text-xl font-bold text-gray-900">Best Deals</h2></div>
            <Link href="/products" className="text-blue-600 font-medium text-sm">View All <ArrowRight size={16} /></Link>
          </div>
          {loading ? (
            <div className="flex gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded-2xl animate-pulse" />)}</div>
          ) : (
            <div className="relative group">
              <button onClick={() => scrollRow(scrollRef2, 'left', 2)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center -translate-x-2 hover:scale-110"><ChevronLeft size={24} /></button>
              <button onClick={() => scrollRow(scrollRef2, 'right', 2)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center translate-x-2 hover:scale-110"><ChevronRight size={24} /></button>
              <div 
                ref={scrollRef2} 
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2" 
                style={{ scrollbarWidth: 'none' }}
                onScroll={() => handleManualScroll(scrollRef2, 2)}
              >
                {(row2Products || []).map((p, i) => (
                  <Link key={`r2-${p._id}-${i}`} href={`/product/${p._id}`}>
                    <div className="flex-shrink-0 w-48 group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100">
                      <div className="relative aspect-[3/4] bg-gray-100">
                        <Image src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                        {p.originalPrice > p.price && <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">{Math.round((1 - p.price / p.originalPrice) * 100)}% OFF</div>}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500 mb-1">{p.category}</p>
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm">{p.name}</h3>
                        <div className="flex items-center gap-1 mb-2"><div className="flex items-center bg-green-600 px-1.5 py-0.5 rounded text-xs"><span className="text-white font-bold">{p.rating}</span><Star size={10} className="text-white fill-white ml-0.5" /></div><span className="text-xs text-gray-500">({p.reviews})</span></div>
                        <div className="flex items-center gap-2"><span className="text-lg font-bold">Rs. {p.price}</span>{p.originalPrice > p.price && <span className="text-sm text-gray-400 line-through">Rs. {p.originalPrice}</span>}</div>
                      </div>
                    </div>
                  </Link>
                ))}
                {loadingMore2 && <div className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded-2xl animate-pulse flex items-center justify-center"><span className="text-gray-500">Loading...</span></div>}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/products?category=Electronics" className="relative h-48 rounded-2xl overflow-hidden group">
              <Image src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&q=80" alt="Elec" fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-6"><span className="inline-block w-fit px-3 py-1 bg-yellow-400 text-blue-900 rounded-full text-xs font-bold mb-2">New Arrivals</span><h3 className="text-2xl font-bold text-white">Latest Electronics</h3><p className="text-white/80 text-sm">Up to 40% off</p></div>
            </Link>
            <Link href="/products?category=Fashion" className="relative h-48 rounded-2xl overflow-hidden group">
              <Image src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80" alt="Fashion" fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-900/80 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-6"><span className="inline-block w-fit px-3 py-1 bg-yellow-400 text-pink-900 rounded-full text-xs font-bold mb-2">Trending</span><h3 className="text-2xl font-bold text-white">Fashion Collection</h3><p className="text-white/80 text-sm">Min 50% off</p></div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
