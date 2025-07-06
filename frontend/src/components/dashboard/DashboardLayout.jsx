import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import DashboardContent from './DashboardContent';
import Settings from '../Settings';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';

function DashboardLayout() {
  const { user, loading, user_role, fetchUserRole } = useAuth();
  const [activeItem, setActiveItem] = useState(0);

  useEffect(() => {
    if (user) {
      // Fetch user role when user is available
      fetchUserRole(user.id);
    }
  }, [user, fetchUserRole]);

  return (
    <div className='flex flex-col min-h-screen'>
      <DashboardHeader />
      <div className='flex flex-1'>
        <DashboardSidebar activeItem={activeItem} onSelect={setActiveItem}/>
        <div className='flex-1'>
          {/* Render Settings if activeItem is 1, and render DashboardContent if active item is 0*/}
          {activeItem === 1 ? (
            <Settings />
          ) : (
            <DashboardContent user={user} user_role={user_role} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;