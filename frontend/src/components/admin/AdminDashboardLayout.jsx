import DashboardHeader from '../dashboard/DashboardHeader';
import DashboardSidebar from '../dashboard/DashboardSidebar';
import AdminDashboard from './AdminDashboard';
import { useState } from 'react';

function AdminDashboardLayout() {
  // activeItem = 0, onSelect
  const [activeItem, setActiveItem] = useState(0);
  return (
    <div className='flex flex-col min-h-screen'>
      <DashboardHeader />
      <div className='flex flex-1'>
        <DashboardSidebar activeItem={activeItem} onSelect={setActiveItem} />
        <div className='flex-1'>
          <AdminDashboard />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardLayout;