'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { WorkoutLog, Exercise } from '@/types/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Clock, Calendar, User, Dumbbell, CheckCircle, XCircle, Activity } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { Card } from '@/components/ui/Card';

export default function WorkoutLogDetailPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <WorkoutLogDetailContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function WorkoutLogDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { error: showError } = useToast();

  const [workoutLog, setWorkoutLog] = useState<WorkoutLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${mins}dk`;
    }
    return `${mins}dk`;
  };

  const fetchWorkoutLogDetail = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getWorkoutLogById(id);
      if (response.data) {
        setWorkoutLog(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch workout log:', error);
      showError('Antrenman kaydı yüklenemedi');
      router.push('/workouts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWorkoutLogDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Antrenman Detayı</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!workoutLog) {
    return null;
  }

  // Group entries by exercise
  const exerciseGroups = workoutLog.entries?.reduce((acc, entry) => {
    const exerciseId = entry.exerciseId;
    if (!acc[exerciseId]) {
      acc[exerciseId] = {
        exercise: entry.exercise,
        sets: []
      };
    }
    acc[exerciseId].sets.push(entry);
    return acc;
  }, {} as Record<string, { exercise: Exercise | undefined; sets: typeof workoutLog.entries }>) || {};

  const statusColor = workoutLog.status === 'completed'
    ? 'text-green-600 bg-green-50'
    : workoutLog.status === 'cancelled'
    ? 'text-red-600 bg-red-50'
    : 'text-blue-600 bg-blue-50';

  const statusText = workoutLog.status === 'completed'
    ? 'Tamamlandı'
    : workoutLog.status === 'cancelled'
    ? 'İptal Edildi'
    : 'Devam Ediyor';

  const StatusIcon = workoutLog.status === 'completed'
    ? CheckCircle
    : workoutLog.status === 'cancelled'
    ? XCircle
    : Activity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/workouts')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Antrenman Detayı</h1>
        </div>
      </div>

      {/* Workout Info Card */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Antrenman Bilgileri</h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusColor}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{statusText}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Öğrenci</p>
                <p className="font-medium text-gray-900">
                  {workoutLog.user ? `${workoutLog.user.firstName} ${workoutLog.user.lastName}` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Program */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Dumbbell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Program</p>
                <p className="font-medium text-gray-900">
                  {workoutLog.program?.name || 'Programsız'}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tarih</p>
                <p className="font-medium text-gray-900">
                  {formatDate(workoutLog.startedAt)}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Süre</p>
                <p className="font-medium text-gray-900">
                  {workoutLog.duration ? formatDuration(workoutLog.duration) : 'Devam ediyor'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {workoutLog.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Notlar:</p>
              <p className="text-sm text-gray-600">{workoutLog.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Exercises and Sets */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Egzersizler ve Setler</h2>

        {Object.keys(exerciseGroups).length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Bu antrenman için henüz set kaydı bulunmuyor</p>
            </div>
          </Card>
        ) : (
          Object.entries(exerciseGroups).map(([exerciseId, group]) => (
            <Card key={exerciseId}>
              <div className="space-y-4">
                {/* Exercise Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.exercise?.name || 'Bilinmeyen Egzersiz'}
                    </h3>
                    {group.exercise?.targetMuscleGroup && (
                      <p className="text-sm text-gray-500 mt-1">
                        {group.exercise.targetMuscleGroup}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {group.sets.length} Set
                  </span>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Set
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ağırlık (kg)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tekrar
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          RPE
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notlar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.sets
                        .sort((a, b) => a.setNumber - b.setNumber)
                        .map((set, idx) => (
                          <tr key={set.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {set.setNumber}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {set.weightKg ? `${set.weightKg} kg` : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {set.repsCompleted}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {set.rpe || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {set.notes || '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Exercise Summary */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 text-sm">
                  <div className="text-gray-600">
                    <span className="font-medium">Toplam Hacim: </span>
                    {group.sets.reduce((sum, set) =>
                      sum + (set.weightKg || 0) * set.repsCompleted, 0
                    ).toFixed(1)} kg
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">Toplam Tekrar: </span>
                    {group.sets.reduce((sum, set) => sum + set.repsCompleted, 0)}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
