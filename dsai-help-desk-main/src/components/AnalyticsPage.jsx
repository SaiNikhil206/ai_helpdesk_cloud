import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, Grid, LinearProgress, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, CircularProgress, Alert,
} from '@mui/material';
import QueryStatsIcon      from '@mui/icons-material/QueryStats';
import TrendingUpIcon      from '@mui/icons-material/TrendingUp';
import TrendingDownIcon    from '@mui/icons-material/TrendingDown';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import ScheduleIcon        from '@mui/icons-material/Schedule';
import TimerIcon           from '@mui/icons-material/Timer';
import PsychologyIcon      from '@mui/icons-material/Psychology';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import ArrowDownwardIcon   from '@mui/icons-material/ArrowDownward';
import SecurityIcon        from '@mui/icons-material/Security';
import ChatIcon            from '@mui/icons-material/Chat';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { fetchMetricsSummary, fetchMetricsTrends } from '../routes/metricsService';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ── Shared chart style defaults ─────────────────────────────────────────────
const tooltip = {
  backgroundColor: '#242424', titleColor: '#D4AF37',
  bodyColor: '#E0E0E0', borderColor: '#333333', borderWidth: 1, padding: 10,
};
const axisSx = {
  grid: { color: '#333333', drawBorder: false },
  ticks: { color: '#999999' },
};

// ── Small reusable components ───────────────────────────────────────────────
const ProgressRow = ({ label, value, pct, color }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" sx={{ color: '#E0E0E0' }}>{label}</Typography>
      <Typography variant="body2" sx={{ color, fontWeight: 'bold' }}>{value ?? '—'}</Typography>
    </Box>
    <LinearProgress variant="determinate" value={Math.min(pct || 0, 100)}
      sx={{ height: 6, backgroundColor: '#333333', '& .MuiLinearProgress-bar': { backgroundColor: color } }} />
  </Box>
);

const StatRow = ({ label, value, color = '#D4AF37' }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="body2" sx={{ color: '#E0E0E0' }}>{label}</Typography>
    <Typography variant="body2" sx={{ color, fontWeight: 'bold' }}>{value ?? '—'}</Typography>
  </Box>
);

const FooterMeta = () => (
  <Box sx={{ mt: 3, p: 2, backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #333333' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Chip label="Live" sx={{ backgroundColor: '#2196F3', color: '#1a1a1a', fontWeight: 'bold', height: '32px' }} />
      <Chip label={`Updated: ${new Date().toLocaleString()}`} sx={{ backgroundColor: '#333333', color: '#E0E0E0', height: '32px' }} />
    </Box>
  </Box>
);

const Loader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
    <CircularProgress sx={{ color: '#D4AF37' }} />
  </Box>
);

const Empty = ({ text = 'No data available.' }) => (
  <Typography sx={{ color: '#999', textAlign: 'center', py: 4 }}>{text}</Typography>
);

// ── Main component ──────────────────────────────────────────────────────────
const AnalyticsPage = () => {
  const [tab, setTab] = useState(0);
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

  // ── Derived values ──────────────────────────────────────────────────────
  const severityColors = { LOW: '#4A7C59', MEDIUM: '#FBC02D', HIGH: '#FF9500', CRITICAL: '#D32F2F' };
  const issueCategories   = trends?.top_categories       || [];
  const queryTopics       = trends?.query_topics         || [];
  const guardrailTrend    = trends?.guardrail_trend      || [];
  const dailyVolumes      = trends?.daily_volumes        || [];
  const conversationVols  = trends?.conversation_volumes || [];
  const topicSentiments   = trends?.topic_sentiments     || [];
  // Backend returns these in summary, not trends
  const deflectionRate    = summary?.deflectionRate;
  const escalationCount   = summary?.escalations;

  const fmtDate = (str) => { const d = new Date(str); return `${d.getMonth()+1}/${d.getDate()}`; };

  // ── Chart data ──────────────────────────────────────────────────────────
  const ticketVolumeData = useMemo(() => ({
    labels: dailyVolumes.map(d => fmtDate(d.date)),
    datasets: [{
      label: 'Ticket Volume',
      data: dailyVolumes.map(d => d.count),
      borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)',
      fill: true, tension: 0.4, pointRadius: 2,
    }],
  }), [dailyVolumes]);

  const conversationData = useMemo(() => ({
    labels: conversationVols.map(d => fmtDate(d.date)),
    datasets: [
      { label: 'Total',    data: conversationVols.map(d => d.total),    borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)', fill: true, tension: 0.4 },
      { label: 'Resolved', data: conversationVols.map(d => d.resolved), borderColor: '#4A7C59', backgroundColor: 'rgba(74,124,89,0.1)',  fill: true, tension: 0.4 },
      { label: 'Escalated',data: conversationVols.map(d => d.escalated),borderColor: '#FF9500', backgroundColor: 'rgba(255,149,0,0.1)',  fill: true, tension: 0.4 },
    ],
  }), [conversationVols]);

  const guardrailData = useMemo(() => ({
    labels: guardrailTrend.map(d => fmtDate(d.date)),
    datasets: [{
      label: 'Guardrail Hits',
      data: guardrailTrend.map(d => d.count),
      borderColor: '#D32F2F', backgroundColor: 'rgba(211,47,47,0.1)',
      fill: true, tension: 0.4,
    }],
  }), [guardrailTrend]);

  const categoriesBarData = useMemo(() => ({
    labels: issueCategories.map(c => c.category),
    datasets: [{
      label: 'Ticket Count',
      data: issueCategories.map(c => c.count),
      backgroundColor: issueCategories.map((_, i) =>
        i === 0 ? '#D4AF37' : i === 1 ? '#FF9500' : i === 2 ? '#4A7C59' : `rgba(212,175,55,${0.6 - i * 0.08})`
      ),
      borderColor: '#333333', borderWidth: 1,
    }],
  }), [issueCategories]);

  const severityBarData = useMemo(() => {
    const labels = summary ? Object.keys(summary.ticketsBySeverity) : [];
    return {
      labels,
      datasets: [{
        label: 'Tickets',
        data: summary ? Object.values(summary.ticketsBySeverity) : [],
        backgroundColor: labels.map(l => severityColors[l] || '#D4AF37'),
        borderColor: '#333333', borderWidth: 1,
      }],
    };
  }, [summary]);

  const sentimentBarData = useMemo(() => ({
    labels: topicSentiments.map(t => t.topic),
    datasets: [
      { label: 'Frustrated', data: topicSentiments.map(t => t.frustrated), backgroundColor: 'rgba(211,47,47,0.1)',  borderColor: '#D32F2F', borderWidth: 2 },
      { label: 'Neutral',    data: topicSentiments.map(t => t.neutral),    backgroundColor: 'rgba(255,149,0,0.1)',  borderColor: '#FF9500', borderWidth: 2 },
      { label: 'Satisfied',  data: topicSentiments.map(t => t.satisfied),  backgroundColor: 'rgba(74,124,89,0.1)', borderColor: '#4A7C59', borderWidth: 2 },
    ],
  }), [topicSentiments]);

  // ── Chart options ───────────────────────────────────────────────────────
  const lineOpts = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: true, labels: { color: '#999999', boxWidth: 12, usePointStyle: true } }, tooltip },
    scales: {
      x: { ...axisSx, title: { display: true, text: 'Date',   color: '#999999' } },
      y: { ...axisSx, title: { display: true, text: 'Count',  color: '#999999' } },
    },
    animation: { duration: 800 },
  }), []);

  const hBarOpts = useMemo(() => ({
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip },
    scales: {
      x: { ...axisSx, title: { display: true, text: 'Count',    color: '#999999' } },
      y: { ...axisSx, title: { display: true, text: 'Category', color: '#999999' } },
    },
  }), []);

  const sentimentOpts = useMemo(() => ({
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: '#999999', boxWidth: 12, usePointStyle: true } },
      tooltip,
    },
    scales: {
      x: { ...axisSx, stacked: true, title: { display: true, text: 'Count', color: '#999999' } },
      y: { ...axisSx, stacked: true, title: { display: true, text: 'Topic', color: '#999999' } },
    },
  }), []);

  const vBarOpts = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip },
    scales: {
      x: { ...axisSx, title: { display: true, text: 'Severity', color: '#999999' } },
      y: { ...axisSx, title: { display: true, text: 'Count',    color: '#999999' } },
    },
  }), []);

  const pieOpts = { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: '#999999', usePointStyle: true } } } };

  // ── Conversation volume pie for overview ────────────────────────────────
  const totalConv    = conversationVols.reduce((s, d) => s + (d.total    || 0), 0);
  const resolvedConv = conversationVols.reduce((s, d) => s + (d.resolved || 0), 0);
  const escalatedConv= conversationVols.reduce((s, d) => s + (d.escalated|| 0), 0);
  const convPieData  = {
    labels: ['Resolved', 'Escalated', 'Other'],
    datasets: [{
      data: [resolvedConv, escalatedConv, Math.max(0, totalConv - resolvedConv - escalatedConv)],
      backgroundColor: ['#4A7C59', '#FF9500', '#555555'],
      borderColor: '#333333', borderWidth: 2,
    }],
  };

  // ── KPI Card ────────────────────────────────────────────────────────────
  const KPICard = ({ label, value, unit = '', icon: Icon, color = '#D4AF37' }) => (
    <Paper sx={{ p: 2, backgroundColor: '#242424', border: '1px solid #333333', height: '100%',
      transition: 'all 0.2s', '&:hover': { borderColor: '#D4AF37', transform: 'translateY(-2px)' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {Icon && <Icon sx={{ fontSize: 24, color }} />}
      </Box>
      <Typography variant="h5" sx={{ color, fontWeight: 'bold', mb: 0.5 }}>
        {value != null ? `${Number(value).toLocaleString()}${unit}` : '—'}
      </Typography>
      <Typography variant="body2" sx={{ color: '#999999' }}>{label}</Typography>
    </Paper>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#1a1a1a', minHeight: '100vh', width: '100%' }}>

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <QueryStatsIcon sx={{ fontSize: 40, color: '#D4AF37' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#D4AF37' }}>
            Executive Analytics Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: '#E0E0E0', mt: 0.5 }}>
            Real-time insights across tickets, chatbot performance, issue categories, and user sentiment
          </Typography>
        </Box>
      </Box>

      {/* Global errors */}
      {errorSum   && <Alert severity="error" sx={{ mb: 2, backgroundColor: '#2a1a1a', color: '#ff6b6b' }}>{errorSum}</Alert>}
      {errorTrend && <Alert severity="error" sx={{ mb: 2, backgroundColor: '#2a1a1a', color: '#ff6b6b' }}>{errorTrend}</Alert>}

      {/* Tabs */}
      <Paper sx={{ backgroundColor: '#242424', border: '1px solid #333333' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
          variant="scrollable" scrollButtons allowScrollButtonsMobile
          sx={{ '& .MuiTabs-indicator': { backgroundColor: '#D4AF37' } }}>
          {['Overview', 'Chatbot Analytics', 'Issue Categories', 'User Context & Sentiment', 'Actionable AI Insights'].map((label, i) => (
            <Tab key={i} label={label} sx={{ color: '#E0E0E0', fontWeight: 'bold' }} />
          ))}
        </Tabs>
      </Paper>

      {/* ── TAB 0: Overview ─────────────────────────────────────────────── */}
      {tab === 0 && (
        <>
          <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold', mt: 3, mb: 2 }}>Overview</Typography>

          {/* Live KPIs */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333' }}>
            <Typography variant="h5" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Key Performance Indicators</Typography>
            {loadingSum ? <Loader /> : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4} lg={2}><KPICard label="Total Tickets"         value={summary?.totalTickets}        icon={CheckCircleIcon}    color="#D4AF37" /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}><KPICard label="Open Tickets"          value={summary?.openTickets}          icon={ScheduleIcon}       color="#FF9500" /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}><KPICard label="Resolved Tickets"      value={summary?.resolvedTickets}      icon={TimerIcon}          color="#4A7C59" /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}><KPICard label="Guardrail Activations" value={summary?.guardrailActivations} icon={SecurityIcon}       color="#2196F3" /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}><KPICard label="Escalations"           value={escalationCount}              icon={ArrowDownwardIcon}  color="#D32F2F" /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                  <KPICard
                    label="Deflection Rate" icon={SelfImprovementIcon} color="#4A7C59"
                    value={deflectionRate != null ? (deflectionRate * 100).toFixed(1) : null} unit="%"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                  <KPICard label="Total Conversations" value={summary?.totalConversations} icon={ChatIcon} color="#AB47BC" />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                  <KPICard
                    label="Avg Confidence" icon={PsychologyIcon} color="#26C6DA"
                    value={summary?.avgConfidence != null ? (summary.avgConfidence * 100).toFixed(1) : null} unit="%"
                  />
                </Grid>
              </Grid>
            )}
          </Paper>

          {/* Charts row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Ticket Volume */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '320px' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Ticket Volume (30d)</Typography>
                {loadingTrend ? <Loader /> : dailyVolumes.length === 0 ? <Empty /> : (
                  <Box sx={{ height: '240px' }}><Line data={ticketVolumeData} options={lineOpts} /></Box>
                )}
              </Paper>
            </Grid>

            {/* Severity breakdown */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '320px' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Tickets by Severity</Typography>
                {loadingSum ? <Loader /> : !summary?.ticketsBySeverity ? <Empty /> : (
                  <Box sx={{ height: '240px' }}><Bar data={severityBarData} options={vBarOpts} /></Box>
                )}
              </Paper>
            </Grid>

            {/* Conversation outcomes */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '320px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Conversation Outcomes</Typography>
                {loadingTrend ? <Loader /> : totalConv === 0 ? <Empty /> : (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Pie data={convPieData} options={pieOpts} />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Deflection vs Escalation */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Deflection vs Escalation</Typography>
            {loadingTrend ? <Loader /> : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ProgressRow label="Deflection Rate" color="#4A7C59"
                  value={deflectionRate != null ? `${(deflectionRate * 100).toFixed(1)}%` : '—'}
                  pct={deflectionRate ? deflectionRate * 100 : 0} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#E0E0E0' }}>Escalation Count</Typography>
                  <Typography variant="body2" sx={{ color: '#FF4444', fontWeight: 'bold' }}>{escalationCount ?? '—'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#E0E0E0' }}>Guardrail Activations</Typography>
                  <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 'bold' }}>{summary?.guardrailActivations ?? '—'}</Typography>
                </Box>
              </Box>
            )}
          </Paper>
          <FooterMeta />
        </>
      )}

      {/* ── TAB 1: Chatbot Analytics ─────────────────────────────────────── */}
      {tab === 1 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 3 }}>Chatbot Analytics</Typography>

          {/* Conversation volume trend */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '380px' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Conversation Volume Trend</Typography>
            {loadingTrend ? <Loader /> : conversationVols.length === 0 ? <Empty /> : (
              <Box sx={{ height: '290px' }}><Line data={conversationData} options={lineOpts} /></Box>
            )}
          </Paper>

          {/* Guardrail trend */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '320px' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Guardrail Activations Over Time</Typography>
            {loadingTrend ? <Loader /> : guardrailTrend.length === 0 ? <Empty /> : (
              <Box sx={{ height: '230px' }}><Line data={guardrailData} options={lineOpts} /></Box>
            )}
          </Paper>

          {/* Query topics table */}
          {!loadingTrend && queryTopics.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Frequent Query Topics</Typography>
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
                      <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#2a2a2a' }, borderBottom: '1px solid #333333' }}>
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

          {/* Resolution metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Deflection vs Escalation</Typography>
                {loadingTrend ? <Loader /> : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <ProgressRow label="Deflection Rate" color="#4A7C59"
                      value={deflectionRate != null ? `${(deflectionRate * 100).toFixed(1)}%` : '—'}
                      pct={deflectionRate ? deflectionRate * 100 : 0} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#E0E0E0' }}>Escalation Count</Typography>
                      <Typography variant="body2" sx={{ color: '#FF4444', fontWeight: 'bold' }}>{escalationCount ?? '—'}</Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Guardrail Summary</Typography>
                {loadingSum ? <Loader /> : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <StatRow label="Total Activations"   value={summary?.guardrailActivations} />
                    <StatRow label="Total Tickets"       value={summary?.totalTickets} />
                    <StatRow label="Open Tickets"        value={summary?.openTickets}   color="#FF9500" />
                    <StatRow label="Resolved Tickets"    value={summary?.resolvedTickets} color="#4A7C59" />
                    <StatRow label="Total Conversations" value={summary?.totalConversations} color="#AB47BC" />
                    <StatRow label="Avg Confidence"
                      value={summary?.avgConfidence != null ? `${(summary.avgConfidence * 100).toFixed(1)}%` : '—'}
                      color="#26C6DA" />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
          <FooterMeta />
        </Box>
      )}

      {/* ── TAB 2: Issue Categories ──────────────────────────────────────── */}
      {tab === 2 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 3 }}>Issue Categories & Trends</Typography>

          {loadingTrend ? <Loader /> : issueCategories.length === 0 ? (
            <Empty text="No issue category data available yet." />
          ) : (
            <>
              <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333', height: '400px' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Top Issue Categories</Typography>
                <Box sx={{ height: '310px' }}><Bar data={categoriesBarData} options={hBarOpts} /></Box>
              </Paper>

              {/* Heatmap */}
              <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Issue Category Heatmap</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {issueCategories.map((c, idx) => {
                    const max = Math.max(...issueCategories.map(x => x.count));
                    const intensity = Math.min(1, Math.max(0.2, c.count / max));
                    const dark = intensity > 0.6;
                    return (
                      <Box key={idx} sx={{ minWidth: '140px', px: 2, py: 1.5, borderRadius: '4px', border: '1px solid #333', backgroundColor: `rgba(212,175,55,${intensity})` }}>
                        <Typography variant="body2" sx={{ color: dark ? '#1a1a1a' : '#E0E0E0', fontWeight: 'bold' }}>{c.category}</Typography>
                        <Typography variant="caption" sx={{ color: dark ? '#1a1a1a' : '#E0E0E0' }}>{c.count}</Typography>
                      </Box>
                    );
                  })}
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#999' }}>Darker gold = higher volume.</Typography>
              </Paper>
            </>
          )}
          <FooterMeta />
        </Box>
      )}

      {/* ── TAB 3: User Context & Sentiment ─────────────────────────────── */}
      {tab === 3 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 3 }}>User Context & Sentiment</Typography>

          {/* Sentiment Associations */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Sentiment Associations with Topics</Typography>
            {loadingTrend ? <Loader /> : topicSentiments.length === 0 ? (
              <Empty text="No sentiment data available yet." />
            ) : (
              <Box sx={{ height: '400px' }}><Bar data={sentimentBarData} options={sentimentOpts} /></Box>
            )}
          </Paper>

          {/* Ticket status breakdown */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#242424', border: '1px solid #333333' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Ticket Status Breakdown</Typography>
            {loadingSum ? <Loader /> : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Open',     val: summary?.openTickets,     color: '#FF9500' },
                  { label: 'Resolved', val: summary?.resolvedTickets, color: '#4A7C59' },
                ].map(({ label, val, color }) => {
                  const total = summary?.totalTickets || 1;
                  const pct   = val ? Math.round((val / total) * 100) : 0;
                  return (
                    <ProgressRow key={label} label={label} value={`${val ?? 0} (${pct}%)`} pct={pct} color={color} />
                  );
                })}
              </Box>
            )}
          </Paper>
          <FooterMeta />
        </Box>
      )}

      {/* ── TAB 4: Actionable AI Insights ───────────────────────────────── */}
      {tab === 4 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 3 }}>Actionable AI Insights</Typography>

          {/* Guardrail alert */}
          {!loadingSum && summary?.guardrailActivations > 0 && (
            <Alert severity="warning" sx={{ mb: 3, backgroundColor: '#2A2417', border: '1px solid #FF9500', color: '#E0E0E0', '& .MuiAlert-icon': { color: '#FF9500' } }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                🛡️ Guardrail Alert: {summary.guardrailActivations} activation{summary.guardrailActivations > 1 ? 's' : ''} detected
              </Typography>
              <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 'bold', mt: 1 }}>
                Recommended Action: Review blocked queries and update KB articles to reduce recurring blocks.
              </Typography>
            </Alert>
          )}

          {/* Escalation alert */}
          {!loadingTrend && escalationCount > 0 && (
            <Alert severity="error" sx={{ mb: 3, backgroundColor: '#2a1a1a', border: '1px solid #D32F2F', color: '#E0E0E0', '& .MuiAlert-icon': { color: '#D32F2F' } }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                ⚠️ Escalation Risk: {escalationCount} ticket{escalationCount > 1 ? 's' : ''} escalated
              </Typography>
              <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 'bold', mt: 1 }}>
                Recommended Action: Assign senior support staff and review SLA thresholds.
              </Typography>
            </Alert>
          )}

          {/* Deflection insight */}
          {!loadingTrend && deflectionRate != null && (
            <Alert
              severity={deflectionRate >= 0.6 ? 'success' : 'warning'}
              sx={{ mb: 3, backgroundColor: deflectionRate >= 0.6 ? '#1F2A24' : '#2A2417', border: `1px solid ${deflectionRate >= 0.6 ? '#4A7C59' : '#FF9500'}`, color: '#E0E0E0' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {deflectionRate >= 0.6 ? '✅' : '📉'} Deflection Rate: {(deflectionRate * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#999999', mb: 1 }}>
                {deflectionRate >= 0.6
                  ? 'AI is successfully resolving the majority of queries without human intervention.'
                  : 'Deflection rate is below target. Consider expanding KB coverage.'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 'bold', mt: 1 }}>
                Recommended Action: {deflectionRate >= 0.6
                  ? 'Maintain KB quality and monitor for topic drift.'
                  : 'Add KB articles for top unresolved categories and retrain response templates.'}
              </Typography>
            </Alert>
          )}

          {/* Top issue spike alert */}
          {!loadingTrend && issueCategories.length > 0 && (
            <Alert severity="info" sx={{ mb: 3, backgroundColor: '#1E2A32', border: '1px solid #2196F3', color: '#E0E0E0', '& .MuiAlert-icon': { color: '#2196F3' } }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                📊 Top Issue: {issueCategories[0].category} — {issueCategories[0].count} tickets
              </Typography>
              <Typography variant="body2" sx={{ color: '#999999', mb: 1 }}>
                This category accounts for the highest ticket volume in the current period.
              </Typography>
              <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 'bold', mt: 1 }}>
                Recommended Action: Review and update KB articles for "{issueCategories[0].category}" and schedule proactive user communications.
              </Typography>
            </Alert>
          )}

          {loadingSum && loadingTrend && <Loader />}
          {!loadingSum && !loadingTrend && !summary?.guardrailActivations && !escalationCount && !deflectionRate && (
            <Empty text="No actionable insights available yet. Data will appear as tickets and sessions accumulate." />
          )}

          <FooterMeta />
        </Box>
      )}
    </Box>
  );
};

export default AnalyticsPage;