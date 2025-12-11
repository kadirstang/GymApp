'use client';

import { Settings as SettingsIcon } from 'lucide-react';
import { Card } from '@/components/ui';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
              <p className="text-sm text-gray-600">Sistem ve salon ayarları</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-center py-12">
          <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ayarlar Paneli
          </h3>
          <p className="text-gray-600 mb-4">
            Bu özellik yakında kullanıma açılacak
          </p>
          <div className="text-sm text-gray-500">
            <p>• Salon profili düzenleme</p>
            <p>• Logo yükleme</p>
            <p>• Kullanıcı yönetimi</p>
            <p>• Yetki ayarları</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
