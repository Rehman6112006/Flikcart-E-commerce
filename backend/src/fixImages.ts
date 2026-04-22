import fs from 'fs/promises'
import path from 'path'
import { Product } from './models/Product'

const uploadsDir = path.join(__dirname, '../uploads')

// Fix image mapping: scan uploads/, match filenames to product names
export const fixProductImages = async () => {
  try {
    console.log('🔄 Scanning uploads directory...')
    
    const files = await fs.readdir(uploadsDir)
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    
    console.log(`📁 Found ${imageFiles.length} images`)
    
    for (const product of await Product.find()) {
      let matched = false
      
      // Try exact name match first
      for (const file of imageFiles) {
        if (file.toLowerCase().includes(product.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
          product.images = product.images.length ? [...new Set([`/uploads/${file}`, ...product.images])] : [`/uploads/${file}`]
          matched = true
          console.log(`✅ Matched ${product.name} → ${file}`)
          break
        }
      }
      
      // Fallback: first available image if no match
      if (!matched && imageFiles.length > 0 && (!product.images || product.images.length === 0)) {
        product.images = [`/uploads/${imageFiles[0]}`]
        console.log(`🔄 Assigned fallback ${imageFiles[0]} to ${product.name}`)
      }
      
      // Save if changed
      if (matched || (!product.images || product.images.length === 0)) {
        await product.save()
      }
    }
    
    console.log('🎉 Image mapping complete!')
  } catch (error) {
    console.error('💥 Image fix error:', error)
  }
}

