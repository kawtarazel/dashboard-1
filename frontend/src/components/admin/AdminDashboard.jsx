import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Verified as VerifiedIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { 
  Search, 
  Users, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Edit2,
  Trash2,
  LogOut,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import api, { authApi } from '../../services/api';

const AdminDashboard = ({ setSwitch }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [editingRoleUserId, setEditingRoleUserId] = useState(null);
  const { user: currentUser, fetchUserRole } = useAuth();

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

  const handleRoleChange = async (userId, roleId) => {
    try {
      await authApi.assignRoleToUser(userId, Number(roleId));
      toast.success('Role updated successfully');
      setEditingRoleUserId(null);
      fetchUsers();
      if (userId === currentUser.id) {
        await fetchUserRole(currentUser.id);
      }
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handlePermissionUpdate = async () => {
    try {
      const oldIds = new Set(selectedUser.permissions.map(p => p.id));
      const newIds = new Set(selectedPermissions.map(p => p.id));
      const toAdd = [...newIds].filter(id => !oldIds.has(id));
      const toRemove = [...oldIds].filter(id => !newIds.has(id));
      
      for (const id of toAdd) {
        await authApi.addPermissionToUser(selectedUser.id, id);
      }
      for (const id of toRemove) {
        await authApi.removePermissionFromUser(selectedUser.id, id);
      }
      
      toast.success('Permissions updated successfully');
      setIsPermissionModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update permissions');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    authApi.getPermissions().then(setAllPermissions);
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-blue-100">Manage users, roles, and permissions</p>
            </div>
            <button
              onClick={() => setSwitch(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm border border-white/30 text-white transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Switch to KPIs Dashboard</span>
            </button>
          </div>
        </div>

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

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Users Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-red-500 rounded-full flex items-center justify-center text-white font-medium">
                          {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_verified 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {user.is_verified ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Unverified
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_superuser 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {user.is_superuser ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Administrator
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3 mr-1" />
                            Standard User
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {editingRoleUserId === user.id ? (
                          <>
                            <select
                              value={user.role.id}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingRoleUserId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              {user.role.name}
                            </span>
                            <button
                              onClick={() => setEditingRoleUserId(user.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.permissions.length === 0 ? (
                          <span className="text-sm text-gray-500">No permissions</span>
                        ) : (
                          <>
                            {user.permissions.slice(0, 2).map((perm) => (
                              <span key={perm.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                {perm.name}
                              </span>
                            ))}
                            {user.permissions.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{user.permissions.length - 2} more
                              </span>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setSelectedPermissions(user.permissions);
                            setIsPermissionModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentUser?.id}
                        className={`p-2 rounded-lg transition-colors ${
                          user.id === currentUser?.id
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={user.id === currentUser?.id ? "You can't delete yourself" : "Delete User"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found matching your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Permission Modal */}
      {isPermissionModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Permissions for {selectedUser.username}
                </h3>
                <button
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {allPermissions.map((permission) => {
                  const isSelected = selectedPermissions.some(p => p.id === permission.id);
                  return (
                    <label
                      key={permission.id}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p.id !== permission.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{permission.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsPermissionModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePermissionUpdate}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;