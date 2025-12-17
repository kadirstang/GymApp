'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
          <ShieldAlert className="h-12 w-12 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Erişim Engellendi
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-8">
          Bu sayfaya erişim yetkiniz bulunmamaktadır. Yetkili olmadığınız bir içeriğe ulaşmaya çalışıyorsunuz.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="secondary"
            onClick={() => router.back()}
            leftIcon={<ArrowLeft size={20} />}
          >
            Geri Dön
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            leftIcon={<Home size={20} />}
          >
            Ana Sayfaya Git
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            Eğer bu sayfaya erişmeniz gerektiğini düşünüyorsanız, lütfen yöneticiniz ile iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
}
