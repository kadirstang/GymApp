'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Activity } from 'lucide-react';
import { Card } from '@/components/ui';

export default function WorkoutLogsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Antrenman Logları</h1>
                  <p className="text-sm text-gray-600">Öğrenci antrenman geçmişini görüntüleyin</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Antrenman Takibi
              </h3>
              <p className="text-gray-600 mb-4">
                Bu özellik yakında kullanıma açılacak
              </p>
              <div className="text-sm text-gray-500">
                <p>• Öğrenci antrenman geçmişi</p>
                <p>• Set/tekrar/ağırlık logları</p>
                <p>• İlerleme grafikleri</p>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
