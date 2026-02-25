import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Select, MenuItem, FormControl,
  InputLabel, Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Divider, IconButton,
} from '@mui/material';
import JiraIcon from '@mui/icons-material/IntegrationInstructions';
import TagIcon from '@mui/icons-material/Label';
import SentimentIcon from '@mui/icons-material/EmojiEmotions';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { fetchTickets, updateTicket, deleteTicket } from '../routes/ticketService';
import { useAuth } from '../context/AuthContext';

const TicketDashboard = () => {
  const { user } = useAuth();
  const [filterTier, setFilterTier] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editTier, setEditTier] = useState('');
  const [editSeverity, setEditSeverity] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  // ── Role-based permissions ──────────────────────────────────────────────────
  const canUpdate = ['Help Desk Analyst', 'Administrator', 'Training Manager'].includes(user?.role);
  const canDelete = user?.role === 'Administrator';
  // Operator cannot change tier
  const canChangeTier = user?.role !== 'Cyber Operator';

  // ── Open modal ──────────────────────────────────────────────────────────────
  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.rawStatus);
    setEditTier(ticket.rawTier);
    setEditSeverity(ticket.rawSeverity);
    setUpdateError(null);
    setConfirmDelete(false);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTicket(null);
    setConfirmDelete(false);
    setUpdateError(null);
  };

  // ── Update ──────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    try {
      setUpdating(true);
      setUpdateError(null);
      await updateTicket(selectedTicket.id, {
        status: editStatus,
        tier: editTier,
        severity: editSeverity,
      });
      await loadTickets();
      handleCloseModal();
    } catch (err) {
      setUpdateError(err.response?.data?.detail || 'Update failed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setUpdateError(null);
      await deleteTicket(selectedTicket.id);
      await loadTickets();
      handleCloseModal();
    } catch (err) {
      setUpdateError(err.response?.data?.detail || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // ── Normalisers ─────────────────────────────────────────────────────────────
  const normaliseStatus  = (s) => ({ OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Resolved' }[s?.toUpperCase()] || s || 'Open');
  const normalisePriority = (s) => ({ LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' }[s?.toUpperCase()] || s || 'Medium');
  const normaliseTier    = (s) => ({ TIER_0: 'Tier 0', TIER_1: 'Tier 1', TIER_2: 'Tier 2' }[s?.toUpperCase()] || s || 'Tier 0');

  const mapTicket = (ticket) => ({
    id: ticket.id,
    title: ticket.ai_results?.subject || ticket.ai_results?.title || 'Support Request',
    status: normaliseStatus(ticket.status),
    rawStatus: ticket.status || 'OPEN',
    priority: normalisePriority(ticket.severity),
    rawSeverity: ticket.severity || 'MEDIUM',
    tier: normaliseTier(ticket.tier),
    rawTier: ticket.tier || 'TIER_0',
    tags: ticket.ai_results?.tags ? ticket.ai_results.tags.map((t) => typeof t === 'string' ? { label: t, confidence: 90 } : t) : [],
    sentiment: ticket.ai_results?.sentiment || 'Neutral',
    kbMatch: ticket.ai_results?.kb_match || '—',
    slaRisk: ['HIGH', 'CRITICAL'].includes(ticket.severity?.toUpperCase()),
    createdAt: ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '—',
    userRole: ticket.user_role,
    sessionId: ticket.session_id,
  });

  const displayTickets = tickets.map(mapTicket);
  const filteredTickets = displayTickets.filter((t) => {
    if (filterTier !== 'All' && t.tier !== filterTier) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    return true;
  });

  // Stats
  const totalTickets = tickets.length;
  const atRiskCount  = tickets.filter((t) => ['HIGH', 'CRITICAL'].includes(t.severity?.toUpperCase())).length;
  const tier0Count   = tickets.filter((t) => t.tier?.toUpperCase() === 'TIER_0').length;
  const tier1Count   = tickets.filter((t) => t.tier?.toUpperCase() === 'TIER_1').length;
  const tier2Count   = tickets.filter((t) => t.tier?.toUpperCase() === 'TIER_2').length;
  const tier0Pct = totalTickets ? Math.round((tier0Count / totalTickets) * 100) : 0;
  const tier1Pct = totalTickets ? Math.round((tier1Count / totalTickets) * 100) : 0;
  const tier2Pct = totalTickets ? Math.round((tier2Count / totalTickets) * 100) : 0;

  const getPriorityColor = (p) => ({ Critical: '#D32F2F', High: '#FF9500', Medium: '#FBC02D', Low: '#4A7C59' }[p] || '#999');
  const getSentimentColor = (s) => ({ Frustrated: '#D32F2F', Neutral: '#FF9500', Satisfied: '#4A7C59' }[s] || '#999');
  const getStatusColor = (s) => ({ Open: '#FF9500', 'In Progress': '#2196F3', Resolved: '#4A7C59' }[s] || '#999');

  const selectSx = { backgroundColor: '#1a1a1a', color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' }, '& .MuiSvgIcon-root': { color: '#fff' } };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: '#1a1a1a', minHeight: '100vh', width: '100%' }}>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ConfirmationNumberIcon sx={{ fontSize: 40, color: '#D4AF37' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#D4AF37' }}>
              Help Desk Ticket Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: '#E0E0E0', mt: 0.5 }}>
              AI-enriched ticket management with auto-tagging, sentiment analysis, and KB recommendations
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, backgroundColor: '#2a1a1a', color: '#ff6b6b' }}>{error}</Alert>}

      {/* Stats */}
      <Paper sx={{ p: 3, mb: 4, backgroundColor: '#242424', border: '1px solid #333333' }}>
        <Typography variant="h3" sx={{ mb: 3, color: '#D4AF37', fontWeight: 'bold' }}>Overall Tickets Statistics</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, backgroundColor: '#1a1a1a', borderLeft: '4px solid #D4AF37' }}>
              <Typography variant="caption" sx={{ color: '#999999' }}>Total Tickets</Typography>
              <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>{loading ? '—' : totalTickets}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, backgroundColor: '#1a1a1a', borderLeft: '4px solid #4A7C59' }}>
              <Typography variant="caption" sx={{ color: '#999999' }}>Tier 0 Tickets</Typography>
              <Typography variant="h5" sx={{ color: '#4A7C59', fontWeight: 'bold' }}>{loading ? '—' : tier0Count}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Tooltip title="Tickets with HIGH or CRITICAL severity" arrow>
              <Paper sx={{ p: 2, backgroundColor: '#1a1a1a', borderLeft: '4px solid #FF9500', cursor: 'help' }}>
                <Typography variant="caption" sx={{ color: '#999999', display: 'block', mb: 0.5 }}>Tickets at Risk</Typography>
                <Typography variant="h5" sx={{ color: '#FF9500', fontWeight: 'bold' }}>{loading ? '—' : atRiskCount}</Typography>
              </Paper>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, backgroundColor: '#1a1a1a', borderLeft: '4px solid #2196F3' }}>
              <Typography variant="caption" sx={{ color: '#999999', mb: 1.5, display: 'block' }}>Tickets by Tier</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip label={`Tier 0: ${tier0Pct}%`} size="small" sx={{ backgroundColor: '#4A7C59', color: '#fff', fontSize: '0.7rem', height: '20px', fontWeight: 'bold' }} />
                <Chip label={`Tier 1: ${tier1Pct}%`} size="small" sx={{ backgroundColor: '#2196F3', color: '#fff', fontSize: '0.7rem', height: '20px', fontWeight: 'bold' }} />
                <Chip label={`Tier 2: ${tier2Pct}%`} size="small" sx={{ backgroundColor: '#D4AF37', color: '#1a1a1a', fontSize: '0.7rem', height: '20px', fontWeight: 'bold' }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, backgroundColor: '#242424', mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: '#D4AF37', fontWeight: 'bold' }}>Filters</Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Tier', value: filterTier, set: setFilterTier, options: ['All Tiers', 'Tier 0', 'Tier 1', 'Tier 2'] },
            { label: 'Status', value: filterStatus, set: setFilterStatus, options: ['All Statuses', 'Open', 'In Progress', 'Resolved'] },
            { label: 'Priority', value: filterPriority, set: setFilterPriority, options: ['All Priorities', 'Critical', 'High', 'Medium', 'Low'] },
          ].map(({ label, value, set, options }) => (
            <Grid item xs={12} sm={6} md={3} key={label}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#999999' }}>{label}</InputLabel>
                <Select value={value} onChange={(e) => set(e.target.value)} label={label} sx={selectSx}>
                  {options.map((o) => <MenuItem key={o} value={o.startsWith('All') ? 'All' : o}>{o}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Loading */}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#D4AF37' }} /></Box>}

      {/* Table */}
      {!loading && (
        <TableContainer component={Paper} sx={{ backgroundColor: '#242424' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1a1a1a' }}>
                {['Ticket ID', 'Title', 'Priority', 'Status', 'Tier', 'AI Tags', 'Sentiment', 'KB Match', 'SLA'].map((h) => (
                  <TableCell key={h} sx={{ color: '#D4AF37', fontWeight: 'bold' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', color: '#999999', py: 4 }}>No tickets found.</TableCell>
                </TableRow>
              ) : filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} sx={{ backgroundColor: '#242424', '&:hover': { backgroundColor: '#2a2a2a' }, borderBottom: '1px solid #333333' }}>
                  <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <JiraIcon sx={{ fontSize: '16px', color: '#0052CC' }} />
                      {/* ✅ Click ticket ID to open modal */}
                      <Tooltip title="Click to view / update ticket" arrow>
                        <Box component="span" onClick={() => handleOpenTicket(ticket)}
                          sx={{ cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: '#FFD700' } }}>
                          {ticket.id.substring(0, 8).toUpperCase()}
                        </Box>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#ffffff', maxWidth: '200px' }}>
                    <Typography variant="body2">{ticket.title}</Typography>
                    <Typography variant="caption" sx={{ color: '#999999' }}>{ticket.createdAt}</Typography>
                  </TableCell>
                  <TableCell><Chip label={ticket.priority} size="small" sx={{ backgroundColor: getPriorityColor(ticket.priority), color: '#fff', fontWeight: 'bold' }} /></TableCell>
                  <TableCell><Chip label={ticket.status} size="small" sx={{ backgroundColor: getStatusColor(ticket.status), color: '#fff', fontWeight: 'bold' }} /></TableCell>
                  <TableCell><Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>{ticket.tier}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {ticket.tags.length > 0
                        ? ticket.tags.map((tag, idx) => <Chip key={idx} icon={<TagIcon />} label={`${tag.label} (${tag.confidence}%)`} size="small" sx={{ backgroundColor: '#333333', color: '#D4AF37', fontSize: '11px' }} />)
                        : <Typography variant="caption" sx={{ color: '#999999' }}>—</Typography>}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SentimentIcon sx={{ fontSize: '16px', color: getSentimentColor(ticket.sentiment) }} />
                      <Typography variant="caption" sx={{ color: '#ffffff' }}>{ticket.sentiment}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="caption" sx={{ color: '#4A7C59' }}>{ticket.kbMatch}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ticket.slaRisk ? '#FF9500' : '#4A7C59' }} />
                      <Typography variant="caption" sx={{ color: ticket.slaRisk ? '#FF9500' : '#4A7C59' }}>{ticket.slaRisk ? 'At Risk' : 'OK'}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Footer */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#242424', borderRadius: '8px', border: '1px solid #333333' }}>
        <Typography variant="caption" sx={{ color: '#999999' }}>
          <strong>AI-Enriched Data:</strong> Tags, sentiment, and KB recommendations are generated by the AI system. Click any Ticket ID to view details, update status, or delete.
        </Typography>
      </Box>

      {/* ── Ticket Detail Modal ─────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#242424', border: '1px solid #D4AF37', borderRadius: '12px' } }}>
        <DialogTitle sx={{ color: '#D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <JiraIcon sx={{ color: '#0052CC' }} />
            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
              Ticket: {selectedTicket?.id.substring(0, 8).toUpperCase()}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseModal} sx={{ color: '#999', '&:hover': { color: '#D4AF37' } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider sx={{ borderColor: '#333' }} />

        <DialogContent sx={{ pt: 2 }}>
          {selectedTicket && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Read-only info */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#999' }}>Title</Typography>
                  <Typography variant="body2" sx={{ color: '#E0E0E0' }}>{selectedTicket.title}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#999' }}>Created At</Typography>
                  <Typography variant="body2" sx={{ color: '#E0E0E0' }}>{selectedTicket.createdAt}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#999' }}>KB Match</Typography>
                  <Typography variant="body2" sx={{ color: '#4A7C59' }}>{selectedTicket.kbMatch}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#999' }}>User Role</Typography>
                  <Typography variant="body2" sx={{ color: '#E0E0E0' }}>{selectedTicket.userRole || '—'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ borderColor: '#333' }} />

              {/* Editable fields */}
              {canUpdate ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#D4AF37', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EditIcon sx={{ fontSize: 16 }} /> Update Ticket
                  </Typography>

                  {/* Status */}
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#999' }}>Status</InputLabel>
                    <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} label="Status" sx={selectSx}>
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="RESOLVED">Resolved</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Tier — hidden for Cyber Operator */}
                  {canChangeTier && (
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: '#999' }}>Tier</InputLabel>
                      <Select value={editTier} onChange={(e) => setEditTier(e.target.value)} label="Tier" sx={selectSx}>
                        <MenuItem value="TIER_0">Tier 0</MenuItem>
                        <MenuItem value="TIER_1">Tier 1</MenuItem>
                        <MenuItem value="TIER_2">Tier 2</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {/* Severity */}
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#999' }}>Severity</InputLabel>
                    <Select value={editSeverity} onChange={(e) => setEditSeverity(e.target.value)} label="Severity" sx={selectSx}>
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="CRITICAL">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              ) : (
                // Read-only view for roles that can't update
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: '#999' }}>Status</Typography>
                    <Box><Chip label={selectedTicket.status} size="small" sx={{ backgroundColor: getStatusColor(selectedTicket.status), color: '#fff' }} /></Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: '#999' }}>Tier</Typography>
                    <Typography variant="body2" sx={{ color: '#D4AF37' }}>{selectedTicket.tier}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: '#999' }}>Priority</Typography>
                    <Box><Chip label={selectedTicket.priority} size="small" sx={{ backgroundColor: getPriorityColor(selectedTicket.priority), color: '#fff' }} /></Box>
                  </Grid>
                </Grid>
              )}

              {/* Error */}
              {updateError && <Alert severity="error" sx={{ backgroundColor: '#2a1a1a', color: '#ff6b6b' }}>{updateError}</Alert>}

              {/* Confirm delete prompt */}
              {confirmDelete && (
                <Alert severity="warning" sx={{ backgroundColor: '#2a1500', color: '#FF9500', border: '1px solid #FF9500' }}>
                  Are you sure you want to permanently delete this ticket? This cannot be undone.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <Divider sx={{ borderColor: '#333' }} />

        <DialogActions sx={{ p: 2, gap: 1 }}>
          {/* Delete — admin only */}
          {canDelete && !confirmDelete && (
            <Button startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}
              sx={{ color: '#D32F2F', borderColor: '#D32F2F', mr: 'auto' }} variant="outlined">
              Delete
            </Button>
          )}
          {canDelete && confirmDelete && (
            <>
              <Button onClick={() => setConfirmDelete(false)} sx={{ color: '#999' }}>Cancel</Button>
              <Button onClick={handleDelete} disabled={deleting} variant="contained"
                sx={{ backgroundColor: '#D32F2F', '&:hover': { backgroundColor: '#b71c1c' }, mr: 'auto' }}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </>
          )}

          <Button onClick={handleCloseModal} sx={{ color: '#999' }}>Close</Button>

          {/* Save — roles that can update */}
          {canUpdate && (
            <Button startIcon={<SaveIcon />} onClick={handleUpdate} disabled={updating} variant="contained"
              sx={{ backgroundColor: '#D4AF37', color: '#1a1a1a', fontWeight: 700, '&:hover': { backgroundColor: '#E8C547' } }}>
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketDashboard;