import mongoose, { Schema, Document } from 'mongoose'

export interface IOrderItem {
  product: string
  name: string
  price: number
  quantity: number
  image: string
  variant?: string
}

export interface IOrder extends Document {
  user: string
  orderItems: IOrderItem[]
  shippingAddress: {
    fullName: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    phone: string
  }
  paymentMethod: string
  paymentResult?: {
    id: string
    status: string
    email: string
  }
  itemsPrice: number
  shippingPrice: number
  taxPrice: number
  totalPrice: number
  isPaid: boolean
  paidAt?: Date
  isDelivered: boolean
  deliveredAt?: Date
  status: string
  trackingId?: string
  trackingNumber?: string
  createdAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true },
  variant: { type: String }
})

const OrderSchema = new Schema<IOrder>({
  user: { type: String, required: true },
  orderItems: [OrderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentMethod: { type: String, required: true },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    email: { type: String }
  },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, required: true },
  taxPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  status: { type: String, default: 'Processing' },
  trackingId: { type: String, sparse: true }, // legacy field - keep for DB compatibility
  trackingNumber: { type: String },
  couponCode: { type: String },
  discountAmount: { type: Number, default: 0 },
  guestEmail: { type: String },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  assignedRider: { type: String },
  shippedAt: { type: Date },
  outForDeliveryAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

// Index for purchase-verification queries (user + product lookup)
OrderSchema.index({ user: 1, 'orderItems.product': 1 })

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
