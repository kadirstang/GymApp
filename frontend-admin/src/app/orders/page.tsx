'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProductInfo {
  id: string;
  name: string;
  imageUrl?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  product?: ProductInfo;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: 'pending_approval' | 'prepared' | 'completed' | 'cancelled';
  metadata?: {
    cancellationReason?: string;
    internalNotes?: string;
    deliveryNotes?: string;
    paymentMethod?: string;
  };
  createdAt: string;
  updatedAt: string;
  user?: User;
  items?: OrderItem[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modals
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [metadataForm, setMetadataForm] = useState({
    cancellationReason: '',
    internalNotes: '',
    deliveryNotes: '',
    paymentMethod: '',
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, number | string> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await apiClient.getOrders(params);

      if (response.success && response.data) {
        setOrders(response.data.items || []);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Siparişler yüklenemedi';
      toast?.showToast('error', message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setMetadataForm({
      cancellationReason: order.metadata?.cancellationReason || '',
      internalNotes: order.metadata?.internalNotes || '',
      deliveryNotes: order.metadata?.deliveryNotes || '',
      paymentMethod: order.metadata?.paymentMethod || '',
    });
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      const metadata: Record<string, string> = {};

      // Only include metadata fields that have values
      if (metadataForm.cancellationReason) metadata.cancellationReason = metadataForm.cancellationReason;
      if (metadataForm.internalNotes) metadata.internalNotes = metadataForm.internalNotes;
      if (metadataForm.deliveryNotes) metadata.deliveryNotes = metadataForm.deliveryNotes;
      if (metadataForm.paymentMethod) metadata.paymentMethod = metadataForm.paymentMethod;

      await apiClient.updateOrderStatus(selectedOrder.id, {
        status: newStatus as Order['status'],
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      toast?.showToast('success', 'Sipariş durumu güncellendi');
      setIsStatusModalOpen(false);
      fetchOrders();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Güncelleme başarısız';
      toast?.showToast('error', message);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig: Record<Order['status'], { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
      pending_approval: {
        label: 'Onay Bekliyor',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      prepared: {
        label: 'Hazırlandı',
        className: 'bg-blue-100 text-blue-800',
        icon: Package,
      },
      completed: {
        label: 'Tamamlandı',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      cancelled: {
        label: 'İptal Edildi',
        className: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.toLowerCase().includes(searchLower) ||
      (order.user?.email || '').toLowerCase().includes(searchLower)
    );
  });

  const canEditStatus = user?.role?.permissions?.orders?.update || user?.role?.name === 'GymOwner';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-8 h-8 text-indigo-600" />
                Siparişler
              </h1>
              <p className="text-gray-500 mt-1">
                Toplam {pagination.total} sipariş
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Sipariş no, müşteri adı veya email ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending_approval">Onay Bekliyor</option>
                  <option value="prepared">Hazırlandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Yükleniyor...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş Bulunamadı</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Arama kriterlerine uygun sipariş bulunamadı.' : 'Henüz sipariş bulunmuyor.'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sipariş No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Müşteri
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tutar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <ShoppingCart className="w-5 h-5 text-gray-400" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.orderNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.user?.firstName} {order.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{order.user?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              ₺{Number(order.totalAmount).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.items?.length || 0} ürün
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewDetail(order)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                                title="Detayları Görüntüle"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              {canEditStatus && order.status !== 'completed' && order.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleOpenStatusModal(order)}
                                  className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50 transition-colors text-xs font-medium"
                                >
                                  Durum Güncelle
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                      {' - '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>
                      {' / '}
                      <span className="font-medium">{pagination.total}</span> sipariş gösteriliyor
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Önceki
                    </button>
                    <span className="text-sm text-gray-700">
                      Sayfa {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Sonraki
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status Update Modal */}
        {isStatusModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sipariş Durumu Güncelle
                </h3>

                <div className="space-y-4">
                  {/* Order Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Sipariş No</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.orderNumber}</p>
                    <p className="text-sm text-gray-600 mt-2">Müşteri</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                    </p>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Durum
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="pending_approval">Onay Bekliyor</option>
                      <option value="prepared">Hazırlandı</option>
                      <option value="completed">Tamamlandı</option>
                      <option value="cancelled">İptal Edildi</option>
                    </select>
                  </div>

                  {/* Metadata Fields */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-gray-900">Ek Bilgiler (Opsiyonel)</h4>

                    {/* Cancellation Reason (only if cancelled) */}
                    {newStatus === 'cancelled' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          İptal Nedeni
                        </label>
                        <select
                          value={metadataForm.cancellationReason}
                          onChange={(e) =>
                            setMetadataForm({ ...metadataForm, cancellationReason: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Seçiniz...</option>
                          <option value="Müşteri talebi">Müşteri talebi</option>
                          <option value="Stok yetersiz">Stok yetersiz</option>
                          <option value="Ödeme alınamadı">Ödeme alınamadı</option>
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ödeme Yöntemi
                      </label>
                      <select
                        value={metadataForm.paymentMethod}
                        onChange={(e) =>
                          setMetadataForm({ ...metadataForm, paymentMethod: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Seçiniz...</option>
                        <option value="Nakit">Nakit</option>
                        <option value="Kredi Kartı">Kredi Kartı</option>
                        <option value="Havale/EFT">Havale/EFT</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>

                    {/* Delivery Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teslimat Notları
                      </label>
                      <textarea
                        value={metadataForm.deliveryNotes}
                        onChange={(e) =>
                          setMetadataForm({ ...metadataForm, deliveryNotes: e.target.value })
                        }
                        rows={2}
                        placeholder="Teslimat ile ilgili notlar..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    {/* Internal Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dahili Notlar
                      </label>
                      <textarea
                        value={metadataForm.internalNotes}
                        onChange={(e) =>
                          setMetadataForm({ ...metadataForm, internalNotes: e.target.value })
                        }
                        rows={3}
                        placeholder="Sadece personel tarafından görülebilen notlar..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setIsStatusModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {isDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Sipariş Detayları
                    </h3>
                    <p className="text-gray-500 mt-1">{selectedOrder.orderNumber}</p>
                  </div>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Müşteri Bilgileri</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-600">Ad Soyad:</span>{' '}
                        <span className="font-medium">
                          {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600">Email:</span>{' '}
                        <span className="font-medium">{selectedOrder.user?.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Sipariş Bilgileri</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-600">Toplam Tutar:</span>{' '}
                        <span className="font-semibold text-lg">
                          ₺{Number(selectedOrder.totalAmount).toFixed(2)}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600">Tarih:</span>{' '}
                        <span className="font-medium">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {selectedOrder.metadata && Object.keys(selectedOrder.metadata).length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Ek Bilgiler</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      {selectedOrder.metadata.paymentMethod && (
                        <p>
                          <span className="text-gray-600">Ödeme Yöntemi:</span>{' '}
                          <span className="font-medium">{selectedOrder.metadata.paymentMethod}</span>
                        </p>
                      )}
                      {selectedOrder.metadata.cancellationReason && (
                        <p>
                          <span className="text-gray-600">İptal Nedeni:</span>{' '}
                          <span className="font-medium text-red-600">
                            {selectedOrder.metadata.cancellationReason}
                          </span>
                        </p>
                      )}
                      {selectedOrder.metadata.deliveryNotes && (
                        <p>
                          <span className="text-gray-600">Teslimat Notları:</span>{' '}
                          <span className="font-medium">{selectedOrder.metadata.deliveryNotes}</span>
                        </p>
                      )}
                      {selectedOrder.metadata.internalNotes && (
                        <p>
                          <span className="text-gray-600">Dahili Notlar:</span>{' '}
                          <span className="font-medium">{selectedOrder.metadata.internalNotes}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Sipariş İçeriği</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ürün
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Adet
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Birim Fiyat
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Toplam
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {item.product?.imageUrl && (
                                  <Image
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                )}
                                <span className="text-sm font-medium text-gray-900">
                                  {item.product?.name || 'Ürün'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                              ₺{Number(item.unitPrice).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              ₺{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            Genel Toplam:
                          </td>
                          <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                            ₺{Number(selectedOrder.totalAmount).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Kapat
                  </button>
                  {canEditStatus && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenStatusModal(selectedOrder);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Durum Güncelle
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
