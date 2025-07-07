import React, { act, useEffect, useState } from 'react';
import api, { authApi } from '../../services/api';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  TextField,
  InputAdornment,
  Fade,
  Skeleton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Verified as VerifiedIcon,
  PersonAdd as PersonAddIcon,
  LogoutRounded as LogoutIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';

const AdminDashboard = ({ setSwitch }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverPerms, setPopoverPerms] = useState([]);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permDialogUser, setPermDialogUser] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await authApi.getRoles();
      setRoles(res);
    } catch (err) {
      toast.error('Failed to fetch roles');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success('User deleted successfully');
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (email) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const getStatusColor = (isVerified) => {
    return isVerified ? '#10B981' : '#F59E0B';
  };

  const getRoleColor = (isSuperuser) => {
    return isSuperuser ? '#8B5CF6' : '#6B7280';
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    // eslint-disable-next-line
  }, []);

  // Fetch all permissions once
  useEffect(() => {
    authApi.getPermissions().then(setAllPermissions);
  }, []);

  const statsCards = [
    {
      title: 'Total Users',
      value: users.length,
      icon: <PeopleIcon sx={{ fontSize: 30, color: '#3B82F6' }} />,
      color: '#EBF8FF',
      borderColor: '#3B82F6'
    },
    {
      title: 'Verified Users',
      value: users.filter(u => u.is_verified).length,
      icon: <VerifiedIcon sx={{ fontSize: 30, color: '#10B981' }} />,
      color: '#F0FDF4',
      borderColor: '#10B981'
    },
    {
      title: 'Administrators',
      value: users.filter(u => u.is_superuser).length,
      icon: <AdminIcon sx={{ fontSize: 30, color: '#8B5CF6' }} />,
      color: '#FAF5FF',
      borderColor: '#8B5CF6'
    },
    {
      title: 'Available Roles',
      value: roles.length,
      icon: <PersonAddIcon sx={{ fontSize: 30, color: '#F59E0B' }} />,
      color: '#FFFBEB',
      borderColor: '#F59E0B'
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4, ml: 0 }}>
      <Fade in={true} timeout={800}>
        <Box>
          {/* Header Section */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            color: 'white',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Admin Dashboard
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Manage users, roles, and permissions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<LogoutIcon />}
              onClick={() => { setSwitch(false) }}
              sx={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.3)',
                }
              }}
            >
              Switch to KPIs Dashboard
            </Button>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statsCards.map((card, index) => (
              <Grid key={index}>
                <Card
                  sx={{
                    height: '100%',
                    background: card.color,
                    border: `2px solid ${card.borderColor}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color={card.borderColor}>
                          {card.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                          {card.title}
                        </Typography>
                      </Box>
                      {card.icon}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Search and Table Section */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #E5E7EB',
              overflow: 'hidden',
              background: 'white'
            }}
          >
            <Box sx={{ p: 3, background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="bold" color="#374151">
                  Users Management
                </Typography>
                <TextField
                  placeholder="Search users..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#9CA3AF' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: 300,
                    '& .MuiOutlinedInput-root': {
                      background: 'white',
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
            </Box>

            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', background: '#F3F4F6' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', background: '#F3F4F6' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', background: '#F3F4F6' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', background: '#F3F4F6' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', background: '#F3F4F6' }}>Permissions</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', background: '#F3F4F6' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        '&:hover': { background: '#F9FAFB' },
                        borderBottom: index === filteredUsers.length - 1 ? 'none' : '1px solid #E5E7EB'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              mr: 2,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              fontWeight: 'bold'
                            }}
                          >
                            {getInitials(user.email)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {user.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_verified ? 'Verified' : 'Unverified'}
                          sx={{
                            background: user.is_verified ? '#D1FAE5' : '#FEF3C7',
                            color: user.is_verified ? '#065F46' : '#92400E',
                            fontWeight: 'medium',
                            border: `1px solid ${getStatusColor(user.is_verified)}`
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_superuser ? 'Administrator' : 'Standard User'}
                          sx={{
                            background: user.is_superuser ? '#EDE9FE' : '#F3F4F6',
                            color: user.is_superuser ? '#5B21B6' : '#374151',
                            fontWeight: 'medium',
                            border: `1px solid ${getRoleColor(user.is_superuser)}`
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip
                            label={user.role.name}
                            size="small"
                            sx={{
                              mr: 1,
                              background: '#EBF8FF',
                              color: '#1E40AF',
                              border: '1px solid #3B82F6'
                            }}
                          />
                          <Tooltip title="Edit Role">
                            <IconButton
                              size="small"
                              onClick={() => setUsers(users => users.map(u => u.id === user.id ? { ...u, editingRole: true } : u))}
                              sx={{
                                color: '#6B7280',
                                '&:hover': { color: '#3B82F6', background: '#EBF8FF' }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {user.editingRole && (
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                              <Select
                                size="small"
                                value={user.role.id}
                                onChange={async (e) => {
                                  try {
                                    await authApi.assignRoleToUser(user.id, Number(e.target.value));
                                    toast.success('Role updated successfully');
                                    setUsers(users => users.map(u => u.id === user.id ? { ...u, editingRole: false } : u));
                                    fetchUsers();
                                  } catch (err) {
                                    toast.error('Failed to update role');
                                  }
                                }}
                                sx={{
                                  minWidth: 120,
                                  mr: 1,
                                  background: '#fff',
                                  borderRadius: 2,
                                  '& .MuiSelect-select': {
                                    py: 1
                                  }
                                }}
                              >
                                {roles.map((role) => (
                                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                                ))}
                              </Select>
                              <Button
                                size="small"
                                variant="contained"
                                sx={{
                                  ml: 1,
                                  minWidth: 0,
                                  px: 2,
                                  borderRadius: 2,
                                  background: '#10B981',
                                  '&:hover': { background: '#059669' }
                                }}
                                onClick={() => setUsers(users => users.map(u => u.id === user.id ? { ...u, editingRole: false } : u))}
                              >
                                Save
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {user.permissions.length === 0 ? (
                            <Chip label="No permissions" size="small" sx={{ background: '#F3F4F6', color: '#6B7280' }} />
                          ) : (
                            <>
                              {user.permissions.slice(0, 2).map((perm) => (
                                <Chip
                                  key={perm.id}
                                  label={perm.name}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5, background: '#F1F5F9', color: '#0F172A' }}
                                />
                              ))}
                              {user.permissions.length > 2 && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1, px: 1, minWidth: 0, fontSize: 12, borderRadius: 2 }}
                                  onClick={(e) => {
                                    setAnchorEl(e.currentTarget);
                                    setPopoverPerms(user.permissions);
                                  }}
                                >
                                  +{user.permissions.length - 2} more
                                </Button>
                              )}
                            </>
                          )}
                          {/* Edit Permissions Button as Icon */}
                          <Tooltip title="Edit Permissions">
                            <IconButton
                              size="small"
                              sx={{ ml: 1, color: '#3B82F6', background: '#EFF6FF', '&:hover': { background: '#DBEAFE' } }}
                              onClick={() => {
                                setPermDialogUser(user);
                                setSelectedPerms(user.permissions);
                                setPermDialogOpen(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        {/* Permission Dialog */}
                        <Dialog open={permDialogOpen && permDialogUser?.id === user.id} onClose={() => setPermDialogOpen(false)} maxWidth="xs" fullWidth>
                          <DialogTitle>Edit Permissions for {user.username}</DialogTitle>
                          <DialogContent>
                            <Autocomplete
                              multiple
                              options={allPermissions.filter(p => !user.permissions.some(up => up.id === p.id))}
                              getOptionLabel={(option) => option.name}
                              value={selectedPerms}
                              onChange={(_, value) => setSelectedPerms(value)}
                              renderInput={(params) => <TextField {...params} label="Permissions" placeholder="Select permissions" />}
                              sx={{ mt: 2 }}
                            />
                          </DialogContent>
                          <DialogActions>
                            <Button onClick={() => setPermDialogOpen(false)} color="secondary">Cancel</Button>
                            <Button
                              variant="contained"
                              onClick={async () => {
                                // Compute added and removed permissions
                                const oldIds = new Set(permDialogUser.permissions.map(p => p.id));
                                const newIds = new Set(selectedPerms.map(p => p.id));
                                const toAdd = [...newIds].filter(id => !oldIds.has(id));
                                const toRemove = [...oldIds].filter(id => !newIds.has(id));
                                try {
                                  for (const id of toAdd) {
                                    await authApi.addPermissionToUser(permDialogUser.id, id);
                                  }
                                  for (const id of toRemove) {
                                    await authApi.removePermissionFromUser(permDialogUser.id, id);
                                  }
                                  toast.success('Permissions updated');
                                  setPermDialogOpen(false);
                                  fetchUsers();
                                } catch (err) {
                                  toast.error('Failed to update permissions');
                                }
                              }}
                              color="primary"
                            >
                              Save
                            </Button>
                          </DialogActions>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={user.id === currentUser?.id ? "You can't delete yourself" : "Delete User"}>
                          <span>
                            <IconButton
                              onClick={() => handleDelete(user.id)}
                              size="small"
                              sx={{
                                color: '#DC2626',
                                '&:hover': {
                                  background: '#FEE2E2',
                                  color: '#B91C1C'
                                }
                              }}
                              disabled={user.id === currentUser?.id}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {filteredUsers.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No users found matching your search criteria
              </Typography>
            </Box>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminDashboard;