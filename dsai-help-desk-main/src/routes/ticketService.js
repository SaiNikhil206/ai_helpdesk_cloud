import apiClient from './apiService';

const getAuth = () => JSON.parse(localStorage.getItem("pcte_user") || "{}");

export const createSupportTicket = async (ticketData) => {
    try {
        const auth = getAuth();
        const response = await apiClient.post('/api/tickets', {
            ...ticketData,
            session_id: auth.session_id || "",
            user_role: auth.role || "",
        });
        return response.data;
    } catch (error) {
        console.error("Error creating support ticket:", error);
        throw error;
    }
};

export const fetchTickets = async () => {
    try {
        const response = await apiClient.get('/api/tickets');
        return response.data;
    } catch (error) {
        console.error("Error fetching tickets:", error);
        throw error;
    }
};

export const fetchTicketDetails = async (ticketId) => {
    try {
        const response = await apiClient.get(`/api/tickets/${ticketId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching ticket details:", error);
        throw error;
    }
};

// ✅ Send all three fields to match TicketUpdate schema on backend
export const updateTicket = async (ticketId, { status, tier, severity }) => {
    try {
        const payload = {};
        if (status)   payload.status   = status;
        if (tier)     payload.tier     = tier;
        if (severity) payload.severity = severity;

        const response = await apiClient.put(`/api/tickets/${ticketId}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating ticket:", error);
        throw error;
    }
};

export const deleteTicket = async (ticketId) => {
    try {
        const response = await apiClient.delete(`/api/tickets/${ticketId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting ticket:", error);
        throw error;
    }
};