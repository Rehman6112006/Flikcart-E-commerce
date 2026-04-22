import mongoose, { Schema, Document } from 'mongoose'

export interface IReturnOrder extends Document {
  orderId: string
  userId: string
  userName: string
  userEmail: string
  product: {
    productId: string
    name: string
    price: number
    quantity: number
    image: string
  }
  reason: string
  description: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Refunded'
  refundAmount: number
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: Date
  createdAt: Date
}

const ReturnOrderSchema = new Schema<IReturnOrder>({
  orderId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  product: {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  },
  reason: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Refunded'],
    default: 'Pending' 
  },
  refundAmount: { type: Number, default: 0 },
  adminNotes: { type: String },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

export const ReturnOrder = mongoose.models.ReturnOrder || mongoose.model<IReturnOrder>('ReturnOrder', ReturnOrderSchema)

