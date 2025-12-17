'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { WorkoutProgram } from '@/types/api';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Weight,
  Activity,
  TrendingUp,
  Dumbbell,
  ShoppingCart,
  ArrowLeft,
  Edit,
  Target,
  Clock,
  X,
} from 'lucide-react';

interface StudentDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  assignedProgram?: {
    id: string;
    name: string;
    description?: string;
    difficultyLevel: string;
    programExercises: Array<{
      id: string;
      orderIndex: number;
      sets: number;
      reps: string;
      restTimeSeconds: number;
      exercise: {
        id: string;
        name: string;
        targetMuscleGroup: string;
      };
    }>;
  };
  workoutLogs: Array<{
    id: string;
    startedAt: string;
    endedAt?: string;
    program?: { name: string };
    _count: { entries: number };
  }>;
  measurements: Array<{
    id: string;
    weight?: number;
    height?: number;
    bodyFat?: number;
    muscleMass?: number;
    measuredAt: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    _count: { items: number };
  }>;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');

  const fetchStudentDetail = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserById(studentId);
      if (response.data) {
        setStudent(response.data as unknown as StudentDetail);
      }
    } catch (error) {
      console.error('Fetch student detail error:', error);
      const message = error instanceof Error ? error.message : 'Failed to load student details';
      toast?.showToast('error', message);
      router.push('/my-students');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await apiClient.getPrograms({ page: 1, limit: 100 });
      setPrograms(response.data?.items || []);
    } catch (error) {
      console.error('Fetch programs error:', error);
    }
  };

  useEffect(() => {
    fetchStudentDetail();
    fetchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleAssignProgram = async () => {
    if (!selectedProgramId) {
      toast?.showToast('error', 'Please select a program');
      return;
    }

    try {
      await apiClient.updateProgram(selectedProgramId, {
        assignedUserId: studentId,
      });
      toast?.showToast('success', 'Program assigned successfully');
      setShowProgramModal(false);
      fetchStudentDetail();
    } catch (error) {
      console.error('Assign program error:', error);
      const message = error instanceof Error ? error.message : 'Failed to assign program';
      toast?.showToast('error', message);
    }
  };

  const handleUnassignProgram = async () => {
    if (!student?.assignedProgram) return;

    if (!confirm('Are you sure you want to unassign this program from the student?')) {
      return;
    }

    try {
      await apiClient.updateProgram(student.assignedProgram.id, {
        assignedUserId: null,
      });
      toast?.showToast('success', 'Program unassigned successfully');
      fetchStudentDetail();
    } catch (error) {
      console.error('Unassign program error:', error);
      const message = error instanceof Error ? error.message : 'Failed to unassign program';
      toast?.showToast('error', message);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateWorkoutDuration = (startedAt?: string, endedAt?: string) => {
    if (!startedAt || !endedAt) return 'Ongoing';
    const duration = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'prepared':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!student) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">Student not found</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/my-students')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {student.firstName} {student.lastName}
                </h1>
                <p className="text-gray-500 mt-1">Student Profile</p>
              </div>
            </div>
            <button
              onClick={() => {
                fetchPrograms();
                setShowProgramModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Assign Program
            </button>
          </div>

          {/* Contact Info Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{student.email}</p>
                </div>
              </div>
              {student.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{student.phone}</p>
                  </div>
                </div>
              )}
              {student.birthDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Birth Date</p>
                    <p className="font-medium">{formatDate(student.birthDate)}</p>
                  </div>
                </div>
              )}
              {student.gender && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium capitalize">{student.gender}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Program Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-blue-600" />
                Assigned Program
              </h2>
              {student.assignedProgram && (
                <button
                  onClick={handleUnassignProgram}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Atamasını Kaldır
                </button>
              )}
            </div>
            {student.assignedProgram ? (
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-lg">{student.assignedProgram.name}</h3>
                  {student.assignedProgram.description && (
                    <p className="text-gray-600 mt-1">{student.assignedProgram.description}</p>
                  )}
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {student.assignedProgram.difficultyLevel}
                  </span>
                </div>

                {student.assignedProgram.programExercises.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Exercises</h4>
                    <div className="space-y-2">
                      {student.assignedProgram.programExercises
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((pe) => (
                          <div key={pe.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
                                {pe.orderIndex}
                              </span>
                              <div>
                                <p className="font-medium">{pe.exercise.name}</p>
                                <p className="text-sm text-gray-500">{pe.exercise.targetMuscleGroup}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{pe.sets} sets</span>
                              <span>{pe.reps} reps</span>
                              <span>{pe.restTimeSeconds}s rest</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No program assigned yet</p>
                <button
                  onClick={() => {
                    fetchPrograms();
                    setShowProgramModal(true);
                  }}
                  className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Assign a program
                </button>
              </div>
            )}
          </div>

          {/* Recent Measurements */}
          {student.measurements && student.measurements.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Weight className="w-5 h-5 text-blue-600" />
                Body Measurements
              </h2>
              <div className="space-y-3">
                {student.measurements.slice(0, 5).map((measurement) => (
                  <div key={measurement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500">{formatDate(measurement.measuredAt)}</span>
                    <div className="flex gap-4 text-sm">
                      {measurement.weight && (
                        <span className="flex items-center gap-1">
                          <Weight className="w-4 h-4 text-gray-400" />
                          {measurement.weight} kg
                        </span>
                      )}
                      {measurement.bodyFat && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-4 h-4 text-gray-400" />
                          {measurement.bodyFat}% BF
                        </span>
                      )}
                      {measurement.muscleMass && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          {measurement.muscleMass} kg Muscle
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Workouts */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Workouts
            </h2>
            {student.workoutLogs && student.workoutLogs.length > 0 ? (
              <div className="space-y-3">
                {student.workoutLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/workout-logs/${log.id}`)}
                  >
                    <div>
                      <p className="font-medium">{log.program?.name || 'No Program'}</p>
                      <p className="text-sm text-gray-500">{formatDateTime(log.startedAt)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {calculateWorkoutDuration(log.startedAt, log.endedAt)}
                      </span>
                      <span>{log._count.entries} sets</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No workout history yet</p>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          {student.orders && student.orders.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Recent Orders
              </h2>
              <div className="space-y-3">
                {student.orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadgeClass(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      <span className="font-semibold">₺{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assign Program Modal */}
        {showProgramModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Assign Program</h3>
                <button
                  onClick={() => setShowProgramModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Program
                  </label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a program...</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} ({program.difficultyLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowProgramModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignProgram}
                    disabled={!selectedProgramId}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
