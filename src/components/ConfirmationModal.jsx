import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Check, 
  X, 
  Calendar, 
  CheckSquare, 
  Clock, 
  FileText,
  AlertCircle
} from 'lucide-react';

export function ConfirmationModal({ 
  confirmation, 
  onConfirm, 
  onReject 
}) {
  const [submitting, setSubmitting] = useState(false);

  if (!confirmation) return null;

  const { confirmationId, tool, args, description } = confirmation;

  const handleAction = async (approved) => {
    setSubmitting(true);
    try {
      if (approved) {
        await onConfirm(confirmationId);
      } else {
        await onReject(confirmationId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isCalendar = tool === 'create_calendar_event';
  const isTask = tool === 'create_task' || tool === 'complete_task';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-amber-500/10 overflow-hidden relative">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Action Requires Approval
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                HITL Guardrail
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              The agent is requesting to execute a write action that will modify state.
            </p>
          </div>
        </div>

        {/* Details Box */}
        <div className="bg-dark-950/80 rounded-xl p-4 border border-slate-800 space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Proposed Tool:</span>
            <span className="font-mono font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {tool}
            </span>
          </div>

          {/* Calendar specific breakdown */}
          {isCalendar && args && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-white font-semibold">{args.summary || 'Calendar Event'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300 pl-5 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Start Time:</span>
                  <span className="font-mono text-emerald-400">{args.startDateTime}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">End Time:</span>
                  <span className="font-mono text-emerald-400">{args.endDateTime}</span>
                </div>
              </div>
              {args.description && (
                <div className="pl-5 text-[11px] text-slate-400">
                  <span className="text-slate-500 block">Description:</span>
                  <span>{args.description}</span>
                </div>
              )}
            </div>
          )}

          {/* Task specific breakdown */}
          {isTask && args && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-white font-semibold">
                  {tool === 'complete_task' ? `Complete Task: ${args.title || args.taskId}` : args.title}
                </span>
              </div>
              {args.priority && (
                <div className="pl-5 text-[11px] text-slate-300">
                  <span className="text-slate-500">Priority: </span>
                  <span className="font-semibold uppercase text-amber-400">{args.priority}</span>
                </div>
              )}
              {args.dueDate && (
                <div className="pl-5 text-[11px] text-slate-300">
                  <span className="text-slate-500">Due Date: </span>
                  <span className="font-mono text-emerald-400">{args.dueDate}</span>
                </div>
              )}
            </div>
          )}

          {description && (
            <p className="text-xs text-slate-400 italic pt-1">
              "{description}"
            </p>
          )}
        </div>

        {/* Warning Note */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-5 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>If approved, this action will be executed and recorded in the audit log.</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAction(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>Reject / Cancel</span>
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-brand-600 hover:from-emerald-600 hover:to-brand-700 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? 'Executing...' : 'Approve & Execute'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
