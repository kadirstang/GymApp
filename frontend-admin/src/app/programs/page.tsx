'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Trash2, ClipboardList, Users, Dumbbell } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { WorkoutProgram, User } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Modal, Table, Badge, Card, Select, Textarea } from '@/components/ui';
import type { Column } from '@/components/ui';

interface ProgramFormData {
  name: string;
  description: string;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  isPublic: boolean;
}

const difficultyLevels = [
  { value: 'Beginner', label: 'Başlangıç' },
  { value: 'Intermediate', label: 'Orta' },
  { value: 'Advanced', label: 'İleri' },
];

export default function ProgramsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<WorkoutProgram | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = user?.role?.name === 'GymOwner';
  const isTrainer = user?.role?.name === 'Trainer';

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Form data
  const [formData, setFormData] = useState<ProgramFormData>({
    name: '',
    description: '',
    difficulty_level: 'Beginner',
    isPublic: false,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, difficultyFilter]);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getPrograms({
        page: currentPage,
        limit: 20,
        search: debouncedSearch || undefined,
        difficultyLevel: (difficultyFilter || undefined) as 'Beginner' | 'Intermediate' | 'Advanced' | undefined,
      });
      if (response.data) {
        setPrograms(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Programlar yüklenirken hata oluştu';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, difficultyFilter]);

  const fetchStudents = async () => {
    try {
      // Trainer ise sadece kendi öğrencilerini getir
      if (isTrainer) {
        const response = await fetch('/api/trainer-matches/my-students', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (data.data?.items) {
          setStudents(data.data.items);
        }
      } else {
        // Owner ise tüm öğrencileri getir
        const response = await apiClient.getUsers({
          page: 1,
          limit: 100,
          role: 'Student',
        });
        if (response.data) {
          setStudents(response.data.items);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Öğrenciler yüklenirken hata oluştu';
      console.error(message);
    }
  };

  const handleOpenModal = (program?: WorkoutProgram) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        name: program.name,
        description: program.description || '',
        difficulty_level: program.difficultyLevel,
        isPublic: program.isPublic || false,
      });
    } else {
      setEditingProgram(null);
      setFormData({
        name: '',
        description: '',
        difficulty_level: 'Beginner',
        isPublic: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProgram(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        name: formData.name,
        description: formData.description,
        difficultyLevel: formData.difficulty_level,
        isPublic: formData.isPublic,
      };

      if (editingProgram) {
        await apiClient.updateProgram(editingProgram.id, dataToSubmit);
        toast.success('Program başarıyla güncellendi');
      } else {
        await apiClient.createProgram(dataToSubmit);
        toast.success('Program başarıyla oluşturuldu');
      }
      handleCloseModal();
      fetchPrograms();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'İşlem sırasında hata oluştu';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (program: WorkoutProgram) => {
    setDeletingProgram(program);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProgram) return;

    try {
      await apiClient.deleteProgram(deletingProgram.id);
      toast.success('Program başarıyla silindi');
      setIsDeleteModalOpen(false);
      setDeletingProgram(null);
      fetchPrograms();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Silme işlemi sırasında hata oluştu';
      toast.error(message);
    }
  };

  const getDifficultyBadge = (level: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      Beginner: 'success',
      Intermediate: 'warning',
      Advanced: 'danger',
    };
    const labels: Record<string, string> = {
      Beginner: 'Başlangıç',
      Intermediate: 'Orta',
      Advanced: 'İleri',
    };
    return <Badge variant={variants[level]}>{labels[level]}</Badge>;
  };

  const columns: Column<WorkoutProgram>[] = [
    {
      key: 'name',
      title: 'Program Adı',
      sortable: true,
    },
    {
      key: 'difficulty_level',
      title: 'Zorluk',
      render: (row) => getDifficultyBadge(row.difficultyLevel),
    },
    {
      key: 'visibility',
      title: 'Görünürlük',
      render: (row) => {
        if (row.isPublic) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              🌍 Public
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
            🔒 Private
          </span>
        );
      },
    },
    {
      key: 'creator',
      title: 'Oluşturan',
      render: (row) => `${row.createdByUser?.firstName || ''} ${row.createdByUser?.lastName || ''}`,
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: (row) => {
        const canEdit = isOwner || row.createdBy === user?.id;

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => router.push(`/programs/${row.id}/exercises`)}
              leftIcon={<Dumbbell size={16} />}
            >
              Egzersizler
            </Button>
            <Button
              size="sm"
              variant={canEdit ? 'ghost' : 'secondary'}
              onClick={() => canEdit && handleOpenModal(row)}
              leftIcon={<Pencil size={16} />}
              disabled={!canEdit}
              title={!canEdit ? 'Bu programı sadece oluşturan düzenleyebilir' : ''}
            >
              {canEdit ? 'Düzenle' : 'Görüntüle'}
            </Button>
            {canEdit && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleOpenDeleteModal(row)}
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList size={32} className="text-indigo-600" />
            Antrenman Programları
          </h1>
          <p className="text-gray-600 mt-1">Spor salonu antrenman programlarını yönetin</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={20} />}>
          Yeni Program
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Program ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={20} />}
          />
          <Select
            placeholder="Zorluk Seviyesi"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            options={[
              { value: '', label: 'Tüm Seviyeler' },
              ...difficultyLevels,
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={programs}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={20}
          onPageChange={setCurrentPage}
          emptyMessage="Henüz program eklenmemiş"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProgram ? 'Program Düzenle' : 'Yeni Program Oluştur'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {editingProgram ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Program Adı"
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
          <Select
            label="Zorluk Seviyesi"
            value={formData.difficulty_level}
            onChange={(e) =>
              setFormData({ ...formData, difficulty_level: e.target.value as ProgramFormData['difficulty_level'] })
            }
            options={difficultyLevels}
            required
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Program Görünürlüğü
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPublic"
                  checked={!formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: false })}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm">🔒 Private (Sadece ben)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: true })}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm">🌍 Public (Herkes görebilir)</span>
              </label>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Not:</strong> Program oluşturduktan sonra içine egzersiz ekleyebilirsiniz.
              <br />
              <strong>Private:</strong> Sadece siz görebilirsiniz, öğrencilere manuel atayabilirsiniz.
              <br />
              <strong>Public:</strong> Tüm trainer ve öğrenciler görebilir.
            </p>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Programı Sil"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Sil
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          <strong>{deletingProgram?.name}</strong> programını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </p>
      </Modal>
    </div>
  );
}
