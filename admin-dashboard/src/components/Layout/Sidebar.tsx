import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Brain,
  ClipboardList,
  ClipboardCheck,
  FlaskConical,
  Wrench,
  Calendar,
  BarChart3,
  FileText,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NAV_ITEMS } from '../../utils/constants';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Database,
  Brain,
  ClipboardList,
  ClipboardCheck,
  FlaskConical,
  Wrench,
  Calendar,
  BarChart3,
  FileText,
  Upload,
  Settings,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-all duration-300 ease-in-out flex flex-col
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <span
              className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent"
            >
              &#9889; Asset Intelligence Platform
            </span>
          )}
          {collapsed && (
            <span
              className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent mx-auto"
            >
              &#9889; AIP
            </span>
          )}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}`
                }
                end={item.path === '/'}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Fleet Status section */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Fleet Status
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              Models Running
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-4.5">
              Last Updated: 2 min ago
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              v1.0.0
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
