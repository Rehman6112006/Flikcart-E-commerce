import mongoose, { Schema, Document } from 'mongoose'

export interface IRider extends Document {
  riderId: string
  name: string
  email: string
  password: string
  phone: string
  vehicleType?: string
  vehicleNumber?: string
  status: 'active' | 'inactive' | 'busy'
  currentLocation?: { lat: number; lng: number }
  rating: number
  totalDeliveries: number
  createdAt: Date
}

const generateRiderId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'RID-'
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const RiderSchema = new Schema<IRider>({
  riderId: { type: String, unique: true, default: generateRiderId },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleType: { type: String }, // bike, car, motorcycle, etc.
  vehicleNumber: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'busy'], default: 'active' },
  currentLocation: { lat: Number, lng: Number },
  rating: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

export const Rider = mongoose.models.Rider || mongoose.model<IRider>('Rider', RiderSchema)
