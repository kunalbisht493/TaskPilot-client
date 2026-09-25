import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { agentApi } from '../api/agentApi';

export function useAgentSession() {
  const { socket, isConnected } = useSocket();
  const [conversationId, setConversationId] = useState(() => 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  const [steps, setSteps] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [finalAnswer, setFinalAnswer] = useState(null);
  const [error, setError] = useState(null);
  const [activeGoal, setActiveGoal] = useState('');

  // Join the conversation room whenever conversationId or socket changes
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    socket.emit('join_conversation', conversationId);
    console.log('Joined conversation room:', conversationId);

    return () => {
      socket.emit('leave_conversation', conversationId);
    };
  }, [socket, isConnected, conversationId]);

  // Socket event listeners for real-time streaming
  useEffect(() => {
    if (!socket) return;

    const handleStep = (data) => {
      console.log('⚡ Socket agent:step:', data);
      setSteps((prev) => [...prev, data]);
      if (data.tool) {
        setCurrentAction(`Tool: ${data.tool}`);
      }
    };

    const handleConfirmRequest = (data) => {
      console.log('⚠️ Socket agent:confirm_request:', data);
      setPendingConfirmation(data);
      setCurrentAction(null);
      setIsExecuting(false);
    };

    const handleComplete = (data) => {
      console.log('✅ Socket agent:complete:', data);
      setIsExecuting(false);
      setCurrentAction(null);
      setPendingConfirmation(null);
      if (data?.finalAnswer) {
        setFinalAnswer(data.finalAnswer);
      }
    };

    const handleError = (data) => {
      console.error('❌ Socket agent:error:', data);
      setIsExecuting(false);
      setCurrentAction(null);
      setError(data?.message || 'Agent execution failed');
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
    setCurrentAction('Initializing ReAct loop...');
    // Clear previous steps or keep for history? Let's start fresh for a new goal
    setSteps([]);

    try {
      const res = await agentApi.startTask({ goal, conversationId });
      console.log('Agent REST response:', res);
      
      if (res?.status === 'awaiting_confirmation') {
        setPendingConfirmation(res.pendingAction);
        setIsExecuting(false);
        setCurrentAction(null);
      } else if (res?.status === 'completed') {
        setIsExecuting(false);
        setCurrentAction(null);
        if (res?.finalAnswer) {
          setFinalAnswer(res.finalAnswer);
        }
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
    const confId = pendingConfirmation.confirmationId;
    setIsExecuting(true);
    setCurrentAction(approved ? 'Executing confirmed action...' : 'Processing action cancellation...');

    try {
      const res = await agentApi.confirmAction({
        confirmationId: confId,
        approved,
      });

      console.log('Confirmation REST response:', res);
      setPendingConfirmation(null);

      if (res?.status === 'completed' && res?.result?.finalAnswer) {
        setFinalAnswer(res.result.finalAnswer);
        setIsExecuting(false);
        setCurrentAction(null);
      } else if (res?.status === 'awaiting_confirmation') {
        setPendingConfirmation(res.pendingAction);
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

  // Reset conversation
  const resetSession = () => {
    const newId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    setConversationId(newId);
    setSteps([]);
    setIsExecuting(false);
    setCurrentAction(null);
    setPendingConfirmation(null);
    setFinalAnswer(null);
    setError(null);
    setActiveGoal('');
  };

  return {
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
