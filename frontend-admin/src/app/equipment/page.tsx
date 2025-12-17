'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, QrCode, Wrench } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { Equipment } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Modal, Table, Badge, Card, Select, Textarea, ConfirmDialog } from '@/components/ui';
import type { Column } from '@/components/ui';

interface EquipmentFormData {
  name: string;
  description: string;
  video_url: string;
  status: 'active' | 'maintenance' | 'broken';
}

const statusOptions = [
  { value: 'active', label: 'Aktif' },
  { value: 'maintenance', label: 'Bakımda' },
  { value: 'broken', label: 'Arızalı' },
];

export default function EquipmentPage() {
  const toast = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [viewingQr, setViewingQr] = useState<{ equipment: Equipment; qrCode: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; equipment: Equipment | null }>({ isOpen: false, equipment: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form data
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    description: '',
    video_url: '',
    status: 'active',
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, statusFilter]);

  const fetchEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getEquipment({
        page: currentPage,
        limit: 20,
        search: debouncedSearch || undefined,
        status: (statusFilter || undefined) as 'active' | 'maintenance' | 'broken' | undefined,
      });
      if (response.data) {
        setEquipment(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ekipmanlar yüklenirken hata oluştu';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, statusFilter]);

  const handleOpenModal = (equip?: Equipment) => {
    if (equip) {
      setEditingEquipment(equip);
      setFormData({
        name: equip.name,
        description: equip.description || '',
        video_url: equip.videoUrl || '',
        status: equip.status,
      });
    } else {
      setEditingEquipment(null);
      setFormData({
        name: '',
        description: '',
        video_url: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEquipment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingEquipment) {
        await apiClient.updateEquipment(editingEquipment.id, formData);
        toast.success('Ekipman başarıyla güncellendi');
      } else {
        await apiClient.createEquipment(formData);
        toast.success('Ekipman başarıyla oluşturuldu');
      }
      handleCloseModal();
      fetchEquipment();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'İşlem sırasında hata oluştu';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (equip: Equipment) => {
    setDeleteDialog({ isOpen: true, equipment: equip });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.equipment) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteEquipment(deleteDialog.equipment.id);
      toast.success('Ekipman başarıyla silindi');
      fetchEquipment();
      setDeleteDialog({ isOpen: false, equipment: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Silme işlemi sırasında hata oluştu';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewQrCode = async (equip: Equipment) => {
    try {
      const response = await apiClient.generateQRCode(equip.id);
      setViewingQr({ equipment: equip, qrCode: response.data?.qrCodeImage || '' });
      setIsQrModalOpen(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'QR kod yüklenirken hata oluştu';
      toast.error(message);
    }
  };

  const handleDownloadQr = () => {
    if (!viewingQr) return;
    const link = document.createElement('a');
    link.href = viewingQr.qrCode;
    link.download = `qr-${viewingQr.equipment.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      active: 'success',
      maintenance: 'warning',
      broken: 'danger',
    };
    const labels: Record<string, string> = {
      active: 'Aktif',
      maintenance: 'Bakımda',
      broken: 'Arızalı',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const columns: Column<Equipment>[] = [
    {
      key: 'name',
      title: 'Ekipman Adı',
      sortable: true,
    },
    {
      key: 'description',
      title: 'Açıklama',
      render: (row) => (
        <span className="line-clamp-2">{row.description || '-'}</span>
      ),
    },
    {
      key: 'status',
      title: 'Durum',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'qr_code',
      title: 'QR Kod',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewQrCode(row)}
          leftIcon={<QrCode size={16} />}
        >
          Görüntüle
        </Button>
      ),
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenModal(row)}
            leftIcon={<Pencil size={16} />}
          >
            Düzenle
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteClick(row)}
            leftIcon={<Trash2 size={16} />}
          >
            Sil
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wrench size={32} className="text-indigo-600" />
            Ekipman Yönetimi
          </h1>
          <p className="text-gray-600 mt-1">Spor salonu ekipmanlarını ve QR kodlarını yönetin</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={20} />}>
          Yeni Ekipman
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Ekipman ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={20} />}
          />
          <Select
            placeholder="Durum"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Tüm Durumlar' },
              ...statusOptions,
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={equipment}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={20}
          onPageChange={setCurrentPage}
          emptyMessage="Henüz ekipman eklenmemiş"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEquipment ? 'Ekipman Düzenle' : 'Yeni Ekipman Ekle'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {editingEquipment ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ekipman Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            label="Açıklama"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <Input
            label="Video URL"
            type="url"
            value={formData.video_url}
            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
          />
          <Select
            label="Durum"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentFormData['status'] })}
            options={statusOptions}
            required
          />
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, equipment: null })}
        onConfirm={handleDeleteConfirm}
        title="Ekipmanı Sil"
        message={`"${deleteDialog.equipment?.name}" ekipmanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`QR Kod - ${viewingQr?.equipment.name}`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsQrModalOpen(false)}>
              Kapat
            </Button>
            <Button onClick={handleDownloadQr}>
              İndir
            </Button>
          </div>
        }
      >
        {viewingQr && (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewingQr.qrCode}
              alt={`QR Code for ${viewingQr.equipment.name}`}
              className="w-64 h-64"
            />
            <p className="text-sm text-gray-600 text-center">
              Bu QR kodu mobil uygulamada taratarak ekipman kullanım videosunu görüntüleyebilirsiniz.
            </p>
          </div>
        )}
      </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
