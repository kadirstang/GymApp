'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { FileUpload } from '@/components/ui/FileUpload';
import { Modal } from '@/components/ui/Modal';
import {
  User,
  Building2,
  Shield,
  Bell,
  Camera,
  Save,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  gender?: string;
  role: {
    name: string;
  };
  gym: {
    id: string;
    name: string;
    address?: string;
    contactPhone?: string;
    contactEmail?: string;
    website?: string;
    logoUrl?: string;
  };
}

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  customPermissions?: Record<string, any>;
}

export default function SettingsPage() {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    gender: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Gym info state
  const [gymData, setGymData] = useState({
    name: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
  });
  const [savingGym, setSavingGym] = useState(false);

  // Permissions state
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [permissionsModal, setPermissionsModal] = useState(false);
  const [permissions, setPermissions] = useState({
    products: { create: false, update: false, delete: false },
    orders: { update: false, delete: false },
    users: { read: false, update: false, delete: false },
    equipment: { create: false, update: false, delete: false },
  });
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [avatarModal, setAvatarModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCurrentUser();
      const userData: UserData = response.data as unknown as UserData;
      setUser(userData);

      // Set profile data
      setProfileData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || '',
        birthDate: userData.birthDate ? userData.birthDate.split('T')[0] : '',
        gender: userData.gender || '',
      });

      // Set gym data if GymOwner
      if (userData.role.name === 'GymOwner') {
        setGymData({
          name: userData.gym.name,
          address: userData.gym.address || '',
          contactPhone: userData.gym.contactPhone || '',
          contactEmail: userData.gym.contactEmail || '',
          website: userData.gym.website || '',
        });
        fetchTrainers();
      }
    } catch (error: any) {
      console.error('Fetch user error:', error);
      toast?.showToast(error.response?.data?.message || 'Failed to load user data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await apiClient.getUsers({
        role: 'Trainer',
        limit: 100,
      });
      setTrainers(response.data?.items || []);
    } catch (error) {
      console.error('Fetch trainers error:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      if (user?.id) {
        // Filter out empty fields to avoid validation errors
        const updateData: any = {};
        if (profileData.firstName) updateData.firstName = profileData.firstName;
        if (profileData.lastName) updateData.lastName = profileData.lastName;
        if (profileData.phone) updateData.phone = profileData.phone;
        if (profileData.birthDate) updateData.birthDate = profileData.birthDate;
        if (profileData.gender) updateData.gender = profileData.gender;

        await apiClient.updateUser(user.id, updateData);
      }
      toast?.showToast('Profile updated successfully', 'success');
      fetchUserData();
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast?.showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast?.showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast?.showToast('New password must be at least 6 characters', 'error');
      return;
    }

    try {
      setSavingPassword(true);
      // Password change endpoint - using direct axios call as no specific method exists
      await apiClient['client'].put(`/users/${user?.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast?.showToast('Password changed successfully', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Change password error:', error);
      toast?.showToast(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleGymSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingGym(true);
      // Gym update endpoint - using direct axios call as no specific method exists
      await apiClient['client'].put(`/gyms/${user?.gym.id}`, gymData);
      toast?.showToast('Gym information updated successfully', 'success');
      fetchUserData();
    } catch (error: any) {
      console.error('Update gym error:', error);
      toast?.showToast(error.response?.data?.message || 'Failed to update gym info', 'error');
    } finally {
      setSavingGym(false);
    }
  };

  const openPermissionsModal = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    const customPerms = trainer.customPermissions || {};
    setPermissions({
      products: customPerms.products || { create: false, update: false, delete: false },
      orders: customPerms.orders || { update: false, delete: false },
      users: customPerms.users || { read: false, update: false, delete: false },
      equipment: customPerms.equipment || { create: false, update: false, delete: false },
    });
    setPermissionsModal(true);
  };

  const handlePermissionsSubmit = async () => {
    if (!selectedTrainer) return;

    try {
      setSavingPermissions(true);
      // Custom permissions endpoint - using direct axios call as no specific method exists
      await apiClient['client'].patch(`/users/${selectedTrainer.id}/custom-permissions`, {
        customPermissions: permissions,
      });
      toast?.showToast('Permissions updated successfully', 'success');
      setPermissionsModal(false);
      fetchTrainers();
    } catch (error: any) {
      console.error('Update permissions error:', error);
      toast?.showToast(
        error.response?.data?.message || 'Failed to update permissions',
        'error'
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleAvatarUpload = () => {
    setAvatarModal(true);
  };

  const handleAvatarUploadFile = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('User not found');

    try {
      setUploadingAvatar(true);
      const response = await apiClient.uploadUserAvatar(user.id, file);
      if (response.data?.avatarUrl) {
        toast?.showToast('Avatar updated successfully', 'success');
        await fetchUserData();
        await refreshUser();
        setAvatarModal(false);
        return `http://localhost:3001${response.data.avatarUrl}`;
      }
      throw new Error('Avatar URL not received');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Avatar upload failed';
      toast?.showToast(message, 'error');
      throw error;
    } finally {
      setUploadingAvatar(false);
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account and preferences</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile
              </button>

              {user?.role.name === 'GymOwner' && (
                <>
                  <button
                    onClick={() => setActiveTab('gym')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'gym'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Gym Info
                  </button>

                  <button
                    onClick={() => setActiveTab('permissions')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'permissions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Permissions
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Notifications
              </button>
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {user?.avatarUrl ? (
                      <img
                        src={`http://localhost:3001${user.avatarUrl}`}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-12 h-12 text-blue-600" />
                      </div>
                    )}
                    <button
                      onClick={handleAvatarUpload}
                      className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {user?.role.name} at {user?.gym.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Info Form */}
              <form onSubmit={handleProfileSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, firstName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, lastName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (readonly)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+90 555 123 4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={profileData.birthDate}
                      onChange={(e) =>
                        setProfileData({ ...profileData, birthDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={profileData.gender}
                      onChange={(e) =>
                        setProfileData({ ...profileData, gender: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingProfile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Change Password Form */}
              <form onSubmit={handlePasswordSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      required
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Changing...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Gym Info Tab */}
          {activeTab === 'gym' && user?.role.name === 'GymOwner' && (
            <form onSubmit={handleGymSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Gym Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gym Name</label>
                <input
                  type="text"
                  required
                  value={gymData.name}
                  onChange={(e) => setGymData({ ...gymData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  rows={3}
                  value={gymData.address}
                  onChange={(e) => setGymData({ ...gymData, address: e.target.value })}
                  placeholder="Full address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={gymData.contactPhone}
                    onChange={(e) => setGymData({ ...gymData, contactPhone: e.target.value })}
                    placeholder="+90 555 123 4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={gymData.contactEmail}
                    onChange={(e) => setGymData({ ...gymData, contactEmail: e.target.value })}
                    placeholder="info@gym.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={gymData.website}
                  onChange={(e) => setGymData({ ...gymData, website: e.target.value })}
                  placeholder="https://www.gym.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={savingGym}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingGym ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Gym Info
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && user?.role.name === 'GymOwner' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Trainer Permissions</h2>
              <p className="text-gray-600 mb-6">
                Manage custom permissions for trainers in your gym
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Trainer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Custom Permissions
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainers.map((trainer) => (
                      <tr key={trainer.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {trainer.firstName} {trainer.lastName}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{trainer.email}</td>
                        <td className="py-3 px-4">
                          {trainer.customPermissions ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Custom
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Default
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openPermissionsModal(trainer)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {trainers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No trainers found</p>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              <p className="text-gray-600 mb-6">
                Choose how you want to be notified about events
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive push notifications (mobile app)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Notification Types</h3>
                  <div className="space-y-3">
                    {[
                      'New order placed',
                      'Order status changed',
                      'New student assigned',
                      'Program assigned',
                      'Low stock alert',
                    ].map((type) => (
                      <label key={type} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => toast?.showToast('Notification preferences saved', 'success')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Permissions Modal */}
        {permissionsModal && selectedTrainer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold">
                  Manage Permissions: {selectedTrainer.firstName} {selectedTrainer.lastName}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Products */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Products</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.products.create}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            products: { ...permissions.products, create: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Create Products</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.products.update}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            products: { ...permissions.products, update: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Update Products</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.products.delete}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            products: { ...permissions.products, delete: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Delete Products</span>
                    </label>
                  </div>
                </div>

                {/* Orders */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Orders</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.orders.update}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            orders: { ...permissions.orders, update: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Update Orders</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.orders.delete}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            orders: { ...permissions.orders, delete: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Delete Orders</span>
                    </label>
                  </div>
                </div>

                {/* Users */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Users</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.users.read}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            users: { ...permissions.users, read: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Read Users</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.users.update}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            users: { ...permissions.users, update: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Update Users</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.users.delete}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            users: { ...permissions.users, delete: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Delete Users</span>
                    </label>
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Equipment</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.equipment.create}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            equipment: { ...permissions.equipment, create: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Create Equipment</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.equipment.update}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            equipment: { ...permissions.equipment, update: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Update Equipment</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={permissions.equipment.delete}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            equipment: { ...permissions.equipment, delete: e.target.checked },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Delete Equipment</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex gap-3">
                <button
                  onClick={() => setPermissionsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePermissionsSubmit}
                  disabled={savingPermissions}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingPermissions ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Permissions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>

      {/* Avatar Upload Modal */}
      <Modal
        isOpen={avatarModal}
        onClose={() => setAvatarModal(false)}
        title="Upload Avatar"
        size="md"
      >
        {user && (
          <FileUpload
            label="Profile Photo"
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            value={user.avatarUrl ? `http://localhost:3001${user.avatarUrl}` : null}
            onChange={() => {}}
            onUpload={handleAvatarUploadFile}
            preview={true}
            helperText="Upload profile photo (PNG, JPG, GIF, WebP). Maximum 5MB."
          />
        )}
      </Modal>
    </ProtectedRoute>
  );
}
