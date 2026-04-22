import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
  name: string
  description: string
  price: number
  originalPrice: number
  category: string
  subcategory?: string
  images: string[]
  rating: number
  reviews: number
  stock: number
  brand?: string
  colors?: string[]
  sizes?: string[]
  features?: string[]
  isFeatured: boolean
  isNewArrival: boolean
  discount: number
  createdAt: Date
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  images: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  brand: { type: String },
  colors: [{ type: String }],
  sizes: [{ type: String }],
  features: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
