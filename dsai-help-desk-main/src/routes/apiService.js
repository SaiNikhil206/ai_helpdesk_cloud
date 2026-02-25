import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ Attach access_token from logged-in user on every request
apiClient.interceptors.request.use(
    (config) => {
        const stored = localStorage.getItem("pcte_user");
        if (stored) {
            const user = JSON.parse(stored);
            if (user?.access_token) {
                config.headers.Authorization = `Bearer ${user.access_token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;