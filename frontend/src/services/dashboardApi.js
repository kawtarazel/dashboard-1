import api from './api';

export const dashboardApi = {
  getKPIs: async (level) => {
    const response = await api.get(`/api/dashboard/kpis?level=${level}`);
    return response.data;
  },
  
  getKPIValue: async (kpiId) => {
    const response = await api.get(`/api/dashboard/kpi/${kpiId}/value`);
    return response.data;
  },
  
  getChartData: async (chartType, timeRange) => {
    const response = await api.get(`/api/dashboard/charts/${chartType}?range=${timeRange}`);
    return response.data;
  }
};