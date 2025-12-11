'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { Search, Calendar, TrendingUp, User, GraduationCap, Dumbbell, X } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  lastWorkoutDate?: string;
  assignedProgram?: { id: string; name: string };
  monthlyWorkouts: number;
  isActive: boolean;
  latestMeasurement?: {
    weight?: number;
    bodyFat?: number;
  };
}

interface Stats {
  total: number;
  active: number;
  avgWorkoutsPerWeek: number;
}

interface Program {
  id: string;
  name: string;
  description?: string;
  difficultyLevel: string;
  isPublic: boolean;
}

export default function MyStudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, avgWorkoutsPerWeek: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);

  // Program assignment modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Add student modal
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  useEffect(() => {
    // Redirect if not trainer
    if (user && user.role?.name !== 'Trainer') {
      router.push('/dashboard');
      return;
    }

    fetchMyStudents();
  }, [user, router]);

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/trainer-matches/my-students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched my students - Full response:', data);
      console.log('Items:', data.data?.items);
      console.log('Stats:', data.data?.stats);

      const items = data.data?.items || [];
      const stats = data.data?.stats || { total: 0, active: 0, avgWorkoutsPerWeek: 0 };

      console.log('Setting students:', items);
      console.log('Setting stats:', stats);

      setStudents(items);
      setStats(stats);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Öğrenciler yüklenemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPrograms = async () => {
    try {
      const response = await apiClient.getPrograms({ page: 1, limit: 100 });
      if (response.data) {
        setPrograms(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  const handleOpenAssignModal = (student: Student) => {
    setSelectedStudent(student);
    setSelectedProgramId(student.assignedProgram?.id || '');
    setIsAssignModalOpen(true);
    fetchMyPrograms();
  };

  const handleAssignProgram = async () => {
    if (!selectedStudent || !selectedProgramId) return;

    setIsAssigning(true);
    try {
      await apiClient.updateProgram(selectedProgramId, {
        assignedUserId: selectedStudent.id,
      });
      toast.success('Program başarıyla atandı!');
      setIsAssignModalOpen(false);
      fetchMyStudents(); // Refresh student list
    } catch (error) {
      toast.error('Program atama başarısız oldu');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveProgram = async () => {
    if (!selectedStudent?.assignedProgram) return;

    setIsAssigning(true);
    try {
      await apiClient.updateProgram(selectedStudent.assignedProgram.id, {
        assignedUserId: undefined,
      });
      toast.success('Program kaldırıldı!');
      setIsAssignModalOpen(false);
      fetchMyStudents();
    } catch (error) {
      toast.error('Program kaldırma başarısız oldu');
    } finally {
      setIsAssigning(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await apiClient.getUsers({ page: 1, limit: 100, role: 'Student' });
      if (response.data) {
        // Filter out students who have ANY active trainer match (not just with this trainer)
        const available = response.data.items.filter(u => !u.hasPrivateTraining);
        setAvailableStudents(available);
      }
    } catch (error) {
      console.error('Failed to fetch available students:', error);
      toast.error('Öğrenciler yüklenemedi');
    }
  };

  const handleOpenAddStudentModal = () => {
    setIsAddStudentModalOpen(true);
    setSelectedStudentId('');
    fetchAvailableStudents();
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      toast.error('Lütfen bir öğrenci seçin');
      return;
    }

    setIsAddingStudent(true);
    try {
      console.log('Adding student:', { trainerId: user!.id, studentId: selectedStudentId });
      const result = await apiClient.createTrainerMatch({
        trainerId: user!.id,
        studentId: selectedStudentId,
      });
      console.log('Student added successfully:', result);
      toast.success('Öğrenci başarıyla eklendi!');
      setIsAddStudentModalOpen(false);
      setSelectedStudentId('');
      fetchMyStudents();
    } catch (error) {
      console.error('Failed to add student:', error);
      toast.error('Öğrenci eklenemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setIsAddingStudent(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && student.isActive) ||
      (filterActive === 'inactive' && !student.isActive);

    return matchesSearch && matchesFilter;
  });

  const getDaysSinceLastWorkout = (date?: string) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Öğrencilerim</h1>
              <p className="text-gray-600">Özel ders verdiğiniz öğrencileri yönetin</p>
            </div>
            <button
              onClick={handleOpenAddStudentModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Yeni Öğrenci Ekle
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-lg p-3">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Toplam Öğrenci</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-lg p-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Aktif Öğrenci</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Dumbbell className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Ort. Haftalık Antrenman</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgWorkoutsPerWeek.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Öğrenci ara (isim, email)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Tümü</option>
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
              </select>
            </div>
          </div>

          {/* Students Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterActive !== 'all' ? 'Öğrenci bulunamadı' : 'Henüz öğrenciniz yok'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterActive !== 'all'
                  ? 'Arama kriterlerinize uygun öğrenci bulunamadı.'
                  : 'Salon sahibi size öğrenci atadığında buradan görebilirsiniz.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((student) => {
                const daysSince = getDaysSinceLastWorkout(student.lastWorkoutDate);

                return (
                  <div key={student.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          {student.phone && (
                            <p className="text-sm text-gray-500">{student.phone}</p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          student.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {student.isActive ? '🟢 Aktif' : '🔴 Pasif'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          Son antrenman:{' '}
                          {daysSince !== null ? `${daysSince} gün önce` : 'Henüz yok'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span>Bu ay: {student.monthlyWorkouts} antrenman</span>
                      </div>

                      {student.assignedProgram && (
                        <div className="flex items-center gap-2 text-sm">
                          <Dumbbell className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Program: </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            {student.assignedProgram.name}
                          </span>
                        </div>
                      )}

                      {student.latestMeasurement && (
                        <div className="text-sm text-gray-600">
                          <span className="text-gray-500">Ölçümler: </span>
                          {student.latestMeasurement.weight && (
                            <span>{student.latestMeasurement.weight} kg</span>
                          )}
                          {student.latestMeasurement.bodyFat && (
                            <span className="ml-2">Yağ: {student.latestMeasurement.bodyFat}%</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleOpenAssignModal(student)}
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        {student.assignedProgram ? 'Program Değiştir' : 'Program Ata'}
                      </button>
                      <button
                        onClick={() => router.push(`/workouts?userId=${student.id}`)}
                        className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Geçmiş
                      </button>
                      <button
                        onClick={() => router.push(`/my-students/${student.id}`)}
                        className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Detay
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Program Assignment Modal */}
        {isAssignModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Program Ata</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {selectedStudent.assignedProgram && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Mevcut Program:</strong> {selectedStudent.assignedProgram.name}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program Seç
                  </label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Program Seçin --</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} ({program.difficultyLevel})
                        {program.isPublic ? ' 🌍' : ' 🔒'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Not:</strong> Sadece kendi oluşturduğunuz ve public programlar listelenir.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 p-6 border-t bg-gray-50">
                {selectedStudent.assignedProgram && (
                  <button
                    onClick={handleRemoveProgram}
                    disabled={isAssigning}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Programı Kaldır
                  </button>
                )}
                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleAssignProgram}
                    disabled={!selectedProgramId || isAssigning}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigning ? 'Atanıyor...' : 'Ata'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {isAddStudentModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Yeni Öğrenci Ekle</h2>
                <button
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Öğrenci Seç
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Öğrenci Seçin --</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>

                {availableStudents.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ℹ️ Eklenebilecek öğrenci bulunamadı. Tüm öğrenciler zaten listenizde olabilir.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Not:</strong> Sadece henüz sizinle eşleşmemiş öğrenciler listelenir.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={!selectedStudentId || isAddingStudent}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingStudent ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
