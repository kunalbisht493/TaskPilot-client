import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { agentApi } from '../api/agentApi';

const SESSION_ID_KEY = 'taskpilot_session_id';
const CONVERSATION_ID_KEY = 'taskpilot_conversation_id';
const STEPS_KEY = 'taskpilot_steps';
const FINAL_ANSWER_KEY = 'taskpilot_final_answer';
const ACTIVE_GOAL_KEY = 'taskpilot_active_goal';
const PENDING_CONF_KEY = 'taskpilot_pending_confirmation';

const generateSessionId = () => 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
const generateConversationId = () => 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

const getOrGenerateSessionId = () => {
  if (typeof window === 'undefined') return generateSessionId();
  try {
    const existing = window.localStorage.getItem(SESSION_ID_KEY);
    if (existing && existing.trim()) {
      return existing.trim();
    }
    const newId = generateSessionId();
    window.localStorage.setItem(SESSION_ID_KEY, newId);
    return newId;
  } catch (err) {
    console.warn('[Storage] Failed to access localStorage for sessionId:', err);
    return generateSessionId();
  }
};

const getOrGenerateConversationId = () => {
  if (typeof window === 'undefined') return generateConversationId();
  try {
    const existing = window.localStorage.getItem(CONVERSATION_ID_KEY);
    if (existing && existing.trim()) {
      return existing.trim();
    }
    const newId = generateConversationId();
    window.localStorage.setItem(CONVERSATION_ID_KEY, newId);
    return newId;
  } catch (err) {
    console.warn('[Storage] Failed to access localStorage for conversationId:', err);
    return generateConversationId();
  }
};

const safeGetStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.warn(`[Storage] Failed to parse ${key}:`, err);
    return fallback;
  }
};

const safeGetStringStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = window.localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch (err) {
    console.warn(`[Storage] Failed to read string ${key}:`, err);
    return fallback;
  }
};

const safeSetStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`[Storage] Failed to set ${key}:`, err);
  }
};

const safeRemoveStorage = (key) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[Storage] Failed to remove ${key}:`, err);
  }
};

export function useAgentSession() {
  const { socket, updateSocketAuth } = useSocket();
  const [sessionId] = useState(getOrGenerateSessionId);
  const [conversationId, setConversationId] = useState(getOrGenerateConversationId);
  const [steps, setSteps] = useState(() => safeGetStorage(STEPS_KEY, []));
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(() => safeGetStorage(PENDING_CONF_KEY, null));
  const [finalAnswer, setFinalAnswer] = useState(() => safeGetStringStorage(FINAL_ANSWER_KEY, null));
  const [error, setError] = useState(null);
  const [activeGoal, setActiveGoal] = useState(() => safeGetStringStorage(ACTIVE_GOAL_KEY, ''));

  // Sync conversation steps to storage across browser refreshes
  useEffect(() => {
    if (steps && steps.length > 0) {
      safeSetStorage(STEPS_KEY, steps);
    } else {
      safeRemoveStorage(STEPS_KEY);
    }
  }, [steps]);

  // Sync final answer to storage
  useEffect(() => {
    if (finalAnswer) {
      safeSetStorage(FINAL_ANSWER_KEY, finalAnswer);
    } else {
      safeRemoveStorage(FINAL_ANSWER_KEY);
    }
  }, [finalAnswer]);

  // Sync active goal to storage
  useEffect(() => {
    if (activeGoal) {
      safeSetStorage(ACTIVE_GOAL_KEY, activeGoal);
    } else {
      safeRemoveStorage(ACTIVE_GOAL_KEY);
    }
  }, [activeGoal]);

  // Sync pending confirmation to storage
  useEffect(() => {
    if (pendingConfirmation) {
      safeSetStorage(PENDING_CONF_KEY, pendingConfirmation);
    } else {
      safeRemoveStorage(PENDING_CONF_KEY);
    }
  }, [pendingConfirmation]);

  // Join the conversation room whenever conversationId or socket changes, and ensure re-join upon reconnection
  useEffect(() => {
    if (!socket || !conversationId) return;

    const joinRoom = () => {
      // Synchronize socket handshake auth for transparent reconnection
      if (updateSocketAuth) {
        updateSocketAuth({ conversationId, sessionId });
      }
      socket.emit('join_conversation', conversationId);
      console.log('[Socket] Joined conversation room:', conversationId);
    };

    // If socket is already connected, join immediately
    if (socket.connected) {
      joinRoom();
    }

    // Always re-join on reconnect or connect
    socket.on('connect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
      if (socket.connected && conversationId) {
        socket.emit('leave_conversation', conversationId);
      }
    };
  }, [socket, conversationId, sessionId, updateSocketAuth]);

  // Socket event listeners for real-time streaming
  useEffect(() => {
    if (!socket) return;

    const handleStep = (data) => {
      console.log('[Socket] agent:step:', data);
      if (!data || data.type === 'agent_started') return;

      setSteps((prevSteps) => {
        const cycleNum = data.step || (prevSteps.length > 0 ? prevSteps[prevSteps.length - 1].step : 1);
        const existingIdx = prevSteps.findIndex((s) => s.step === cycleNum);

        if (existingIdx >= 0) {
          const updated = [...prevSteps];
          const curr = { ...updated[existingIdx] };

          if (data.type === 'reasoning_start') {
            curr.thought = data.reasoning || curr.thought;
            curr.status = 'reasoning';
          } else if (data.type === 'tool_call') {
            curr.tool = data.tool;
            curr.args = data.args;
            curr.thought = data.reasoning || curr.thought;
            curr.provider = data.provider;
            curr.status = 'tool_call';
          } else if (data.type === 'confirmation_required') {
            curr.tool = data.tool || curr.tool;
            curr.args = data.args || curr.args;
            curr.isWriteAction = true;
            curr.description = data.description;
            curr.status = 'awaiting_confirmation';
          } else if (data.type === 'tool_observation') {
            curr.result = data.result || (data.error ? { error: data.error } : null);
            curr.success = data.success !== false;
            curr.status = 'observed';
            if (curr.isWriteAction) {
              curr.confirmedStatus = 'approved';
            }
          } else if (data.type === 'final_answer') {
            curr.finalAnswer = data.content;
            curr.status = 'completed';
          }

          updated[existingIdx] = curr;
          return updated;
        } else {
          const newStep = {
            step: cycleNum,
            timestamp: data.timestamp || new Date().toISOString(),
            thought: data.reasoning || null,
            tool: data.tool || null,
            args: data.args || null,
            isWriteAction: data.type === 'confirmation_required',
            description: data.description || null,
            result: data.result || (data.error ? { error: data.error } : null),
            status: data.type,
          };
          return [...prevSteps, newStep];
        }
      });

      if (data.tool) {
        const friendlyToolMap = {
          get_current_time: 'Checking current date and time...',
          check_calendar_availability: 'Checking calendar availability...',
          create_calendar_event: 'Preparing calendar event...',
          list_tasks: 'Checking existing tasks...',
          create_task: 'Creating task...',
          complete_task: 'Updating task status...',
          calculate: 'Calculating duration...',
        };
        setCurrentAction(friendlyToolMap[data.tool] || 'Working on your request...');
      } else if (data.type === 'reasoning_start') {
        setCurrentAction('Working on your request...');
      } else if (data.type === 'final_answer') {
        setFinalAnswer(data.content);
        // Clean up empty trailing step if it only served as final answer placeholder
        setSteps((prevSteps) => prevSteps.filter((s) => s.thought || s.tool || s.result));
      }
    };

    const handleConfirmRequest = (data) => {
      console.log('[Socket] agent:confirm_request:', data);
      setPendingConfirmation(data);
      setCurrentAction(null);
      setIsExecuting(false);
    };

    const handleComplete = (data) => {
      console.log('[Socket] agent:complete:', data);
      setIsExecuting(false);
      setCurrentAction(null);
      setPendingConfirmation(null);
      if (data?.finalAnswer || data?.result?.finalAnswer) {
        setFinalAnswer(data.finalAnswer || data.result?.finalAnswer);
      }
      setSteps((prevSteps) => prevSteps.filter((s) => s.thought || s.tool || s.result));
    };

    const handleError = (data) => {
      console.error('[Socket] agent:error:', data);
      setIsExecuting(false);
      setCurrentAction(null);
      setError(data?.message || data?.error || 'Agent execution failed');
    };

    socket.on('agent:step', handleStep);
    socket.on('agent:confirm_request', handleConfirmRequest);
    socket.on('agent:complete', handleComplete);
    socket.on('agent:error', handleError);

    return () => {
      socket.off('agent:step', handleStep);
      socket.off('agent:confirm_request', handleConfirmRequest);
      socket.off('agent:complete', handleComplete);
      socket.off('agent:error', handleError);
    };
  }, [socket]);

  // Start new agent task
  const submitGoal = async (goal) => {
    setActiveGoal(goal);
    setIsExecuting(true);
    setFinalAnswer(null);
    setError(null);
    setCurrentAction('Initializing ReAct orchestrator loop...');
    setSteps([]);

    try {
      const res = await agentApi.startTask({ goal, conversationId, sessionId });
      console.log('Agent REST response:', res);
      
      if (res?.status === 'awaiting_confirmation') {
        const pending = res.pendingConfirmation || res.pendingAction || res.result?.pendingAction;
        if (pending) {
          setPendingConfirmation(pending);
        }
        setIsExecuting(false);
        setCurrentAction(null);
      } else if (res?.status === 'completed') {
        setIsExecuting(false);
        setCurrentAction(null);
        if (res?.finalAnswer || res?.result?.finalAnswer) {
          setFinalAnswer(res.finalAnswer || res.result?.finalAnswer);
        }
        setSteps((prevSteps) => prevSteps.filter((s) => s.thought || s.tool || s.result));
      }
    } catch (err) {
      console.error('Submit goal error:', err);
      setError(err.message || 'Failed to start agent task');
      setIsExecuting(false);
      setCurrentAction(null);
    }
  };

  // Submit confirmation decision (Approve or Reject)
  const submitConfirmation = async (approved) => {
    if (!pendingConfirmation) return;
    const confId = pendingConfirmation.confirmationId || pendingConfirmation._id || pendingConfirmation.id;
    setIsExecuting(true);
    setCurrentAction(approved ? 'Executing approved write action...' : 'Processing action cancellation...');

    try {
      const res = await agentApi.confirmAction({
        confirmationId: confId,
        approved,
        conversationId,
        sessionId,
      });

      console.log('Confirmation REST response:', res);
      setPendingConfirmation(null);

      // Transition the write tool step to approved / rejected
      setSteps((prevSteps) =>
        prevSteps.map((s) => {
          if (s.isWriteAction || s.status === 'awaiting_confirmation') {
            return {
              ...s,
              status: approved ? 'approved' : 'rejected',
              confirmedStatus: approved ? 'approved' : 'rejected',
              result: res.toolResult || (approved ? { status: 'executed', details: 'Action approved and executed successfully.' } : { status: 'cancelled', details: 'Action rejected by user.' }),
            };
          }
          return s;
        })
      );

      if (res?.status === 'completed' || res?.result?.status === 'completed') {
        const answer = res.result?.finalAnswer || res.finalAnswer;
        if (answer) {
          setFinalAnswer(answer);
        }
        setIsExecuting(false);
        setCurrentAction(null);
        setSteps((prevSteps) => prevSteps.filter((s) => s.thought || s.tool || s.result));
      } else if (res?.status === 'awaiting_confirmation') {
        const nextPending = res.pendingConfirmation || res.pendingAction || res.result?.pendingAction;
        setPendingConfirmation(nextPending);
        setIsExecuting(false);
        setCurrentAction(null);
      } else {
        setIsExecuting(false);
        setCurrentAction(null);
      }
    } catch (err) {
      console.error('Confirm action error:', err);
      setError(err.message || 'Failed to submit confirmation');
      setIsExecuting(false);
      setCurrentAction(null);
    }
  };

  // Reset conversation: retains persistent Session ID while generating a fresh Conversation ID
  const resetSession = () => {
    const newConvId = generateConversationId();
    const oldConvId = conversationId;

    // Explicitly transition rooms on the live socket
    if (socket && socket.connected) {
      if (oldConvId) {
        socket.emit('leave_conversation', oldConvId);
      }
      if (updateSocketAuth) {
        updateSocketAuth({ conversationId: newConvId, sessionId });
      }
      socket.emit('join_conversation', newConvId);
    }

    setConversationId(newConvId);
    safeSetStorage(CONVERSATION_ID_KEY, newConvId);

    // Clear active conversation history & UI state
    setSteps([]);
    setIsExecuting(false);
    setCurrentAction(null);
    setPendingConfirmation(null);
    setFinalAnswer(null);
    setError(null);
    setActiveGoal('');

    // Clear saved conversation history from storage
    safeRemoveStorage(STEPS_KEY);
    safeRemoveStorage(FINAL_ANSWER_KEY);
    safeRemoveStorage(ACTIVE_GOAL_KEY);
    safeRemoveStorage(PENDING_CONF_KEY);
  };

  return {
    sessionId,
    conversationId,
    steps,
    isExecuting,
    currentAction,
    pendingConfirmation,
    finalAnswer,
    error,
    activeGoal,
    submitGoal,
    submitConfirmation,
    resetSession,
  };
}
