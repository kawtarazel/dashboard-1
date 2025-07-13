const Operational = {
  getDashboardData: () => ({
    kpis: [
      {
        title: 'Top Attack Types',
        current_value: 5,
        unit: 'types',
        last_calculated_date: "01-07-2025",
        threshold: 3,
        target: 'decreasing',
        icon: "shield",
        top_items: [
          { name: 'Phishing', count: 12 },
          { name: 'Malware', count: 9 },
          { name: 'Ransomware', count: 7 },
          { name: 'DDoS', count: 5 },
          { name: 'Insider Threat', count: 3 }
        ]
      },
      {
        title: 'Detection Rule Performance',
        current_value: 92,
        previous_value: 89,
        unit: '%',
        progress: 92,
        last_calculated_date: "01-07-2025",
        threshold: 90,
        target: 'increasing',
        icon: "activity"
      },
      {
        title: 'Average CVSS Score',
        current_value: 6.8,
        previous_value: 7.1,
        unit: '/10',
        last_calculated_date: "01-07-2025",
        threshold: 5,
        target: 'decreasing',
        icon: "trending"
      },
      {
        title: 'Top Vulnerabilities',
        current_value: 8,
        unit: 'vulnerabilities',
        last_calculated_date: "01-07-2025",
        threshold: 5,
        target: 'decreasing',
        icon: "bar",
        top_items: [
          { name: 'CVE-2023-1234', count: 4 },
          { name: 'CVE-2023-5678', count: 2 },
          { name: 'CVE-2022-9999', count: 1 },
          { name: 'CVE-2021-8888', count: 1 }
        ]
      },
      {
        title: 'Top Malware Types',
        current_value: 4,
        unit: 'types',
        last_calculated_date: "01-07-2025",
        threshold: 2,
        target: 'decreasing',
        icon: "shield",
        top_items: [
          { name: 'Trojan', count: 6 },
          { name: 'Worm', count: 4 },
          { name: 'Spyware', count: 3 },
          { name: 'Adware', count: 2 }
        ]
      },
      {
        title: 'Successful Quarantines',
        current_value: 95,
        previous_value: 93,
        unit: '%',
        progress: 95,
        last_calculated_date: "01-07-2025",
        threshold: 90,
        target: 'increasing',
        icon: "trending"
      }
    ],
    charts: [
      {
        title: 'Detection Rule Performance Trend',
        threshold: 90,
        type: 'bar',
        data: [
          { date: '2025-01', value: 92 },
          { date: '2025-02', value: 85 },
          { date: '2025-03', value: 81 },
          { date: '2025-04', value: 90 },
          { date: '2025-05', value: 85 },
          { date: '2025-06', value: 89 },
          { date: '2025-07', value: 92 }
        ]
      },
      {
        title: 'Quarantine Success Rate Trend',
        threshold: 90,
        type: 'line',
        data: [
          { date: '2025-01', value: 85 },
          { date: '2025-02', value: 88 },
          { date: '2025-03', value: 90 },
          { date: '2025-04', value: 91 },
          { date: '2025-05', value: 93 },
          { date: '2025-06', value: 93 },
          { date: '2025-07', value: 95 }
        ]
      }
    ]
  })
};

export default Operational;