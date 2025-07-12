import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import DashboardContent from './dashboard/Dashboard_KPI';
import AdminDashboard from './admin/AdminDashboard';
import Sources from './Sources';
import FilesPage from './FilesPage';
import { useEffect, useState } from 'react';

function DashboardLayout({user, loading, user_role, fetchUserRole}) {
  const [activeItem, setActiveItem] = useState(0);
  const [Switch, setSwitch] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserRole(user.id);
    }
  }, [user, fetchUserRole]);

  const CanAccess = user && user.is_superuser && Switch;

  return (
    <div className='flex flex-col min-h-screen'>
      <DashboardHeader setSwitch={setSwitch} setActiveItem={setActiveItem}/>
      <div className='flex flex-1'>
        <DashboardSidebar activeItem={activeItem} onSelect={setActiveItem} is_superuser={user.is_superuser} />
        <div className='flex-1'>
          {activeItem === 0 ? (
            (CanAccess === true ? 
              (
                <AdminDashboard setSwitch={setSwitch}/>
              ) : (
                <DashboardContent user={user} user_role={user_role} loading={loading} />
              )
            )
          ) : activeItem === 1 ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Settings page coming soon...</p>
            </div>
          ) : activeItem === 2 ? (
            <Sources />
          ) : activeItem === 3 ? (
            <FilesPage />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;