import { Mail, MapPin, Calendar, Shield, Edit } from 'lucide-react';
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
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <MapPin size={14} />
                San Francisco, CA
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <Calendar size={14} />
                Joined Jan 2023
              </span>
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
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Experienced administrator with a passion for building great products and managing high-performing teams.
            Focused on data-driven decision making and continuous improvement.
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">San Francisco, California</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">Joined January 2023</span>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Projects', value: '24' },
              { label: 'Tasks Done', value: '142' },
              { label: 'Team Members', value: '8' },
              { label: 'Reports', value: '37' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
              >
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h4>
        <div className="space-y-4">
          {[
            { action: 'Updated profile settings', time: '2 hours ago', color: 'bg-blue-500' },
            { action: 'Completed quarterly report', time: '5 hours ago', color: 'bg-green-500' },
            { action: 'Added 3 new team members', time: '1 day ago', color: 'bg-purple-500' },
            { action: 'Deployed version 2.4.1', time: '2 days ago', color: 'bg-orange-500' },
            { action: 'Reviewed pull request #42', time: '3 days ago', color: 'bg-pink-500' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
              <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.action}</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
