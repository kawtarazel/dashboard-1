import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            try {
                const response = await axios.post(`${API_URL}/api/auth/refresh`, null, {
                    headers: { Authorization: `Bearer ${refreshToken}` },
                });

                const { access_token, refresh_token } = response.data;
                localStorage.setItem('accessToken', access_token);
                localStorage.setItem('refreshToken', refresh_token);

                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/token', {
            email,
            password,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('Login successful, storing tokens...');
        return response.data;
    },

    signup: async (email, username, password) => {
        const response = await api.post('/api/auth/signup', {
            email,
            username,
            password,
        });
        return response.data;
    },

    refreshToken: async (refreshToken) => {
        const response = await api.post('/api/auth/refresh', null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
        });
        return response.data;
    },

    getRoles: async () => {
        const response = await api.get('/api/roles');
        console.log('Roles fetched:', response);
        return response.data;
    },
    getPermissions: async () => {
        const response = await api.get('/api/permissions');
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/api/auth/me');
        return response.data;
    },

    // Role management
    assignRoleToUser: async (userId, roleId) => {
        const response = await api.post(`/api/admin/users/${userId}/role/${roleId}`);
        return response.data;
    },

    // Permission management
    assignPermissionsToRole: async (roleId, permissionIds) => {
        const response = await api.post(`/api/role/${roleId}/permissions`, {
            permission_ids: permissionIds
        });
        return response.data;
    },

    removePermissionsFromRole: async (roleId, permissionIds) => {
        const response = await api.delete(`/api/role/${roleId}/permissions`, {
            data: { permission_ids: permissionIds }
        });
        return response.data;
    },

    // Get user's role and permissions
    getUserRole: async (userId) => {
        const response = await api.get(`/api/users/${userId}/role`);
        return response.data;
    },

    getRolePermissions: async (roleId) => {
        const response = await api.get(`/api/role/${roleId}/permissions`);
        return response.data;
    },

    // Permission management for users
    addPermissionToUser: async (userId, permissionId) => {
        const response = await api.post(`/api/admin/users/${userId}/permissions/${permissionId}`);
        return response.data;
    },
    removePermissionFromUser: async (userId, permissionId) => {
        const response = await api.delete(`/api/admin/users/${userId}/permissions/${permissionId}`);
        return response.data;
    },
};

export default api;
