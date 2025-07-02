import type React from "react"

import { useState, useEffect } from "react"
import { motion, useMotionValue, AnimatePresence } from "framer-motion"
import {
  Shield,
  Eye,
  Users,
  Activity,
  Search,
  Download,
  Upload,
  Settings,
  BarChart3,
  Sun,
  Moon,
  ChevronDown,
  TrendingUp,
  Globe,
} from "lucide-react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Progress } from "../ui/progress"

// Glass Card Component with Liquid Effects
const GlassCard = ({ children, className = "", ...props }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  return (
    <motion.div
      className={`relative backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 rounded-2xl shadow-xl overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* Liquid Effect Overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mouseX.get()}px ${mouseY.get()}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`,
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Subtle Edge Glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: isHovered
            ? "0 0 30px rgba(59, 130, 246, 0.1), inset 0 0 30px rgba(59, 130, 246, 0.05)"
            : "0 0 15px rgba(59, 130, 246, 0.05)",
        }}
        transition={{ duration: 0.3 }}
      />

      {children}
    </motion.div>
  )
}

export default function CybrSensDashboard() {
  const [activeView, setActiveView] = useState("strategic")
  const [isDark, setIsDark] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "sources", label: "Sources", icon: Globe },
  ]

  const viewTabs = [
    { id: "strategic", label: "Strategic", icon: Eye },
    { id: "managerial", label: "Managerial", icon: Users },
    { id: "operational", label: "Operational", icon: Activity },
  ]

  const kpiData = [
    { title: "Security Score", value: "87", unit: "%", progress: 87 },
    { title: "Risk Level", value: "23", unit: "%", progress: 23 },
    { title: "Compliance", value: "94", unit: "%", progress: 94 },
    { title: "Incidents", value: "12", unit: "", progress: 60 },
    { title: "Response Time", value: "1.2", unit: "h", progress: 75 },
  ]

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
          : "bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100"
      }`}
    >
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{ top: "10%", left: "10%" }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-gradient-to-r from-blue-300/10 to-blue-700/10 rounded-full blur-3xl"
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{ top: "60%", right: "10%" }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 border-b border-gray-200/50 dark:border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Side - Logo */}
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Shield className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CybrSens</h1>
          </div>

          {/* Right Side - Controls */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-10 w-64 bg-white/50 dark:bg-slate-800/50 border-gray-300/50 dark:border-slate-600/50 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 backdrop-blur-sm"
              />
            </div>

            {/* Action Buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
            >
              <Download className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
            >
              <Upload className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className="text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-blue-500 text-white text-sm">JD</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block">John Doe</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-gray-200/50 dark:border-slate-700/50">
                <DropdownMenuLabel className="text-gray-900 dark:text-white">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-slate-700/50" />
                <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-800/50">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-800/50">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-800/50">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          className="relative z-40"
          animate={{ width: sidebarExpanded ? 200 : 60 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="h-screen p-4">
            <GlassCard className="h-full p-4 flex flex-col">
              {/* Navigation Items */}
              <nav className="space-y-2 flex-1">
                {sidebarItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 ${
                      item.id === "overview" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : ""
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <AnimatePresence>
                      {sidebarExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="whitespace-nowrap text-sm font-medium"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </nav>
            </GlassCard>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* View Tabs */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="p-2">
              <div className="flex space-x-2">
                {viewTabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                      activeView === tab.id
                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-lg"
                        : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-800/50"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* KPI Cards */}
          <motion.div
            className="grid gap-6 md:grid-cols-3 lg:grid-cols-5 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {kpiData.map((kpi, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-center mb-4">
                  <Shield className="h-6 w-6 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">KPI .....</span>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">-- {kpi.unit}</div>
                  <Progress value={kpi.progress} className="h-2" />
                </div>
              </GlassCard>
            ))}
          </motion.div>

          {/* Chart Sections */}
          <motion.div
            className="grid gap-6 lg:grid-cols-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center mb-6">
                <BarChart3 className="h-6 w-6 text-blue-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Titre du graph</h3>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-100/50 dark:bg-slate-700/50 rounded-xl">
                <TrendingUp className="h-16 w-16 text-gray-400 dark:text-gray-500" />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center mb-6">
                <BarChart3 className="h-6 w-6 text-blue-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Titre du graph</h3>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-100/50 dark:bg-slate-700/50 rounded-xl">
                <BarChart3 className="h-16 w-16 text-gray-400 dark:text-gray-500" />
              </div>
            </GlassCard>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
