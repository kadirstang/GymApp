'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Badge, Input, Button } from '@/components/ui';
import { Column } from '@/components/ui/Table';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/contexts/ToastContext';
import { Search, Calendar, Eye } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Program {
  id: string;
  name: string;
  difficultyLevel: string;
}

interface WorkoutLogItem {
  id: string;
  userId: string;
  programId: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  notes: string | null;
  user: User;
  program: Program;
  _count: {
    entries: number;
  };
}

export default function WorkoutsPage() {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { error: showError } = useToast();

  const fetchWorkoutLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: 20,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.getWorkoutLogs({ ...params, page: currentPage, limit: 20 });
      const data = response.data;
      if (!data) throw new Error('No data received');

      const { items, pagination } = data;

      setWorkoutLogs(items as unknown as WorkoutLogItem[]);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.total);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Antrenman günlükleri yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, startDate, endDate, showError]);

  useEffect(() => {
    fetchWorkoutLogs();
  }, [fetchWorkoutLogs]);

  const filteredLogs = workoutLogs.filter((log) => {
    const userName = `${log.user.firstName} ${log.user.lastName}`.toLowerCase();
    const programName = log.program.name.toLowerCase();
    const search = searchTerm.toLowerCase();
    return userName.includes(search) || programName.includes(search);
  });

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'default';
    }
  };

  const columns: Column<WorkoutLogItem>[] = [
    {
      key: 'user',
      title: 'Kullanıcı',
      render: (log) => (
        <div>
          <div className="font-medium">
            {log.user.firstName} {log.user.lastName}
          </div>
          <div className="text-sm text-gray-500">{log.user.email}</div>
        </div>
      ),
    },
    {
      key: 'program',
      title: 'Program',
      render: (log) => (
        <div>
          <div className="font-medium">{log.program.name}</div>
          <Badge variant={getDifficultyColor(log.program.difficultyLevel)}>
            {log.program.difficultyLevel}
          </Badge>
        </div>
      ),
    },
    {
      key: 'startedAt',
      title: 'Başlangıç',
      render: (log) => formatDate(log.startedAt),
    },
    {
      key: 'completedAt',
      title: 'Bitiş',
      render: (log) => (log.completedAt ? formatDate(log.completedAt) : <Badge variant="warning">Devam ediyor</Badge>),
    },
    {
      key: 'duration',
      title: 'Süre',
      render: (log) => formatDuration(log.duration),
    },
    {
      key: 'entries',
      title: 'Egzersiz Sayısı',
      render: (log) => (
        <Badge variant="default">{log._count.entries} set</Badge>
      ),
    },
    {
      key: 'actions',
      title: 'İşlemler',
      render: () => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            showError('Detay sayfası yakında eklenecek');
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Antrenman Günlükleri</h1>
          <p className="text-gray-600 mt-1">Kullanıcıların tamamladığı antrenmanları görüntüleyin</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Ara
            </label>
            <Input
              type="text"
              placeholder="Kullanıcı veya program ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Başlangıç Tarihi
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Bitiş Tarihi
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {(startDate || endDate) && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
            >
              Filtreleri Temizle
            </Button>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-600">Toplam Antrenman</div>
          <div className="text-2xl font-bold mt-1">{totalItems}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Bu Sayfada</div>
          <div className="text-2xl font-bold mt-1">{filteredLogs.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Tamamlanan</div>
          <div className="text-2xl font-bold mt-1">
            {filteredLogs.filter((log) => log.completedAt).length}
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table<WorkoutLogItem>
          columns={columns}
          data={filteredLogs}
          keyExtractor={(log) => log.id}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
