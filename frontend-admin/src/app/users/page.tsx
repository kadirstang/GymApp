'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Users as UsersIcon, GraduationCap } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { User } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Modal, Table, Badge, Card } from '@/components/ui';
import type { Column } from '@/components/ui';

export default function UsersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

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

  const handleOpenDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      await apiClient.deleteUser(deletingUser.id);
      toast.success('Kullanıcı başarıyla silindi');
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Silme işlemi sırasında hata oluştu';
      toast.error(message);
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
            onClick={() => handleOpenDeleteModal(row)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : null,
    },
  ];

  return (
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Kullanıcıyı Sil"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {deletingUser?.firstName} {deletingUser?.lastName} kullanıcısını silmek istediğinize emin misiniz?
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              İptal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
