'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Image as ImageIcon,
  ImageIcon as ImageIcon2,
  Camera
} from 'lucide-react'
import Image from 'next/image'

interface Product {
  _id: string
  name: string
  description: string
  price: number
  originalPrice: number
  category: string
  images: string[]
  stock: number
  brand?: string
  discount: number
  rating: number
  reviews: number
  isFeatured: boolean
  isNewArrival: boolean
  createdAt: string
}

const CATEGORIES = ['Electronics', 'Fashion', 'Sports', 'Home & Living', 'Beauty', 'Books & Media']

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: '',
    images: [''],
    stock: 0,
    brand: '',
    discount: 0,
    isFeatured: false,
    isNewArrival: false
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [search, categoryFilter, page])

  const fetchProducts = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      if (search) params.append('search', search)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products?${params}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      setProducts(data.products || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      setCategories(data || CATEGORIES)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      // Filter out empty image URLs
      const cleanImages = formData.images.filter(img => img.trim() !== '')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...formData, images: cleanImages.length > 0 ? cleanImages : [] })
      })

      if (res.ok) {
        setShowAddModal(false)
        resetForm()
        fetchProducts()
      } else {
        const data = await res.json()
        alert(data.message || 'Error creating product')
      }
    } catch (error) {
      console.error('Error creating product:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    
    setSaving(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      // Filter out empty image URLs
      const cleanImages = formData.images.filter(img => img.trim() !== '')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${selectedProduct._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...formData, images: cleanImages.length > 0 ? cleanImages : [] })
      })

      if (res.ok) {
        setShowEditModal(false)
        setSelectedProduct(null)
        resetForm()
        fetchProducts()
      } else {
        const data = await res.json()
        alert(data.message || 'Error updating product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      if (res.ok) {
        fetchProducts()
      } else {
        alert('Error deleting product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      images: product.images && product.images.length > 0 ? product.images : [''],
      stock: product.stock,
      brand: product.brand || '',
      discount: product.discount,
      isFeatured: product.isFeatured || false,
      isNewArrival: product.isNewArrival || false
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      originalPrice: 0,
      category: '',
      images: [''],
      stock: 0,
      brand: '',
      discount: 0,
      isFeatured: false,
      isNewArrival: false
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-slate-400">Manage your product inventory</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-sm text-slate-400 truncate max-w-xs">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{product.category}</td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white font-semibold">Rs {product.price.toLocaleString()}</p>
                        {product.originalPrice > product.price && (
                          <p className="text-sm text-slate-400 line-through">Rs {product.originalPrice.toLocaleString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock > 10 ? 'bg-green-900 text-green-300' :
                        product.stock > 0 ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {product.isFeatured && (
                          <span className="px-2 py-1 bg-purple-900 text-purple-300 rounded text-xs">Featured</span>
                        )}
                        {product.isNewArrival && (
                          <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">New</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/product/${product._id}`}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-slate-700 flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <ProductModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddProduct}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          saving={saving}
          isEdit={false}
          categories={categories}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <ProductModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateProduct}
          onClose={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }}
          saving={saving}
          isEdit={true}
          categories={categories}
        />
      )}
    </div>
  )
}

interface ProductModalProps {
  formData: any
  setFormData: any
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  saving: boolean
  isEdit: boolean
  categories: string[]
}

function ProductModal({ 
  formData, 
  setFormData, 
  onSubmit, 
  onClose, 
  saving, 
  isEdit,
  categories 
}: ProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Handle URL-based image change
  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData({ ...formData, images: newImages })
  }

  const addImageUrlField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] })
  }

  const removeImageField = (index: number) => {
    const newImages = formData.images.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, images: newImages.length ? newImages : [''] })
  }

  // Handle FILE UPLOAD from computer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      for (let i = 0; i < files.length; i++) {
        formDataUpload.append('images', files[i])
      }

      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: formDataUpload
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Upload failed' }))
        alert(errData.message || 'Upload failed')
        return
      }

      const data = await res.json()

      // Add uploaded URLs to existing images
      const currentImages = formData.images.filter((img: string) => img.trim() !== '')
      const allImages = [...currentImages, ...data.urls]
      setFormData({ ...formData, images: allImages.length > 0 ? allImages : [''] })

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload images. Make sure backend is running on port 5000.')
    } finally {
      setUploading(false)
    }
  }

  // Remove a single image (URL or uploaded)
  const removeImageAtIndex = (index: number) => {
    removeImageField(index)
  }

  // Get valid images for preview
  const previewImages = formData.images.filter((img: string) => img.trim() !== '')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-4 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g. iPhone 15 Pro Max"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Detailed product description..."
            />
          </div>

          {/* Price / Stock Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Price (PKR) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                placeholder="2999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Original Price</label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                placeholder="4999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Stock *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                placeholder="100"
              />
            </div>
          </div>

          {/* Brand / Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Apple, Samsung, Nike..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Discount (%)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                placeholder="10"
              />
            </div>
          </div>

          {/* ===== IMAGES SECTION - Upload + URLs + Preview ===== */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Product Images
            </label>

            {/* Option 1: File Upload from Computer */}
            <div className="mb-4">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-700/30"
                   onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className={`w-8 h-8 mx-auto mb-2 ${uploading ? 'animate-bounce text-blue-400' : 'text-slate-400'}`} />
                <p className="text-slate-300 text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload images from computer'}
                </p>
                <p className="text-slate-500 text-xs mt-1">Supports JPEG, PNG, GIF, WebP, SVG, AVIF (Max 10MB each)</p>
              </div>
            </div>

            {/* Option 2: Paste Image URLs */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <ImageIcon2 className="w-3.5 h-3.5" /> Or paste image URLs:
                </p>
                <button
                  type="button"
                  onClick={addImageUrlField}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add URL field
                </button>
              </div>

              <div className="space-y-2">
                {formData.images.map((img: string, index: number) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={img}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="https://example.com/image.jpg or https://picsum.photos/seed/product/800/800"
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                    />
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="p-2 text-red-400 hover:bg-slate-700 rounded-lg shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {/* Mini preview for URL */}
                    {img && img.trim() !== '' && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-600">
                        <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display='none'}} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Image Preview Grid */}
            {previewImages.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Preview ({previewImages.length} image{previewImages.length > 1 ? 's' : ''}):</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {previewImages.map((img: string, index: number) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-600 aspect-square bg-slate-700">
                      <img
                        src={img.startsWith('/uploads') ? `${process.env.NEXT_PUBLIC_API_URL}${img}` : img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageAtIndex(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                        #{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewImages.length === 0 && (
              <p className="text-xs text-slate-500 italic">No images added yet. Upload from computer or paste URLs above.</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-300">Featured Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-300">New Arrival</span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {saving ? 'Saving...' : uploading ? 'Uploading...' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
