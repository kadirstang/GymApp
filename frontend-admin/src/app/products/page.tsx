'use client';

import { Package } from 'lucide-react';
import { Card } from '@/components/ui';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
              <p className="text-sm text-gray-600">Marketplace ve ürün yönetimi</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ürünler Modülü
          </h3>
          <p className="text-gray-600 mb-4">
            Bu özellik yakında kullanıma açılacak
          </p>
          <div className="text-sm text-gray-500">
            <p>• Ürün kataloğu yönetimi</p>
            <p>• Stok takibi</p>
            <p>• Sipariş onay sistemi</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
