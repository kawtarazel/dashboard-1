import { BarChart3, DollarSign, Users, Target, TrendingUp } from 'lucide-react';

// Composant Managerial
const Managerial = {
  getDashboardData: () => ({
    kpis: [
      { 
        title: 'Active Projects', 
        value: '8', 
        unit: '', 
        progress: 65, 
        icon: <BarChart3 className="w-5 h-5 text-purple-500" />
      },
      { 
        title: 'Budget Used', 
        value: '78', 
        unit: '%', 
        progress: 78, 
        icon: <DollarSign className="w-5 h-5 text-green-500" />
      },
      { 
        title: 'Team Members', 
        value: '24', 
        unit: '', 
        progress: 90, 
        icon: <Users className="w-5 h-5 text-blue-500" />
      },
      { 
        title: 'Milestones Met', 
        value: '15', 
        unit: '/18', 
        progress: 83, 
        icon: <Target className="w-5 h-5 text-indigo-500" />
      },
      { 
        title: 'ROI', 
        value: '145', 
        unit: '%', 
        progress: 100, // Cap at 100% for progress bar
        icon: <TrendingUp className="w-5 h-5 text-green-600" />
      }
    ],
    charts: [
      { title: 'Project Progress Overview', type: 'line' },
      { title: 'Resource Allocation', type: 'bar' }
    ]
  })
};

export default Managerial;