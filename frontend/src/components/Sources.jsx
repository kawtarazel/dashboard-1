import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    Tabs,
    Tab,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Card,
    CardContent,
    Fab,
    Tooltip,
    Alert,
    Snackbar,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Settings as SettingsIcon,
    Assessment as AssessmentIcon,
    Build as BuildIcon,
    ExpandMore as ExpandMoreIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Lock as LockIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { dashboardApi } from '../services/dashboardApi';
import { useAuth } from '../contexts/AuthContext';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// KPI Form Component
function KPIForm({ kpi, onSave, onCancel, open }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        level: '',
        type: '',
        target: '',
        unit: '',
        frequency: '',
        formula: '',
        reporting_format: '',
        data_source: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (kpi) {
            setFormData(kpi);
        } else {
            setFormData({
                name: '',
                description: '',
                level: '',
                type: '',
                target: '',
                unit: '',
                frequency: '',
                formula: '',
                reporting_format: '',
                data_source: ''
            });
        }
    }, [kpi, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (kpi?.id) {
                await dashboardApi.updateKPI(kpi.id, formData);
                toast.success('✅ KPI updated successfully');
            } else {
                await dashboardApi.createKPI(formData);
                toast.success('✅ KPI created successfully');
            }
            onSave();
        } catch (error) {
            toast.error(`❌ ${error.response?.data?.detail || 'Error saving KPI'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    return (
        <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
            <DialogTitle sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 'bold'
            }}>
                {kpi ? 'Edit KPI' : 'Create New KPI'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Name"
                                value={formData.name}
                                onChange={handleChange('name')}
                                fullWidth
                                required
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>Level</InputLabel>
                                <Select
                                    value={formData.level}
                                    onChange={handleChange('level')}
                                    label="Level"
                                >
                                    <MenuItem value="Operational">Operational</MenuItem>
                                    <MenuItem value="Managerial">Managerial</MenuItem>
                                    <MenuItem value="Strategic">Strategic</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                value={formData.description}
                                onChange={handleChange('description')}
                                fullWidth
                                multiline
                                rows={2}
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Type"
                                value={formData.type}
                                onChange={handleChange('type')}
                                fullWidth
                                required
                                margin="normal"
                                placeholder="e.g., Security, Performance"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Target"
                                value={formData.target}
                                onChange={handleChange('target')}
                                fullWidth
                                required
                                margin="normal"
                                placeholder="e.g., > 95%, < 10"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Unit"
                                value={formData.unit}
                                onChange={handleChange('unit')}
                                fullWidth
                                margin="normal"
                                placeholder="e.g., %, count, minutes"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>Frequency</InputLabel>
                                <Select
                                    value={formData.frequency}
                                    onChange={handleChange('frequency')}
                                    label="Frequency"
                                >
                                    <MenuItem value="real-time">Real-time</MenuItem>
                                    <MenuItem value="hourly">Hourly</MenuItem>
                                    <MenuItem value="daily">Daily</MenuItem>
                                    <MenuItem value="weekly">Weekly</MenuItem>
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                    <MenuItem value="quarterly">Quarterly</MenuItem>
                                    <MenuItem value="yearly">Yearly</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Data Source"
                                value={formData.data_source}
                                onChange={handleChange('data_source')}
                                fullWidth
                                margin="normal"
                                placeholder="e.g., Fortinet, OpenVAS, F5"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Formula"
                                value={formData.formula}
                                onChange={handleChange('formula')}
                                fullWidth
                                margin="normal"
                                placeholder="e.g., (blocked_attacks / total_requests) * 100"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Reporting Format"
                                value={formData.reporting_format}
                                onChange={handleChange('reporting_format')}
                                fullWidth
                                margin="normal"
                                placeholder="e.g., Percentage, Count, Chart"
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={onCancel} disabled={loading} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                        sx={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                            }
                        }}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

// Tool Form Component
function ToolForm({ tool, onSave, onCancel, open }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: '',
        category: '',
        vendor: '',
        version: '',
        configuration: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tool) {
            setFormData(tool);
        } else {
            setFormData({
                name: '',
                description: '',
                type: '',
                category: '',
                vendor: '',
                version: '',
                configuration: ''
            });
        }
    }, [tool, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (tool?.id) {
                await dashboardApi.updateTool(tool.id, formData);
                toast.success('✅ Tool updated successfully');
            } else {
                await dashboardApi.createTool(formData);
                toast.success('✅ Tool created successfully');
            }
            onSave();
        } catch (error) {
            toast.error(`❌ ${error.response?.data?.detail || 'Error saving tool'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    return (
        <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
            <DialogTitle sx={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 'bold'
            }}>
                {tool ? 'Edit Tool' : 'Create New Tool'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Name"
                                value={formData.name}
                                onChange={handleChange('name')}
                                fullWidth
                                required
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Vendor"
                                value={formData.vendor}
                                onChange={handleChange('vendor')}
                                fullWidth
                                margin="normal"
                                placeholder="e.g., Fortinet, Palo Alto"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                value={formData.description}
                                onChange={handleChange('description')}
                                fullWidth
                                multiline
                                rows={2}
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={formData.category}
                                    onChange={handleChange('category')}
                                    label="Category"
                                >
                                    <MenuItem value="data">Data Security</MenuItem>
                                    <MenuItem value="IAM">Identity, Access, and Mobility Security</MenuItem>
                                    <MenuItem value="IAC">Infrastructure, Application, and Continuity Security</MenuItem>
                                    <MenuItem value="perimeter">Perimeter Security</MenuItem>
                                    <MenuItem value="monitoring_response">Security Monitoring and Incident Response</MenuItem>
                                    <MenuItem value="GOR">Security Governance, Organization, and Resources</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={formData.type}
                                    onChange={handleChange('type')}
                                    label="Type"
                                >
                                    <MenuItem value="firewall">Firewall</MenuItem>
                                    <MenuItem value="antivirus">Antivirus</MenuItem>
                                    <MenuItem value="vulnerability_scanner">Vulnerability Scanner</MenuItem>
                                    <MenuItem value="waf">WAF</MenuItem>
                                    <MenuItem value="ids_ips">IDS/IPS</MenuItem>
                                    <MenuItem value="siem">SIEM</MenuItem>
                                    <MenuItem value="endpoint_protection">Endpoint Protection</MenuItem>
                                    <MenuItem value="network_monitoring">Network Monitoring</MenuItem>
                                    <MenuItem value="log_analysis">Log Analysis</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Version"
                                value={formData.version}
                                onChange={handleChange('version')}
                                fullWidth
                                margin="normal"
                                placeholder="e.g., 7.4.1, 2023.1"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Configuration"
                                value={formData.configuration}
                                onChange={handleChange('configuration')}
                                fullWidth
                                multiline
                                rows={3}
                                margin="normal"
                                placeholder="JSON configuration or setup notes"
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={onCancel} disabled={loading} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                        sx={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                            }
                        }}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

// Main Sources Component
const Sources = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [kpis, setKpis] = useState([]);
    const [tools, setTools] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Dialog states
    const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
    const [toolDialogOpen, setToolDialogOpen] = useState(false);
    const [selectedKpi, setSelectedKpi] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);

    // Check if user is superuser
    const isSuperUser = user?.is_superuser || false;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [kpisRes, toolsRes, statsRes] = await Promise.all([
                dashboardApi.getAllKPIs(),
                dashboardApi.getAllTools(),
                dashboardApi.getDashboardStats()
            ]);

            setKpis(kpisRes);
            setTools(toolsRes);
            setStats(statsRes);
        } catch (error) {
            toast.error('❌ Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteKpi = async (kpiId) => {
        if (!isSuperUser) {
            toast.error('❌ Only administrators can delete KPIs');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this KPI?')) return;

        try {
            await dashboardApi.deleteKPI(kpiId);
            toast.success('✅ KPI deleted successfully');
            fetchData();
        } catch (error) {
            toast.error(`❌ ${error.response?.data?.detail || 'Failed to delete KPI'}`);
        }
    };

    const handleDeleteTool = async (toolId) => {
        if (!isSuperUser) {
            toast.error('❌ Only administrators can delete tools');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this tool?')) return;

        try {
            await dashboardApi.deleteTool(toolId);
            toast.success('✅ Tool deleted successfully');
            fetchData();
        } catch (error) {
            toast.error(`❌ ${error.response?.data?.detail || 'Failed to delete tool'}`);
        }
    };

    const getLevelColor = (level) => {
        const colors = {
            operational: '#10b981',
            managerial: '#f59e0b',
            strategic: '#8b5cf6'
        };
        return colors[level?.toLowerCase()] || '#6b7280';
    };

    const getCategoryColor = (category) => {
        const colors = {
            data: '#ef4444',
            IAM: '#10b981',
            IAC: '#f59e0b',
            perimeter: '#3b82f6',
            monitoring_response: '#8b5cf6',
            GOR: '#6b7280'
        };
        return colors[category] || '#6b7280';
    };

    const getTypeColor = (type) => {
        const colors = {
            firewall: '#ef4444',
            antivirus: '#10b981',
            vulnerability_scanner: '#f59e0b',
            waf: '#3b82f6',
            ids_ips: '#8b5cf6',
            siem: '#78716c',
            endpoint_protection: '#059669',
            network_monitoring: '#4338ca',
            log_analysis: '#475569',
            other: '#6b7280'
        };
        return colors[type] || '#6b7280';
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={60} />
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 3,
                    p: 4,
                    color: 'white',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <SettingsIcon sx={{ mr: 2 }} />
                        Dashboard Configuration
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                        {isSuperUser ? 'Manage KPIs, tools, and dashboard settings' : 'View KPIs, tools, and dashboard configuration'}
                    </Typography>
                    {!isSuperUser && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                            <LockIcon sx={{ mr: 1, fontSize: 20 }} />
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Read-only access - Contact administrator to modify settings
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Statistics Cards */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                            border: '2px solid #3b82f6',
                            borderRadius: 3,
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold" color="#1e40af">
                                            {stats.kpis.total}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                            Total KPIs
                                        </Typography>
                                    </Box>
                                    <AssessmentIcon sx={{ fontSize: 40, color: '#3b82f6' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                            border: '2px solid #10b981',
                            borderRadius: 3,
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold" color="#047857">
                                            {stats.tools.total}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                            Total Tools
                                        </Typography>
                                    </Box>
                                    <BuildIcon sx={{ fontSize: 40, color: '#10b981' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            border: '2px solid #f59e0b',
                            borderRadius: 3,
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold" color="#d97706">
                                            {stats.logs.today}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                            Logs Today
                                        </Typography>
                                    </Box>
                                    <AssessmentIcon sx={{ fontSize: 40, color: '#f59e0b' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Main Content */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        aria-label="settings tabs"
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 'medium',
                                textTransform: 'none',
                                fontSize: '1rem'
                            }
                        }}
                    >
                        <Tab label="KPI Management" />
                        <Tab label="Tool Management" />
                        <Tab label="Statistics" />
                    </Tabs>
                </Box>

                {/* KPI Management Tab */}
                <TabPanel value={currentTab} index={0}>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">Key Performance Indicators</Typography>
                        {isSuperUser && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setSelectedKpi(null);
                                    setKpiDialogOpen(true);
                                }}
                                sx={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                                    }
                                }}
                            >
                                Add KPI
                            </Button>
                        )}
                    </Box>

                    <TableContainer sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Level</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Target</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Frequency</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Data Source</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {kpis && kpis.map((kpi) => (
                                    <TableRow key={kpi.id} hover sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {kpi.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {kpi.description}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={kpi.level}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getLevelColor(kpi.level),
                                                    color: 'white',
                                                    textTransform: 'capitalize',
                                                    fontWeight: 'medium'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={kpi.type} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {kpi.target} {kpi.unit}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={kpi.frequency} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{kpi.data_source || 'N/A'}</TableCell>
                                        <TableCell>
                                            {isSuperUser ? (
                                                <>
                                                    <Tooltip title="Edit KPI">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedKpi(kpi);
                                                                setKpiDialogOpen(true);
                                                            }}
                                                            sx={{ color: '#3b82f6', '&:hover': { backgroundColor: '#eff6ff' } }}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete KPI">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteKpi(kpi.id)}
                                                            sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fef2f2' } }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <Tooltip title="View only - Contact administrator to modify">
                                                    <IconButton size="small" disabled>
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* Tool Management Tab */}
                <TabPanel value={currentTab} index={1}>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">Security Tools</Typography>
                        {isSuperUser && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    setSelectedTool(null);
                                    setToolDialogOpen(true);
                                }}
                                sx={{ 
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                    }
                                }}
                            >
                                Add Tool
                            </Button>
                        )}
                    </Box>

                    <TableContainer sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Category</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Vendor</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Version</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tools && tools.map((tool) => (
                                    <TableRow key={tool.id} hover sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {tool.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {tool.description}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={tool.category.replace('_', ' ')}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getCategoryColor(tool.category),
                                                    color: 'white',
                                                    textTransform: 'capitalize',
                                                    fontWeight: 'medium'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={tool.type.replace('_', ' ')} 
                                                size="small" 
                                                sx={{
                                                    backgroundColor: getTypeColor(tool.type),
                                                    color: 'white',
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{tool.vendor || 'N/A'}</TableCell>
                                        <TableCell>{tool.version || 'N/A'}</TableCell>
                                        <TableCell>
                                            {isSuperUser ? (
                                                <>
                                                    <Tooltip title="Edit Tool">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedTool(tool);
                                                                setToolDialogOpen(true);
                                                            }}
                                                            sx={{ color: '#3b82f6', '&:hover': { backgroundColor: '#eff6ff' } }}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Tool">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteTool(tool.id)}
                                                            sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fef2f2' } }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <Tooltip title="View only - Contact administrator to modify">
                                                    <IconButton size="small" disabled>
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* Statistics Tab */}
                <TabPanel value={currentTab} index={2}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Dashboard Statistics
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#374151' }}>
                                        KPI Distribution by Level
                                    </Typography>
                                    {stats && (
                                        <Grid container spacing={2}>
                                            {Object.entries(stats.kpis.by_level).map(([level, count]) => (
                                                <Grid item xs={12} key={level}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
                                                        <Typography variant="body1" textTransform="capitalize" fontWeight="medium">
                                                            {level} KPIs
                                                        </Typography>
                                                        <Chip
                                                            label={count}
                                                            sx={{
                                                                backgroundColor: getLevelColor(level),
                                                                color: 'white',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#374151' }}>
                                        Tools by Category
                                    </Typography>
                                    {stats && (
                                        <Grid container spacing={2}>
                                            {Object.entries(stats.tools.by_category).map(([category, count]) => (
                                                <Grid item xs={12} key={category}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
                                                        <Typography variant="body1" textTransform="capitalize" fontWeight="medium">
                                                            {category.replace('_', ' ')}
                                                        </Typography>
                                                        <Chip
                                                            label={count}
                                                            sx={{
                                                                backgroundColor: getCategoryColor(category),
                                                                color: 'white',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>

            {/* Dialogs */}
            <KPIForm
                kpi={selectedKpi}
                open={kpiDialogOpen}
                onSave={() => {
                    setKpiDialogOpen(false);
                    fetchData();
                }}
                onCancel={() => setKpiDialogOpen(false)}
            />

            <ToolForm
                tool={selectedTool}
                open={toolDialogOpen}
                onSave={() => {
                    setToolDialogOpen(false);
                    fetchData();
                }}
                onCancel={() => setToolDialogOpen(false)}
            />
        </Container>
    );
};

export default Sources;