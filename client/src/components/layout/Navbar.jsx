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
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';

const navItems = [
  { path: '/dashboard', icon: HiOutlineHome, label: 'Home' },
  { path: '/jobs', icon: HiOutlineBriefcase, label: 'Jobs' },
  { path: '/resumes', icon: HiOutlineDocumentText, label: 'Resume' },
  { path: '/ai-tools', icon: HiOutlineSparkles, label: 'AI' },
  { path: '/interviews', icon: HiOutlineCalendar, label: 'Schedule' },
  { path: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
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
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(15, 18, 30, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
            <HiOutlineSparkles className="text-white text-sm" />
          </div>
          <span className="font-bold gradient-text">JobLens AI</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-surface-200 p-1">
          {mobileOpen ? <HiOutlineXMark className="text-2xl" /> : <HiOutlineBars3 className="text-2xl" />}
        </button>
      </header>

      {/* Mobile slide-out menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-72 p-6 space-y-4 animate-slideIn"
            style={{ background: 'rgba(15, 18, 30, 0.98)', backdropFilter: 'blur(20px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white">
                {initials}
              </div>
              <div>
                <p className="font-medium text-surface-100">{user?.name}</p>
                <p className="text-xs text-surface-200/60">{user?.email}</p>
              </div>
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-primary-500/15 text-primary-400' : 'text-surface-200/70 hover:bg-white/5'
                  }`
                }
              >
                <item.icon className="text-xl" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-primary-500/15 text-primary-400' : 'text-surface-200/70 hover:bg-white/5'
                }`
              }
            >
              <HiOutlineUser className="text-xl" />
              <span>Profile</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-danger hover:bg-danger/10 transition-colors w-full"
            >
              <HiOutlineArrowRightOnRectangle className="text-xl" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{ background: 'rgba(15, 18, 30, 0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                isActive ? 'text-primary-400' : 'text-surface-200/50'
              }`
            }
          >
            <item.icon className="text-xl" />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Navbar;
