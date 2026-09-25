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
import { 
  Sparkles, 
  RotateCcw, 
  CheckSquare, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export default function App() {
  const { isAuthenticated, user, devLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'audit'
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
    <div className="min-h-screen bg-dark-950 flex flex-col text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
      {/* 1. Header */}
      <Header onOpenInfo={() => setInfoModalOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Unauthenticated Quick Banner */}
        {!isAuthenticated && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-950/60 to-dark-900 border border-accent-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent-500/20 text-accent-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Welcome to TaskPilot</h3>
                <p className="text-xs text-slate-300">
                  Authenticate via Dev Quick Login to interact with live tools and test human-in-the-loop guardrails.
                </p>
              </div>
            </div>
            <button
              onClick={() => devLogin()}
              className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-semibold text-xs transition shadow-md shadow-accent-500/20 whitespace-nowrap"
            >
              One-Click Dev Login
            </button>
          </div>
        )}

        {/* 2. Top Goal Input Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <span>Goal Formulation</span>
              <span className="text-[10px] font-mono text-slate-500">ID: {conversationId.substring(0, 14)}...</span>
            </span>
            {steps.length > 0 && (
              <button
                onClick={resetSession}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Conversation</span>
              </button>
            )}
          </div>

          <GoalInput
            onSubmit={submitGoal}
            isExecuting={isExecuting}
            disabled={!isAuthenticated}
          />
        </div>

        {/* 3. Main Dashboard 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: ReAct Live Reasoning Stream (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <ReasoningFeed
              steps={steps}
              isExecuting={isExecuting}
              currentAction={currentAction}
              finalAnswer={finalAnswer}
              error={error}
              goal={activeGoal}
            />
          </div>

          {/* Right Column: Multi-Panel Tabbed Workspace (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* Tab Buttons */}
            <div className="flex items-center gap-2 p-1 bg-dark-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'tasks'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                <span>Internal Tasks</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'audit'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-accent-400" />
                <span>Action Audit Trail</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'tasks' ? (
              <TaskPanel />
            ) : (
              <AuditLogPanel />
            )}
          </div>
        </div>
      </main>

      {/* 4. Human-in-the-Loop Confirmation Modal */}
      {pendingConfirmation && (
        <ConfirmationModal
          confirmation={pendingConfirmation}
          onConfirm={() => submitConfirmation(true)}
          onReject={() => submitConfirmation(false)}
        />
      )}

      {/* 5. System Info & Architecture Modal */}
      <SystemInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        TaskPilot • Autonomous MERN AI Agent with Hand-Built ReAct Loop • Real-time WebSockets & Audit Logging
      </footer>
    </div>
  );
}
