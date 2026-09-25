import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw, Calendar, CheckSquare } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Calendar,
    label: "Check Calendar",
    prompt: "Check my calendar availability for next Tuesday afternoon"
  },
  {
    icon: Calendar,
    label: "Schedule Event",
    prompt: "Schedule a sprint sync with the team on 2026-09-30 at 14:00 for 30 minutes"
  },
  {
    icon: CheckSquare,
    label: "Create Task",
    prompt: "Create a task to prepare presentation slides for mentor review before Friday"
  },
  {
    icon: Sparkles,
    label: "Multi-Domain",
    prompt: "Schedule a project debrief on 2026-10-02 at 10:00 and create a task to review documentation beforehand"
  }
];

export function GoalInput({ onSubmit, isExecuting, disabled }) {
  const [goal, setGoal] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!goal.trim() || isExecuting || disabled) return;
    onSubmit(goal.trim());
    setGoal('');
  };

  const handleSelectSuggestion = (suggestionPrompt) => {
    setGoal(suggestionPrompt);
  };

  return (
    <div className="w-full bg-dark-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type a goal (e.g., 'Schedule a call next Monday at 3pm and add a follow-up prep task')..."
            rows={2}
            disabled={isExecuting || disabled}
            className="w-full bg-dark-950/70 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pr-24 border border-slate-700/60 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/50 outline-none transition resize-none text-sm font-sans"
          />
          <button
            type="submit"
            disabled={!goal.trim() || isExecuting || disabled}
            className="absolute right-2.5 bottom-2.5 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-emerald-600 hover:from-brand-600 hover:to-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-95"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <span>Run Agent</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Goals:</span>
        </span>
        {SUGGESTIONS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(s.prompt)}
              disabled={isExecuting || disabled}
              className="text-xs bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-700/50 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-brand-400" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
