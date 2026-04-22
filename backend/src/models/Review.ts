import mongoose, { Schema, Document } from 'mongoose'

export interface IReview extends Document {
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  isVerifiedPurchase: boolean
  createdAt: Date
}

const ReviewSchema = new Schema<IReview>({
  productId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  isVerifiedPurchase: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

// Unique compound index: one review per (productId, userId) pair
// This enforces uniqueness at the DB level and catches concurrent duplicate inserts
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)
