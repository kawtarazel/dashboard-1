import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Skeleton } from "../ui/skeleton"
import { Alert, AlertDescription } from "../ui/alert"
import Managerial from './levels/Managerial';
import Operational from './levels/Operational';
import Strategic from './levels/Strategic';
import {
  Shield,
  BarChart3,
  LineChart,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Calendar,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Users,
  Zap,
  CalendarDays,
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts"

function DashboardContent({ user, user_role, loading }) {
  const [kpiData, setKpiData] = useState([])
  const [chartData, setChartData] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [gridcols, setGridCols] = useState(0)

  const fetchDashboardData = useCallback(() => {
    if (user && user_role) {
      setKpiData([])
      setChartData([])
      switch (user_role) {
        case "Viewer":
        case "Operational": {
          const { kpis, charts } = Operational.getDashboardData()
          setKpiData(kpis)
          setChartData(charts)
          break
        }
        case "Managerial": {
          const { kpis, charts } = Managerial.getDashboardData()
          setKpiData(kpis)
          setChartData(charts)
          break
        }
        case "Strategic": {
          const { kpis, charts } = Strategic.getDashboardData()
          setKpiData(kpis)
          setChartData(charts)
          break
        }
        default:
          setKpiData([])
          setChartData([])
      }
    }
    setGridCols(kpiData.length % 3 === 0 ? 3 : kpiData.length % 5 === 0 ? 5 : kpiData.length % 4 === 0 || kpiData.length % 4 === 1 ? 4 : 5)
  }, [user, user_role])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData, refreshTrigger])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshTrigger((prev) => prev + 1)
      setRefreshing(false)
    }, 1000)
  }

  const getIcon = (iconName) => {
    const iconMap = {
      trendingup: <TrendingUp className="w-5 h-5 text-blue-600" />,
      trendingdown: <TrendingDown className="w-5 h-5 text-red-600" />,
      dollar: <DollarSign className="w-5 h-5 text-blue-600" />,
      bar: <BarChart3 className="w-5 h-5 text-blue-600" />,
      line: <LineChart className="w-5 h-5 text-blue-600" />,
      activity: <Activity className="w-5 h-5 text-blue-600" />,
      shield: <Shield className="w-5 h-5 text-red-600" />,
    }
    return iconMap[iconName] || iconMap["shield"]
  }

  const KPICard = ({ title, current_value, previous_value, unit, progress_value, icon, last_calculated_date, threshold, target, top_items }) => {
    let progressWidth = 0
    if (unit === "%") {
      progressWidth = Math.min(current_value, 100)
    } else if (unit.includes("/")) {
      const [current, total] = unit.split("/").map((s) => Number.parseInt(s))
      progressWidth = total > 0 ? Math.min((current / total) * 100, 100) : 0
    } else if (progress_value) {
      progressWidth = Math.min(progress_value, 100)
    }

    let status = "neutral"
    let statusColor = "bg-slate-400"
    let statusBorder = "border-slate-200"
    let statusBg = "bg-slate-50"
    let trendIndicator = null

    const percentageChange = previous_value ? ((current_value - previous_value) / previous_value) * 100 : 0

    if (target === "increasing") {
      if (threshold && current_value >= threshold) {
        status = "excellent"
        statusColor = "bg-blue-600"
        statusBorder = "border-blue-200"
        statusBg = "bg-blue-50"
      } else if (percentageChange > 0) {
        status = "good"
        statusColor = "bg-blue-400"
        statusBorder = "border-blue-100"
        statusBg = "bg-blue-50"
      } else {
        status = "bad"
        statusColor = "bg-red-600"
        statusBorder = "border-red-200"
        statusBg = "bg-red-50"
      }
      trendIndicator =
        percentageChange >= 0 ? (
          <ArrowUp className="w-4 h-4 text-blue-600" />
        ) : (
          <ArrowDown className="w-4 h-4 text-red-600" />
        )
    } else if (target === "decreasing") {
      if (threshold && current_value <= threshold) {
        status = "excellent"
        statusColor = "bg-blue-600"
        statusBorder = "border-blue-200"
        statusBg = "bg-blue-50"
      } else if (percentageChange < 0) {
        status = "good"
        statusColor = "bg-blue-400"
        statusBorder = "border-blue-100"
        statusBg = "bg-blue-50"
      } else {
        status = "bad"
        statusColor = "bg-red-600"
        statusBorder = "border-red-200"
        statusBg = "bg-red-50"
      }
      trendIndicator =
        percentageChange <= 0 ? (
          <ArrowDown className="w-4 h-4 text-blue-600" />
        ) : (
          <ArrowUp className="w-4 h-4 text-red-600" />
        )
    }

    const iconElement = getIcon(icon)
    const hasProgressBar = !!progress_value || unit === "%" || (unit && unit.includes("/"))

    return (
      <Card
        className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${statusBorder} bg-gradient-to-br from-white to-slate-50`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusBg} shadow-sm`}>{iconElement}</div>
              <div className="flex-1">
                <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                  {title}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {trendIndicator}
              <div className={`w-3 h-3 rounded-full ${statusColor} shadow-sm`} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* If top_items exists, show a table. Otherwise, show the value as before. */}
          {Array.isArray(top_items) && top_items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border border-slate-200 rounded-lg">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 font-semibold text-slate-700">Type</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {top_items.map((item, idx) => (
                    <tr key={idx} className="border-t border-slate-200">
                      <td className="px-3 py-2 whitespace-nowrap">{item.name}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-end justify-center gap-2">
              <span className="text-3xl font-bold text-slate-900">{current_value?.toLocaleString?.() ?? current_value}</span>
              <span className="text-lg font-medium text-slate-600 mb-1">{unit}</span>
            </div>
          )}

          {hasProgressBar && (
            <div className="space-y-2">
              <Progress value={progressWidth} className="h-2" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>0</span>
                <span>{unit === "%" ? "100%" : "Target"}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <CalendarDays className="w-3 h-3" />
              <span>{new Date(last_calculated_date).toLocaleDateString()}</span>
            </div>
            {status === "excellent" && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                <CheckCircle className="w-3 h-3 mr-1" />
                On Target
              </Badge>
            )}
            {status === "good" && (
              <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50">
                <TrendingUp className="w-3 h-3 mr-1" />
                Improving
              </Badge>
            )}
            {status === "bad" && (
              <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Attention
              </Badge>
            )}
          </div>

          {previous_value && (
            <div className="text-xs text-slate-500 text-center">
              {percentageChange > 0 ? "+" : ""}
              {percentageChange.toFixed(1)}% from last period
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const ChartCard = ({ title, type, data = [] }) => {
    const chartData = data.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }))

    // Find a matching KPI with a threshold for this chart
    const matchingKPI = kpiData?.find(
      (kpi) => kpi.title && title && kpi.title.toLowerCase().includes(title.toLowerCase().split(" ")[0]) && kpi.threshold !== undefined
    )
    const threshold = matchingKPI?.threshold

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-slate-900">{`Date: ${label}`}</p>
            <p className="text-sm text-slate-600">{`Value: ${payload[0].value}`}</p>
          </div>
        )
      }
      return null
    }

    const renderChart = () => {
      const commonProps = {
        data: chartData,
        margin: { top: 5, right: 30, left: 20, bottom: 5 },
      }
      switch (type) {
        case "line":
          return (
            <RechartsLineChart {...commonProps}>
              <CartesianGrid stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#dc2626"
                strokeWidth={3}
                dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#dc2626", strokeWidth: 2 }}
              />
              {threshold !== undefined && (
                <ReferenceLine y={threshold} stroke="#2563eb" strokeDasharray="6 3" label={{ value: 'Target', position: 'left', fill: '#2563eb', fontSize: 12, fontWeight: 'bold', offset: 30 }} />
              )}
            </RechartsLineChart>
          )
        case "area":
          return (
            <AreaChart {...commonProps}>
              <CartesianGrid stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#colorGradient)" strokeWidth={2} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              {threshold !== undefined && (
                <ReferenceLine y={threshold} stroke="#2563eb" strokeDasharray="6 3" label={{ value: 'Target', position: 'left', fill: '#2563eb', fontSize: 12, fontWeight: 'bold', offset: 30 }} />
              )}
            </AreaChart>
          )
        default:
          return (
            <RechartsBarChart {...commonProps}>
              <CartesianGrid stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              {threshold !== undefined && (
                <ReferenceLine y={threshold} stroke="#2563eb" strokeDasharray="6 3" label={{ value: 'Target', position: 'left', fill: '#2563eb', fontSize: 12, fontWeight: 'bold', offset: 30 }} />
              )}
            </RechartsBarChart>
          )
      }
    }

    return (
      <Card className="group hover:shadow-xl transition-all duration-300 border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg shadow-sm ${type === "bar" ? "bg-blue-100" : "bg-red-100"}`}>
                {type === "bar" ? (
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                ) : (
                  <LineChart className="w-5 h-5 text-red-600" />
                )}
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                {title}
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs text-slate-500 border-slate-300">
              {data.length} data points
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-center space-y-2">
                  <BarChart3 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-slate-500 font-medium">No data available</p>
                  <p className="text-xs text-slate-400">Data will appear here when available</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Error: User not found. Please log in to access the dashboard.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">{user_role || "Loading..."} Dashboard</h1>
                    <p className="text-blue-100 text-lg">Real-time security metrics and performance indicators</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 text-blue-100">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Logged in as</span>
                  </div>
                  <p className="font-semibold text-white text-lg">{user?.username}</p>
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  size="lg"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Key Performance Indicators</h2>
              <p className="text-slate-600 mt-1">Monitor your critical security metrics in real-time</p>
            </div>
          </div>

          <div className={`grid grid-cols-${gridcols} sm:grid-cols-2 md:grid-cols-3 gap-8`}>
            {kpiData.length > 0
              ? kpiData.map((kpi, index) => (
                <KPICard
                  key={index}
                  title={kpi.title}
                  current_value={kpi.current_value}
                  previous_value={kpi.previous_value}
                  unit={kpi.unit}
                  progress_value={kpi.progress}
                  icon={kpi.icon}
                  last_calculated_date={kpi.last_calculated_date}
                  threshold={kpi.threshold}
                  target={kpi.target}
                  top_items={kpi.top_items}
                />
              ))
              : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Trends & Analytics</h2>
              <p className="text-slate-600 mt-1">Visualize performance trends and identify patterns</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.length > 0
              ? chartData.map((chart, i) => (
                <ChartCard key={i} title={chart.title} type={chart.type} data={chart.data} />
              ))
              : [
                <Skeleton key="chart1" className="h-96 rounded-2xl" />,
                <Skeleton key="chart2" className="h-96 rounded-2xl" />,
              ]}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardContent