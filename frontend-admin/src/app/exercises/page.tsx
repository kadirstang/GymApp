'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Dumbbell } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { Exercise, Equipment } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Modal, Table, Card, Select, Textarea, ConfirmDialog } from '@/components/ui';
import { FileUpload } from '@/components/ui/FileUpload';
import type { Column } from '@/components/ui';

interface ExerciseFormData {
  name: string;
  description: string;
  videoUrl: string;
  targetMuscleGroup: string;
  equipmentNeededId: string;
}

const muscleGroups = [
  'Göğüs',
  'Sırt',
  'Omuz',
  'Biceps',
  'Triceps',
  'Ön Kol',
  'Karın',
  'Bacak',
  'Kalça',
  'Baldır',
  'Kardio',
];

export default function ExercisesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; exercise: Exercise | null }>({ isOpen: false, exercise: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const isOwner = user?.role?.name === 'GymOwner';

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');

  // Form data
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    description: '',
    videoUrl: '',
    targetMuscleGroup: '',
    equipmentNeededId: '',
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, muscleFilter]);

  useEffect(() => {
    fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExercises = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getExercises({
        page: currentPage,
        limit: 20,
        search: debouncedSearch || undefined,
        targetMuscleGroup: muscleFilter || undefined,
      });

      if (response.data) {
        setExercises(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Egzersizler yüklenirken hata oluştu';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, muscleFilter]);

  const fetchEquipment = async () => {
    try {
      const response = await apiClient.getEquipment({ page: 1, limit: 100 });
      if (response.data) {
        setEquipment(response.data.items);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ekipmanlar yüklenirken hata oluştu';
      console.error(message);
    }
  };

  const handleOpenModal = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name,
        description: exercise.description || '',
        videoUrl: exercise.videoUrl || '',
        targetMuscleGroup: exercise.targetMuscleGroup,
        equipmentNeededId: exercise.equipment?.id || '',
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: '',
        description: '',
        videoUrl: '',
        targetMuscleGroup: '',
        equipmentNeededId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExercise(null);
    setVideoFile(null);
  };

  const handleVideoUpload = async (file: File): Promise<string> => {
    if (!editingExercise) {
      // If creating new exercise, just store the file for later
      return URL.createObjectURL(file);
    }

    // If editing existing exercise, upload immediately
    try {
      setUploadingVideo(true);
      const response = await apiClient.uploadExerciseVideo(editingExercise.id, file);
      if (response.data?.videoUrl) {
        toast.success('Video başarıyla yüklendi');
        return `http://localhost:3001${response.data.videoUrl}`;
      }
      throw new Error('Video URL alınamadı');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Video yükleme başarısız';
      toast.error(message);
      throw error;
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestData = {
        name: formData.name,
        description: formData.description,
        videoUrl: formData.videoUrl,
        targetMuscleGroup: formData.targetMuscleGroup,
        equipmentNeededId: formData.equipmentNeededId || undefined,
      };

      let exerciseId = editingExercise?.id;

      if (editingExercise) {
        await apiClient.updateExercise(editingExercise.id, requestData);
        toast.success('Egzersiz başarıyla güncellendi');
      } else {
        const response = await apiClient.createExercise(requestData);
        exerciseId = response.data?.id;
        toast.success('Egzersiz başarıyla oluşturuldu');
      }

      // Upload video if file was selected and exercise was created
      if (videoFile && exerciseId && !editingExercise) {
        try {
          await apiClient.uploadExerciseVideo(exerciseId, videoFile);
          toast.success('Video başarıyla yüklendi');
        } catch (error) {
          console.error('Video upload failed:', error);
          toast.warning('Egzersiz oluşturuldu ancak video yüklenemedi');
        }
      }

      await fetchExercises();
      handleCloseModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'İşlem sırasında hata oluştu';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (exercise: Exercise) => {
    setDeleteDialog({ isOpen: true, exercise });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.exercise) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteExercise(deleteDialog.exercise.id);
      toast.success('Egzersiz başarıyla silindi');
      fetchExercises();
      setDeleteDialog({ isOpen: false, exercise: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Silme işlemi sırasında hata oluştu';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Exercise>[] = [
    {
      key: 'name',
      title: 'Egzersiz Adı',
      sortable: true,
    },
    {
      key: 'targetMuscleGroup',
      title: 'Kas Grubu',
      sortable: true,
    },
    {
      key: 'equipment',
      title: 'Ekipman',
      render: (row) => {
        if (row.equipment) {
          return row.equipment.name;
        }
        return '-';
      },
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: (row) => {
        const exerciseWithCreator = row as Exercise & { creator?: { id: string } };
        const canEdit = isOwner || exerciseWithCreator.creator?.id === user?.id;

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={canEdit ? 'ghost' : 'secondary'}
              onClick={() => canEdit && handleOpenModal(row)}
              leftIcon={<Pencil size={16} />}
              disabled={!canEdit}
              title={!canEdit ? 'Bu egzersizi sadece oluşturan düzenleyebilir' : ''}
            >
              {canEdit ? 'Düzenle' : 'Görüntüle'}
            </Button>
            {canEdit && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDeleteClick(row)}
                leftIcon={<Trash2 size={16} />}
              >
                Sil
              </Button>
            )}
          </div>
        );
      },
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
            <Dumbbell size={32} className="text-indigo-600" />
            Egzersiz Kütüphanesi
          </h1>
          <p className="text-gray-600 mt-1">Spor salonu egzersizlerini yönetin</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={20} />}>
          Yeni Egzersiz
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Egzersiz ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={20} />}
          />
          <Select
            placeholder="Kas Grubu"
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value)}
            options={[
              { value: '', label: 'Tüm Kas Grupları' },
              ...muscleGroups.map((m) => ({ value: m, label: m })),
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={exercises}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={20}
          onPageChange={setCurrentPage}
          emptyMessage="Henüz egzersiz eklenmemiş"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingExercise ? 'Egzersiz Düzenle' : 'Yeni Egzersiz Ekle'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {editingExercise ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Egzersiz Adı"
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
          <FileUpload
            label="Egzersiz Videosu/Görseli"
            accept="video/*,image/*"
            maxSize={50 * 1024 * 1024}
            value={formData.videoUrl ? `http://localhost:3001${formData.videoUrl}` : null}
            onChange={(file) => setVideoFile(file)}
            onUpload={editingExercise ? handleVideoUpload : undefined}
            preview={true}
            helperText="Video (MP4, WebM, MOV) veya görsel (PNG, JPG, GIF) yükleyebilirsiniz. Maksimum 50MB."
          />
          <Select
            label="Kas Grubu"
            value={formData.targetMuscleGroup}
            onChange={(e) => setFormData({ ...formData, targetMuscleGroup: e.target.value })}
            options={muscleGroups.map((m) => ({ value: m, label: m }))}
            placeholder="Seçiniz"
            required
          />
          <Select
            label="Ekipman (Opsiyonel)"
            value={formData.equipmentNeededId}
            onChange={(e) => setFormData({ ...formData, equipmentNeededId: e.target.value })}
            options={[
              { value: '', label: 'Ekipman Yok' },
              ...(equipment || []).map((e) => ({ value: e.id, label: e.name })),
            ]}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, exercise: null })}
        onConfirm={handleDeleteConfirm}
        title="Egzersizi Sil"
        message={`"${deleteDialog.exercise?.name}" egzersizini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={isDeleting}
      />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
