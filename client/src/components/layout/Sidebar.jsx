import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEnvelope,
} from 'react-icons/hi2';

const navItems = [
  { path: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
  { path: '/jobs', icon: HiOutlineBriefcase, label: 'Jobs' },
  { path: '/resumes', icon: HiOutlineDocumentText, label: 'Resumes' },
  { path: '/ai-tools', icon: HiOutlineSparkles, label: 'AI Tools' },
  { path: '/email-tracker', icon: HiOutlineEnvelope, label: 'Email Tracker' },
  { path: '/interviews', icon: HiOutlineCalendar, label: 'Interviews' },
  { path: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
  { path: '/profile', icon: HiOutlineUser, label: 'Profile' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-out hidden lg:flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{
        background: 'rgba(9, 10, 18, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
          <HiOutlineSparkles className="text-white text-lg" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold gradient-text">JobLens AI</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-500/15 text-primary-400'
                  : 'text-surface-200/70 hover:bg-white/5 hover:text-surface-100'
              }`
            }
          >
            <item.icon className={`text-xl flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-white/5 p-3 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-surface-200/50 hover:bg-white/5 hover:text-surface-100 transition-colors"
        >
          {collapsed ? (
            <HiOutlineChevronRight className="text-lg" />
          ) : (
            <HiOutlineChevronLeft className="text-lg" />
          )}
        </button>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-100 truncate">
                {user?.name}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-surface-200/60 hover:bg-danger/10 hover:text-danger transition-colors"
        >
          <HiOutlineArrowRightOnRectangle className={`text-lg flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
