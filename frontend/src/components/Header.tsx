'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Heart, User, ShoppingCart, Menu, X, LogOut, ShoppingBag, Truck } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    const checkUser = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };
    
    checkUser();
    window.addEventListener('storage', checkUser);
    const interval = setInterval(checkUser, 1000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkUser);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setIsUserMenuOpen(false);
    window.location.href = '/';
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <Link href="/" className="flex flex-col group">
            <div className="flex items-baseline">
              <span className="text-2xl md:text-3xl font-black italic tracking-tighter" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                <span className="text-[#2563EB]">Flik</span>
                <span className="text-[#2563EB]">cart</span>
              </span>
            </div>
            <div className="flex items-center gap-1 -mt-1">
              <span className="text-[10px] text-gray-500 italic">Explore</span>
              <span className="text-[10px] font-bold italic" style={{ color: '#ffe11b', textShadow: '0 0 1px rgba(0,0,0,0.2)' }}>Plus</span>
              <span className="text-[10px] text-[#ffe11b]">★</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-[#2874f0] font-medium transition-colors text-sm">Home</Link>
            <Link href="/products" className="text-gray-700 hover:text-[#2874f0] font-medium transition-colors text-sm">Shop</Link>
            <Link href="/track-order" className="text-gray-700 hover:text-[#2874f0] font-medium transition-colors text-sm flex items-center gap-1">
              <Truck size={16} />Track Order
            </Link>
          </nav>

          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <form action="/search" className="w-full flex">
              <input type="text" name="q" placeholder="Search for products..." className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#2874f0]/20 text-sm" />
              <button type="submit" className="px-4 py-2.5 bg-[#2874f0] text-white rounded-r-lg hover:bg-blue-700 transition-colors">
                <Search size={20} />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-1">
            <Link href="/wishlist" className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <Heart size={22} />
            </Link>

            <Link href="/cart" className="p-2 text-gray-600 hover:text-[#2874f0] hover:bg-blue-50 rounded-lg transition-all relative">
              <ShoppingCart size={22} />
              {cartItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative ml-2">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-[#2874f0] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                        <User size={16} />My Account
                      </Link>
                      {user.isAdmin && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>
                          <ShoppingBag size={16} />Admin
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={16} />Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-[#2874f0] font-medium">Login</Link>
                <Link href="/signup" className="px-4 py-2 bg-[#2874f0] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Sign Up</Link>
              </div>
            )}

            <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg ml-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div> {/* Closing div tag for the flex container */}

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t overflow-hidden">
              <div className="py-4 space-y-3">
                <form action="/search" className="flex">
                  <input type="text" name="q" placeholder="Search..." className="flex-1 px-4 py-2 bg-gray-100 rounded-l-lg focus:outline-none" />
                  <button type="submit" className="px-4 py-2 bg-[#2874f0] text-white rounded-r-lg"><Search size={20} /></button>
                </form>

                <nav className="flex flex-col">
                  <Link href="/" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                  <Link href="/products" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
                  <Link href="/track-order" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <Truck size={18} />Track Order
                  </Link>
                  <Link href="/wishlist" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <Heart size={18} />Wishlist
                  </Link>
                  <Link href="/cart" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <ShoppingCart size={18} />Cart ({cartItems.length})
                  </Link>
                </nav>

                {!user && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Link href="/login" className="flex-1 px-4 py-2 text-center text-gray-700 border rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                    <Link href="/signup" className="flex-1 px-4 py-2 text-center bg-[#2874f0] text-white rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
