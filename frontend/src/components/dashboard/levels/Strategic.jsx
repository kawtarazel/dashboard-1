const Strategic = {
  getDashboardData: () => ({
    kpis: [
      { 
        title: 'Cybersecurity Budget', 
        current_value: 65, 
        previous_value: 56, 
        unit: '%', 
        progress: 65, 
        last_calculated_date: "01-01-2025",
        threshold: 60,
        target: 'increasing',
        icon: "dollar"
      },
      {
        title: 'Security staff trained', 
        current_value: 60, 
        previous_value: 50, 
        unit: '%', 
        progress: 60, 
        last_calculated_date: "01-07-2025",
        threshold: 80,
        target: 'increasing',
        icon: "trending"
      },
      {
        title: 'Incident Trend', 
        current_value: 16, 
        previous_value: 22, 
        unit: 'incidents', 
        last_calculated_date: "01-07-2025",
        threshold: 10,
        target: 'decreasing',
        icon: "trending"
      }
    ],
    charts: [
      {
        title: 'Incident Trend',
        threshold: 10,
        type: 'line',
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
        title: 'Security Staff Training Trend',
        threshold: 80,
        type: 'bar',
        data: [
          { date: '2025-01', value: 40 },
          { date: '2025-02', value: 45 },
          { date: '2025-03', value: 50 },
          { date: '2025-04', value: 53 },
          { date: '2025-05', value: 58 },
          { date: '2025-06', value: 61 },
          { date: '2025-07', value: 65 }
        ]
      }
    ]
  })
};

export default Strategic;