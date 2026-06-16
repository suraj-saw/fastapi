import axios, {
    type InternalAxiosRequestConfig,
    type AxiosResponse,
    type AxiosError
} from "axios";

// FIXED: Changed port from 8000 to 8080 because the API is exposed via Nginx on 8080
const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8080/api" : "/api");

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = sessionStorage.getItem("access_token");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
    failedQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve(token!);
    });
    failedQueue = [];
}

API.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/auth/refresh") &&
            !originalRequest.url?.includes("/auth/login")
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return API(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = sessionStorage.getItem("refresh_token");

            if (!refreshToken) {
                sessionStorage.clear();
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                sessionStorage.setItem("access_token", data.access_token);
                sessionStorage.setItem("refresh_token", data.refresh_token);

                processQueue(null, data.access_token);
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return API(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                sessionStorage.clear();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default API;
