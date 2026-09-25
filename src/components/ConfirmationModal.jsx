import React, { useState } from 'react';
import { AlertCircle, Check, X, Calendar, CheckSquare } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        role="dialog"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="bg-surface-900 border border-surface-700 rounded-lg max-w-md w-full p-5 shadow-xl text-slate-200"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded bg-amber-950/60 border border-amber-800 text-amber-400 flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-semibold text-slate-100">
              Confirmation required
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              The agent proposed a write action. Review parameters before approving execution.
            </p>
          </div>
        </div>

        {/* Parameters Box */}
        <div className="bg-surface-950 rounded border border-surface-800 p-3 space-y-2.5 mb-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-surface-850">
            <span className="text-slate-400">Target tool:</span>
            <span className="font-mono text-slate-200 bg-surface-900 px-2 py-0.5 rounded border border-surface-800">
              {tool}
            </span>
          </div>

          {isCalendar && args && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{args.summary || 'Calendar event'}</span>
              </div>
              <div className="text-slate-300 pl-5 space-y-1 text-[11px]">
                <div><span className="text-slate-500">Start: </span><span className="font-mono">{args.startDateTime}</span></div>
                <div><span className="text-slate-500">End: </span><span className="font-mono">{args.endDateTime}</span></div>
                {args.description && <div><span className="text-slate-500">Description: </span><span>{args.description}</span></div>}
              </div>
            </div>
          )}

          {isTask && args && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>{tool === 'complete_task' ? `Complete: ${args.title || args.taskId}` : args.title}</span>
              </div>
              <div className="text-slate-300 pl-5 text-[11px] space-y-0.5">
                {args.priority && <div><span className="text-slate-500">Priority: </span><span>{args.priority}</span></div>}
                {args.dueDate && <div><span className="text-slate-500">Due: </span><span className="font-mono">{args.dueDate}</span></div>}
              </div>
            </div>
          )}

          {description && (
            <p className="text-xs text-slate-400 italic pt-1 border-t border-surface-850">
              "{description}"
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-surface-700 bg-surface-850 hover:bg-surface-800 text-slate-300 text-xs font-medium focus-ring transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Reject action</span>
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium focus-ring transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{submitting ? 'Executing...' : 'Approve action'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
