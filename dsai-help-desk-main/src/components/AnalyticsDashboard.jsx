import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Alert, Chip, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
} from '@mui/material';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import TrendingUpIcon     from '@mui/icons-material/TrendingUp';
import TrendingDownIcon   from '@mui/icons-material/TrendingDown';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import ScheduleIcon       from '@mui/icons-material/Schedule';
import TimerIcon          from '@mui/icons-material/Timer';
import PsychologyIcon     from '@mui/icons-material/Psychology';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import ArrowDownwardIcon  from '@mui/icons-material/ArrowDownward';
import AnalyticsIcon      from '@mui/icons-material/Analytics';
import SecurityIcon       from '@mui/icons-material/Security';
import ChatIcon           from '@mui/icons-material/Chat';
import { fetchMetricsSummary, fetchMetricsTrends } from '../routes/metricsService';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const tooltipDefaults = {
  backgroundColor: '#242424', titleColor: '#D4AF37',
  bodyColor: '#E0E0E0', borderColor: '#333333', borderWidth: 1, padding: 12,
};
const axisDefaults = {
  grid: { color: '#333333', drawBorder: false },
  ticks: { color: '#999999', font: { size: 11 } },
};
const lineChartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: true, labels: { color: '#999999', boxWidth: 12, usePointStyle: true } },
    tooltip: { ...tooltipDefaults, displayColors: false },
  },
  scales: {
    x: { ...axisDefaults, title: { display: true, text: 'Date',    color: '#999', font: { size: 12 } } },
    y: { ...axisDefaults, title: { display: true, text: 'Count',   color: '#999', font: { size: 12 } } },
  },
  animation: { duration: 1000, easing: 'easeInOutQuart' },
};

const AnalyticsDashboard = () => {
  const [summary, setSummary]         = useState(null);
  const [trends, setTrends]           = useState(null);
  const [loadingSum, setLoadingSum]   = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [errorSum, setErrorSum]       = useState(null);
  const [errorTrend, setErrorTrend]   = useState(null);

  useEffect(() => {
    fetchMetricsSummary()
      .then(setSummary)
      .catch(() => setErrorSum('Failed to load summary metrics.'))
      .finally(() => setLoadingSum(false));

    fetchMetricsTrends()
      .then(setTrends)
      .catch(() => setErrorTrend('Failed to load trend data.'))
      .finally(() => setLoadingTrend(false));
  }, []);

  // ── KPI Card ────────────────────────────────────────────────────────────────
  const KPICard = ({ label, value, unit = '', icon: Icon, color = '#D4AF37' }) => (
    <Card sx={{
      height: '100%', backgroundColor: '#242424', border: '1px solid #333333',
      transition: 'all 0.2s ease',
      '&:hover': { boxShadow: 4, borderColor: '#D4AF37', transform: 'translateY(-2px)' },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {Icon && <Icon sx={{ fontSize: '28px', color }} />}
        </Box>
        <Typography variant="h4" sx={{ color, fontWeight: 'bold', mb: 0.5 }}>
          {value !== undefined && value !== null ? `${Number(value).toLocaleString()}${unit}` : '—'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#999999' }}>{label}</Typography>
      </CardContent>
    </Card>
  );

  // ── Severity bar chart ───────────────────────────────────────────────────────
  const severityColors  = { LOW: '#4A7C59', MEDIUM: '#FBC02D', HIGH: '#FF9500', CRITICAL: '#D32F2F' };
  const severityLabels  = summary ? Object.keys(summary.ticketsBySeverity) : [];
  const severityValues  = summary ? Object.values(summary.ticketsBySeverity) : [];
  const severityBarData = {
    labels: severityLabels,
    datasets: [{
      label: 'Tickets',
      data: severityValues,
      backgroundColor: severityLabels.map(l => severityColors[l] || '#D4AF37'),
      borderColor: '#333333', borderWidth: 1,
    }],
  };
  const severityBarOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { ...tooltipDefaults } },
    scales: {
      x: { ...axisDefaults, title: { display: true, text: 'Severity', color: '#999', font: { size: 12 } } },
      y: { ...axisDefaults, title: { display: true, text: 'Count',    color: '#999', font: { size: 12 } } },
    },
  };

  // ── Ticket volume trend line chart ──────────────────────────────────────────
  const trendLabels = (trends?.daily_volumes || []).map(d => {
    const dt = new Date(d.date); return `${dt.getMonth() + 1}/${dt.getDate()}`;
  });
  const lineChartData = {
    labels: trendLabels,
    datasets: [{
      label: 'Ticket Volume',
      data: (trends?.daily_volumes || []).map(d => d.count),
      borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)',
      fill: true, tension: 0.4,
      pointRadius: 3, pointHoverRadius: 5,
      pointBackgroundColor: '#D4AF37', pointBorderColor: '#1a1a1a', pointBorderWidth: 2,
    }],
  };

  // ── Guardrail trend line chart ──────────────────────────────────────────────
  const guardrailChartData = {
    labels: (trends?.guardrail_trend || []).map(d => {
      const dt = new Date(d.date); return `${dt.getMonth() + 1}/${dt.getDate()}`;
    }),
    datasets: [{
      label: 'Guardrail Hits',
      data: (trends?.guardrail_trend || []).map(d => d.count),
      borderColor: '#D32F2F', backgroundColor: 'rgba(211, 47, 47, 0.1)',
      fill: true, tension: 0.4,
    }],
  };

  // ── Conversation volume trend ───────────────────────────────────────────────
  const conversationChartData = {
    labels: (trends?.conversation_volumes || []).map(d => {
      const dt = new Date(d.date); return `${dt.getMonth() + 1}/${dt.getDate()}`;
    }),
    datasets: [
      {
        label: 'Total Conversations',
        data: (trends?.conversation_volumes || []).map(d => d.total),
        borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)', fill: true, tension: 0.4,
      },
      {
        label: 'Resolved',
        data: (trends?.conversation_volumes || []).map(d => d.resolved),
        borderColor: '#4A7C59', backgroundColor: 'rgba(74,124,89,0.1)', fill: true, tension: 0.4,
      },
      {
        label: 'Escalated',
        data: (trends?.conversation_volumes || []).map(d => d.escalated),
        borderColor: '#FF9500', backgroundColor: 'rgba(255,149,0,0.1)', fill: true, tension: 0.4,
      },
    ],
  };

  // ── Top issue categories bar chart ──────────────────────────────────────────
  const issueCategories = trends?.top_categories || [];
  const categoriesBarData = {
    labels: issueCategories.map(c => c.category),
    datasets: [{
      label: 'Ticket Count',
      data: issueCategories.map(c => c.count),
      backgroundColor: issueCategories.map((_, i) =>
        i === 0 ? '#D4AF37' : i === 1 ? '#FF9500' : i === 2 ? '#4A7C59' : `rgba(212,175,55,${0.6 - i * 0.08})`
      ),
      borderColor: '#333333', borderWidth: 1,
    }],
  };
  const categoriesBarOptions = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { ...tooltipDefaults } },
    scales: {
      x: { ...axisDefaults, title: { display: true, text: 'Count',    color: '#999', font: { size: 12 } } },
      y: { ...axisDefaults, title: { display: true, text: 'Category', color: '#999', font: { size: 12 } } },
    },
    animation: { duration: 1000, easing: 'easeInOutQuart' },
  };

  // ── Query topics from trends ────────────────────────────────────────────────
  const queryTopics = trends?.query_topics || [];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#1a1a1a', minHeight: '100vh', width: '100%' }}>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AnalyticsIcon sx={{ fontSize: 40, color: '#D4AF37' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#D4AF37' }}>
              Executive Analytics Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: '#E0E0E0', mt: 0.5 }}>
              Real-time insights, trend analysis, and predictive forecasting for Help Desk operations
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', ml: 10 }}>
          <Chip label="Live" sx={{ backgroundColor: '#2196F3', color: '#1a1a1a', fontWeight: 'bold', height: '32px' }} />
          <Chip label={`Updated: ${new Date().toLocaleString()}`} sx={{ backgroundColor: '#333333', color: '#E0E0E0', height: '32px' }} />
        </Box>
      </Box>

      {/* Errors */}
      {errorSum   && <Alert severity="error" sx={{ mb: 2, backgroundColor: '#2a1a1a', color: '#ff6b6b' }}>{errorSum}</Alert>}
      {errorTrend && <Alert severity="error" sx={{ mb: 2, backgroundColor: '#2a1a1a', color: '#ff6b6b' }}>{errorTrend}</Alert>}

      {/* ── Live KPIs ────────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#242424', border: '1px solid #333333' }}>
        <Typography variant="h3" sx={{ mb: 3, color: '#D4AF37', fontWeight: 'bold' }}>
          Key Performance Indicators
        </Typography>
        {loadingSum ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#D4AF37' }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={2}>
              <KPICard label="Total Tickets"         value={summary?.totalTickets}         icon={CheckCircleIcon}    color="#D4AF37" />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KPICard label="Open Tickets"          value={summary?.openTickets}           icon={ScheduleIcon}       color="#FF9500" />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KPICard label="Resolved Tickets"      value={summary?.resolvedTickets}       icon={TimerIcon}          color="#4A7C59" />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KPICard label="Guardrail Activations" value={summary?.guardrailActivations}  icon={SecurityIcon}       color="#2196F3" />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KPICard label="Escalations"           value={summary?.escalations}           icon={ArrowDownwardIcon}  color="#D32F2F" />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KPICard
                label="Deflection Rate"
                value={summary?.deflectionRate != null ? (summary?.deflectionRate * 100).toFixed(1) : null}
                unit="%"
                icon={SelfImprovementIcon}
                color="#4A7C59"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KPICard label="Total Conversations"   value={summary?.totalConversations}    icon={ChatIcon}           color="#AB47BC" />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <KPICard
                label="Avg Confidence"
                value={summary?.avgConfidence != null ? (summary?.avgConfidence * 100).toFixed(1) : null}
                unit="%"
                icon={PsychologyIcon}
                color="#26C6DA"
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* ── Tickets by Severity ───────────────────────────────────────────────── */}
      {!loadingSum && severityLabels.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, backgroundColor: '#242424', border: '1px solid #333333', height: '300px' }}>
          <Typography variant="h3" sx={{ mb: 3, color: '#D4AF37', fontWeight: 'bold' }}>
            Tickets by Severity
          </Typography>
          <Box sx={{ height: '200px' }}>
            <Bar data={severityBarData} options={severityBarOptions} />
          </Box>
        </Paper>
      )}

      {/* ── Charts Row ───────────────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>

        {/* Ticket Volume Trend */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '380px' }}>
            <Typography variant="h3" sx={{ mb: 3, color: '#D4AF37', fontWeight: 'bold' }}>
              Ticket Volume Trend
            </Typography>
            {loadingTrend ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                <CircularProgress sx={{ color: '#D4AF37' }} />
              </Box>
            ) : trendLabels.length === 0 ? (
              <Typography sx={{ color: '#999', textAlign: 'center', pt: 6 }}>No trend data available.</Typography>
            ) : (
              <Box sx={{ height: '280px' }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Guardrail Activations Over Time */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '380px' }}>
            <Typography variant="h3" sx={{ mb: 3, color: '#D4AF37', fontWeight: 'bold' }}>
              Guardrail Activations Over Time
            </Typography>
            {loadingTrend ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                <CircularProgress sx={{ color: '#D4AF37' }} />
              </Box>
            ) : (trends?.guardrail_trend || []).length === 0 ? (
              <Typography sx={{ color: '#999', textAlign: 'center', pt: 6 }}>No guardrail data available.</Typography>
            ) : (
              <Box sx={{ height: '280px' }}>
                <Line data={guardrailChartData} options={lineChartOptions} />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Conversation Volumes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '380px' }}>
            <Typography variant="h3" sx={{ mb: 3, color: '#D4AF37', fontWeight: 'bold' }}>
              Conversation Volumes
            </Typography>
            {loadingTrend ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                <CircularProgress sx={{ color: '#D4AF37' }} />
              </Box>
            ) : (trends?.conversation_volumes || []).length === 0 ? (
              <Typography sx={{ color: '#999', textAlign: 'center', pt: 6 }}>No conversation data available.</Typography>
            ) : (
              <Box sx={{ height: '280px' }}>
                <Line data={conversationChartData} options={lineChartOptions} />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Top Issue Categories ──────────────────────────────────────────────── */}
      {!loadingTrend && issueCategories.length > 0 && (
        <>
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '400px' }}>
            <Typography variant="h3" sx={{ mb: 3, color: '#D4AF37', fontWeight: 'bold' }}>
              Top Issue Categories
            </Typography>
            <Box sx={{ height: '300px' }}>
              <Bar data={categoriesBarData} options={categoriesBarOptions} />
            </Box>
          </Paper>

          {/* Heatmap */}
          <Paper sx={{ p: 3, mb: 4, backgroundColor: '#242424', border: '1px solid #333333' }}>
            <Typography variant="h3" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>
              Issue Categories Heatmap
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {issueCategories.map((c, idx) => {
                const max = Math.max(...issueCategories.map(x => x.count));
                const intensity = Math.min(1, Math.max(0.2, c.count / max));
                return (
                  <Box key={idx} sx={{ minWidth: '140px', px: 2, py: 1.5, backgroundColor: `rgba(212, 175, 55, ${intensity})`, border: '1px solid #333333', borderRadius: '4px' }}>
                    <Typography variant="body2" sx={{ color: intensity > 0.6 ? '#1a1a1a' : '#E0E0E0', fontWeight: 'bold' }}>{c.category}</Typography>
                    <Typography variant="caption" sx={{ color: intensity > 0.6 ? '#1a1a1a' : '#E0E0E0' }}>{c.count}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </>
      )}

      {/* ── Resolution Metrics ─────────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '100%' }}>
            <Typography variant="h3" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>
              Deflection vs Escalation
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#E0E0E0' }}>Deflection Rate</Typography>
                  <Typography variant="body2" sx={{ color: '#4A7C59', fontWeight: 'bold' }}>
                    {loadingTrend ? '—' : summary?.deflectionRate != null ? `${(summary?.deflectionRate * 100).toFixed(1)}%` : '—'}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate"
                  value={loadingTrend ? 0 : summary?.deflectionRate ? summary?.deflectionRate * 100 : 0}
                  sx={{ height: '10px', borderRadius: '4px', backgroundColor: '#333333', '& .MuiLinearProgress-bar': { backgroundColor: '#4A7C59' } }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#E0E0E0' }}>Escalation Count</Typography>
                  <Typography variant="body2" sx={{ color: '#FF4444', fontWeight: 'bold' }}>
                    {loadingTrend ? '—' : summary?.escalations ?? '—'}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#E0E0E0' }}>Guardrail Activations</Typography>
                  <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                    {loadingSum ? '—' : summary?.guardrailActivations ?? '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '100%' }}>
            <Typography variant="h3" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>
              Ticket Status Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Open',     value: summary?.openTickets,     color: '#FF9500' },
                { label: 'Resolved', value: summary?.resolvedTickets, color: '#4A7C59' },
              ].map(({ label, value, color }) => {
                const total = summary?.totalTickets || 1;
                const pct   = value ? Math.round((value / total) * 100) : 0;
                return (
                  <Box key={label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#E0E0E0' }}>{label}</Typography>
                      <Typography variant="body2" sx={{ color, fontWeight: 'bold' }}>
                        {loadingSum ? '—' : `${value ?? 0} (${pct}%)`}
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: '10px', borderRadius: '4px', backgroundColor: '#333333', '& .MuiLinearProgress-bar': { backgroundColor: color } }} />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Query Topics Table (from trends.query_topics) ──────────────────────── */}
      {!loadingTrend && queryTopics.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, backgroundColor: '#242424', border: '1px solid #333333' }}>
          <Typography variant="h3" sx={{ mb: 3, color: '#D4AF37', fontWeight: 'bold' }}>
            Most Common Issue Categories
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1a1a1a' }}>
                  {['Category', 'Count', 'Trend'].map(h => (
                    <TableCell key={h} sx={{ color: '#D4AF37', fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {queryTopics.map((topic, idx) => (
                  <TableRow key={idx} sx={{ backgroundColor: '#242424', '&:hover': { backgroundColor: '#2a2a2a' }, borderBottom: '1px solid #333333' }}>
                    <TableCell sx={{ color: '#E0E0E0', fontWeight: 'bold' }}>{topic.category}</TableCell>
                    <TableCell sx={{ color: '#E0E0E0' }}>{topic.count}</TableCell>
                    <TableCell>
                      {topic.trend === 'up'
                        ? <TrendingUpIcon sx={{ color: '#FF9500' }} />
                        : topic.trend === 'down'
                        ? <TrendingDownIcon sx={{ color: '#4A7C59' }} />
                        : <Box sx={{ width: 20, height: 2, backgroundColor: '#999' }} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Footer */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #333333' }}>
        <Typography variant="caption" sx={{ color: '#999999' }}>
          <strong>Real-time Metrics:</strong> All data fetched live from{' '}
          <code>/api/metrics/summary</code> and <code>/api/metrics/trends</code>.
        </Typography>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;