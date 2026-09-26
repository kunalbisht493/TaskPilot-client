import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GoalInput } from './components/GoalInput';
import { ReasoningFeed } from './components/ReasoningFeed';
import { ConfirmationModal } from './components/ConfirmationModal';
import { TaskPanel } from './components/TaskPanel';
import { AuditLogPanel } from './components/AuditLogPanel';
import { SystemInfoModal } from './components/SystemInfoModal';
import { useAgentSession } from './hooks/useAgentSession';
import { useAuth } from './context/AuthContext';
import { RotateCcw, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function App() {
  const { isAuthenticated, devLogin, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [authBanner, setAuthBanner] = useState(null);

  // Sync OAuth redirect query parameters (?auth=success or ?auth_error=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      refreshUser();
      setAuthBanner({
        type: 'success',
        message: 'Google account connected successfully. Calendar and session are active.',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => setAuthBanner(null), 6000);
      return () => clearTimeout(timer);
    } else if (params.get('auth_error')) {
      const errorMsg = params.get('auth_error');
      setAuthBanner({
        type: 'error',
        message: `Google authentication failed: ${decodeURIComponent(errorMsg)}`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refreshUser]);

  const {
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
  } = useAgentSession();

  return (
    <div className="min-h-screen bg-white flex flex-col text-zinc-900 antialiased">
      {/* Flush top navigation */}
      <Header onOpenInfo={() => setInfoModalOpen(true)} />

      {/* Main container */}
      <main className="flex-1 max-w-7xl w-full mx-auto flex flex-col">
        {/* Auth notification banner */}
        {authBanner && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
              authBanner.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {authBanner.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{authBanner.message}</span>
            </div>
            <button
              onClick={() => setAuthBanner(null)}
              className="text-zinc-500 hover:text-zinc-800 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Unauthenticated notice */}
        {!isAuthenticated && (
          <div className="p-3 bg-canvas-subtle border-b border-canvas-border flex items-center justify-between text-xs text-zinc-700">
            <span>Development session inactive. Authenticate via Google OAuth or Dev Quick Login to enable tool execution and confirmations.</span>
            <button
              onClick={() => devLogin()}
              className="px-2.5 py-1 rounded bg-white hover:bg-zinc-50 text-zinc-900 border border-canvas-border focus-ring font-medium"
            >
              Dev Quick Login
            </button>
          </div>
        )}

        {/* Goal input bar */}
        <GoalInput
          onSubmit={submitGoal}
          isExecuting={isExecuting}
          disabled={!isAuthenticated}
        />

        {/* Two-Pane Workspace Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[580px] border-b border-canvas-border">
          {/* Left Pane: Execution Trace Timeline (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-canvas-border">
            <div className="px-4 py-1.5 border-b border-canvas-border bg-white flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>SESSION: {conversationId.substring(0, 16)}</span>
              {steps.length > 0 && (
                <button
                  onClick={resetSession}
                  className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 font-sans focus-ring rounded"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <ReasoningFeed
              steps={steps}
              isExecuting={isExecuting}
              currentAction={currentAction}
              finalAnswer={finalAnswer}
              error={error}
              goal={activeGoal}
            />
          </div>

          {/* Right Pane: Operations & Ledger Workspace (5 cols, subtle background tonal contrast) */}
          <div className="lg:col-span-5 flex flex-col bg-canvas-subtle">
            {/* Tab selector */}
            <div className="flex border-b border-canvas-border bg-white text-xs font-medium">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 py-2 px-3 text-center border-b-2 transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Database Tasks
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`flex-1 py-2 px-3 text-center border-b-2 transition-colors ${
                  activeTab === 'audit'
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Action Audit Log
              </button>
            </div>

            {/* Selected panel view */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'tasks' ? (
                <TaskPanel />
              ) : (
                <AuditLogPanel />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {pendingConfirmation && (
        <ConfirmationModal
          confirmation={pendingConfirmation}
          onConfirm={() => submitConfirmation(true)}
          onReject={() => submitConfirmation(false)}
        />
      )}

      {/* Architecture Specs Modal */}
      <SystemInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="py-3 px-6 text-center text-[11px] text-zinc-400 bg-white">
        TaskPilot - Autonomous MERN AI Agent with Hand-Built ReAct Loop and Human-in-the-Loop Confirmation
      </footer>
    </div>
  );
}
