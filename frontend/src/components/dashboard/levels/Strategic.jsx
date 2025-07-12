import { TrendingUp, DollarSign } from 'lucide-react';

// Composant Strategic
const Strategic = {
  getDashboardData: () => ({
    kpis: [
      { 
        title: 'Cybersecurity Budget', 
        value: '65', 
        unit: '%', 
        progress: 65, 
        last_calculated_date: "28-12-2024",
        target: 60,
        icon: <DollarSign className="w-5 h-5 text-green-600" />
      },
      {
        title: 'Security staff trained', 
        value: '60', 
        unit: '%', 
        progress: 60, 
        last_calculated_date: "02-07-2025",
        target: 80,
        icon: <TrendingUp className="w-5 h-5 text-blue-600" />
      },
      {
        title: 'Incident Trend', 
        value: '11.2', 
        unit: '%', 
        last_calculated_date: "01-07-2025",
        target: 'decreasing',
        icon: <TrendingUp className="w-5 h-5 text-green-600" />
      }
    ],
    charts: [
      { title: 'Incident Trend', type: 'line' },
      { title: 'Security staff trained Trend', type: 'bar' }
    ]
  })
};

export default Strategic;