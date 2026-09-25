import React from 'react';
import { 
  X, 
  Cpu, 
  ShieldCheck, 
  GitBranch, 
  Database, 
  Zap, 
  Lock,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SystemInfoModal({ isOpen, onClose }) {
  const { health } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-accent-500/20 border border-accent-500/30 text-accent-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              TaskPilot Architecture & Engineering
            </h2>
            <p className="text-xs text-slate-400">
              Autonomous ReAct Loop with Dual-Domain Tools and HITL Guardrails
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          {/* Card 1: Core Loop */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-brand-400 font-semibold">
              <Zap className="w-4 h-4" />
              <span>Hand-Built ReAct Loop (Zero LangChain / LangGraph)</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              TaskPilot executes a native Reason → Act → Observe cyclic loop built from scratch in Node.js. The LLM acts purely as a reasoning engine producing structured tool calls, while the server enforces deterministic safety checks before calling external APIs.
            </p>
          </div>

          {/* Card 2: Security & HITL */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm-Before-Write (Human-in-the-Loop Guardrail)</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Mutating actions (<code className="text-amber-300">create_calendar_event</code>, <code className="text-amber-300">create_task</code>, <code className="text-amber-300">complete_task</code>) physically halt the orchestrator loop, create a pending confirmation in MongoDB, and broadcast an approval request via WebSockets. No write operation can execute without an explicit cryptographic session token.
            </p>
          </div>

          {/* Card 3: Dual Domain Tools */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-accent-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>Active Tool Registry & Schemas</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded bg-dark-950 border border-slate-800">
                <span className="text-emerald-400 block font-semibold">check_calendar_availability</span>
                <span className="text-slate-400 text-[10px]">Read-only calendar check</span>
              </div>
              <div className="p-2 rounded bg-dark-950 border border-slate-800">
                <span className="text-amber-400 block font-semibold">create_calendar_event</span>
                <span className="text-slate-400 text-[10px]">Write action (requires HITL)</span>
              </div>
              <div className="p-2 rounded bg-dark-950 border border-slate-800">
                <span className="text-emerald-400 block font-semibold">list_tasks</span>
                <span className="text-slate-400 text-[10px]">Read-only internal task query</span>
              </div>
              <div className="p-2 rounded bg-dark-950 border border-slate-800">
                <span className="text-amber-400 block font-semibold">create_task / complete_task</span>
                <span className="text-slate-400 text-[10px]">Write actions (requires HITL)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Runtime Specs */}
          <div className="bg-dark-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>LLM Provider: <strong className="text-white">{health?.activeLlmProvider?.toUpperCase() || 'GROQ'}</strong></span>
            <span>Max Loop Cap: <strong className="text-white">6 Steps</strong></span>
            <span>Auth: <strong className="text-white">JWT + Google OAuth 2.0</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
