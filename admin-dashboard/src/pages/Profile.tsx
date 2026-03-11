import { Mail, MapPin, Calendar, Shield, Edit, Building2 } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../utils/helpers';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and manage your profile information
        </p>
      </div>

      {/* Profile Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-bold">
            {user ? getInitials(user.name) : 'U'}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.name || 'User'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <Shield size={14} />
                <span className="capitalize">{user?.role || 'User'}</span>
              </span>
              {user?.title && (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={14} />
                  {user.title}
                </span>
              )}
              {user?.organization && (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 size={14} />
                  {user.organization}
                </span>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm">
            <Edit size={16} />
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* About */}
        <Card>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300 capitalize">{user?.role || 'User'}</span>
            </div>
            {user?.title && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{user.title}</span>
              </div>
            )}
            {user?.organization && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 size={16} className="text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{user.organization}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Role & Access */}
        <Card>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Role & Access</h4>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Role</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{user?.role || 'User'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.role === 'admin' ? 'Full' : user?.role === 'asset_manager' ? 'Write' : 'Read'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Data Access</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.role === 'admin' ? 'Yes' : 'No'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">User Management</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
