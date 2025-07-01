import React, { useEffect, useState } from 'react';
import api from '../../services/api';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import RolePermissionManager from './RolePermissionManager';

interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
//   roles: { id: number; name: string }[];
//   permissions: { id: number; name: string }[];
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
        const res = await api.get('/api/admin/users');
        setUsers(res.data);
        console.log('response:', res.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success('User deleted');
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);
  
  if (loading) {
    return <Typography variant="h6">Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Verified</TableCell>
                  <TableCell>Superuser</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.is_verified ? (
                        <Chip label="Yes" color="success" size="small" />
                      ) : (
                        <Chip label="No" color="warning" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_superuser ? (
                        <Chip label="Admin" color="primary" size="small" />
                      ) : (
                        <Chip label="User" color="default" size="small" />
                      )}
                    </TableCell>
                    {/* <TableCell>
                      {user.roles.map((role) => (
                        <Chip key={role.id} label={role.name} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell> */}
                    <TableCell>
                      {/* <RolePermissionManager
                        userId={user.id}
                        userRoles={user.roles}
                        userPermissions={user.permissions}
                        onChange={fetchUsers}
                      /> */}
                      <Tooltip title="Delete User">
                        <IconButton onClick={() => handleDelete(user.id)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
