import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import DashboardContent from './DashboardContent';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

function DashboardLayout() {
  const { user, loading, user_role, fetchUserRole } = useAuth();
  
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
        <DashboardSidebar />
        <div className='flex-1'>
          <DashboardContent 
            user={user} 
            user_role={user_role} 
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;