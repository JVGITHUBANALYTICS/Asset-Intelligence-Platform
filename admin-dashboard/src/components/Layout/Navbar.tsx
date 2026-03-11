import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, LogOut, User, Settings, AlertTriangle, CheckCircle2, Info, Wrench, FlaskConical, ClipboardCheck, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getInitials } from '../../utils/helpers';

interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: 'alert' | 'check' | 'info' | 'wrench' | 'flask' | 'clipboard';
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'critical',
    title: 'DGA Alert — Transformer T-4420',
    message: 'Acetylene levels exceeded 150 ppm threshold. Immediate investigation recommended per IEEE C57.104.',
    timestamp: '12 min ago',
    read: false,
    icon: 'flask',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Health Score Decline — Breaker B-2201',
    message: 'Health index dropped from 78 to 62 over the past 30 days. Trending toward Poor condition.',
    timestamp: '1 hr ago',
    read: false,
    icon: 'alert',
  },
  {
    id: '3',
    type: 'success',
    title: 'Inspection Completed — Substation Delta',
    message: '12 assets inspected with 10 Good, 1 Fair, 1 Poor condition ratings recorded.',
    timestamp: '2 hrs ago',
    read: false,
    icon: 'clipboard',
  },
  {
    id: '4',
    type: 'info',
    title: 'Maintenance WO-2024-0847 Closed',
    message: 'Preventive maintenance on transformer T-3310 completed. Oil filtration and bushing inspection done.',
    timestamp: '4 hrs ago',
    read: true,
    icon: 'wrench',
  },
  {
    id: '5',
    type: 'warning',
    title: 'SAIDI Threshold Approaching',
    message: 'Year-to-date SAIDI at 92% of annual target (108 of 118 minutes). Monitor closely.',
    timestamp: '6 hrs ago',
    read: true,
    icon: 'alert',
  },
  {
    id: '6',
    type: 'info',
    title: 'Report Generated',
    message: 'Q4 2024 PUC Compliance Report has been generated and is ready for review.',
    timestamp: '8 hrs ago',
    read: true,
    icon: 'info',
  },
  {
    id: '7',
    type: 'success',
    title: 'Data Ingestion Complete',
    message: 'SCADA batch import processed 2,847 readings across 156 monitored assets.',
    timestamp: '1 day ago',
    read: true,
    icon: 'check',
  },
];

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationIcon = (icon: Notification['icon'], type: Notification['type']) => {
    const colorMap = {
      critical: 'text-red-500 bg-red-500/10',
      warning: 'text-amber-500 bg-amber-500/10',
      success: 'text-green-500 bg-green-500/10',
      info: 'text-blue-500 bg-blue-500/10',
    };
    const colors = colorMap[type];
    const iconMap = {
      alert: <AlertTriangle size={14} />,
      check: <CheckCircle2 size={14} />,
      info: <Info size={14} />,
      wrench: <Wrench size={14} />,
      flask: <FlaskConical size={14} />,
      clipboard: <ClipboardCheck size={14} />,
    };
    return (
      <div className={`w-8 h-8 rounded-lg ${colors} flex items-center justify-center flex-shrink-0`}>
        {iconMap[icon]}
      </div>
    );
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          <Menu size={20} />
        </button>
        {/* Mobile: show platform name */}
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white sm:hidden">
          Asset Intelligence Platform
        </h1>
        {/* Desktop: show welcome with org */}
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">
          Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}
          {user?.organization && (
            <span className="text-gray-400 dark:text-gray-500 font-normal">
              {' '}&bull; {user.organization}
            </span>
          )}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Models Running status */}
        <div className="hidden md:flex items-center gap-2 mr-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span>Models Running</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setDropdownOpen(false);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                        !n.read ? 'bg-amber-50/50 dark:bg-amber-500/5' : ''
                      }`}
                    >
                      {getNotificationIcon(n.icon, n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                            {n.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(n.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 mt-0.5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{n.timestamp}</p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-center">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    {unreadCount > 0 && ` · ${unreadCount} unread`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
              {user ? getInitials(user.name) : 'U'}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.name || 'User'}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {user?.email}
                </p>
                {user?.title && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {user.title}
                  </p>
                )}
                {user?.organization && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                    {user.organization}
                  </p>
                )}
              </div>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User size={16} />
                Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings size={16} />
                Settings
              </Link>
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
