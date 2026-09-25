import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Check availability', prompt: 'Check my calendar availability for next Tuesday afternoon' },
  { label: 'Schedule meeting', prompt: 'Schedule a sprint sync on 2026-09-30 at 14:00 for 30 minutes' },
  { label: 'Add task', prompt: 'Create a task to prepare presentation slides for mentor review before Friday' },
  { label: 'Multi-step action', prompt: 'Schedule a project debrief on 2026-10-02 at 10:00 and add a prep task' }
];

export function GoalInput({ onSubmit, isExecuting, disabled }) {
  const [goal, setGoal] = useState('');
  const MAX_LENGTH = 500;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!goal.trim() || isExecuting || disabled) return;
    onSubmit(goal.trim());
    setGoal('');
  };

  return (
    <div className="w-full bg-surface-900 border border-surface-800 rounded-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={MAX_LENGTH}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type a goal (e.g. Schedule a call with mentor next Tuesday and add a prep task)..."
            rows={2}
            disabled={isExecuting || disabled}
            aria-label="Agent request input"
            className="w-full bg-surface-950 text-slate-100 placeholder-slate-500 rounded-md p-3 pr-24 border border-surface-700 focus-ring text-sm resize-none disabled:opacity-60"
          />

          <div className="absolute right-2.5 bottom-3 flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              {goal.length}/{MAX_LENGTH}
            </span>
            <button
              type="submit"
              disabled={!goal.trim() || isExecuting || disabled}
              className="px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs flex items-center gap-1.5 focus-ring disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing</span>
                </>
              ) : (
                <>
                  <span>Run goal</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestion pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium mr-1">Examples:</span>
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setGoal(item.prompt)}
              disabled={isExecuting || disabled}
              className="px-2.5 py-1 rounded bg-surface-850 hover:bg-surface-800 text-slate-300 border border-surface-700 focus-ring transition-colors disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
