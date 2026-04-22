'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Truck, 
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface SalesData {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  salesByDate: Record<string, number>
  period: string
}

interface OrderData {
  totalOrders: number
  deliveredOrders: number
  pendingOrders: number
  cancelledOrders: number
  outForDelivery: number
  statusDistribution: Array<{ status: string; count: number }>
}

interface ProductData {
  totalProducts: number
  outOfStock: number
  lowStock: number
  featuredProducts: number
  categoryDistribution: Array<{ category: string; count: number }>
  topProducts: Array<{ _id: string; totalSold: number; totalRevenue: number }>
}

interface UserData {
  totalUsers: number
  newUsers: number
  topBuyers: Array<{ _id: string; orderCount: number; totalSpent: number }>
}

interface RiderData {
  totalRiders: number
  activeRiders: number
  busyRiders: number
  riderPerformance: Array<{ name: string; totalDeliveries: number; rating: number }>
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [riderData, setRiderData] = useState<RiderData | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const headers = { 'Authorization': `Bearer ${adminToken}` }

      const [salesRes, orderRes, productRes, userRes, riderRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics/sales?period=${period}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics/orders`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics/products`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics/users`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics/riders`, { headers })
      ])

      setSalesData(await salesRes.json())
      setOrderData(await orderRes.json())
      setProductData(await productRes.json())
      setUserData(await userRes.json())
      setRiderData(await riderRes.json())
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate chart data
  const getSalesChartData = () => {
    if (!salesData?.salesByDate) return []
    return Object.entries(salesData.salesByDate).map(([date, value]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: value
    })).reverse()
  }

  const getStatusChartData = () => {
    if (!orderData?.statusDistribution) return []
    return orderData.statusDistribution.map(item => ({
      name: item.status,
      value: item.count
    }))
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">Track your store performance</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Sales"
          value={`Rs ${(salesData?.totalSales || 0).toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-green-400" />}
          trend={+12}
        />
        <MetricCard
          title="Total Orders"
          value={orderData?.totalOrders || 0}
          icon={<ShoppingBag className="w-6 h-6 text-blue-400" />}
          trend={+8}
        />
        <MetricCard
          title="Total Users"
          value={userData?.totalUsers || 0}
          icon={<Users className="w-6 h-6 text-purple-400" />}
          trend={+15}
        />
        <MetricCard
          title="Active Riders"
          value={riderData?.activeRiders || 0}
          icon={<Truck className="w-6 h-6 text-orange-400" />}
          subtitle={`${riderData?.busyRiders || 0} busy`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Trend */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sales Trend</h3>
          <div className="h-64 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-sm">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Sales (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {getSalesChartData().map((item, idx) => (
                  <tr key={idx} className="border-t border-slate-700">
                    <td className="py-2 text-slate-300">{item.date}</td>
                    <td className="py-2 text-right text-green-400 font-medium">Rs {item.sales.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Order Status</h3>
          <div className="space-y-3">
            {getStatusChartData().map((item, idx) => {
              const percentage = orderData ? Math.round((item.value / orderData.totalOrders) * 100) : 0
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-slate-400">{item.value} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        item.name === 'Delivered' ? 'bg-green-500' :
                        item.name === 'Cancelled' ? 'bg-red-500' :
                        item.name === 'Out for Delivery' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {productData?.topProducts?.slice(0, 5).map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-white truncate max-w-[200px]">{product._id}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{product.totalSold} sold</p>
                  <p className="text-sm text-green-400">Rs {product.totalRevenue?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Products by Category</h3>
          <div className="space-y-3">
            {productData?.categoryDistribution?.map((cat, idx) => {
              const percentage = productData ? Math.round((cat.count / productData.totalProducts) * 100) : 0
              return (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-300">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-slate-400 text-sm w-8">{cat.count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stock Status */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Stock Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total Products</span>
              <span className="text-white font-bold">{productData?.totalProducts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Out of Stock
              </span>
              <span className="text-red-400 font-bold">{productData?.outOfStock || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Low Stock</span>
              <span className="text-yellow-400 font-bold">{productData?.lowStock || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Featured</span>
              <span className="text-purple-400 font-bold">{productData?.featuredProducts || 0}</span>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total Users</span>
              <span className="text-white font-bold">{userData?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">New Users (30 days)</span>
              <span className="text-green-400 font-bold">+{userData?.newUsers || 0}</span>
            </div>
          </div>
        </div>

        {/* Rider Performance */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Rider Performance</h3>
          <div className="space-y-3">
            {riderData?.riderPerformance?.slice(0, 4).map((rider, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-slate-300 truncate">{rider.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white">{rider.totalDeliveries} deliveries</span>
                  <span className="text-yellow-400">★ {rider.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, trend, subtitle }: { 
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: number
  subtitle?: string
}): JSX.Element {
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend !== undefined && (
            <p className={`text-sm mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(trend)}% vs last period
            </p>
          )}
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 bg-slate-700/50 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  )
}

