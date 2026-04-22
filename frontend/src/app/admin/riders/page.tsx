'use client'

import { useState, useEffect } from 'react'
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  UserX,
  Package
} from 'lucide-react'

interface Rider {
  _id: string
  name: string
  email: string
  phone: string
  photo?: string
  vehicle: string
  licenseNumber?: string
  rating: number
  totalDeliveries: number
  status: string
  isActive: boolean
  activeOrders: number
  createdAt: string
}

const RIDER_STATUSES = ['active', 'offline', 'busy', 'suspended']

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicle: '',
    licenseNumber: '',
    status: 'offline'
  })

  useEffect(() => {
    fetchRiders()
  }, [statusFilter])

  const fetchRiders = async () => {
    setLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/all-riders?${params}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      // Ensure riders is always an array
      setRiders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching riders:', error)
      setRiders([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/riders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowAddModal(false)
        resetForm()
        fetchRiders()
      } else {
        const data = await res.json()
        alert(data.message || 'Error creating rider')
      }
    } catch (error) {
      console.error('Error creating rider:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRider) return
    
    setSaving(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/riders/${selectedRider._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          vehicle: formData.vehicle,
          status: formData.status
        })
      })

      if (res.ok) {
        setShowEditModal(false)
        setSelectedRider(null)
        resetForm()
        fetchRiders()
      } else {
        const data = await res.json()
        alert(data.message || 'Error updating rider')
      }
    } catch (error) {
      console.error('Error updating rider:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRider = async (riderId: string) => {
    if (!confirm('Are you sure you want to delete this rider?')) return
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/riders/${riderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      if (res.ok) {
        fetchRiders()
      } else {
        alert('Error deleting rider')
      }
    } catch (error) {
      console.error('Error deleting rider:', error)
    }
  }

  const toggleRiderStatus = async (rider: Rider) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const newStatus = rider.status === 'active' ? 'offline' : 'active'
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/riders/${rider._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        fetchRiders()
      }
    } catch (error) {
      console.error('Error toggling rider status:', error)
    }
  }

  const openEditModal = (rider: Rider) => {
    setSelectedRider(rider)
    setFormData({
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      password: '',
      vehicle: rider.vehicle,
      licenseNumber: rider.licenseNumber || '',
      status: rider.status
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      vehicle: '',
      licenseNumber: '',
      status: 'offline'
    })
  }

  const filteredRiders = riders.filter(rider => {
    if (search) {
      return rider.name.toLowerCase().includes(search.toLowerCase()) ||
             rider.email.toLowerCase().includes(search.toLowerCase()) ||
             rider.phone.includes(search)
    }
    return true
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Riders</h1>
          <p className="text-slate-400">Manage delivery riders</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Rider
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search riders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {RIDER_STATUSES.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Riders Grid */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : filteredRiders.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No riders found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredRiders.map((rider) => (
              <div key={rider._id} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 bg-slate-600 rounded-full flex items-center justify-center overflow-hidden">
                    {rider.photo ? (
                      <img src={rider.photo} alt={rider.name} className="w-full h-full object-cover" />
                    ) : (
                      <Truck className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">{rider.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rider.status === 'active' ? 'bg-green-900 text-green-300' :
                        rider.status === 'busy' ? 'bg-orange-900 text-orange-300' :
                        rider.status === 'suspended' ? 'bg-red-900 text-red-300' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {rider.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{rider.email}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {rider.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Truck className="w-4 h-4 text-slate-400" />
                    {rider.vehicle}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Package className="w-4 h-4 text-slate-400" />
                    {rider.totalDeliveries} deliveries
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRiderStatus(rider)}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                      rider.status === 'active' 
                        ? 'bg-red-900/50 text-red-400 hover:bg-red-900' 
                        : 'bg-green-900/50 text-green-400 hover:bg-green-900'
                    }`}
                  >
                    {rider.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEditModal(rider)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRider(rider._id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Rider Modal */}
      {showAddModal && (
        <RiderModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddRider}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          saving={saving}
          isEdit={false}
        />
      )}

      {/* Edit Rider Modal */}
      {showEditModal && selectedRider && (
        <RiderModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateRider}
          onClose={() => { setShowEditModal(false); setSelectedRider(null); resetForm(); }}
          saving={saving}
          isEdit={true}
        />
      )}
    </div>
  )
}

interface RiderModalProps {
  formData: any
  setFormData: any
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  saving: boolean
  isEdit: boolean
}

function RiderModal({ formData, setFormData, onSubmit, onClose, saving, isEdit }: RiderModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-md">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Edit Rider' : 'Add New Rider'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isEdit}
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!isEdit}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Vehicle *</label>
            <input
              type="text"
              value={formData.vehicle}
              onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Honda CG 125, Yamaha YBR"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">License Number</label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Rider' : 'Add Rider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

