import axios, {
    type InternalAxiosRequestConfig,
    type AxiosResponse,
    type AxiosError
} from "axios";

// FIXED: Changed port from 8000 to 8080 because the API is exposed via Nginx on 8080
const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8080/api" : "/api");

const API = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown) {
    failedQueue.forEach(p => {
        if (error) p.reject(error);
        else p.resolve("");
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
                }).then(() => {
                    return API(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });

                processQueue(null);
                return API(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default API;
