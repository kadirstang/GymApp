'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { ConfirmDialog } from '@/components/ui';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  AlertTriangle,
  Filter,
  X,
  DollarSign,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface BulkActionModalState {
  type: 'price' | 'status' | 'delete' | null;
  isOpen: boolean;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Check if user is Owner
  const isOwner = user?.role?.name === 'GymOwner';

  // Redirect if not owner
  useEffect(() => {
    if (user && !isOwner) {
      router.push('/unauthorized');
    }
  }, [user, isOwner, router]);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkActionModal, setBulkActionModal] = useState<BulkActionModalState>({
    type: null,
    isOpen: false,
  });
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [bulkPriceType, setBulkPriceType] = useState<'percent' | 'fixed'>('percent');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.page, selectedCategory, filterStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (filterStatus !== 'all') {
        params.isActive = filterStatus === 'active';
      }

      const response = await apiClient.getProducts(params);
      const items = response.data?.items || [];
      setProducts(items);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.pagination?.total || 0,
        totalPages: response.data?.pagination?.totalPages || 1,
      }));
    } catch (error: any) {
      console.error('Fetch products error:', error);
      toast?.showToast(
        'error',
        error.response?.data?.message || 'Failed to load products'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getProductCategories();
      // Backend returns { items, pagination } structure
      const data = response.data as { items?: Category[] } | Category[];
      const items = Array.isArray(data) ? data : (data?.items || []);
      setCategories(items);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const getStockBadgeClass = (stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock < 10) return 'bg-red-100 text-red-800';
    if (stock < 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockIcon = (stock: number) => {
    if (stock < 10) return <AlertTriangle className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  const handleToggleActive = async (productId: string) => {
    try {
      await apiClient.patch(`/products/${productId}/toggle`);
      toast?.showToast('Product status updated', 'success');
      fetchProducts();
    } catch (error: any) {
      console.error('Toggle product error:', error);
      toast?.showToast(
        error.response?.data?.message || 'Failed to update status',
        'error'
      );
    }
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteDialog({ isOpen: true, product });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.product) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteProduct(deleteDialog.product.id);
      toast?.showToast('success', 'Ürün başarıyla silindi');
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deleteDialog.product.id);
        return newSet;
      });
      fetchProducts();
      setDeleteDialog({ isOpen: false, product: null });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Ürün silinirken hata oluştu';
      toast?.showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkPriceValue || selectedProducts.size === 0) return;

    try {
      const value = parseFloat(bulkPriceValue);
      const promises = Array.from(selectedProducts).map(async (productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        let newPrice = product.price;
        if (bulkPriceType === 'percent') {
          newPrice = product.price * (1 + value / 100);
        } else {
          newPrice = value;
        }

        return apiClient.put(`/products/${productId}`, { price: newPrice });
      });

      await Promise.all(promises);
      toast?.showToast(
        `${selectedProducts.size} products updated successfully`,
        'success'
      );
      setBulkActionModal({ type: null, isOpen: false });
      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error: any) {
      console.error('Bulk price update error:', error);
      toast?.showToast('Failed to update prices', 'error');
    }
  };

  const handleBulkStatusToggle = async (activate: boolean) => {
    if (selectedProducts.size === 0) return;

    try {
      const promises = Array.from(selectedProducts).map((productId) =>
        apiClient.put(`/products/${productId}`, { isActive: activate })
      );

      await Promise.all(promises);
      toast?.showToast(
        `${selectedProducts.size} products ${activate ? 'activated' : 'deactivated'}`,
        'success'
      );
      setBulkActionModal({ type: null, isOpen: false });
      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error: any) {
      console.error('Bulk status update error:', error);
      toast?.showToast('Failed to update status', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`Delete ${selectedProducts.size} products?`)) return;

    try {
      const promises = Array.from(selectedProducts).map((productId) =>
        apiClient.delete(`/products/${productId}`)
      );

      await Promise.all(promises);
      toast?.showToast(
        `${selectedProducts.size} products deleted successfully`,
        'success'
      );
      setBulkActionModal({ type: null, isOpen: false });
      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast?.showToast('Failed to delete products', 'error');
    }
  };

  const lowStockCount = products.filter((p) => p.stockQuantity < 10).length;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-500 mt-1">Manage marketplace products</p>
            </div>
            <button
              onClick={() => router.push('/products/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>

          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">
                <strong>{lowStockCount}</strong> product(s) have low stock (less than 10 units)
              </span>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {Array.isArray(categories) && categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as any);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedProducts.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedProducts.size} product(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setBulkActionModal({ type: 'price', isOpen: true })}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <DollarSign className="w-4 h-4" />
                  Update Price
                </button>
                <button
                  onClick={() => setBulkActionModal({ type: 'status', isOpen: true })}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Toggle Status
                </button>
                <button
                  onClick={() => setBulkActionModal({ type: 'delete', isOpen: true })}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedProducts(new Set())}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedCategory || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first product'}
                </p>
                <button
                  onClick={() => router.push('/products/new')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedProducts.size === products.length && products.length > 0}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            {product.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                            {product.category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            ₺{Number(product.price).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStockBadgeClass(
                              product.stockQuantity
                            )}`}
                          >
                            {getStockIcon(product.stockQuantity)}
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(product.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-colors ${
                              product.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {product.isActive ? (
                              <>
                                <Eye className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => router.push(`/products/${product.id}/edit`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(product)}
                              className="text-red-600 hover:text-red-900"
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                    <div className="text-sm text-gray-700">
                      Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bulk Action Modals */}
        {bulkActionModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  {bulkActionModal.type === 'price' && 'Update Prices'}
                  {bulkActionModal.type === 'status' && 'Toggle Status'}
                  {bulkActionModal.type === 'delete' && 'Delete Products'}
                </h3>
                <button
                  onClick={() => setBulkActionModal({ type: null, isOpen: false })}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bulkActionModal.type === 'price' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Type
                    </label>
                    <select
                      value={bulkPriceType}
                      onChange={(e) => setBulkPriceType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percent">Percentage Change</option>
                      <option value="fixed">Fixed Price</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {bulkPriceType === 'percent' ? 'Percentage (%)' : 'New Price (₺)'}
                    </label>
                    <input
                      type="number"
                      value={bulkPriceValue}
                      onChange={(e) => setBulkPriceValue(e.target.value)}
                      placeholder={bulkPriceType === 'percent' ? 'e.g., 10 for +10%, -5 for -5%' : 'e.g., 99.99'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBulkActionModal({ type: null, isOpen: false })}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkPriceUpdate}
                      disabled={!bulkPriceValue}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}

              {bulkActionModal.type === 'status' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Change status for {selectedProducts.size} selected product(s)
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBulkStatusToggle(true)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleBulkStatusToggle(false)}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              )}

              {bulkActionModal.type === 'delete' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete {selectedProducts.size} product(s)? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBulkActionModal({ type: null, isOpen: false })}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, product: null })}
          onConfirm={handleDeleteConfirm}
          title="Ürünü Sil"
          message={`"${deleteDialog.product?.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
          variant="danger"
          isLoading={isDeleting}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
