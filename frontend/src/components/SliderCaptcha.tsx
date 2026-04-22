'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, RefreshCw } from 'lucide-react'

interface SliderCaptchaProps {
  onVerify: (verified: boolean) => void
}

export default function SliderCaptcha({ onVerify }: SliderCaptchaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [currentX, setCurrentX] = useState(0)
  const [puzzleX, setPuzzleX] = useState(0)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const puzzleRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  // Generate random puzzle position
  const puzzleOffset = 240 // pixels from left
  const puzzleSize = 50

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
    setError(false)
  }, [])

  const handleMouseMove = useCallback((clientX: number) => {
    if (!isDragging || !sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left - puzzleSize / 2
    
    if (x >= 0 && x <= puzzleOffset) {
      setCurrentX(x)
      setPuzzleX(x)
    }
  }, [isDragging, puzzleOffset])

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    
    // Check if slider matches puzzle position (±10px tolerance)
    const tolerance = 10
    if (Math.abs(currentX - puzzleOffset) <= tolerance) {
      setVerified(true)
      onVerify(true)
    } else {
      setError(true)
      setCurrentX(0)
      setPuzzleX(0)
      setTimeout(() => setError(false), 500)
    }
  }, [isDragging, currentX, puzzleOffset, onVerify])

  const resetCaptcha = useCallback(() => {
    setCurrentX(0)
    setPuzzleX(0)
    setVerified(false)
    setError(false)
    onVerify(false)
  }, [onVerify])

  // Mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', (e) => handleMouseMove(e.clientX))
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', (e) => handleMouseMove(e.clientX))
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    handleMouseDown()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    handleMouseMove(touch.clientX)
  }

  const handleTouchEnd = () => {
    handleMouseUp()
  }

  // Success animation
  useEffect(() => {
    if (verified) {
      setTimeout(() => {
        resetCaptcha()
      }, 2000)
    }
  }, [verified, resetCaptcha])

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div 
        ref={trackRef}
        className={`relative w-full h-16 bg-gray-50 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
          verified ? 'bg-green-50 border-green-200' : error ? 'bg-red-50 border-red-200' : 'hover:shadow-md'
        }`}
      >
        {/* Track Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200" />
        
        {/* Slider Block */}
        <div
          ref={sliderRef}
          className={`absolute left-0 top-0 h-full w-14 bg-white border-r border-gray-300 shadow-md flex items-center justify-center transition-all duration-200 z-10 hover:shadow-lg ${
            isDragging ? 'shadow-lg' : ''
          }`}
          style={{ left: `${currentX}px` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded shadow-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded border border-gray-300" />
          </div>
        </div>

        {/* Puzzle Block */}
        <div 
          ref={puzzleRef}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white border border-gray-300 shadow-md rounded flex items-center justify-center z-20 pointer-events-none"
          style={{ left: `${puzzleOffset}px` }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded shadow-lg flex items-center justify-center relative overflow-hidden">
            <div className="w-4 h-4 bg-white rounded border border-gray-300 z-10" />
            {/* Puzzle missing piece effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded shadow-lg clip-path-puzzle" />
          </div>
        </div>

        {/* Status Icon */}
        {verified && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Check className="w-6 h-6 text-green-500" />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-3 flex items-center justify-between">
        <p className={`text-sm ${verified ? 'text-green-600 font-medium' : error ? 'text-red-600' : 'text-gray-600'}`}>
          {verified ? 'Verified! ✅' : error ? 'Try again' : 'Drag slider to complete the puzzle'}
        </p>
        <button
          onClick={resetCaptcha}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm"
          disabled={isDragging || verified}
        >
          <RefreshCw size={14} />
          Reset
        </button>
      </div>

      <style jsx>{`
        .clip-path-puzzle {
          clip-path: polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%);
        }
      `}</style>
    </div>
  )
}

