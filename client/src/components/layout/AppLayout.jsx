import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar />
      <Navbar />
      {/* Main content area — offset for sidebar on desktop, top/bottom nav on mobile */}
      <main className="lg:ml-64 pt-16 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
