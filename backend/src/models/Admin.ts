import mongoose, { Schema, Document } from 'mongoose'

export interface IAdmin extends Document {
  adminId: string
  name: string
  email: string
  password: string
  createdAt: Date
}

// Generate unique admin ID
const generateAdminId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'ADM-'
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const AdminSchema = new Schema<IAdmin>({
  adminId: { type: String, unique: true, default: generateAdminId },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema)
