import { AlertTriangle, Activity, TrendingUp, CheckCircle, Clock } from 'lucide-react';

// Composant Operational
const Operational = {
  getDashboardData: () => ({
    kpis: [
      { 
        title: 'Active Incidents', 
        value: '12', 
        unit: '', 
        progress: 60, 
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />
      },
      { 
        title: 'Open Tickets', 
        value: '34', 
        unit: '', 
        progress: 80, 
        icon: <Activity className="w-5 h-5 text-orange-500" />
      },
      { 
        title: 'System Uptime', 
        value: '99.8', 
        unit: '%', 
        progress: 99, 
        icon: <TrendingUp className="w-5 h-5 text-green-500" />
      },
      { 
        title: 'Response Time', 
        value: '2.3', 
        unit: 'min', 
        progress: 85, 
        icon: <Clock className="w-5 h-5 text-blue-500" />
      },
      { 
        title: 'Resolved Today', 
        value: '28', 
        unit: '', 
        progress: 70, 
        icon: <CheckCircle className="w-5 h-5 text-green-600" />
      }
    ],
    charts: [
      { title: 'Incidents Over Time', type: 'line' },
      { title: 'Tickets by Priority', type: 'bar' }
    ]
  })
};

export default Operational;