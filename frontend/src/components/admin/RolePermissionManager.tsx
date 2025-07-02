import React, { useEffect, useState } from 'react';
import { authApi } from '../../services/api';
import { Box, Chip, Button, MenuItem, Select, Typography } from '@mui/material';
import { toast } from 'react-toastify';

interface Role {
  id: number;
  name: string;
}
interface Permission {
  id: number;
  name: string;
}

interface Props {
  userId: number;
  userRoles: Role[];
  userPermissions: Permission[];
  onChange: () => void;
}

const RolePermissionManager: React.FC<Props> = ({ userId, userRoles, userPermissions, onChange }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');

  useEffect(() => {
    authApi.getRoles().then(data => setRoles(data));
    authApi.getPermissions().then(data => setPermissions(data));
  }, []);

  const handleAddRole = async () => {
    if (!selectedRole) return;
    await authApi.assignRolesToUser(userId, [Number(selectedRole)]);
    toast.success('Role added');
    setSelectedRole('');
    onChange();
  };
  const handleRemoveRole = async (roleId: number) => {
    await authApi.removeRolesFromUser(userId, [roleId]);
    toast.success('Role removed');
    onChange();
  };
  const handleAddPermission = async () => {
    if (!selectedPermission || !selectedRole) return;
    await authApi.assignPermissionsToRole(Number(selectedRole), [Number(selectedPermission)]);
    toast.success('Permission added');
    setSelectedPermission('');
    onChange();
  };
  const handleRemovePermission = async (permId: number) => {
    if (!selectedRole) return;
    await authApi.removePermissionsFromRole(Number(selectedRole), [permId]);
    toast.success('Permission removed');
    onChange();
  };

  return (
    <Box>
      <Typography variant="subtitle2">Roles:</Typography>
      {userRoles.map(role => (
        <Chip key={role.id} label={role.name} onDelete={() => handleRemoveRole(role.id)} sx={{ mr: 0.5, mb: 0.5 }} />
      ))}
      <Select
        size="small"
        value={selectedRole}
        onChange={e => setSelectedRole(e.target.value as string)}
        displayEmpty
        sx={{ minWidth: 120, mr: 1 }}
      >
        <MenuItem value="" disabled>Add Role</MenuItem>
        {roles.filter(r => !userRoles.some(ur => ur.id === r.id)).map(role => (
          <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
        ))}
      </Select>
      <Button size="small" variant="outlined" onClick={handleAddRole} disabled={!selectedRole}>Add</Button>
      <Typography variant="subtitle2" sx={{ mt: 2 }}>Permissions:</Typography>
      {userPermissions.map(perm => (
        <Chip key={perm.id} label={perm.name} onDelete={() => handleRemovePermission(perm.id)} sx={{ mr: 0.5, mb: 0.5 }} />
      ))}
      <Select
        size="small"
        value={selectedPermission}
        onChange={e => setSelectedPermission(e.target.value as string)}
        displayEmpty
        sx={{ minWidth: 120, mr: 1 }}
      >
        <MenuItem value="" disabled>Add Permission</MenuItem>
        {permissions.filter(p => !userPermissions.some(up => up.id === p.id)).map(perm => (
          <MenuItem key={perm.id} value={perm.id}>{perm.name}</MenuItem>
        ))}
      </Select>
      <Button size="small" variant="outlined" onClick={handleAddPermission} disabled={!selectedPermission}>Add</Button>
    </Box>
  );
};

export default RolePermissionManager;
