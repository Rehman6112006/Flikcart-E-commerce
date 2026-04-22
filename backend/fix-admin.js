// Fix admin password and add tracking IDs to existing orders
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopease';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => { console.error(err); process.exit(1); });

const userSchema = new mongoose.Schema({ name: String, email: String, password: String, isAdmin: Boolean });
const orderSchema = new mongoose.Schema({ user: String, orderItems: Array, totalPrice: Number, status: String, trackingId: String, createdAt: Date });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

function generateTrackingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRK-';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

async function fixIssues() {
  try {
    // Update admin with your email
    const hashedPassword = await bcrypt.hash('Rehman@00', 10);
    await User.findOneAndUpdate(
      { email: 'abdulrehman6112006@gmail.com' },
      { name: 'Admin', email: 'abdulrehman6112006@gmail.com', password: hashedPassword, isAdmin: true },
      { upsert: true, new: true }
    );
    console.log('Admin updated: abdulrehman6112006@gmail.com / Rehman@00');

    // Add tracking IDs to existing orders without trackingId
    const orders = await Order.find({ trackingId: { $exists: false } });
    for (const order of orders) {
      order.trackingId = generateTrackingId();
      await order.save();
    }
    console.log(`Added tracking IDs to ${orders.length} orders`);

    // Show sample tracking IDs
    const sample = await Order.find().limit(3);
    console.log('\nSample orders with tracking IDs:');
    sample.forEach(o => console.log(`  - ${o.trackingId}`));

    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
}

fixIssues();
