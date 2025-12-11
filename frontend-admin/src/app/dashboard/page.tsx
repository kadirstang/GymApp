'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  Dumbbell,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Activity,
  GraduationCap,
} from 'lucide-react';

interface Stats {
  users?: { total: number };
  exercises?: { total: number };
  programs?: { total: number };
  orders?: { total: number };
  workouts?: { totalWorkouts: number };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  const isTrainer = user?.role?.name === 'Trainer';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch various statistics
        const [exerciseStats, programStats, workoutStats, orderStats] = await Promise.all([
          apiClient.getExerciseStats().catch(() => ({ data: { total: 0 } })),
          apiClient.getProgramStats().catch(() => ({ data: { total: 0 } })),
          apiClient.getWorkoutStats().catch(() => ({ data: { totalWorkouts: 0 } })),
          apiClient.getOrderStats().catch(() => ({ data: { total: 0 } })),
        ]);

        setStats({
          exercises: exerciseStats.data,
          programs: programStats.data,
          workouts: workoutStats.data,
          orders: orderStats.data,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      name: 'Toplam Egzersiz',
      value: stats.exercises?.total || 0,
      icon: Dumbbell,
      color: 'bg-blue-500',
    },
    {
      name: 'Aktif Programlar',
      value: stats.programs?.total || 0,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      name: 'Toplam Antrenman',
      value: stats.workouts?.totalWorkouts || 0,
      icon: Activity,
      color: 'bg-purple-500',
    },
    {
      name: 'Toplam Sipariş',
      value: stats.orders?.total || 0,
      icon: ShoppingCart,
      color: 'bg-orange-500',
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Hoş geldiniz, {user?.firstName} {user?.lastName}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {user?.gym?.name} - {user?.role?.name}
            </p>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.name}
                    className="bg-white rounded-lg shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className={`${stat.color} rounded-lg p-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            {stat.name}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Hızlı İşlemler
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => router.push('/exercises?action=create')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Dumbbell className="w-5 h-5 mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Yeni Egzersiz
                </span>
              </button>
              <button
                onClick={() => router.push('/programs?action=create')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Yeni Program
                </span>
              </button>
              <button
                onClick={() => router.push(isTrainer ? '/my-students' : '/users?action=create')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isTrainer ? (
                  <GraduationCap className="w-5 h-5 mr-2 text-gray-600" />
                ) : (
                  <Users className="w-5 h-5 mr-2 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {isTrainer ? 'Öğrencilerim' : 'Kullanıcı Ekle'}
                </span>
              </button>
              <button
                disabled
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed opacity-50"
              >
                <TrendingUp className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">
                  Raporlar (Yakında)
                </span>
              </button>
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <h2 className="text-lg font-semibold mb-2">
              GymOS Admin Panel&apos;e Hoş Geldiniz!
            </h2>
            <p className="text-indigo-100 mb-4">
              Spor salonunuzu yönetmek için ihtiyacınız olan her şey burada.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                ✓ Egzersiz Kütüphanesi
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                ✓ Program Oluşturma
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                ✓ Antrenman Takibi
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                ✓ Sipariş Yönetimi
              </span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
