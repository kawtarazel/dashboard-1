const Managerial = {
  getDashboardData: () => ({
    kpis: [
      {
        title: 'Number of Incidents',
        current_value: 16,
        previous_value: 22,
        unit: 'incidents',
        last_calculated_date: "01-07-2025",
        threshold: 10,
        target: 'decreasing',
        icon: "bar"
      },
      {
        title: 'SLA Remediation Rate',
        current_value: 88,
        previous_value: 92,
        unit: '%',
        progress: 88,
        last_calculated_date: "01-07-2025",
        threshold: 90,
        target: 'increasing',
        icon: "trending"
      },
      {
        title: 'Average CVSS Score',
        current_value: 6.4,
        previous_value: 7.2,
        unit: '/10',
        last_calculated_date: "01-07-2025",
        threshold: 5,
        target: 'decreasing',
        icon: "trending"
      },
      {
        title: 'Security Training',
        current_value: 82,
        previous_value: 68,
        unit: '%',
        progress: 82,
        last_calculated_date: "01-07-2025",
        threshold: 75,
        target: 'increasing',
        icon: "trending"
      }
    ],
    charts: [
      {
        title: 'Incident Trend',
        threshold: 10,
        type: 'bar',
        data: [
          { date: '2025-01', value: 30 },
          { date: '2025-02', value: 28 },
          { date: '2025-03', value: 24 },
          { date: '2025-04', value: 32 },
          { date: '2025-05', value: 26 },
          { date: '2025-06', value: 22 },
          { date: '2025-07', value: 16 }
        ]
      },
      {
        title: 'Average CVSS Score trend',
        threshold: 5,
        type: 'line',
        data: [
          { date: '2025-01', value: 8.2 },
          { date: '2025-02', value: 7.6 },
          { date: '2025-03', value: 7.8 },
          { date: '2025-04', value: 7.3 },
          { date: '2025-05', value: 6.9 },
          { date: '2025-06', value: 7.2 },
          { date: '2025-07', value: 6.4 }
        ]
      }
    ]
  })
};

export default Managerial;