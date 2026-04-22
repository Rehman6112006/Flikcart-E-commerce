import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import Stripe from 'stripe'
import { Admin } from './models/Admin'
import { Review } from './models/Review'
import { User } from './models/User'


dotenv.config()

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

// Database Connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('✅ DB Connected'))
  .catch((err) => {
    console.error('💥 DB Connection Error:', err.message)
    process.exit(1)
  })

mongoose.connection.on('error', (err) => console.error('💥 Mongoose connection error:', err))
mongoose.connection.once('open', () => console.log('🔗 MongoDB connection opened'))

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'abdulrehman6112006@gmail.com',
    pass: process.env.EMAIL_PASS || 'ucesbnzs fdfu pvda'
  }
})

interface OtpData {
  otp: string;
  expiresAt: number;
  type: 'verify' | 'reset';
  reset?: boolean;
  resetToken?: string;
}

const otpStore: Record<string, OtpData> = {}

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const app: Application = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ... [ALL ORIGINAL CODE FROM WORKING VERSION] ...

// FIXED RESET ENDPOINTS (insert after OTP endpoints, before other endpoints)

app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    console.log('🔄 [forgot-password] Request:', { email })
    
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email })
    if (!user) {
      console.log('❌ [forgot-password] User not found:', email)
      return res.status(404).json({ message: 'User not found' })
    }

    const otp = generateOTP()
    const expiresAt = Date.now() + 15 * 60 * 1000
    otpStore[email] = { otp, expiresAt, type: 'reset', reset: true }
    console.log('✅ [forgot-password] OTP stored:', { email, expiresAt: new Date(expiresAt).toISOString() })

    const mailOptions = {
      from: '"FlikCart" <abdulrehman6112006@gmail.com>',
      to: email,
      subject: 'FlikCart - Password Reset Code',
      html: `... [email template with ${otp}] ...`
    }

    await transporter.sendMail(mailOptions)
    res.json({ message: 'Password reset code sent!' })
  } catch (error) {
    console.error('💥 [forgot-password] Error:', error)
    res.status(500).json({ message: 'Error sending code' })
  }
})

app.post('/api/auth/verify-reset-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    console.log('🔄 [verify-reset-otp] Attempt:', email)

    const otpData = otpStore[email]
    if (!otpData || otpData.type !== 'reset' || otpData.otp !== otp || Date.now() > otpData.expiresAt) {
      delete otpStore[email]
      return res.status(400).json({ message: 'Invalid or expired code' })
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET || 'flikcart_jwt_secret_key_2024', { expiresIn: '20m' })
    otpStore[email].resetToken = resetToken
    delete otpStore[email].otp

    console.log('✅ [verify-reset-otp] Token issued')
    res.json({ resetToken, message: 'Code verified' })
  } catch (error) {
    console.error('💥 [verify-reset-otp] Error:', error)
    res.status(500).json({ message: 'Verification failed' })
  }
})

app.post('/api/auth/resend-reset-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    console.log('🔄 [resend-reset-otp] Request:', email)

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    delete otpStore[email]
    const otp = generateOTP()
    const expiresAt = Date.now() + 15 * 60 * 1000
    otpStore[email] = { otp, expiresAt, type: 'reset', reset: true }

    // Send email...
    await transporter.sendMail({ to: email, /* template */ })
    res.json({ message: 'New code sent' })
  } catch (error) {
    console.error('💥 [resend-reset-otp] Error:', error)
    res.status(500).json({ message: 'Resend failed' })
  }
})

app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body
    console.log('🔄 [reset-password] Attempt')

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'flikcart_jwt_secret_key_2024') as any
    const email = decoded.email
    const otpData = otpStore[email]

    if (!otpData?.resetToken || otpData.resetToken !== resetToken) {
      delete otpStore[email]
      return res.status(400).json({ message: 'Invalid token' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await User.findOneAndUpdate({ email }, { password: hashed })
    delete otpStore[email]

    console.log('✅ [reset-password] Success')
    res.json({ message: 'Password reset complete' })
  } catch (error) {
    console.error('💥 [reset-password] Error:', error)
    res.status(500).json({ message: 'Reset failed' })
  }
})

app.listen(PORT, () => console.log(`Server on port ${PORT}`))

export default app

