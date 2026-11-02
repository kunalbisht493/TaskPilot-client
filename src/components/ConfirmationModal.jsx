import React, { useState } from 'react';
import { formatIndianDate } from '../utils/dateUtils';
import { AlertCircle, Check, X, Calendar, CheckSquare, Clock, MapPin } from 'lucide-react';

export function ConfirmationModal({ 
  confirmation, 
  onConfirm, 
  onReject 
}) {
  const [submitting, setSubmitting] = useState(false);

  if (!confirmation) return null;

  const { tool, args = {}, description } = confirmation;
  const confirmationId = confirmation.confirmationId || confirmation._id || confirmation.id;

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

  const friendlyActionName = {
    create_calendar_event: 'Schedule Calendar Event',
    create_task: 'Create New Task',
    complete_task: 'Complete Task',
  }[tool] || tool.replace(/_/g, ' ');

  const formatDateTime = (val) => {
    if (!val) return 'Not specified';
    try {
      const formatted = formatIndianDate(val, 'short', true);
      return formatted || String(val);
    } catch {
      return String(val);
    }
  };

  const startTimeStr = formatDateTime(args?.startTime || args?.startDateTime || args?.start);
  const endTimeStr = formatDateTime(args?.endTime || args?.endDateTime || args?.end);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="bg-white border border-canvas-border rounded-xl max-w-md w-full p-4 sm:p-5 text-zinc-900 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start gap-2.5 mb-3.5">
          <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-semibold text-zinc-900">
              Confirmation Required
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              The assistant is requesting your approval before making this update.
            </p>
          </div>
        </div>

        {/* Parameters Box */}
        <div className="bg-canvas-subtle rounded-lg border border-canvas-border p-3.5 space-y-2.5 mb-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-canvas-border">
            <span className="text-zinc-500 font-medium">Proposed Action:</span>
            <span className="text-zinc-900 bg-white px-2 py-0.5 rounded border border-canvas-border font-medium text-xs">
              {friendlyActionName}
            </span>
          </div>

          {isCalendar && args && (
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center gap-1.5 text-zinc-900 font-semibold text-xs">
                <Calendar className="w-3.5 h-3.5 text-zinc-700" />
                <span>{args.summary || args.title || 'Calendar Event'}</span>
              </div>
              <div className="text-zinc-600 pl-5 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span>Start: <strong className="text-zinc-800 font-medium">{startTimeStr}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span>End: <strong className="text-zinc-800 font-medium">{endTimeStr}</strong></span>
                </div>
                {args.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    <span>Location: <strong className="text-zinc-800 font-medium">{args.location}</strong></span>
                  </div>
                )}
                {args.description && (
                  <div className="text-zinc-500 font-sans mt-1.5 pt-1.5 border-t border-canvas-border/50">
                    {args.description}
                  </div>
                )}
              </div>
            </div>
          )}

          {isTask && args && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-1.5 text-zinc-900 font-semibold text-xs">
                <CheckSquare className="w-3.5 h-3.5 text-zinc-700" />
                <span>{tool === 'complete_task' ? `Complete Task: ${args.title || args.taskId}` : args.title}</span>
              </div>
              <div className="text-zinc-600 pl-5 text-[11px] space-y-1">
                {args.priority && <div>Priority: <strong className="text-zinc-800 capitalize font-medium">{args.priority}</strong></div>}
                {args.dueDate && <div>Due: <strong className="text-zinc-800 font-mono font-medium">{formatDateTime(args.dueDate)}</strong></div>}
              </div>
            </div>
          )}

          {description && (
            <p className="text-[11px] text-zinc-500 italic pt-1.5 border-t border-canvas-border">
              "{description}"
            </p>
          )}
        </div>

        {/* Action controls */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => handleAction(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-canvas-border bg-white hover:bg-canvas-subtle text-zinc-700 text-xs font-medium focus-ring disabled:opacity-50 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-rose-600" />
            <span>Reject</span>
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium focus-ring disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{submitting ? 'Executing...' : 'Approve'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
