import React, { useEffect, useState } from 'react';
import { authApi } from '../../services/api';
import { Box, Chip, Button, MenuItem, Select, Typography } from '@mui/material';
import { toast } from 'react-toastify';

const RolePermissionManager = ({ userId, userPermissions, onChange }) => {
  const [permissions, setPermissions] = useState([]);
  const [selectedPermission, setSelectedPermission] = useState('');

  useEffect(() => {
    authApi.getPermissions().then(data => setPermissions(data));
  }, []);

  const handleAddPermission = async () => {
    if (!selectedPermission) return;
    await authApi.addPermissionToUser(userId, Number(selectedPermission));
    toast.success('Permission added');
    setSelectedPermission('');
    onChange();
  };
  const handleRemovePermission = async (permId) => {
    await authApi.removePermissionFromUser(userId, permId);
    toast.success('Permission removed');
    onChange();
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mt: 2 }}>Permissions:</Typography>
      {userPermissions.map(perm => (
        <Chip key={perm.id} label={perm.name} onDelete={() => handleRemovePermission(perm.id)} sx={{ mr: 0.5, mb: 0.5 }} />
      ))}
      <Select
        size="small"
        value={selectedPermission}
        onChange={e => setSelectedPermission(e.target.value)}
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
