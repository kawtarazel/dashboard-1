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
    Cancel as CancelIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { dashboardApi } from '../services/dashboardApi';

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
                dashboardApi.updateKPI(kpi.id, formData);
                toast.success('KPI updated successfully');
            } else {
                dashboardApi.createKPI(formData);
                toast.success('KPI created successfully');
            }
            onSave();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error saving KPI');
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
            <DialogTitle>
                {kpi ? 'Edit KPI' : 'Create New KPI'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Name"
                                value={formData.name}
                                onChange={handleChange('name')}
                                fullWidth
                                required
                                margin="normal"
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
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
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

        console.log('Submitting form data:', formData);

        try {
            if (tool?.id) {
                await dashboardApi.updateTool(tool.id, formData);
                toast.success('Tool updated successfully');
            } else {
                await dashboardApi.createTool(formData);
                toast.success('Tool created successfully');
            }
            onSave();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error saving tool');
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
            <DialogTitle>
                {tool ? 'Edit Tool' : 'Create New Tool'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Name"
                                value={formData.name}
                                onChange={handleChange('name')}
                                fullWidth
                                required
                                margin="normal"
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
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

// Main Admin Settings Component
const Sources = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [kpis, setKpis] = useState([]);
    const [tools, setTools] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
    const [toolDialogOpen, setToolDialogOpen] = useState(false);
    const [selectedKpi, setSelectedKpi] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);

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
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteKpi = async (kpiId) => {
        if (!window.confirm('Are you sure you want to delete this KPI?')) return;

        try {
            dashboardApi.deleteKPI(kpiId);
            toast.success('KPI deleted successfully');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete KPI');
        }
    };

    const handleDeleteTool = async (toolId) => {
        if (!window.confirm('Are you sure you want to delete this tool?')) return;

        try {
            dashboardApi.deleteTool(toolId);
            toast.success('Tool deleted successfully');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete tool');
        }
    };

    const getLevelColor = (level) => {
        const colors = {
            operational: '#4CAF50',
            managerial: '#FF9800',
            strategic: '#9C27B0'
        };
        return colors[level] || '#757575';
    };

    const getCategoryColor = (category) => {
        const colors = {
            firewall: '#F44336',
            antivirus: '#4CAF50',
            vulnerability_scanner: '#FF9800',
            waf: '#2196F3',
            ids_ips: '#9C27B0',
            siem: '#795548',
            endpoint_protection: '#009688',
            network_monitoring: '#3F51B5',
            log_analysis: '#607D8B',
            other: '#757575'
        };
        return colors[category] || '#757575';
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
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    <SettingsIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
                    Dashboard Settings
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage KPIs, tools, and dashboard configuration
                </Typography>
            </Box>

            {/* Statistics Cards */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold" color="primary">
                                            {stats.kpis.total}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total KPIs
                                        </Typography>
                                    </Box>
                                    <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold" color="secondary">
                                            {stats.tools.total}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Tools
                                        </Typography>
                                    </Box>
                                    <BuildIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold" color="success.main">
                                            {stats.logs.today}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Logs Today
                                        </Typography>
                                    </Box>
                                    <AssessmentIcon sx={{ fontSize: 40, color: 'success.main' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Main Content */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E5E7EB' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, newValue) => setCurrentTab(newValue)}
                        aria-label="settings tabs"
                    >
                        <Tab label="KPI Management" />
                        <Tab label="Tool Management" />
                        <Tab label="Configuration" />
                    </Tabs>
                </Box>

                {/* KPI Management Tab */}
                <TabPanel value={currentTab} index={0}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Key Performance Indicators</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setSelectedKpi(null);
                                setKpiDialogOpen(true);
                            }}
                        >
                            Add KPI
                        </Button>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Level</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Target</TableCell>
                                    <TableCell>Frequency</TableCell>
                                    <TableCell>Data Source</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {kpis && kpis.map((kpi) => (
                                    <TableRow key={kpi.id} hover>
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
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{kpi.type}</TableCell>
                                        <TableCell>
                                            {kpi.target} {kpi.unit}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={kpi.frequency} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{kpi.data_source || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedKpi(kpi);
                                                        setKpiDialogOpen(true);
                                                    }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteKpi(kpi.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* Tool Management Tab */}
                <TabPanel value={currentTab} index={1}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Security Tools</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setSelectedTool(null);
                                setToolDialogOpen(true);
                            }}
                        >
                            Add Tool
                        </Button>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Vendor</TableCell>
                                    <TableCell>Version</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tools && tools.map((tool) => (
                                    <TableRow key={tool.id} hover>
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
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={tool.type.replace('_', ' ')} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{tool.vendor || 'N/A'}</TableCell>
                                        <TableCell>{tool.version || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedTool(tool);
                                                        setToolDialogOpen(true);
                                                    }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteTool(tool.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* Configuration Tab */}
                <TabPanel value={currentTab} index={2}>
                    <Typography variant="h6" gutterBottom>
                        Dashboard Configuration
                    </Typography>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">KPI Distribution by Level</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {stats && (
                                <Grid container spacing={2}>
                                    {Object.entries(stats.kpis.by_level).map(([level, count]) => (
                                        <Grid item xs={12} sm={4} key={level}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="h6" color={getLevelColor(level)}>
                                                        {count}
                                                    </Typography>
                                                    <Typography variant="body2" textTransform="capitalize">
                                                        {level} KPIs
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">Tools by Category</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {stats && (
                                <Grid container spacing={2}>
                                    {Object.entries(stats.tools.by_category).map(([category, count]) => (
                                        <Grid item xs={12} sm={6} md={4} key={category}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="h6" color={getCategoryColor(category)}>
                                                        {count}
                                                    </Typography>
                                                    <Typography variant="body2" textTransform="capitalize">
                                                        {category.replace('_', ' ')}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </AccordionDetails>
                    </Accordion>
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