import { useEffect, useState } from 'react';
import Managerial from './levels/Managerial';
import Operational from './levels/Operational';
import Strategic from './levels/Strategic';
import { Shield, BarChart3 } from 'lucide-react';

function DashboardContent({ user, user_role, loading }) {
  const [kpiData, setKpiData] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (user && user_role) {
      // Reset data
      setKpiData([]);
      setChartData([]);

      // Get data based on user role
      switch (user_role) {
        case 'Viewer':
        case 'Operational': {
          const { kpis, charts } = Operational.getDashboardData();
          setKpiData(kpis);
          setChartData(charts);
          break;
        }
        case 'Managerial': {
          const { kpis, charts } = Managerial.getDashboardData();
          setKpiData(kpis);
          setChartData(charts);
          break;
        }
        case 'Strategic': {
          const { kpis, charts } = Strategic.getDashboardData();
          setKpiData(kpis);
          setChartData(charts);
          break;
        }
        default:
          setKpiData([]);
          setChartData([]);
      }
    }
  }, [user, user_role]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">Error: User not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const KPICard = ({ title, value, unit, progress, icon, last_calculated_date, target }) => {
    // Determine status based on target
    let status = 'neutral';
    let statusColor = 'bg-gray-500';

    if (typeof target === 'number') {
      if (parseFloat(value) >= target) {
        status = 'good';
        statusColor = 'bg-green-500';
      } else {
        status = 'bad';
        statusColor = 'bg-red-500';
      }
    } else if (target === 'decreasing') {
      if (parseFloat(value) <= 0) { // Assuming negative is good for incident trend
        status = 'good';
        statusColor = 'bg-green-500';
      } else {
        status = 'bad';
        statusColor = 'bg-red-500';
      }
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-medium text-gray-700 truncate">{title}</h3>
          </div>
          <div className={`w-3 h-3 rounded-full ${statusColor}`} title={status}></div>
        </div>

        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          <span className="text-2xl font-bold text-gray-900 ml-1">{unit}</span>
          {typeof target === 'number' && (
            <span className="text-sm text-gray-500 ml-2">(target: {target}%)</span>
          )}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`${statusColor} h-2 rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <p>
            Last updated:
            </p>
            {last_calculated_date}
          </div>
          {status === 'good' && (
            <span className="text-xs text-green-600 font-medium">On target</span>
          )}
          {status === 'bad' && (
            <span className="text-xs text-red-600 font-medium">Needs improvement</span>
          )}
        </div>
      </div>
    );
  };

  const ChartCard = ({ title, chartType }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        {chartType === 'line' ? (
          <svg width="200" height="120" viewBox="0 0 200 120" className="text-gray-400">
            <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="20" x2="20" y2="100" stroke="currentColor" strokeWidth="2" />
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="30,80 60,60 90,40 120,50 150,30 170,35"
            />
            <circle cx="30" cy="80" r="4" fill="#3B82F6" />
            <circle cx="60" cy="60" r="4" fill="#3B82F6" />
            <circle cx="90" cy="40" r="4" fill="#3B82F6" />
            <circle cx="120" cy="50" r="4" fill="#3B82F6" />
            <circle cx="150" cy="30" r="4" fill="#3B82F6" />
            <circle cx="170" cy="35" r="4" fill="#3B82F6" />
          </svg>
        ) : (
          <svg width="200" height="120" viewBox="0 0 200 120" className="text-gray-400">
            <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="20" x2="20" y2="100" stroke="currentColor" strokeWidth="2" />
            <rect x="30" y="70" width="15" height="30" fill="#3B82F6" rx="2" />
            <rect x="55" y="50" width="15" height="50" fill="#3B82F6" rx="2" />
            <rect x="80" y="30" width="15" height="70" fill="#3B82F6" rx="2" />
            <rect x="105" y="60" width="15" height="40" fill="#3B82F6" rx="2" />
            <rect x="130" y="40" width="15" height="60" fill="#3B82F6" rx="2" />
            <rect x="155" y="55" width="15" height="45" fill="#3B82F6" rx="2" />
          </svg>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                {user_role || 'Loading...'} Dashboard
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Role: <span className="font-medium">{user_role || 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className={`grid grid-cols-1 md:grid-cols-${kpiData.length<2 ? kpiData.length : '2'} lg:grid-cols-${kpiData.length<3 ? kpiData.length : '3'} xl:grid-cols-${kpiData.length<5 ? kpiData.length : '5'} gap-6 mb-8`}>
          {kpiData.length > 0
            ? kpiData.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                unit={kpi.unit}
                progress={kpi.progress}
                icon={kpi.icon}
                last_calculated_date={kpi.last_calculated_date}
                target={kpi.target}
              />
            ))
            : Array.from({ length: 5 }).map((_, i) => (
              <KPICard
                key={i}
                title="KPI ....."
                value="- -"
                unit="%"
                progress={40}
                icon={<Shield className="w-5 h-5 text-gray-400" />}
              />
            ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartData.length > 0
            ? chartData.map((chart, i) => (
              <ChartCard key={i} title={chart.title} chartType={chart.type} />
            ))
            : [
              <ChartCard key="line" title="Titre du graph" chartType="line" />,
              <ChartCard key="bar" title="Titre du graph" chartType="bar" />,
            ]}
        </div>
      </div>
    </div>
  );
}

export default DashboardContent;