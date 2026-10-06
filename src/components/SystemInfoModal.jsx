import React from 'react';
import { X, Clock, Database } from 'lucide-react';

export function SystemInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-labelledby="sysinfo-title"
        aria-modal="true"
        className="bg-white border border-canvas-border rounded-lg max-w-lg w-full p-5 text-zinc-900 shadow-xl relative max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1 focus-ring"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 id="sysinfo-title" className="text-sm font-semibold text-zinc-900 mb-1">
          System Architecture & Data Policy
        </h3>
        <p className="text-xs text-zinc-500 mb-4">
          TaskPilot technical boundaries, tools, security mechanisms, and retention lifecycle.
        </p>

        <div className="space-y-3 text-xs text-zinc-600">
          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-border space-y-1">
            <span className="font-semibold text-zinc-800 block">ReAct Loop Architecture</span>
            <p className="leading-relaxed">
              Hand-built cyclic loop in Node.js executing Reason, Act, and Observe steps directly without LangChain or LangGraph dependencies. Enforces a cap of 6 maximum steps.
            </p>
          </div>

          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-border space-y-1">
            <span className="font-semibold text-zinc-800 block">Confirm-Before-Write Policy</span>
            <p className="leading-relaxed">
              Mutating tools pause orchestrator execution, persist state in MongoDB, and broadcast an approval request via WebSockets. No write executes without explicit confirmation.
            </p>
          </div>

          {/* Automated Data Retention / Lifecycle Management */}
          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-border space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
              <Database className="w-3.5 h-3.5 text-zinc-600" />
              <span>Automated Document Retention (MongoDB TTL)</span>
            </div>
            <p className="leading-relaxed text-[11px] text-zinc-600">
              To prevent database bloat and ensure zero maintenance on MongoDB Atlas M0 (512 MB quota), automated document lifecycle rules run directly in MongoDB background threads:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-700 font-mono">
              <li>
                <span className="font-semibold font-sans">Action Audit Logs:</span> Auto-deleted after <strong>14 days</strong> (<code className="text-[10px] bg-zinc-100 px-1 py-0.5 rounded">timestamp + 14d</code>)
              </li>
              <li>
                <span className="font-semibold font-sans">Conversations & Traces:</span> Auto-deleted after <strong>14 days</strong> (<code className="text-[10px] bg-zinc-100 px-1 py-0.5 rounded">updatedAt + 14d</code>)
              </li>
              <li>
                <span className="font-semibold font-sans">Pending Confirmations:</span> Auto-deleted after <strong>14 days</strong> (<code className="text-[10px] bg-zinc-100 px-1 py-0.5 rounded">createdAt + 14d</code>)
              </li>
              <li>
                <span className="font-semibold font-sans">Completed Tasks:</span> Auto-pruned after <strong>30 days</strong> (<code className="text-[10px] bg-zinc-100 px-1 py-0.5 rounded">completedAt + 30d</code>)
              </li>
              <li>
                <span className="font-semibold font-sans">Active Tasks:</span> Persist indefinitely until marked completed or deleted
              </li>
            </ul>
          </div>

          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-border space-y-1 font-mono text-[11px]">
            <span className="font-semibold text-zinc-800 font-sans block">Registered Tools</span>
            <ul className="list-disc pl-4 space-y-0.5 text-zinc-700">
              <li>check_calendar_availability (read-only)</li>
              <li>create_calendar_event (write, requires approval)</li>
              <li>list_tasks (read-only)</li>
              <li>create_task, complete_task (write, requires approval)</li>
            </ul>
          </div>

          <div className="p-2.5 rounded bg-canvas-subtle border border-canvas-border flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Auth: HttpOnly JWT</span>
            <span>Port: 5174</span>
          </div>
        </div>
      </div>
    </div>
  );
}
