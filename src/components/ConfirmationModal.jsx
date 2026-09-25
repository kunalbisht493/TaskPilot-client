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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="bg-white border border-canvas-border rounded-lg max-w-md w-full p-4 text-zinc-900 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-700 flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-semibold text-zinc-900">
              Confirmation required
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              The agent proposed a mutating write action. Review parameters before approving.
            </p>
          </div>
        </div>

        {/* Parameters Box */}
        <div className="bg-canvas-subtle rounded border border-canvas-border p-3 space-y-2 mb-4 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-canvas-border">
            <span className="text-zinc-500">Target tool:</span>
            <span className="font-mono text-zinc-800 bg-white px-1.5 py-0.5 rounded border border-canvas-border font-medium">
              {tool}
            </span>
          </div>

          {isCalendar && args && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{args.summary || 'Calendar event'}</span>
              </div>
              <div className="text-zinc-600 pl-5 space-y-0.5 text-[11px] font-mono">
                <div>Start: {args.startDateTime}</div>
                <div>End:   {args.endDateTime}</div>
                {args.description && <div className="text-zinc-500 font-sans">Description: {args.description}</div>}
              </div>
            </div>
          )}

          {isTask && args && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
                <CheckSquare className="w-3.5 h-3.5 text-zinc-500" />
                <span>{tool === 'complete_task' ? `Complete: ${args.title || args.taskId}` : args.title}</span>
              </div>
              <div className="text-zinc-600 pl-5 text-[11px] space-y-0.5">
                {args.priority && <div>Priority: {args.priority}</div>}
                {args.dueDate && <div className="font-mono">Due: {args.dueDate}</div>}
              </div>
            </div>
          )}

          {description && (
            <p className="text-xs text-zinc-500 italic pt-1 border-t border-canvas-border">
              "{description}"
            </p>
          )}
        </div>

        {/* Action controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-canvas-border bg-white hover:bg-canvas-subtle text-zinc-700 text-xs font-medium focus-ring disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5 text-rose-600" />
            <span>Reject</span>
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium focus-ring disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{submitting ? 'Executing...' : 'Approve'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
