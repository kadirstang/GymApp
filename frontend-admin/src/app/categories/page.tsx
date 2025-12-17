'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui';

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', imageUrl: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; category: Category | null }>({ isOpen: false, category: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProductCategories();
      const data = response.data as { items?: Category[] } | Category[];
      const items = Array.isArray(data) ? data : (data?.items || []);
      setCategories(items);
    } catch (error) {
      console.error('Fetch categories error:', error);
      toast?.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast?.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await apiClient.updateProductCategory(editingCategory.id, formData);
        toast?.success('Category updated successfully');
      } else {
        await apiClient.createProductCategory(formData);
        toast?.success('Category created successfully');
      }
      setIsModalOpen(false);
      setFormData({ name: '', imageUrl: '' });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Save category error:', error);
      const message = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save category'
        : 'Failed to save category';
      toast?.error(message);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, imageUrl: category.imageUrl || '' });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteDialog({ isOpen: true, category });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.category) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteProductCategory(deleteDialog.category.id);
      toast?.success('Kategori başarıyla silindi');
      fetchCategories();
      setDeleteDialog({ isOpen: false, category: null });
    } catch (error: unknown) {
      let message = 'Kategori silinirken hata oluştu';
      if (error && typeof error === 'object') {
        const axiosError = error as {
          response?: {
            data?: {
              message?: string;
            };
          };
          message?: string;
        };

        if (axiosError.response?.data?.message) {
          message = axiosError.response.data.message;
        } else if (axiosError.message) {
          message = axiosError.message;
        }
      }

      toast?.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', imageUrl: '' });
    setIsModalOpen(true);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Categories</h1>
              <p className="text-gray-500 mt-1">Manage product categories for your marketplace</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>

          {/* Categories Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Categories Yet</h3>
              <p className="text-gray-500 mb-6">Create your first product category to get started</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                    {category._count && (
                      <p className="text-sm text-gray-500 mb-4">
                        {category._count.products} product{category._count.products !== 1 ? 's' : ''}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(category);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(category)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Supplements"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormData({ name: '', imageUrl: '' });
                      setEditingCategory(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, category: null })}
          onConfirm={handleDeleteConfirm}
          title="Kategoriyi Sil"
          message={`"${deleteDialog.category?.name}" kategorisini silmek istediğinize emin misiniz? ${deleteDialog.category?._count?.products ? `Bu kategoriye bağlı ${deleteDialog.category._count.products} ürün var.` : ''} Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
          variant="danger"
          isLoading={isDeleting}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
