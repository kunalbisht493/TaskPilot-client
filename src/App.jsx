import React, { useState } from 'react';
import { Header } from './components/Header';
import { GoalInput } from './components/GoalInput';
import { ReasoningFeed } from './components/ReasoningFeed';
import { ConfirmationModal } from './components/ConfirmationModal';
import { TaskPanel } from './components/TaskPanel';
import { AuditLogPanel } from './components/AuditLogPanel';
import { SystemInfoModal } from './components/SystemInfoModal';
import { useAgentSession } from './hooks/useAgentSession';
import { useAuth } from './context/AuthContext';
import { RotateCcw } from 'lucide-react';

export default function App() {
  const { isAuthenticated, devLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [infoModalOpen, setInfoModalOpen] = useState(false);

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
    <div className="min-h-screen bg-surface-950 flex flex-col text-slate-100">
      {/* Header */}
      <Header onOpenInfo={() => setInfoModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Unauthenticated Quick Banner */}
        {!isAuthenticated && (
          <div className="p-3.5 rounded-lg bg-surface-900 border border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-300">
              Not currently logged in. Run Dev Quick Login to test tool execution and confirmations.
            </p>
            <button
              onClick={() => devLogin()}
              className="px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium focus-ring whitespace-nowrap"
            >
              Dev Quick Login
            </button>
          </div>
        )}

        {/* Goal Input Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Session: <span className="font-mono">{conversationId.substring(0, 16)}</span></span>
            {steps.length > 0 && (
              <button
                onClick={resetSession}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors focus-ring rounded"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset conversation</span>
              </button>
            )}
          </div>

          <GoalInput
            onSubmit={submitGoal}
            isExecuting={isExecuting}
            disabled={!isAuthenticated}
          />
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Live Reasoning Feed (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <ReasoningFeed
              steps={steps}
              isExecuting={isExecuting}
              currentAction={currentAction}
              finalAnswer={finalAnswer}
              error={error}
              goal={activeGoal}
            />
          </div>

          {/* Right Column: Tabbed Task and Audit Workspace (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex border-b border-surface-800 gap-4 text-xs font-medium">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === 'tasks'
                    ? 'border-primary-600 text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Database tasks
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === 'audit'
                    ? 'border-primary-600 text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Action audit trail
              </button>
            </div>

            {activeTab === 'tasks' ? (
              <TaskPanel />
            ) : (
              <AuditLogPanel />
            )}
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

      {/* Architecture Modal */}
      <SystemInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-surface-900 py-4 px-6 text-center text-xs text-slate-500">
        TaskPilot • Autonomous MERN AI Agent with Hand-Built ReAct Loop and Human-in-the-Loop Confirmation
      </footer>
    </div>
  );
}
