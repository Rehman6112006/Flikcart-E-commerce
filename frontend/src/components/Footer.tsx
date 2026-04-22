'use client'

import Link from 'next/link'
import { Facebook, Twitter, Youtube, Instagram, Mail, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#172337] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10">
          {/* About */}
          <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">About</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-white text-sm hover:text-yellow-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/about" className="text-white text-sm hover:text-yellow-400 transition-colors">About Us</Link></li>
              <li><Link href="/about" className="text-white text-sm hover:text-yellow-400 transition-colors">Careers</Link></li>
              <li><Link href="/about" className="text-white text-sm hover:text-yellow-400 transition-colors">Press</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Help</h3>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-white text-sm hover:text-yellow-400 transition-colors">Payments</Link></li> 
              <li><Link href="/help" className="text-white text-sm hover:text-yellow-400 transition-colors">Shipping</Link></li> 
              <li><Link href="/help" className="text-white text-sm hover:text-yellow-400 transition-colors">Cancellation & Returns</Link></li> 
              <li><Link href="/help" className="text-white text-sm hover:text-yellow-400 transition-colors">FAQ</Link></li> 
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Policy</h3>
            <ul className="space-y-2">
              <li><Link href="/return-refund" className="text-white text-sm hover:text-yellow-400 transition-colors">Return & Refund</Link></li>
              <li><Link href="/policy" className="text-white text-sm hover:text-yellow-400 transition-colors">Return Policy</Link></li>
              <li><Link href="/policy" className="text-white text-sm hover:text-yellow-400 transition-colors">Terms Of Use</Link></li>
              <li><Link href="/policy" className="text-white text-sm hover:text-yellow-400 transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Social</h3>
            
            <div className="flex gap-4 mb-4">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" 	className="text-white hover:text-yellow-400 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-white hover:text-yellow-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white hover:text-yellow-400 transition-colors">
                <Youtube size={20} />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white hover:text-yellow-400 transition-colors">
                <Instagram size={20} />
              </a>
            </div>

            <div className="text-sm text-gray-400">
              <p className="flex items-center gap-2 mb-1"><Phone size={14} />+1 304 883 7945</p>
              <p className="flex items-center gap-2"><Mail size={14} /> support@flikcart.com</p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontStyle: 'italic', fontWeight: 700, fontSize: '24px', color: '#FF6B00' }}>FlikCart</span>
            <span style={{ color: '#ffe11b', fontSize: '10px', fontWeight: 500 }}>Express</span>
          </div>
          <p style={{ color: '#999', fontSize: '12px' }}>
             © {new Date().getFullYear()} FlikCart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
