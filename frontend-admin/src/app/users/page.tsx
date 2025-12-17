'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Users as UsersIcon, GraduationCap, Upload, User as UserIcon } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { User } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Table, Badge, Card, ConfirmDialog, Modal } from '@/components/ui';
import { FileUpload } from '@/components/ui/FileUpload';
import type { Column } from '@/components/ui';

export default function UsersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarModal, setAvatarModal] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isTrainer = user?.role?.name === 'Trainer';
  const canManage = !isTrainer;

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, roleFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getUsers({
        page: currentPage,
        limit: 20,
        search: debouncedSearch || undefined,
        role: (roleFilter || undefined) as 'Student' | 'Trainer' | 'GymOwner' | undefined,
      });
      if (response.data) {
        setUsers(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Kullanıcılar yüklenirken hata oluştu';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, roleFilter]);

  const handleDeleteClick = (userToDelete: User) => {
    setDeleteDialog({ isOpen: true, user: userToDelete });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.user) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteUser(deleteDialog.user.id);
      toast.success('Kullanıcı başarıyla silindi');
      fetchUsers();
      setDeleteDialog({ isOpen: false, user: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Silme işlemi sırasında hata oluştu';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAvatarClick = (userToUpdate: User) => {
    setAvatarModal({ isOpen: true, user: userToUpdate });
  };

  const handleAvatarUpload = async (file: File): Promise<string> => {
    if (!avatarModal.user) throw new Error('No user selected');

    try {
      setUploadingAvatar(true);
      const response = await apiClient.uploadUserAvatar(avatarModal.user.id, file);
      if (response.data?.avatarUrl) {
        toast.success('Avatar başarıyla güncellendi');
        fetchUsers();
        return `http://localhost:3001${response.data.avatarUrl}`;
      }
      throw new Error('Avatar URL alınamadı');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Avatar yükleme başarısız';
      toast.error(message);
      throw error;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getRoleBadge = (roleName: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      GymOwner: 'danger',
      Trainer: 'warning',
      Student: 'success',
    };
    const labels: Record<string, string> = {
      GymOwner: 'Salon Sahibi',
      Trainer: 'Antrenör',
      Student: 'Öğrenci',
    };
    return <Badge variant={variants[roleName] || 'success'}>{labels[roleName] || roleName}</Badge>;
  };

  const columns: Column<User>[] = [
    {
      key: 'avatar',
      title: 'Avatar',
      render: (row) => (
        <div className="relative group">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {row.avatarUrl ? (
              <img
                src={`http://localhost:3001${row.avatarUrl}`}
                alt={`${row.firstName} ${row.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          {canManage && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAvatarClick(row);
              }}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              title="Upload avatar"
            >
              <Upload className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'firstName',
      title: 'Ad Soyad',
      sortable: true,
      render: (row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'email',
      title: 'E-posta',
      sortable: true,
    },
    {
      key: 'phone',
      title: 'Telefon',
      render: (row) => row.phone || '-',
    },
    {
      key: 'role',
      title: 'Rol',
      render: (row) => getRoleBadge(row.role?.name || 'Unknown'),
    },
    {
      key: 'privateTraining',
      title: 'Özel Ders',
      render: (row) => {
        const hasPrivateTraining = (row as User & { hasPrivateTraining?: boolean }).hasPrivateTraining;
        if (row.role?.name === 'Student' && hasPrivateTraining) {
          return (
            <div className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4 text-green-600" />
              <Badge variant="success">Alıyor</Badge>
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'createdAt',
      title: 'Kayıt Tarihi',
      render: (row) => new Date(row.createdAt).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: (row) => canManage ? (
        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteClick(row)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : null,
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kullanıcılar</h1>
              <p className="text-sm text-gray-600">Salon kullanıcılarını yönetin</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tüm Roller</option>
              <option value="GymOwner">Salon Sahibi</option>
              <option value="Trainer">Antrenör</option>
              <option value="Student">Öğrenci</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table<User>
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id.toString()}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={handleDeleteConfirm}
        title="Kullanıcıyı Sil"
        message={`"${deleteDialog.user?.firstName} ${deleteDialog.user?.lastName}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Avatar Upload Modal */}
      <Modal
        isOpen={avatarModal.isOpen}
        onClose={() => setAvatarModal({ isOpen: false, user: null })}
        title="Avatar Yükle"
        size="md"
      >
        {avatarModal.user && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{avatarModal.user.firstName} {avatarModal.user.lastName}</span> için avatar yükleyin
              </p>
            </div>
            <FileUpload
              label="Profile Photo"
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              value={avatarModal.user.avatarUrl ? `http://localhost:3001${avatarModal.user.avatarUrl}` : null}
              onChange={() => {}}
              onUpload={handleAvatarUpload}
              preview={true}
              helperText="Upload profile photo (PNG, JPG, GIF, WebP). Maximum 5MB. Changes are saved immediately."
            />
          </div>
        )}
      </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
