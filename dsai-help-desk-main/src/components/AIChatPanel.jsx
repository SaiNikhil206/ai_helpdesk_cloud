// AIChatPanel - Main chat interface component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Alert,
  Collapse,
  Paper,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChatIcon from '@mui/icons-material/Chat';
import { styled } from '@mui/material/styles';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { sendMessage } from '../routes/chatService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pcte_chat_messages';
const CONTEXT_KEY = 'pcte_chat_context';

const loadMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    // Rehydrate Date objects
    return JSON.parse(raw).map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
};

const saveMessages = (msgs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {}
};

const loadContext = () => {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveContext = (ctx) => {
  try {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
  } catch {}
};

// ─── Styled components ───────────────────────────────────────────────────────

const ChatPanel = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 24,
  right: 24,
  width: '420px',
  height: 'calc(100vh - 112px)',
  maxHeight: '700px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#1a1a1a',
  color: '#E0E0E0',
  borderRadius: '16px',
  border: `2px solid ${alpha('#D4AF37', 0.3)}`,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(212, 175, 55, 0.2)',
  zIndex: 1000,
  background: `linear-gradient(180deg, ${alpha('#1a1a1a', 1)} 0%, ${alpha('#121212', 1)} 100%)`,
  overflow: 'hidden',
  [theme.breakpoints.down('lg')]: { width: '380px' },
  [theme.breakpoints.down('md')]: {
    width: 'calc(100vw - 48px)',
    right: 24,
    left: 24,
    height: 'calc(100vh - 112px)',
    maxHeight: '85vh',
  },
}));

const ChatHeader = styled(Box)(() => ({
  padding: '20px 24px',
  borderBottom: `2px solid ${alpha('#D4AF37', 0.2)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: `linear-gradient(135deg, ${alpha('#D4AF37', 0.15)} 0%, ${alpha('#0052CC', 0.1)} 100%)`,
  borderRadius: '16px 16px 0 0',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, transparent, ${alpha('#D4AF37', 0.6)}, transparent)`,
  },
}));

const MessagesContainer = styled(Box)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  background: `linear-gradient(180deg, ${alpha('#1a1a1a', 1)} 0%, ${alpha('#121212', 1)} 100%)`,
  '&::-webkit-scrollbar': { width: '10px' },
  '&::-webkit-scrollbar-track': { backgroundColor: '#121212', borderRadius: '5px' },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha('#D4AF37', 0.3),
    borderRadius: '5px',
    border: '2px solid #121212',
    '&:hover': { backgroundColor: alpha('#D4AF37', 0.5) },
  },
}));

const TypingIndicator = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 16px',
  color: '#999999',
  backgroundColor: alpha('#333333', 0.3),
  borderRadius: '12px',
  border: `1px solid ${alpha('#D4AF37', 0.2)}`,
  marginBottom: '12px',
  width: 'fit-content',
}));

// ─── Component ───────────────────────────────────────────────────────────────

const AIChatPanel = ({ isOpen, onClose, onTicketCreated, initialMessage = null }) => {
  // ✅ Initialise from localStorage so messages survive refresh / tab switch
  const [messages, setMessages] = useState(() => loadMessages());
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('Understanding request...');
  // ✅ Persist conversation context too
  const [conversationContext, setConversationContext] = useState(() => loadContext());
  const [escalationStatus, setEscalationStatus] = useState(null);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const initialMessageSentRef = useRef(false);
  const lastInitialMessageRef = useRef(null);

  const typingMessages = [
    'Understanding request...',
    'Analyzing...',
    'Processing...',
    'Generating response...',
  ];

  // ✅ Persist messages to localStorage whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // ✅ Persist context to localStorage whenever it changes
  useEffect(() => {
    saveContext(conversationContext);
  }, [conversationContext]);

  // Rotate typing indicator text
  useEffect(() => {
    if (isTyping && !escalationStatus) {
      let idx = 0;
      setTypingMessage(typingMessages[0]);
      typingIntervalRef.current = setInterval(() => {
        idx = (idx + 1) % typingMessages.length;
        setTypingMessage(typingMessages[idx]);
      }, 1500);
      return () => clearInterval(typingIntervalRef.current);
    } else {
      clearInterval(typingIntervalRef.current);
    }
  }, [isTyping, escalationStatus]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Welcome message — only if history is empty
  useEffect(() => {
    if (isOpen && !collapsed && messages.length === 0) {
      const welcome = {
        id: Date.now(),
        type: 'ai',
        content: "Hello! I'm your AI assistant for PCTE Help Desk. How can I help you today?",
        timestamp: new Date(),
        sentiment: { sentiment: 'neutral', score: 0 },
        confidence: 0.95,
      };
      setMessages([welcome]);
    }
  }, [isOpen, collapsed, messages.length]);

  // ─── Send message ──────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(async (userMessage) => {
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const updatedHistory = [...messages, userMsg];

    // Waiting for ticket details flow
    if (conversationContext.waitingForTicketDetails) {
      setIsTyping(true);

      const analyzingMsg = { id: Date.now() + 0.1, type: 'ai', content: '🔍 Analyzing request...', timestamp: new Date(), isAnalyzing: true };
      setMessages((prev) => [...prev, analyzingMsg]);
      await new Promise((r) => setTimeout(r, 800));
      setMessages((prev) => prev.filter((m) => !m.isAnalyzing));

      const processingMsg = {
        id: Date.now() + 0.2,
        type: 'ai',
        content: '🤖 **AI Agent Processing Ticket Creation...**\n\n📋 Analyzing details...\n🔍 Classifying priority...\n📝 Generating ticket...',
        timestamp: new Date(),
        isProcessing: true,
      };
      setMessages((prev) => [...prev, processingMsg]);
      await new Promise((r) => setTimeout(r, 3000));
      setMessages((prev) => prev.map((m) => m.id === processingMsg.id ? { ...m, isProcessing: false } : m));

      const ticketId = `INC-${Date.now().toString().slice(-5)}`;
      const ticketData = { id: ticketId, priority: 'Medium', status: 'Open', description: userMessage, subject: `Lab Crash - ${userMessage.substring(0, 50)}...` };

      const ticketMsg = {
        id: Date.now() + 1,
        type: 'ai',
        content: `✅ **Support ticket ${ticketId} has been created successfully!**\n\n**Ticket Details:**\n- **ID:** ${ticketId}\n- **Priority:** ${ticketData.priority}\n- **Status:** ${ticketData.status}\n- **Description:** ${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}\n\nOur support team will review your ticket and get back to you within 2 hours.`,
        timestamp: new Date(),
        sentiment: { sentiment: 'neutral', score: 0 },
        confidence: 0.95,
        ticketId,
        isTyping: true,
      };
      setMessages((prev) => [...prev, ticketMsg]);
      if (onTicketCreated) onTicketCreated(ticketData);

      await new Promise((r) => setTimeout(r, Math.min(ticketMsg.content.length * 20, 2000)));
      setMessages((prev) => prev.map((m) => m.id === ticketMsg.id ? { ...m, isTyping: false } : m));
      setIsTyping(false);

      setConversationContext((prev) => ({ ...prev, waitingForTicketDetails: false, ticketCreated: true, lastTicketId: ticketId }));
      return;
    }

    // Escalation flow after ticket created
    if (conversationContext.ticketCreated) {
      const lower = userMessage.toLowerCase();
      const escalationKeywords = ['urgent', 'now', 'asap', 'immediately', 'need help now', 'emergency'];
      if (escalationKeywords.some((k) => lower.includes(k))) {
        setIsTyping(true);

        const analyzingMsg = { id: Date.now() + 0.1, type: 'ai', content: '🔍 Analyzing escalation request...', timestamp: new Date(), isAnalyzing: true };
        setMessages((prev) => [...prev, analyzingMsg]);
        await new Promise((r) => setTimeout(r, 800));
        setMessages((prev) => prev.filter((m) => !m.isAnalyzing));

        const aiEscMsg = { id: Date.now() + 0.2, type: 'ai', content: 'I understand this is urgent. Let me connect you with a live human agent immediately.', timestamp: new Date(), isTyping: true };
        setMessages((prev) => [...prev, aiEscMsg]);
        await new Promise((r) => setTimeout(r, 1000));
        setMessages((prev) => prev.map((m) => m.id === aiEscMsg.id ? { ...m, isTyping: false } : m));

        setEscalationStatus({ message: '🔍 Finding available agent...', status: 'searching' });
        await new Promise((r) => setTimeout(r, 1500));
        setEscalationStatus({ message: '📞 Connecting to live agent...', status: 'connecting' });
        await new Promise((r) => setTimeout(r, 1500));
        setEscalationStatus({ message: 'Agent will message you when online', status: 'pending' });

        setTimeout(() => {
          const agentMsg = {
            id: Date.now() + 2,
            type: 'agent',
            content: `Hi! I'm Sarah from Tier 2 Support. I can see you have ticket ${conversationContext.lastTicketId || 'INC-XXXX'} and need urgent assistance. I'm here to help you right away. Can you tell me more about what's happening?`,
            timestamp: new Date(),
            agentName: 'Sarah',
            agentTier: 'Tier 2',
          };
          setIsTyping(false);
          setMessages((prev) => [...prev, agentMsg]);
          setEscalationStatus({ message: 'Live agent active - Sarah (Tier 2)', status: 'active' });
          setIsAgentActive(true);
        }, 3000);
        return;
      }
    }

    // Normal AI response
    setIsTyping(true);
    const analyzingMsg = { id: Date.now() + 0.1, type: 'ai', content: '🔍 Analyzing request...', timestamp: new Date(), isAnalyzing: true };
    setMessages((prev) => [...prev, analyzingMsg]);
    await new Promise((r) => setTimeout(r, 800));
    setMessages((prev) => prev.filter((m) => !m.isAnalyzing));

    let aiResponse;
    try {
      const backendResponse = await sendMessage(userMessage);
      console.log('Backend Response:', backendResponse);
      aiResponse = {
        message: backendResponse.answer,
        confidence: backendResponse.confidence ?? 0.95,
        tier: backendResponse.tier,
        severity: backendResponse.severity,
        needEscalation: backendResponse.needEscalation,
        ticketId: backendResponse.ticketId,
        guardrail: backendResponse.guardrail ?? { blocked: false, reason: null },
        sentiment: { sentiment: 'neutral', score: 0 },
        options: null,
        type: backendResponse.needEscalation ? 'escalation' : 'answer',
        source: backendResponse.kb_references?.[0]?.title ?? null,
      };
    } catch (error) {
      console.error('Chat API Error:', error);
      aiResponse = {
        message: "⚠️ I'm having trouble connecting right now. Please try again shortly.",
        confidence: 0,
        sentiment: { sentiment: 'negative', score: 0.5 },
        type: 'error',
        guardrail: { blocked: false },
      };
    }

    // Escalation from backend
    if (aiResponse.type === 'escalation') {
      setEscalationStatus({ message: 'Connecting to live agent...', status: 'escalating' });
      setTimeout(() => {
        setEscalationStatus({ message: 'Agent connected: Sarah from Tier 1 Support', status: 'connected' });
        const escalationTicket = { id: `INC-${Date.now().toString().slice(-5)}`, priority: 'High', status: 'Open', escalated: true };
        setTimeout(() => {
          if (onTicketCreated) onTicketCreated(escalationTicket);
          const agentMsg = {
            id: Date.now() + 2,
            type: 'agent',
            content: `Hi! I'm Sarah from Tier 2 Support. I've created ticket ${escalationTicket.id} and I'm here to help you right away. Can you tell me more about what's happening?`,
            timestamp: new Date(),
            agentName: 'Sarah',
            agentTier: 'Tier 2',
          };
          setIsTyping(false);
          setMessages((prev) => [...prev, agentMsg]);
          setEscalationStatus({ message: `Live agent active - Ticket ${escalationTicket.id} created`, status: 'active' });
        }, 2000);
      }, 1500);
      setIsTyping(false);
      return;
    }

    // Ticket details request from backend
    if (aiResponse.type === 'ticket_details_request') {
      setConversationContext((prev) => ({
        ...prev,
        waitingForTicketDetails: true,
        activeScriptId: aiResponse.context?.activeScriptId,
        currentStepIndex: aiResponse.context?.currentStepIndex,
        unresolvedAttempts: aiResponse.context?.unresolvedAttempts || 0,
      }));
    }

    // Update context from backend
    if (aiResponse.context) {
      setConversationContext((prev) => ({
        ...prev,
        activeScriptId: aiResponse.context.activeScriptId ?? prev.activeScriptId,
        currentStepIndex: aiResponse.context.currentStepIndex ?? prev.currentStepIndex,
        unresolvedAttempts: aiResponse.context.unresolvedAttempts ?? prev.unresolvedAttempts ?? 0,
        lastTicketId: aiResponse.context.lastTicketId || prev.lastTicketId,
      }));
    } else if (aiResponse.type === 'answer' && !aiResponse.options) {
      setConversationContext((prev) => ({ ...prev, activeScriptId: null, currentStepIndex: null }));
    }

    const aiMsg = {
      id: Date.now() + 1,
      type: 'ai',
      content: aiResponse.message,
      timestamp: new Date(),
      confidence: aiResponse.confidence,
      tier: aiResponse.tier,
      severity: aiResponse.severity,
      guardrail: aiResponse.guardrail,
      ticketId: aiResponse.ticketId,
      isTyping: true,
    };
    setIsTyping(false);
    setMessages((prev) => [...prev, aiMsg]);
    await new Promise((r) => setTimeout(r, Math.min(aiResponse.message.length * 20, 2000)));
    setMessages((prev) => prev.map((m) => m.id === aiMsg.id ? { ...m, isTyping: false } : m));
  }, [messages, conversationContext, onTicketCreated]);

  // ─── Initial message handling ──────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && initialMessage && initialMessage !== lastInitialMessageRef.current) {
      initialMessageSentRef.current = false;
      lastInitialMessageRef.current = initialMessage;
      if (collapsed) setCollapsed(false);
    } else if (!initialMessage) {
      initialMessageSentRef.current = false;
      lastInitialMessageRef.current = null;
    }
  }, [initialMessage, isOpen, collapsed]);

  useEffect(() => {
    if (isOpen && !collapsed && initialMessage && !initialMessageSentRef.current) {
      if (messages.length === 0) return;
      const timer = setTimeout(() => {
        if (!initialMessageSentRef.current) {
          initialMessageSentRef.current = true;
          handleSendMessage(initialMessage);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, collapsed, initialMessage, messages.length, handleSendMessage]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleClose = () => {
    // ✅ Clear persisted chat on explicit close (X button)
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONTEXT_KEY);
    setMessages([]);
    setConversationContext({});
    setEscalationStatus(null);
    setIsAgentActive(false);
    setIsTyping(false);
    setCollapsed(true);
    initialMessageSentRef.current = false;
    lastInitialMessageRef.current = null;
    if (onClose) onClose();
  };

  const handleToggleCollapse = () => {
    setIsTyping(false);
    if (!collapsed) setEscalationStatus(null);
    setCollapsed((prev) => !prev);
  };

  const handleOptionClick = (option) => handleSendMessage(option);

  if (!isOpen) return null;

  // Collapsed state — floating button
  if (collapsed) {
    return (
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <IconButton
          onClick={handleToggleCollapse}
          sx={{
            width: 'auto', height: 56, minWidth: 180, px: 2,
            backgroundColor: '#D4AF37', color: '#1a1a1a', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)',
            '&:hover': { backgroundColor: '#E8C547', boxShadow: '0 6px 16px rgba(212, 175, 55, 0.5)', transform: 'scale(1.05)' },
            transition: 'all 0.3s ease',
          }}
        >
          <ChatIcon sx={{ fontSize: '24px', mr: 1 }} />
          <Typography sx={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'none' }}>
            Chat with ACE
          </Typography>
        </IconButton>
      </Box>
    );
  }

  // ─── Full panel ────────────────────────────────────────────────────────────

  return (
    <ChatPanel elevation={8}>
      <ChatHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px',
            background: `linear-gradient(135deg, ${alpha('#D4AF37', 0.3)} 0%, ${alpha('#0052CC', 0.2)} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${alpha('#D4AF37', 0.4)}`,
            boxShadow: `0 4px 12px ${alpha('#D4AF37', 0.2)}`,
          }}>
            <SmartToyIcon sx={{ color: '#D4AF37', fontSize: '24px' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '18px', lineHeight: 1.2 }}>
              ACE - AI Assistant
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#E0E0E0', 0.7), fontSize: '11px' }}>
              Always here to help
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: '#999999', '&:hover': { backgroundColor: alpha('#D4AF37', 0.1), color: '#D4AF37' }, transition: 'all 0.2s ease' }}>
          <CloseIcon />
        </IconButton>
      </ChatHeader>

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <MessagesContainer ref={messagesContainerRef}>
          {messages.map((msg) => {
            if (msg.isAnalyzing) return null;
            return (
              <ChatMessage
                key={msg.id}
                message={msg.content}
                isUser={msg.type === 'user'}
                source={msg.source}
                confidence={msg.confidence}
                sentiment={msg.sentiment}
                type={msg.messageType === 'disambiguation' ? { options: msg.options, onOptionClick: handleOptionClick } : msg.messageType === 'guardrail' ? 'guardrail' : null}
                agentName={msg.agentName}
                agentTier={msg.agentTier}
                isTyping={msg.isTyping}
                guardrail={msg.guardrail}
              />
            );
          })}

          {isTyping && !escalationStatus && (
            <TypingIndicator>
              <Box sx={{
                width: 24, height: 24, borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha('#D4AF37', 0.3)} 0%, ${alpha('#0052CC', 0.2)} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${alpha('#D4AF37', 0.4)}`,
              }}>
                <SmartToyIcon sx={{ fontSize: '14px', color: '#D4AF37' }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 'medium' }}>
                {typingMessage}
              </Typography>
            </TypingIndicator>
          )}

          <Box ref={messagesEndRef} />

          <Collapse in={escalationStatus !== null}>
            <Alert severity="warning" sx={{
              mt: 2, backgroundColor: alpha('#FF9500', 0.2), color: '#FF9500',
              border: `1px solid ${alpha('#FF9500', 0.4)}`, borderRadius: '12px',
              '& .MuiAlert-icon': { color: '#FF9500' },
              boxShadow: `0 4px 12px ${alpha('#FF9500', 0.2)}`,
            }}>
              {escalationStatus?.message || 'Connecting to live agent...'}
            </Alert>
          </Collapse>
        </MessagesContainer>

        <Box sx={{
          borderTop: `2px solid ${alpha('#D4AF37', 0.2)}`,
          padding: '16px 20px',
          background: `linear-gradient(180deg, ${alpha('#121212', 1)} 0%, ${alpha('#1a1a1a', 1)} 100%)`,
          position: 'relative',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent, ${alpha('#D4AF37', 0.6)}, transparent)`,
          },
        }}>
          <ChatInput onSend={handleSendMessage} disabled={isTyping || escalationStatus?.status === 'escalating'} />
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <IconButton onClick={handleToggleCollapse} sx={{
              color: '#D4AF37', backgroundColor: alpha('#D4AF37', 0.1), borderRadius: '8px', width: '100%', py: 0.5,
              '&:hover': { backgroundColor: alpha('#D4AF37', 0.2), color: '#E8C547' },
              transition: 'all 0.2s ease',
            }}>
              <ExpandMoreIcon sx={{ fontSize: '24px' }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </ChatPanel>
  );
};

export default AIChatPanel;