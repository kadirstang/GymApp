'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardSummary {
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  activeStudents?: number;
  totalUsers: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface OrderStatusData {
  status: string;
  count: number;
}

interface TopProductData {
  productId: string;
  name: string;
  totalSold: number;
}

interface StudentTrendData {
  date: string;
  active: number;
  inactive: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending_approval: '#f59e0b',
  prepared: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [topProductsData, setTopProductsData] = useState<TopProductData[]>([]);
  const [studentTrendData, setStudentTrendData] = useState<StudentTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const isTrainer = user?.role?.name === 'Trainer';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data in parallel
        const [summaryRes, revenueRes, orderStatusRes, topProductsRes, studentTrendRes] = await Promise.allSettled([
          apiClient.getDashboardSummary(),
          apiClient.getRevenueTrend(),
          apiClient.getOrderStatusDistribution(),
          apiClient.getTopProducts(5),
          apiClient.getActiveStudentsTrend(),
        ]);

        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value.data);
        }
        if (revenueRes.status === 'fulfilled') {
          setRevenueData(revenueRes.value.data);
        }
        if (orderStatusRes.status === 'fulfilled') {
          setOrderStatusData(orderStatusRes.value.data);
        }
        if (topProductsRes.status === 'fulfilled') {
          setTopProductsData(topProductsRes.value.data);
        }
        if (studentTrendRes.status === 'fulfilled') {
          setStudentTrendData(studentTrendRes.value.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      name: 'Toplam Gelir',
      value: summary ? `₺${summary.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '₺0',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      name: 'Bekleyen Siparişler',
      value: summary?.pendingOrders || 0,
      icon: ShoppingCart,
      color: 'bg-orange-500',
    },
    {
      name: 'Toplam Ürün',
      value: summary?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: 'Düşük Stok Uyarısı',
      value: summary?.lowStockProducts || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ];

  if (summary?.activeStudents !== undefined) {
    statCards.unshift({
      name: 'Aktif Öğrenci',
      value: summary.activeStudents,
      icon: Users,
      color: 'bg-purple-500',
    });
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow p-6 text-white">
            <h1 className="text-2xl font-bold">
              Hoş geldiniz, {user?.firstName} {user?.lastName}!
            </h1>
            <p className="mt-1 text-indigo-100">
              {user?.gym?.name} - {user?.role?.name}
            </p>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.name}
                    className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className={`${stat.color} rounded-lg p-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-xs font-medium text-gray-600 uppercase">
                            {stat.name}
                          </p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
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

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Son 30 Gün Gelir Trendi
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `₺${value.toFixed(2)}`}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString('tr-TR');
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Gelir"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Henüz veri yok
                </div>
              )}
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sipariş Durumu Dağılımı
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => entry.status}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Henüz veri yok
                </div>
              )}
            </div>

            {/* Top Products Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                En Çok Satan Ürünler (Top 5)
              </h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalSold" name="Satış Adedi" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Henüz veri yok
                </div>
              )}
            </div>

            {/* Active Students Trend (for trainers/owners) */}
            {(isTrainer || user?.role?.name === 'GymOwner') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Aktif Öğrenci Trendi
                </h3>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : studentTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={studentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString('tr-TR');
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="active"
                        name="Aktif"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="inactive"
                        name="İnaktif"
                        stroke="#ef4444"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Henüz veri yok
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
