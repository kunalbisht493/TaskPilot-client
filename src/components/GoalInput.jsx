import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Check calendar', prompt: 'Check my calendar availability for next Tuesday afternoon' },
  { label: 'Schedule meeting', prompt: 'Schedule a sprint sync on 2026-09-30 at 14:00 for 30 minutes' },
  { label: 'Create task', prompt: 'Create a task to prepare presentation slides before Friday' },
  { label: 'Chained workflow', prompt: 'Schedule project debrief on 2026-10-02 at 10:00 and add a prep task' }
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
    <div className="bg-canvas-subtle border-b border-canvas-border p-4">
      <form onSubmit={handleSubmit} className="space-y-2.5">
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
            aria-label="Agent goal input"
            className="w-full bg-canvas text-zinc-100 placeholder-zinc-500 rounded p-2.5 pr-24 border border-canvas-border focus-ring text-xs resize-none disabled:opacity-50"
          />

          <div className="absolute right-2.5 bottom-3 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono">
              {goal.length}/{MAX_LENGTH}
            </span>
            {/* The single primary accent color on the entire screen */}
            <button
              type="submit"
              disabled={!goal.trim() || isExecuting || disabled}
              className="px-3 py-1 rounded bg-action hover:bg-action-hover text-white text-xs font-medium flex items-center gap-1.5 focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Running</span>
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

        {/* Suggestion prompt chips - neutral styling */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px] mr-1">Suggestions:</span>
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setGoal(item.prompt)}
              disabled={isExecuting || disabled}
              className="px-2 py-0.5 rounded bg-canvas hover:bg-canvas-muted text-zinc-400 hover:text-zinc-200 border border-canvas-borderSubtle text-[11px] focus-ring disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
