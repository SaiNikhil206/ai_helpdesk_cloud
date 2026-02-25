import apiClient from "./apiService";

export const sendMessage = async (message) => {
    try {
        const auth = JSON.parse(localStorage.getItem("pcte_user") || "{}");

        const response = await apiClient.post('/api/chat', {
            session_id: auth.session_id || "",
            message,
            user_role: auth.role || "",
            user_id: auth.username || "",
            context: {
                module: "",
                channel: "",
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};