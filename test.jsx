import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, TrendingUp, Target, DollarSign, CheckCircle, Activity, Users, BarChart3 } from 'lucide-react';

// Mock Auth Context Hook
const useAuth = () => {
  // Simuler différents rôles pour tester
  const [currentRole, setCurrentRole] = useState('Strategic');
  
  return {
    user: {
      role: { name: currentRole },
      email: 'test@example.com'
    },
    loading: false,
    setRole: setCurrentRole // Helper pour tester différents rôles
  };
};

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
        progress: 145, 
        icon: <TrendingUp className="w-5 h-5 text-green-600" />
      }
    ],
    charts: [
      { title: 'Project Progress Overview', type: 'line' },
      { title: 'Resource Allocation', type: 'bar' }
    ]
  })
};

// Composant Strategic
const Strategic = {
  getDashboardData: () => ({
    kpis: [
      { 
        title: 'Strategic Goals', 
        value: '7', 
        unit: '/10', 
        progress: 70, 
        icon: <Target className="w-5 h-5 text-purple-600" />
      },
      { 
        title: 'Market Share', 
        value: '23.5', 
        unit: '%', 
        progress: 85, 
        icon: <TrendingUp className="w-5 h-5 text-blue-600" />
      },
      { 
        title: 'Revenue Growth', 
        value: '18.2', 
        unit: '%', 
        progress: 92, 
        icon: <DollarSign className="w-5 h-5 text-green-600" />
      },
      { 
        title: 'Innovation Index', 
        value: '8.7', 
        unit: '/10', 
        progress: 87, 
        icon: <Shield className="w-5 h-5 text-indigo-600" />
      },
      { 
        title: 'Customer Satisfaction', 
        value: '94', 
        unit: '%', 
        progress: 94, 
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      }
    ],
    charts: [
      { title: 'Strategic Objectives Timeline', type: 'line' },
      { title: 'KPI Achievement Matrix', type: 'bar' }
    ]
  })
};
