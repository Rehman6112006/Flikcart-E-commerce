import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import Stripe from 'stripe'
import path from 'path'
import fs from 'fs'
import multer from 'multer'

// ===== MODELS =====
import { User } from './models/User'
import { Admin } from './models/Admin'
import { Product } from './models/Product'
import { Order } from './models/Order'
import Coupon from './models/Coupon'
import { Review } from './models/Review'
import { ReturnOrder } from './models/ReturnOrder'
import { Rider } from './models/Rider'

dotenv.config()

// ===== STRIPE CONFIG =====
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

// ===== DATABASE CONNECTION =====
const MONGODB_URI = process.env.MONGODB_URI?.replace(/\/+$/, '') || ''

if (!MONGODB_URI) {
  console.error('💥 ERROR: MONGODB_URI not found in .env file!')
  process.exit(1)
}

// MongoDB connection options - prevents automatic disconnects
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 10000,
  // Auto-reconnect options
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority' as const,
}

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully')
    // One-time migration: drop stale unique index on trackingId
    try {
      const db = mongoose.connection.db
      if (!db) { throw new Error('DB handle not ready') }
      const orderCollection = db.collection('orders')
      const indexes = await orderCollection.indexes()
      const staleIndex = indexes.find((idx: any) => idx.name === 'trackingId_1' && idx.unique === true)
      if (staleIndex) {
        await orderCollection.dropIndex('trackingId_1')
        console.log('🗑️ Dropped stale unique index: trackingId_1')
      } else {
        console.log('✅ Index check OK — no stale trackingId_1 found')
      }
    } catch (idxErr: any) {
      // Only warn on real errors; ignore "not found" or missing DB
      if (!['IndexNotFound', 'NamespaceNotFound', 'DB handle not ready'].includes(idxErr?.codeName)) {
        console.warn('⚠️ Index cleanup note:', idxErr?.message || idxErr)
      }
    }
  })
  .catch((err) => {
    console.error('💥 MongoDB Connection Error:', err.message)
    process.exit(1)
  })

// Connection monitoring & auto-reconnect handlers
mongoose.connection.on('connected', () => console.log('🔌 Mongoose connected'))
mongoose.connection.on('error', (err) => console.error('💥 Mongoose error:', err.message))
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB Disconnected — attempting auto-reconnect...')
})
mongoose.connection.on('reconnected', () => console.log('🔄 MongoDB Reconnected Successfully!'))

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await mongoose.connection.close(false)
  process.exit(0)
}
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

// ===== EMAIL TRANSPORTER =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'abdulrehman6112006@gmail.com',
    pass: process.env.EMAIL_PASS || '',
  }
})

// ===== TYPES =====
interface OtpData {
  otp: string;
  expiresAt: number;
  type: 'verify' | 'reset';
  reset?: boolean;
  resetToken?: string;
  verifiedAt?: number; // timestamp when OTP was verified (for cleanup)
}

interface JwtPayload {
  id: string;
  email?: string;
  iat?: number;
  exp?: number;
}

// ===== IN-MEMORY STORES =====
const otpStore: Record<string, OtpData> = {}

// Periodic cleanup: remove expired OTP entries every 5 min to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const key of Object.keys(otpStore)) {
    if (now > (otpStore[key].expiresAt || 0)) {
      delete otpStore[key]
    }
  }
}, 5 * 60 * 1000)

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ===== AUTH MIDDLEWARE =====
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024') as JwtPayload
    ;(req as any).user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const authenticateAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024') as JwtPayload
    const admin = await Admin.findOne({ email: decoded.email || '' })
    if (!admin) {
      return res.status(403).json({ message: 'Admin access required' })
    }
    ;(req as any).admin = admin
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const authenticateRider = async (req: Request, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024') as JwtPayload
    ;(req as any).riderId = decoded.id
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// ===== APP SETUP =====
const app: Application = express()
const PORT = process.env.PORT || 5000

// Import image fixer
import { fixProductImages } from './fixImages'

// Add endpoint to trigger image fix
app.post('/api/admin/fix-images', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    await fixProductImages()
    res.json({ message: 'Image mapping completed successfully' })
  } catch {
    res.status(500).json({ message: 'Image fix failed' })
  }
})

app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve uploaded images statically
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|avif|svg/
  if (allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP, AVIF, SVG)'))
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter
})

// ===== IMAGE UPLOAD ROUTE =====

app.post('/api/upload', authenticateAdmin, upload.array('images', 5), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) return res.status(400).json({ message: 'No images uploaded' })

    const urls = files.map(file => `/uploads/${file.filename}`)
    res.json({ message: `${files.length} image(s) uploaded successfully`, urls })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Upload failed' })
  }
})

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body
    console.log('🔄 [register] Attempt:', { name, email })

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashed })
    console.log('✅ [register] User created:', user._id)

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024', { expiresIn: '7d' })
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email }, message: 'Registration successful' })
  } catch (error) {
    console.error('💥 [register] Error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    console.log('🔄 [login] Attempt:', { email })

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024', { expiresIn: '7d' })
    console.log('✅ [login] Success:', user._id)
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      message: 'Login successful',
    })
  } catch (error) {
    console.error('💥 [login] Error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const otp = generateOTP()
    otpStore[email] = { otp, expiresAt: Date.now() + 15 * 60 * 1000, type: 'verify' }

    await transporter.sendMail({
      from: '"ShopEase" <abdulrehman6112006@gmail.com>',
      to: email,
      subject: 'ShopEase - Email Verification Code',
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #FF6B00; padding: 20px; text-align: center;"><h1 style="color: white;">ShopEase</h1></div>
        <div style="padding: 30px;">
          <h2>Email Verification Code</h2><p>Your code is:</p>
          <div style="background: #fff; padding: 20px; text-align: center; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <span style="font-size: 32px; font-weight: bold; color: #FF6B00; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #999;">Expires in 15 minutes.</p>
        </div></div>`
    })
    res.json({ message: 'Verification code sent!' })
  } catch (error) {
    console.error('💥 [verify-email] Error:', error)
    res.status(500).json({ message: 'Error sending code' })
  }
})

app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    const otpData = otpStore[email]
    if (!otpData || otpData.type !== 'verify' || otpData.otp !== otp || Date.now() > otpData.expiresAt) {
      delete otpStore[email]
      return res.status(400).json({ message: 'Invalid or expired code' })
    }

    await User.findOneAndUpdate({ email }, { isVerified: true })
    delete otpStore[email]
    res.json({ message: 'Email verified' })
  } catch (error) {
    console.error('💥 [verify-otp] Error:', error)
    res.status(500).json({ message: 'Verification failed' })
  }
})

app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const otp = generateOTP()
    otpStore[email] = { otp, expiresAt: Date.now() + 15 * 60 * 1000, type: 'reset', reset: true }

    await transporter.sendMail({
      from: '"ShopEase" <abdulrehman6112006@gmail.com>',
      to: email,
      subject: 'ShopEase - Password Reset Code',
      html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: #FF6B00; padding: 20px; text-align: center;"><h1 style="color: white;">ShopEase</h1></div>
        <div style="padding: 30px;">
          <h2>Password Reset Code</h2><p>Your code is:</p>
          <div style="background: #fff; padding: 20px; text-align: center; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <span style="font-size: 32px; font-weight: bold; color: #FF6B00; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #999;">Expires in 15 minutes.</p>
        </div></div>`
    })
    res.json({ message: 'Password reset code sent!' })
  } catch (error) {
    console.error('💥 [forgot-password] Error:', error)
    res.status(500).json({ message: 'Error sending code' })
  }
})

app.post('/api/auth/verify-reset-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    const otpData = otpStore[email]
    if (!otpData || otpData.type !== 'reset' || otpData.otp !== otp || Date.now() > otpData.expiresAt) {
      delete otpStore[email]
      return res.status(400).json({ message: 'Invalid or expired code' })
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024', { expiresIn: '20m' })
    // Atomic state transition: OTP → reset token (with 20min TTL to prevent memory leak)
    otpStore[email] = {
      ...otpStore[email],
      resetToken,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 20 * 60 * 1000, // reset token expires in 20 min
      otp: '', // clear OTP so it cannot be reused
    }
    res.json({ resetToken, message: 'Code verified' })
  } catch (error) {
    res.status(500).json({ message: 'Verification failed' })
  }
})

app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024') as any
    const otpData = otpStore[decoded.email]

    if (!otpData?.resetToken || otpData.resetToken !== resetToken) {
      delete otpStore[decoded.email]
      return res.status(400).json({ message: 'Invalid token' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await User.findOneAndUpdate({ email: decoded.email }, { password: hashed })
    delete otpStore[decoded.email]
    res.json({ message: 'Password reset complete' })
  } catch (error) {
    res.status(500).json({ message: 'Reset failed' })
  }
})

app.get('/api/auth/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user.id).select('-password')
    res.json(user)
  } catch {
    res.status(500).json({ message: 'Failed to fetch user' })
  }
})

// Update Profile
app.put('/api/auth/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { name, phone, avatar } = req.body
    const user = await User.findByIdAndUpdate(
      (req as any).user.id,
      { name, phone, avatar },
      { new: true }
    ).select('-password')
    
    // Update localStorage user info
    if (user) {
      res.json({ ...user.toObject(), message: 'Profile updated successfully' })
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch {
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

// Change Password
app.post('/api/auth/change-password', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required' })

    const user = await User.findById((req as any).user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' })

    const hashed = await bcrypt.hash(newPassword, 10)
    user.password = hashed
    await user.save()
    res.json({ message: 'Password changed successfully' })
  } catch {
    res.status(500).json({ message: 'Failed to change password' })
  }
})

// Delete Account
app.delete('/api/auth/account', authenticateUser, async (req: Request, res: Response) => {
  try {
    await User.findByIdAndDelete((req as any).user.id)
    res.json({ message: 'Account deleted successfully' })
  } catch {
    res.status(500).json({ message: 'Failed to delete account' })
  }
})

app.put('/api/auth/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { name, phone, avatar } = req.body
    const user = await User.findByIdAndUpdate(
      (req as any).user.id,
      { name, phone, avatar },
      { new: true }
    ).select('-password')
    res.json(user)
  } catch {
    res.status(500).json({ message: 'Profile update failed' })
  }
})

// ==================== PRODUCT ROUTES ====================

app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category, search, sort, page = '1', limit = '500', featured, newArrivals } = req.query
    const query: any = {}

    if (category) query.category = category
    if (search) query.$or = [
      { name: { $regex: search as string, $options: 'i' } },
      { description: { $regex: search as string, $options: 'i' } }
    ]
    if (featured === 'true') query.isFeatured = true
    if (newArrivals === 'true') query.isNewArrival = true

    let sortOption: any = { createdAt: -1 }
    if (sort === 'price-low') sortOption = { price: 1 }
    else if (sort === 'price-high') sortOption = { price: -1 }
    else if (sort === 'rating') sortOption = { rating: -1 }
    else if (sort === 'popular') sortOption = { reviews: -1 }

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const total = await Product.countDocuments(query)
    const products = await Product.find(query)
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)

    res.json({ products, page: pageNum, pages: Math.ceil(total / limitNum), total })
  } catch (error) {
    console.error('💥 [getProducts] Error:', error)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
})

app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch {
    res.status(500).json({ message: 'Failed to fetch product' })
  }
})

app.get('/api/products/category/:category', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ category: req.params.category }).sort({ createdAt: -1 })
    res.json(products)
  } catch {
    res.status(500).json({ message: 'Failed to fetch products by category' })
  }
})

app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await Product.distinct('category')
    res.json(categories)
  } catch {
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
})

// ==================== ADMIN PRODUCT MANAGEMENT ====================

app.get('/api/admin/products', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search as string || ''
    const category = req.query.category as string

    const filter: any = {}
    if (search) filter.name = { $regex: search, $options: 'i' }
    if (category && category !== 'all') filter.category = category

    const total = await Product.countDocuments(filter)
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      total,
      currentPage: page
    })
  } catch (error) {
    console.error('💥 [getProducts] Error:', error)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
})

app.post('/api/admin/products', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body)
    const saved = await product.save()
    res.status(201).json(saved)
  } catch (error) {
    console.error('💥 [createProduct] Error:', error)
    res.status(500).json({ message: 'Failed to create product' })
  }
})

app.put('/api/admin/products/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ message: 'Product not found' })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product' })
  }
})

app.delete('/api/admin/products/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: 'Product deleted' })
  } catch {
    res.status(500).json({ message: 'Failed to delete product' })
  }
})

// ==================== ORDER ROUTES ====================

app.post('/api/orders', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' })
    }
    const orderData = { ...req.body, user: userId }

    // If coupon was applied, increment usage count
    if (orderData.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: orderData.couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      ).catch(() => {})
    }

    const order = new Order(orderData)
    const saved = await order.save()

    // Update stock for each item
    for (const item of saved.orderItems) {
      const product = await Product.findById(item.product)
      if (product && product.stock >= item.quantity) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      }
    }

    res.status(201).json(saved)
  } catch (error) {
    console.error('💥 [createOrder] Error:', error)
    res.status(500).json({ message: 'Failed to create order' })
  }
})

// Guest Order (no auth required - for non-logged-in users)
app.post('/api/guest-orders', async (req: Request, res: Response) => {
  try {
    const { email, ...orderBody } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required for guest checkout' })
    }

    // Check if a user account exists with this email and link it
    let guestId = 'guest'
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      guestId = existingUser._id.toString()
    }

    const orderData = { ...orderBody, user: guestId, guestEmail: email }

    // If coupon was applied, increment usage count
    if (orderData.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: orderData.couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      ).catch(() => {})
    }

    const order = new Order(orderData)
    const saved = await order.save()

    // Update stock for each item
    for (const item of saved.orderItems) {
      const product = await Product.findById(item.product)
      if (product && product.stock >= item.quantity) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      }
    }

    res.status(201).json(saved)
  } catch (error) {
    console.error('💥 [createGuestOrder] Error:', error)
    res.status(500).json({ message: 'Failed to create guest order' })
  }
})

// Track guest order by ID or email (no auth)
app.post('/api/track-guest-order', async (req: Request, res: Response) => {
  try {
    const { orderId, email } = req.body
    if (!orderId || !email) {
      return res.status(400).json({ message: 'Order ID and email are required' })
    }

    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { guestEmail: email },
        { 'shippingAddress.email': email }
      ]
    })

    if (!order) {
      return res.status(404).json({ message: 'Order not found. Please check your order ID and email.' })
    }

    res.json(order)
  } catch (error) {
    console.error('💥 [trackGuestOrder] Error:', error)
    res.status(500).json({ message: 'Failed to track order' })
  }
})

app.get('/api/orders/myorders', authenticateUser, async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: (req as any).user.id }).sort({ createdAt: -1 })
    res.json(orders)
  } catch {
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
})

// Get orders by userId (used by my-orders page)
app.get('/api/orders/user/:userId', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token provided' })
    jwt.verify(token, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024')

    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 })
    res.json(orders)
  } catch {
    res.status(401).json({ message: 'Unauthorized' })
  }
})

app.get('/api/orders/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch {
    res.status(500).json({ message: 'Failed to fetch order' })
  }
})

// Cancel Order
app.put('/api/orders/:id/cancel', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    
    const allowedStatuses = ['Processing', 'Payment Pending', 'Confirmed', 'Shipped']
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` })
    }

    // Restore stock for cancelled items
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }).catch(() => {})
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled', cancelledAt: new Date(), cancelReason: reason || '' },
      { new: true }
    )
    console.log(`✅ [cancelOrder] Order ${req.params.id} cancelled`)
    res.json({ message: 'Order cancelled successfully', order: updated })
  } catch (error) {
    console.error('💥 [cancelOrder] Error:', error)
    res.status(500).json({ message: 'Failed to cancel order' })
  }
})

// Track Order by tracking ID or order ID
app.get('/api/track-order', async (req: Request, res: Response) => {
  try {
    const { trackingId, orderId } = req.query
    
    let order
    if (trackingId) {
      order = await Order.findOne({ trackingNumber: trackingId as string })
    } else if (orderId) {
      order = await Order.findById(orderId)
    }

    if (!order) return res.status(404).json({ message: 'Order not found' })

    // Generate tracking timeline based on status
    // Derive approximate timestamps from available fields (Order schema has: createdAt, deliveredAt)
    const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : null
    const outForDeliveryAt = deliveredDate ? new Date(deliveredDate.getTime() - 3600000) : null // ~1hr before delivery
    const shippedAt = outForDeliveryAt ? new Date(outForDeliveryAt.getTime() - 86400000) : null   // ~1day before OOD
    const confirmedAt = shippedAt ? new Date(shippedAt.getTime() - 86400000) : null           // ~1day after processing

    const steps = [
      { label: 'Order Received', completed: true, date: order.createdAt },
      { label: 'Processing', completed: ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status), date: order.createdAt },
      { label: 'Confirmed', completed: ['Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'].includes(order.status), date: confirmedAt || order.createdAt },
      { label: 'Shipped', completed: ['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status), date: shippedAt || order.createdAt },
      { label: 'Out for Delivery', completed: ['Out for Delivery', 'Delivered'].includes(order.status), date: outForDeliveryAt || null },
      { label: 'Delivered', completed: order.status === 'Delivered', date: order.deliveredAt || null }
    ]

    res.json({
      ...order._doc,
      trackingTimeline: steps,
      currentStatus: order.status,
      isCancelled: order.status === 'Cancelled'
    })
  } catch (error) {
    console.error('💥 [trackOrder] Error:', error)
    res.status(500).json({ message: 'Failed to track order' })
  }
})

// ==================== ADMIN ORDER MANAGEMENT ====================

app.get('/api/admin/orders', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch {
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
})

app.put('/api/admin/orders/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, trackingNumber } = req.body
    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'Shipped') updateData.trackingNumber = trackingNumber || ''
      if (status === 'Delivered') { updateData.isDelivered = true; updateData.deliveredAt = new Date() }
    }
    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Failed to update order' })
  }
})

app.get('/api/admin/stats', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const totalOrders = await Order.countDocuments()
    const totalProducts = await Product.countDocuments()
    const totalUsers = await User.countDocuments()
    const revenueResult = await Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }])
    const revenue = revenueResult[0]?.total || 0
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5)

    res.json({ totalOrders, totalProducts, totalUsers, revenue, recentOrders })
  } catch {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

// ==================== COUPON ROUTES ====================

// Public: List active coupons
app.get('/api/coupons', async (_req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find({ isActive: true })
    res.json(coupons)
  } catch {
    res.status(500).json({ message: 'Failed to fetch coupons' })
  }
})

// Public: Validate a coupon code
app.post('/api/coupons/validate', async (req: Request, res: Response) => {
  try {
    const { code, orderAmount } = req.body
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    })

    if (!coupon) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired coupon' })
    }

    if (coupon.minOrderAmount > orderAmount) {
      return res.status(400).json({ valid: false, message: `Minimum order amount is Rs.${coupon.minOrderAmount}` })
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' })
    }

    let discountAmount = coupon.discountType === 'percentage'
      ? (orderAmount * coupon.discountValue) / 100
      : coupon.discountValue

    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount
    }

    res.json({ valid: true, discountAmount, coupon })
  } catch {
    res.status(500).json({ message: 'Failed to validate coupon' })
  }
})

// Admin: Create coupon
app.post('/api/admin/coupons', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, endDate, usageLimit } = req.body
    if (!code || !discountValue) {
      return res.status(400).json({ message: 'Code and discount value are required' })
    }
    const existing = await Coupon.findOne({ code: code.toUpperCase() })
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' })
    }
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description: description || '',
      discountType: discountType || 'percentage',
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      startDate: startDate ? new Date(startDate) : Date.now(),
      endDate: endDate ? new Date(endDate) : undefined,
      usageLimit: usageLimit || null,
    })
    await coupon.save()
    res.status(201).json(coupon)
  } catch (error: any) {
    console.error('💥 [createCoupon] Error:', error)
    res.status(500).json({ message: error.message || 'Failed to create coupon' })
  }
})

// Admin: List all coupons (including inactive)
app.get('/api/admin/coupons', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.json(coupons)
  } catch {
    res.status(500).json({ message: 'Failed to fetch coupons' })
  }
})

// Admin: Update coupon
app.put('/api/admin/coupons/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ message: 'Coupon not found' })
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Failed to update coupon' })
  }
})

// Admin: Delete coupon
app.delete('/api/admin/coupons/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Coupon not found' })
    res.json({ message: 'Coupon deleted successfully' })
  } catch {
    res.status(500).json({ message: 'Failed to delete coupon' })
  }
})

// ==================== REVIEW ROUTES ====================

app.get('/api/products/:id/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 })
    res.json(reviews)
  } catch {
    res.status(500).json({ message: 'Failed to fetch reviews' })
  }
})

app.post('/api/reviews', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { productId, rating, comment } = req.body
    if (!productId || !rating || !comment) return res.status(400).json({ message: 'All fields required' })

    const user = await User.findById((req as any).user.id)
    const existingReview = await Review.findOne({ productId, userId: (req as any).user.id })
    if (existingReview) return res.status(400).json({ message: 'You have already reviewed this product' })

    const review = new Review({
      productId,
      userId: (req as any).user.id,
      userName: user?.name || 'Anonymous',
      rating,
      comment,
    })
    await review.save()

    // Update product rating
    const productReviews = await Review.find({ productId })
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
    await Product.findByIdAndUpdate(productId, { rating: avgRating, reviews: productReviews.length })

    res.status(201).json(review)
  } catch {
    res.status(500).json({ message: 'Failed to submit review' })
  }
})

// ==================== USER ADDRESSES ====================

app.get('/api/auth/addresses', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024') as JwtPayload
    const user = await User.findById(decoded.id)
    if (!user) return res.status(404).json([])
    
    // Return saved address if stored in user model or from a separate addresses collection
    const addresses = (user as any).address ? [{ ...((user as any).address), fullName: user.name }] : []
    res.json(addresses)
  } catch {
    res.status(401).json([])
  }
})

app.post('/api/auth/addresses', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024') as JwtPayload
    
    // Save address to user profile
    await User.findByIdAndUpdate(decoded.id, { $set: { address: req.body } })
    res.json({ message: 'Address saved successfully', address: req.body })
  } catch {
    res.status(500).json({ message: 'Failed to save address' })
  }
})

// Submit a product review
app.post('/api/reviews/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body
    const userId = (req as any).user.id
    const productId = req.params.id

    // Input validation: allow 1-5 with 0.5 increments (e.g., 3.5)
    if (rating === undefined || rating === null || typeof rating !== 'number'
        || rating < 1 || rating > 5 || !Number.isFinite(rating)
        || Math.abs(rating * 2 - Math.round(rating * 2)) > 0.01) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5 (0.5 steps allowed)' })
    }
    // Bounds: non-empty string, trimmed, max 2000 chars to prevent abuse
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0 || comment.length > 2000) {
      return res.status(400).json({ message: 'Comment is required (max 2000 characters)' })
    }

    // Duplicate check (read-only — no write lock; true uniqueness enforced by unique index below)
    const existingReview = await Review.findOne({ productId, userId })
    if (existingReview) return res.status(400).json({ message: 'You have already reviewed this product' })

    // Parallelize independent queries: user lookup + purchase verification
    const [user, hasPurchased] = await Promise.all([
      User.findById(userId),
      // Note: Order schema uses "user" (not "userId") and "orderItems" with "product" (not "items.productId")
      Order.findOne({
        user: userId,
        status: { $in: ['Delivered', 'Shipped', 'Out for Delivery', 'Confirmed'] },
        'orderItems.product': productId,
      }),
    ])

    const review = new Review({
      productId,
      userId,
      userName: user?.name || 'Anonymous',
      rating,
      comment: comment.trim(),
      isVerifiedPurchase: !!hasPurchased,
    })
    // Save handles TOCTOU race condition: unique index on (productId, userId) will throw
    // duplicate key error if two concurrent requests pass the findOne check above
    try {
      await review.save()
    } catch (saveError: any) {
      if (saveError.code === 11000 || (saveError.message && saveError.message.includes('duplicate'))) {
        return res.status(400).json({ message: 'You have already reviewed this product' })
      }
      throw saveError // re-throw unexpected errors
    }

    // Single aggregation query for average rating
    const aggResult = await Review.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    const stats = aggResult[0] || { avgRating: 0, count: 0 }
    await Product.findByIdAndUpdate(productId, { rating: stats.avgRating, reviews: stats.count })

    res.status(201).json(review)
  } catch (error) {
    console.error('[submitReview] Error:', error)
    res.status(500).json({ message: 'Failed to submit review' })
  }
})

// ==================== RETURN ORDER ROUTES ====================

app.post('/api/returns', authenticateUser, async (req: Request, res: Response) => {
  try {
    const returnOrder = new ReturnOrder({ ...req.body, userId: (req as any).user.id })
    const saved = await returnOrder.save()
    res.status(201).json(saved)
  } catch {
    res.status(500).json({ message: 'Failed to submit return request' })
  }
})

app.get('/api/returns/myreturns', authenticateUser, async (req: Request, res: Response) => {
  try {
    const returns = await ReturnOrder.find({ userId: (req as any).user.id }).sort({ createdAt: -1 })
    res.json(returns)
  } catch {
    res.status(500).json({ message: 'Failed to fetch returns' })
  }
})

app.get('/api/admin/returns', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const returns = await ReturnOrder.find().sort({ createdAt: -1 })
    res.json(returns)
  } catch {
    res.status(500).json({ message: 'Failed to fetch returns' })
  }
})

app.put('/api/admin/returns/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, adminNotes } = req.body
    const updated = await ReturnOrder.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes, reviewedBy: 'admin', reviewedAt: new Date() },
      { new: true }
    )
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Failed to update return status' })
  }
})

// Aliases for frontend's /api/return-orders path
app.get('/api/return-orders', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const returns = await ReturnOrder.find().sort({ createdAt: -1 })
    res.json(returns)
  } catch {
    res.status(500).json({ message: 'Failed to fetch returns' })
  }
})

app.put('/api/return-orders/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body
    const updated = await ReturnOrder.findByIdAndUpdate(
      req.params.id,
      { status, ...(reason && { refundReason: reason }), reviewedBy: 'admin', reviewedAt: new Date() },
      { new: true }
    )
    if (!updated) return res.status(404).json({ message: 'Return order not found' })
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Failed to update return order status' })
  }
})

// ==================== ADMIN AUTH ====================

app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const admin = await Admin.findOne({ email })
    if (!admin) return res.status(404).json({ message: 'Admin not found' })

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024',
      { expiresIn: '7d' }
    )
    res.json({ token, admin: { _id: admin._id, name: admin.name, email: admin.email, adminId: admin.adminId } })
  } catch {
    res.status(500).json({ message: 'Login failed' })
  }
})

app.get('/api/admin/profile', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const admin = await Admin.findById((req as any).admin._id).select('-password')
    res.json(admin)
  } catch {
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

// ==================== STRIPE PAYMENT ====================

app.post('/api/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
    })
    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: any) {
    console.error('💥 [Stripe] Error:', error.message)
    res.status(500).json({ message: 'Payment initialization failed' })
  }
})

app.post('/api/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  // Webhook handler placeholder
  res.json({ received: true })
})

// ==================== ADMIN PRODUCTS (GET LISTING + CATEGORIES) ====================

app.get('/api/admin/products', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const page = parseInt(_req.query.page as string) || 1
    const limit = parseInt(_req.query.limit as string) || 10
    const search = (_req.query.search as string) || ''
    const category = (_req.query.category as string) || ''

    const filter: any = {}
    if (search) filter.name = { $regex: search, $options: 'i' }
    if (category) filter.category = category

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(filter),
    ])

    res.json({ products, totalPages: Math.ceil(total / limit), currentPage: page, total })
  } catch {
    res.status(500).json({ message: 'Failed to fetch products' })
  }
})

app.get('/api/admin/categories', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const categories = await Product.distinct('category')
    res.json(categories.length > 0 ? categories : [
      'Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books',
      'Beauty', 'Toys', 'Automotive', 'Health', 'Garden', 'Other',
    ])
  } catch {
    res.json(['Electronics', 'Clothing', 'Home & Kitchen', 'Sports', 'Books'])
  }
})

// ==================== ADMIN ORDERS (DETAILED) ====================

app.get('/api/admin/all-orders', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, payment } = req.query
    const filter: any = {}
    if (status && status !== '') filter.status = status
    if (payment && payment !== '') filter.paymentMethod = payment
    const orders = await Order.find(filter).sort({ createdAt: -1 })

    // Batch populate rider name/phone in a single query (avoids N+1 problem)
    const assignedRiderIds = [...new Set(
      orders.map((o: any) => o.assignedRider).filter(Boolean)
    )]
    
    let riderMap = new Map<string, { name: string; phone: string }>()
    if (assignedRiderIds.length > 0) {
      const riders = await Rider.find({ _id: { $in: assignedRiderIds } })
        .select('name phone _id').lean()
      // Filter out riders with missing _id/name to prevent undefined Map entries
      riderMap = new Map(
        riders
          .filter((r: any) => r._id && r.name)
          .map((r: any) => [r._id.toString(), { name: r.name || '', phone: r.phone || '' }])
      )
    }

    for (const order of orders as any[]) {
      if (order.assignedRider && riderMap.has(order.assignedRider)) {
        const r = riderMap.get(order.assignedRider)!
        order.riderName = r.name
        order.riderPhone = r.phone
      }
    }

    res.json(orders)
  } catch {
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
})

app.put('/api/admin/update-order-status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId, status, riderId } = req.body
    if (!orderId) return res.status(400).json({ message: 'Order ID required' })

    const updateData: any = {}
    if (status) updateData.status = status
    if (status === 'Shipped') updateData.shippedAt = new Date()
    if (status === 'Out for Delivery') updateData.outForDeliveryAt = new Date()
    if (status === 'Delivered') { updateData.deliveredAt = new Date(); updateData.isDelivered = true; updateData.isPaid = true }
    if (riderId) updateData.assignedRider = riderId

    const updated: any = await Order.findByIdAndUpdate(orderId, updateData, { new: true }).lean()

    // Return 404 if order not found instead of silently returning null
    if (!updated) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Populate rider name & phone after assignment so admin UI shows rider info
    // Non-critical enrichment — never block the response if rider lookup fails
    try {
      if (updated.assignedRider) {
        const assignedRiderDoc = await Rider.findById(updated.assignedRider)
          .select('name phone').lean() as { name?: string; phone?: string } | null
        if (assignedRiderDoc) {
          updated.riderName = assignedRiderDoc.name || ''
          updated.riderPhone = assignedRiderDoc.phone || ''
        } else {
          // Rider document missing (deleted) — provide fallback so UI isn't blank
          updated.riderName = 'Unknown Rider'
          updated.riderPhone = ''
        }
      }
    } catch (populateErr) {
      // Log but don't fail — order was already saved successfully
      console.error('[update-order-status] Rider populate failed:', populateErr)
    }

    res.json(updated)
  } catch (err) {
    console.error('[update-order-status] Failed:', err)
    res.status(500).json({ message: 'Failed to update order' })
  }
})

// Verify JazzCash / manual payment approval
app.put('/api/admin/verify-payment', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId, isVerified, notes } = req.body
    if (!orderId) return res.status(400).json({ message: 'Order ID required' })

    const updated = await Order.findByIdAndUpdate(
      orderId,
      {
        isPaid: !!isVerified,
        paidAt: isVerified ? new Date() : undefined,
        paymentResult: { id: '', status: isVerified ? 'verified' : 'rejected', email: '' },
        ...(notes && { verificationNotes: notes }),
        ...(isVerified && { status: 'Processing' }),
      },
      { new: true }
    )
    if (!updated) return res.status(404).json({ message: 'Order not found' })
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Payment verification failed' })
  }
})

// Get pending payments (unpaid non-COD orders for admin review)
app.get('/api/admin/payments/pending', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find({
      isPaid: false,
      paymentMethod: { $ne: 'cod' },
      status: { $nin: ['Cancelled'] },
    }).sort({ createdAt: -1 })
    res.json(orders)
  } catch {
    res.status(500).json({ message: 'Failed to fetch pending payments' })
  }
})

// ==================== ADMIN USERS MANAGEMENT ====================

app.get('/api/admin/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = (req.query.search as string) || ''

    const filter: any = {}
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-password'),
      User.countDocuments(filter),
    ])

    res.json({ users, totalPages: Math.ceil(total / limit), currentPage: page, total })
  } catch {
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

app.put('/api/admin/users/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive !== undefined ? req.body.isActive : false },
      { new: true }
    ).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch {
    res.status(500).json({ message: 'Failed to update user status' })
  }
})

// ==================== ADMIN RIDERS MANAGEMENT ====================

app.get('/api/admin/all-riders', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query
    const filter: any = {}
    if (status && status !== '') filter.status = status
    const riders = await Rider.find(filter).sort({ createdAt: -1 })
    res.json(riders)
  } catch {
    res.status(500).json({ message: 'Failed to fetch riders' })
  }
})

app.post('/api/admin/riders', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, vehicleType, vehicleNumber } = req.body
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email and phone are required' })
    }
    const existingRider = await Rider.findOne({ $or: [{ email }, { phone }] })
    if (existingRider) return res.status(400).json({ message: 'Rider with this email or phone already exists' })

    const riderPassword = password || 'rider123'
    const hashedPassword = await bcrypt.hash(riderPassword, 12)
    const rider = new Rider({ name, email, password: hashedPassword, phone, vehicleType, vehicleNumber, status: 'active' })
    const saved = await rider.save()
    // Return without exposing the hash
    const { password: _, ...riderData } = saved.toObject()
    res.status(201).json(riderData)
  } catch {
    res.status(500).json({ message: 'Failed to create rider' })
  }
})

app.put('/api/admin/riders/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, vehicleType, vehicleNumber, status } = req.body
    const updated = await Rider.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, vehicleType, vehicleNumber, status },
      { new: true }
    )
    if (!updated) return res.status(404).json({ message: 'Rider not found' })
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Failed to update rider' })
  }
})

app.delete('/api/admin/riders/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await Rider.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Rider not found' })
    res.json({ message: 'Rider deleted successfully' })
  } catch {
    res.status(500).json({ message: 'Failed to delete rider' })
  }
})

// ==================== ADMIN ANALYTICS ====================

app.get('/api/admin/analytics/sales', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week'
    const daysMap: Record<string, number> = { week: 7, month: 30, year: 365 }
    const days = daysMap[period] || 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const orders = await Order.find({ createdAt: { $gte: since }, isPaid: true })
    const dailySales: Record<string, number> = {}

    for (const order of orders) {
      const day = new Date(order.createdAt).toISOString().split('T')[0]
      dailySales[day] = (dailySales[day] || 0) + order.totalPrice
    }

    const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0)
    const ordersCount = orders.length
    const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0

    // Generate chart data with zero-fill for missing days
    const labels: string[] = []
    const data: number[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      labels.push(d.slice(5)) // MM-DD format
      data.push(Math.round((dailySales[d] || 0) * 100) / 100)
    }

    res.json({
      totalRevenue: Math.round(revenue * 100) / 100,
      totalOrders: ordersCount,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      chartData: { labels, data },
      period,
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch sales analytics' })
  }
})

app.get('/api/admin/analytics/orders', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const [totalOrders, delivered, cancelled, processing, shipped] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Delivered' }),
      Order.countDocuments({ status: 'Cancelled' }),
      Order.countDocuments({ status: { $in: ['Processing', 'Confirmed'] } }),
      Order.countDocuments({ status: { $in: ['Shipped', 'Out for Delivery'] } }),
    ])

    res.json({
      totalOrders,
      delivered,
      cancelled,
      processing,
      shipped,
      deliveryRate: totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0,
      cancellationRate: totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0,
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch order analytics' })
  }
})

app.get('/api/admin/analytics/products', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const [totalProducts, lowStock, outOfStock, featured] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ isFeatured: true }),
    ])

    // Top selling by rating (proxy for popularity since we don't have order-item aggregation)
    const topProducts = await Product.find().sort({ rating: -1, reviews: -1 }).limit(5).select('name price rating reviews category images')

    // Category breakdown
    const categoryBreakdown = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      { $sort: { count: -1 } },
    ])

    res.json({
      totalProducts,
      lowStock,
      outOfStock,
      featured,
      topProducts,
      categoryBreakdown,
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch product analytics' })
  }
})

app.get('/api/admin/analytics/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week'
    const daysMap: Record<string, number> = { week: 7, month: 30, year: 365 }
    const days = daysMap[period] || 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [totalUsers, activeUsers, newUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ createdAt: { $gte: since } }),
    ])

    res.json({ totalUsers, activeUsers, newUsers, period })
  } catch {
    res.status(500).json({ message: 'Failed to fetch user analytics' })
  }
})

app.get('/api/admin/analytics/riders', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const [totalRiders, activeRiders, busyRiders] = await Promise.all([
      Rider.countDocuments(),
      Rider.countDocuments({ status: 'active' }),
      Rider.countDocuments({ status: 'busy' }),
    ])

    const riders = await Rider.find().select('riderId name status rating totalDeliveries').limit(10)

    res.json({ totalRiders, activeRiders, busyRiders, riders })
  } catch {
    res.status(500).json({ message: 'Failed to fetch rider analytics' })
  }
})

// ==================== ADMIN SETTINGS ====================

let storeSettings: any = {
  storeName: 'ShopEase',
  tagline: 'Your One-Stop Shop',
  currency: 'PKR', deliveryFee: 150, freeDeliveryMin: 2000,
  returnPolicy: 'Returns accepted within 7 days of delivery.',
  supportEmail: 'support@shopease.com', supportPhone: '+92-300-1234567',
  socialLinks: { facebook: '', instagram: '', twitter: '' },
  paymentMethods: { stripe: true, jazzcash: true, cod: true },
}

app.get('/api/admin/settings', authenticateAdmin, (_req: Request, res: Response) => {
  res.json(storeSettings)
})

app.put('/api/admin/settings', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    storeSettings = { ...storeSettings, ...req.body }
    res.json(storeSettings)
  } catch {
    res.status(500).json({ message: 'Failed to save settings' })
  }
})

// ==================== ADMIN PROFILE UPDATE + PASSWORD CHANGE ====================

app.put('/api/admin/profile', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminEmail = (req as any).user.email
    const { name, email } = req.body
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email

    const updated = await Admin.findOneAndUpdate({ email: adminEmail }, updateData, { new: true }).select('-password')
    if (!updated) return res.status(404).json({ message: 'Admin not found' })
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

app.put('/api/admin/change-password', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }

    const adminEmail = (req as any).user.email
    const admin = await Admin.findOne({ email: adminEmail })
    if (!admin) return res.status(404).json({ message: 'Admin not found' })

    const isValid = await bcrypt.compare(currentPassword, admin.password)
    if (!isValid) return res.status(400).json({ message: 'Current password is incorrect' })

    admin.password = await bcrypt.hash(newPassword, 10)
    await admin.save()
    res.json({ message: 'Password changed successfully' })
  } catch {
    res.status(500).json({ message: 'Failed to change password' })
  }
})

// ==================== INVOICE ROUTES ====================

app.get('/api/invoices/:orderId', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token provided' })
    jwt.verify(token, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024')

    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    // Generate HTML invoice for client-side rendering
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${order.trackingNumber || order._id}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#333; padding:20px; background:#f5f5f5; }
    .invoice { max-width:800px; margin:auto; background:#fff; padding:40px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,.08); }
    .header { display:flex; justify-content:space-between; align-items:start; border-bottom:3px solid #2563eb; padding-bottom:20px; margin-bottom:30px; }
    .logo h1 { font-size:28px; color:#2563eb; font-weight:bold; } .logo p { color:#666; font-size:13px; }
    .invoice-info { text-align:right; }
    .invoice-info h2 { font-size:22px; color:#1e293b; } .invoice-info p { color:#64748b; font-size:14px; }
    .meta { display:flex; gap:30px; margin-bottom:30px; }
    .meta-col { flex:1; }
    .meta-col h3 { font-size:12px; text-transform:uppercase; color:#94a3b8; letter-spacing:1px; margin-bottom:8px; }
    .meta-col p { font-size:14px; color:#334155; line-height:1.6; }
    table { width:100%; border-collapse:collapse; margin-bottom:30px; }
    th { background:#f1f5f9; text-align:left; padding:12px 15px; font-size:12px; text-transform:uppercase; color:#64748b; letter-spacing:.5px; border-bottom:2px solid #e2e8f0; }
    td { padding:12px 15px; font-size:14px; border-bottom:1px solid #f1f5f9; }
    .text-right { text-align:right; }
    .totals { width:280px; margin-left:auto; }
    .totals tr td { padding:10px 15px; border:none; }
    .totals .grand-total { border-top:2px solid #2563eb; font-weight:bold; font-size:16px; color:#1e293b; }
    .totals .grand-total td { padding-top:15px; color:#2563eb; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e2e8f0; text-align:center; color:#94a3b8; font-size:13px; }
    .status { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:bold; }
    .status-paid { background:#dcfce7; color:#166534; }
    .status-pending { background:#fef9c3; color:#854d0e; }
    @media print { body { background:#fff; padding:0; } .invoice { box-shadow:none; padding:20px; } }
  </style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div class="logo">
      <h1>ShopEase</h1>
      <p>Your One-Stop Shop<br/>support@shopease.com | +92-300-1234567</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p>${new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <span class="status ${order.isPaid ? 'status-paid' : 'status-pending'}">${order.isPaid ? 'PAID' : 'PENDING'}</span>
    </div>
  </div>

  <div class="meta">
    <div class="meta-col"><h3>Billed To</h3><p>${order.shippingAddress?.fullName || 'Customer'}<br/>${order.shippingAddress?.address || ''}<br/>${[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ') || ''}<br/>${order.shippingAddress?.phone || ''}</p></div>
    <div class="meta-col"><h3>Order Info</h3><p>Order ID: ${order._id?.toString().slice(-8).toUpperCase()}<br/>Tracking: ${order.trackingNumber || 'N/A'}<br/>Payment: ${(order.paymentMethod || '').toUpperCase()}<br/>Status: ${order.status}</p></div>
  </div>

  <table>
    <thead><tr><th>#</th><th>Item</th><th class="text-right">Price</th><th class="text-right">Qty</th><th class="text-right">Total</th></tr></thead>
    <tbody>
      ${order.orderItems.map((item: any, i: number) => `<tr>
        <td>${i + 1}</td><td>${item.name}</td><td class="text-right">Rs. ${item.price.toFixed(2)}</td>
        <td class="text-right">${item.quantity}</td><td class="text-right">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="text-right">Rs. ${(order.itemsPrice || 0).toFixed(2)}</td></tr>
    <tr><td>Shipping</td><td class="text-right">Rs. ${(order.shippingPrice || 0).toFixed(2)}</td></tr>
    <tr><td>Tax (2%)</td><td class="text-right">Rs. ${(order.taxPrice || 0).toFixed(2)}</td></tr>
    ${order.discountAmount > 0 ? `<tr><td style="color:#16a34a;">Discount (-)</td><td class="text-right" style="color:#16a34a;">- Rs. ${order.discountAmount.toFixed(2)}</td></tr>` : ''}
    <tr class="grand-total"><td>Total (PKR)</td><td class="text-right">Rs. ${(order.totalPrice || 0).toFixed(2)}</td></tr>
  </table>

  <div class="footer">
    <p>Thank you for shopping with ShopEase! For any questions about this order, please contact us.</p>
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`
    res.setHeader('Content-Type', 'text/html')
    res.send(invoiceHTML)
  } catch {
    res.status(401).json({ message: 'Unauthorized' })
  }
})

// ==================== RIDER AUTH ROUTES ====================

app.post('/api/riders/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, vehicleType, vehicleNumber } = req.body
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Name, email, password and phone are required' })
    }
    const existingRider = await Rider.findOne({ email })
    if (existingRider) {
      return res.status(400).json({ message: 'Rider with this email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const rider = new Rider({
      name,
      email,
      password: hashedPassword,
      phone,
      vehicleType,
      vehicleNumber
    })

    const savedRider = await rider.save()
    const token = jwt.sign({ id: savedRider._id, email }, process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024', { expiresIn: '7d' })

    res.status(201).json({
      token,
      rider: {
        _id: savedRider._id,
        name: savedRider.name,
        email: savedRider.email,
        phone: savedRider.phone,
        status: savedRider.status
      },
      message: 'Registration successful'
    })
  } catch (error) {
    console.error('💥 [riderRegister] Error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

app.post('/api/riders/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const rider = await Rider.findOne({ email })
    if (!rider || !rider.password) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Support both bcrypt-hashed passwords and plain text for backward compatibility
    let isMatch = false
    try {
      isMatch = await bcrypt.compare(password, rider.password)
    } catch {
      // If compare fails (e.g. not a bcrypt hash), fall back to direct comparison
      isMatch = password === rider.password
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: rider._id, email: rider.email },
      process.env.JWT_SECRET || 'shopease_jwt_secret_key_2024',
      { expiresIn: '7d' }
    )

    console.log('✅ [riderLogin] Success:', rider._id)
    res.json({
      token,
      rider: {
        _id: rider._id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        vehicleType: rider.vehicleType,
        vehicleNumber: rider.vehicleNumber,
        rating: rider.rating,
        totalDeliveries: rider.totalDeliveries,
        status: rider.status
      }
    })
  } catch (error) {
    console.error('💥 [riderLogin] Error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

app.get('/api/riders/profile', authenticateRider, async (req: Request, res: Response) => {
  try {
    const rider = await Rider.findById((req as any).riderId).select('-password')
    if (!rider) return res.status(404).json({ message: 'Rider not found' })
    res.json(rider)
  } catch {
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

// Get assigned orders for logged-in rider
app.get('/api/riders/orders', authenticateRider, async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ assignedRider: (req as any).riderId }).sort({ createdAt: -1 })
    res.json(orders)
  } catch {
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
})

// Update rider profile
app.put('/api/riders/profile', authenticateRider, async (req: Request, res: Response) => {
  try {
    const { name, phone, vehicleType, vehicleNumber, currentLocation } = req.body
    const updated = await Rider.findByIdAndUpdate(
      (req as any).riderId,
      { name, phone, vehicleType, vehicleNumber, currentLocation },
      { new: true }
    ).select('-password')
    if (!updated) return res.status(404).json({ message: 'Rider not found' })
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

// Update order delivery status (by rider)
app.put('/api/riders/orders/:id/status', authenticateRider, async (req: Request, res: Response) => {
  try {
    const { status, deliveryNotes, collectedAmount } = req.body
    const updateData: any = { status }
    if (status === 'Delivered') {
      updateData.deliveredAt = new Date()
      updateData.isDelivered = true
      updateData.isPaid = true
    }
    if (deliveryNotes) updateData.deliveryNotes = deliveryNotes
    if (collectedAmount) updateData.collectedAmount = collectedAmount

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, assignedRider: (req as any).riderId },
      updateData,
      { new: true }
    )
    if (!order) return res.status(404).json({ message: 'Order not found' })
    
    // Increment rider totalDeliveries on completion
    if (status === 'Delivered') {
      await Rider.findByIdAndUpdate((req as any).riderId, { $inc: { totalDeliveries: 1 } })
    }

    res.json(order)
  } catch {
    res.status(500).json({ message: 'Failed to update order' })
  }
})

// ==================== RIDER LEGACY ROUTES (for dashboard compatibility) ====================

// Get my orders (alias for dashboard)
app.get('/api/rider/my-orders', authenticateRider, async (req: Request, res: Response) => {
  try {
    const riderIdFromToken = (req as any).riderId
    console.log('[MyOrders] Rider ID from token:', riderIdFromToken, typeof riderIdFromToken)

    const orders = await Order.find({ assignedRider: riderIdFromToken }).sort({ createdAt: -1 })
    console.log('[MyOrders] Found', orders.length, 'orders')

    // Map trackingId for frontend compatibility
    const mappedOrders = orders.map(o => ({
      ...o.toObject(),
      trackingId: o.trackingNumber || o._id?.toString().slice(-8)
    }))
    res.json(mappedOrders)
  } catch {
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
})

// Accept order (set status to Out for Delivery)
app.put('/api/rider/accept-order', authenticateRider, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body
    if (!orderId) return res.status(400).json({ message: 'Order ID required' })

    const order = await Order.findOne({ _id: orderId, assignedRider: (req as any).riderId })
    if (!order) return res.status(404).json({ message: 'Order not found' })

    order.status = 'Out for Delivery'
    order.outForDeliveryAt = new Date()
    await order.save()

    res.json({ message: 'Order accepted successfully', order })
  } catch {
    res.status(500).json({ message: 'Failed to accept order' })
  }
})

// Update rider location
app.put('/api/rider/update-location', authenticateRider, async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude required' })
    }

    await Rider.findByIdAndUpdate((req as any).riderId, {
      currentLocation: { lat: latitude, lng: longitude },
      updatedAt: new Date()
    })

    res.json({ message: 'Location updated successfully' })
  } catch {
    res.status(500).json({ message: 'Failed to update location' })
  }
})

// Mark order as delivered (with photo & notes)
app.put('/api/rider/mark-delivered', authenticateRider, async (req: Request, res: Response) => {
  try {
    const { orderId, deliveryNotes, photo } = req.body
    if (!orderId) return res.status(400).json({ message: 'Order ID required' })

    const order = await Order.findOne({ _id: orderId, assignedRider: (req as any).riderId })
    if (!order) return res.status(404).json({ message: 'Order not found' })

    order.status = 'Delivered'
    order.deliveredAt = new Date()
    order.isDelivered = true
    order.isPaid = true
    order.deliveryProof = {
      deliveryNotes,
      ...(photo && { screenshot: photo }),
      collectedAmount: order.totalPrice
    }

    await order.save()

    // Increment rider stats
    await Rider.findByIdAndUpdate(
      (req as any).riderId,
      { $inc: { totalDeliveries: 1 }, $set: { status: 'active' } }
    )

    res.json({ message: 'Delivery completed successfully', order })
  } catch {
    res.status(500).json({ message: 'Failed to mark delivered' })
  }
})

// ==================== HEALTH CHECK ====================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  })
})

// ==================== START SERVER =====

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 API Health: http://localhost:${PORT}/api/health\n`)
})

export default app
