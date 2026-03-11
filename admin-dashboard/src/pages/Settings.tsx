import { useState } from 'react';
import { Save, Bell, Shield, Globe } from 'lucide-react';
import Card, { CardHeader } from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
          Settings saved successfully!
        </div>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader
          title="Profile Settings"
          subtitle="Update your personal information"
        />
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" defaultValue={user?.name.split(' ')[0] || ''} />
            <Input label="Last Name" defaultValue={user?.name.split(' ').slice(1).join(' ') || ''} />
          </div>
          <Input label="Email" type="email" defaultValue={user?.email || ''} />
          <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" />
          <Input label="Bio" placeholder="Tell us about yourself..." />
          <div className="flex justify-end">
            <Button type="submit">
              <Save size={16} />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader
          title="Notifications"
          subtitle="Choose what notifications you receive"
        />
        <div className="space-y-4">
          {[
            { icon: Bell, label: 'Email Notifications', desc: 'Receive updates via email', key: 'email' },
            { icon: Bell, label: 'Push Notifications', desc: 'Get push notifications in browser', key: 'push' },
            { icon: Bell, label: 'Weekly Digest', desc: 'Receive a weekly summary email', key: 'digest' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={item.key !== 'digest'} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600" />
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader
          title="Security"
          subtitle="Keep your account safe"
        />
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">Enable</Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                <Globe size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Active Sessions</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage your logged-in devices</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">View Sessions</Button>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Input label="Current Password" type="password" placeholder="Enter current password" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input label="New Password" type="password" placeholder="Enter new password" />
            <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="secondary">Update Password</Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader
          title="Danger Zone"
          subtitle="Irreversible actions"
        />
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Permanently remove your account and all data</p>
          </div>
          <Button variant="danger" size="sm">Delete Account</Button>
        </div>
      </Card>
    </div>
  );
}
