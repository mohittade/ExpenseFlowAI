import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Loader2,
  Wifi,
  WifiOff,
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Dropdown, DropdownDivider } from '../ui/Dropdown';
import { useAuth } from '../../hooks/useAuth';

interface TopNavProps {
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
  pageTitle: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const statusConfig = {
  connected: { icon: Wifi, color: 'text-success-500', label: 'Connected' },
  disconnected: { icon: WifiOff, color: 'text-danger-500', label: 'Disconnected' },
  connecting: { icon: Loader2, color: 'text-warning-500', label: 'Connecting' },
};

const systemStatuses = [
  { id: 'redis', label: 'Redis', status: 'connected' as const },
  { id: 'ai', label: 'AI Service', status: 'connected' as const },
  { id: 'database', label: 'Database', status: 'connected' as const },
];

type StatusType = 'connected' | 'disconnected' | 'connecting';

const SystemStatusIndicator = ({ status, label }: { status: StatusType; label: string }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-surface-active transition-colors" title={label}>
      <Icon className={`w-4 h-4 ${config.color}`} aria-hidden="true" />
      <span className="text-body-xs font-medium text-text-secondary">{label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-success-500' : status === 'connecting' ? 'bg-warning-500 animate-pulse' : 'bg-danger-500'}`} aria-hidden="true" />
    </div>
  );
};

const notifications = [
  { id: 1, title: 'Report generated', message: 'July 2025 expense report is ready', time: '2 min ago', read: false, type: 'success' },
  { id: 2, title: 'Approval required', message: 'Report #abc123 needs your review', time: '15 min ago', read: false, type: 'warning' },
  { id: 3, title: 'Email sent', message: 'Report sent to finance team', time: '1 hour ago', read: true, type: 'info' },
  { id: 4, title: 'Policy violation', message: 'Flight expense exceeds limit by ₹150', time: '3 hours ago', read: true, type: 'danger' },
];

export const TopNav = ({ onSidebarToggle, sidebarCollapsed, pageTitle, breadcrumbs = [] }: TopNavProps) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const notificationItems = [
    ...notifications.map((notif) => ({
      label: (
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
              notif.type === 'success' ? 'bg-success-500' :
              notif.type === 'warning' ? 'bg-warning-500' :
              notif.type === 'danger' ? 'bg-danger-500' : 'bg-primary-500'
            }`} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-body-sm ${!notif.read ? 'text-text-primary' : 'text-text-secondary'}`}>{notif.title}</p>
              <p className="text-body-xs text-text-tertiary">{notif.message}</p>
            </div>
            <span className="text-caption text-text-tertiary flex-shrink-0">{notif.time}</span>
          </div>
        </div>
      ),
      onClick: () => {},
    })),
    {
      label: (
        <Link to="/notifications" className="flex items-center justify-center px-4 py-2 text-body-sm font-medium text-primary-600 hover:text-primary-700">
          View all notifications
        </Link>
      ),
      onClick: () => setNotificationsOpen(false),
    },
  ];

  const userMenuItems = [
    { label: 'Profile', icon: <User className="w-4 h-4" />, onClick: () => {}, href: '/profile' },
    { label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => {}, href: '/settings' },
    { label: 'Toggle Theme', icon: theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />, onClick: handleThemeToggle },
    { label: 'Sign Out', icon: <LogOut className="w-4 h-4" />, onClick: handleLogout, danger: true },
  ];

  return (
    <header className="sticky top-0 z-sticky bg-surface/80 backdrop-blur-sm border-b border-border-default">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSidebarToggle}
              className="lg:hidden text-text-secondary hover:text-text-primary"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </Button>

            <nav className="flex items-center gap-1.5 flex-1" aria-label="Breadcrumb">
              {breadcrumbs.length > 0 ? (
                <>
                  {breadcrumbs.map((crumb, index) => (
                    <span key={index} className="flex items-center gap-1.5">
                      {index > 0 && (
                        <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      {crumb.href ? (
                        <Link
                          to={crumb.href}
                          className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-body-sm font-medium text-text-primary truncate max-w-[200px]">
                          {crumb.label}
                        </span>
                      )}
                    </span>
                  ))}
                </>
              ) : (
                <h1 className="text-heading-md font-semibold text-text-primary truncate">{pageTitle}</h1>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              {systemStatuses.map((sys) => (
                <SystemStatusIndicator key={sys.id} status={sys.status} label={sys.label} />
              ))}
            </div>

            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={notificationsOpen}
                className="relative text-text-secondary hover:text-text-primary"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 text-white text-caption font-medium rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border-default rounded-xl shadow-lg overflow-hidden z-dropdown animate-fade-in-scale"
                  role="menu"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
                    <h3 className="text-body-md font-semibold text-text-primary">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="text-body-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificationItems.map((item, index) => (
                      <div
                        key={index}
                        role="menuitem"
                        tabIndex={-1}
                        onClick={item.onClick}
                        className="px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border-default/50 last:border-0"
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
                aria-expanded={userMenuOpen}
                className="gap-2 text-text-secondary hover:text-text-primary"
              >
                <Avatar
                  name={user?.full_name || user?.username || 'User'}
                  size="sm"
                  status="online"
                />
                <span className="hidden sm:block text-body-sm font-medium text-text-primary truncate max-w-[120px]">
                  {user?.full_name || user?.username || 'User'}
                </span>
                <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </Button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 min-w-[200px] bg-surface border border-border-default rounded-xl shadow-lg overflow-hidden z-dropdown animate-fade-in-scale"
                  role="menu"
                >
                  <div className="px-4 py-3 border-b border-border-default">
                    <p className="font-medium text-text-primary truncate">{user?.full_name || user?.username || 'User'}</p>
                    <p className="text-body-xs text-text-tertiary truncate">{user?.email || 'user@company.com'}</p>
                  </div>
                  <div className="py-1">
                    {userMenuItems.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-body-sm ${
                          item.danger ? 'text-danger-600 hover:bg-danger-50' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                        } transition-colors ${item.href ? '' : ''}`}
                        dangerouslySetInnerHTML={{ __html: '' }}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};