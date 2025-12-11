'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  ClipboardList,
  Package,
  ShoppingCart,
  Users,
  GraduationCap,
  Settings,
  LogOut,
} from 'lucide-react';

const ownerNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Egzersizler', href: '/exercises', icon: Dumbbell },
  { name: 'Programlar', href: '/programs', icon: Calendar },
  { name: 'Antrenmanlar', href: '/workouts', icon: ClipboardList },
  { name: 'Ekipmanlar', href: '/equipment', icon: Package },
  { name: 'Ürünler', href: '/products', icon: ShoppingCart },
  { name: 'Kullanıcılar', href: '/users', icon: Users },
  { name: 'Ayarlar', href: '/settings', icon: Settings },
];

const trainerNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Egzersizler', href: '/exercises', icon: Dumbbell },
  { name: 'Programlar', href: '/programs', icon: Calendar },
  { name: 'Antrenmanlar', href: '/workouts', icon: ClipboardList },
  { name: 'Ekipmanlar', href: '/equipment', icon: Package },
  { name: 'Öğrencilerim', href: '/my-students', icon: GraduationCap },
  { name: 'Kullanıcılar', href: '/users', icon: Users },
  { name: 'Ayarlar', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Choose navigation based on role
  const isTrainer = user?.role?.name === 'Trainer';
  const navigation = isTrainer ? trainerNavigation : ownerNavigation;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600">GymOS Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role?.name}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-8 py-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
