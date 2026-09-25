import React from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SystemInfoModal({ isOpen, onClose }) {
  const { health } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div 
        role="dialog"
        aria-labelledby="sysinfo-title"
        aria-modal="true"
        className="bg-surface-900 border border-surface-700 rounded-lg max-w-xl w-full p-5 text-slate-200 relative max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded focus-ring"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 id="sysinfo-title" className="text-sm font-semibold text-slate-100 mb-1">
          System architecture specifications
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          TaskPilot technical boundaries, tools, and security mechanisms.
        </p>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded bg-surface-950 border border-surface-800 space-y-1">
            <span className="font-semibold text-slate-200 block">ReAct Loop Architecture</span>
            <p className="leading-relaxed text-slate-400">
              Hand-built cyclic loop in Node.js executing Reason, Act, and Observe steps directly without LangChain or LangGraph dependencies. Hardcapped at 6 maximum steps to prevent runaway loops.
            </p>
          </div>

          <div className="p-3 rounded bg-surface-950 border border-surface-800 space-y-1">
            <span className="font-semibold text-slate-200 block">Security and Guardrails</span>
            <p className="leading-relaxed text-slate-400">
              Confirm-before-write policy enforced server-side. Mutating tools pause the execution cycle, record pending state in MongoDB, and broadcast an approval request via WebSockets.
            </p>
          </div>

          <div className="p-3 rounded bg-surface-950 border border-surface-800 space-y-1">
            <span className="font-semibold text-slate-200 block">Active Tools</span>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-400 font-mono text-[11px]">
              <li>check_calendar_availability (read-only)</li>
              <li>create_calendar_event (write, requires approval)</li>
              <li>list_tasks (read-only)</li>
              <li>create_task, complete_task (write, requires approval)</li>
            </ul>
          </div>

          <div className="p-3 rounded bg-surface-950 border border-surface-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Provider: <strong className="text-slate-200">{health?.activeLLMProvider?.toUpperCase() || 'GROQ'}</strong></span>
            <span>Auth: <strong className="text-slate-200">JWT (HttpOnly)</strong></span>
            <span>Client port: <strong className="text-slate-200">5174</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
