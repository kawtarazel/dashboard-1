import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
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
    login: async (email: string, password: string) => {
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

    signup: async (email: string, username: string, password: string) => {
        const response = await api.post('/api/auth/signup', {
            email,
            username,
            password,
        });
        return response.data;
    },

    refreshToken: async (refreshToken: string) => {
        const response = await api.post('/api/auth/refresh', null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
        });
        return response.data;
    },

    getRoles: async () => {
        const response = await api.get('/api/roles');
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
};

export default api;
