import { TrendingUp, DollarSign, Shield, CheckCircle } from 'lucide-react';

// Composant Strategic
const Strategic = {
  getDashboardData: () => ({
    kpis: [
      { 
        title: 'Cybersecurity Budget', 
        value: '70', 
        unit: '%', 
        progress: 70, 
        icon: <DollarSign className="w-5 h-5 text-green-600" />
      },
      { 
        title: 'Security staff trained', 
        value: '10', 
        unit: '%', 
        progress: 10, 
        icon: <TrendingUp className="w-5 h-5 text-blue-600" />
      },
      { 
        title: 'Incident Trend', 
        value: '18.2', 
        unit: '%', 
        progress: 10, 
        icon: <TrendingUp className="w-5 h-5 text-green-600" />
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

export default Strategic;