import apiClient from './apiService';

export const fetchMetricsSummary = async () => {
    try {
        const response = await apiClient.get('/api/metrics/summary');
        const data = response.data;
        return {
            ...data,
            resolvedTickets: data.closedTickets,
        };
    } catch (error) {
        console.error("Error fetching metrics summary:", error);
        throw error;
    }
};

export const fetchMetricsTrends = async () => {
    try {
        const response = await apiClient.get('/api/metrics/trends');
        const data = response.data;

        // ── Flatten issueCategories [{date, categories:{k:v}}]
        // → top_categories [{category, count}] aggregated across all dates
        const categoryTotals = {};
        (data.issueCategories || []).forEach(({ categories }) => {
            Object.entries(categories || {}).forEach(([cat, count]) => {
                categoryTotals[cat] = (categoryTotals[cat] || 0) + count;
            });
        });
        const top_categories = Object.entries(categoryTotals)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        // ── Also derive query_topics from the same data (with simple trend flag)
        const query_topics = top_categories.map((item, idx, arr) => ({
            ...item,
            trend: idx < arr.length / 2 ? 'up' : 'flat',
        }));

        const sessionsMap = {};
        (data.conversationVolumes?.sessions || []).forEach(({ date, count }) => {
            sessionsMap[date] = { total: count };
        });
        const conversation_volumes = Object.entries(sessionsMap).map(([date, vals]) => ({
            date,
            total:     vals.total    || 0,
            resolved:  0,   
            escalated: 0,   
        }));

        return {
            daily_volumes:        data.tickets      || [],
            guardrail_trend:      data.guardrails   || [],
            escalation_trend:     data.escalations  || [],
            top_categories,
            query_topics,
            conversation_volumes,
            topic_sentiments:     [],   // not yet in backend
        };
    } catch (error) {
        console.error("Error fetching metrics trends:", error);
        throw error;
    }
};