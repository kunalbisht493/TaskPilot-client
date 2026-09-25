import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function ReasoningFeed({ 
  steps = [], 
  isExecuting, 
  currentAction, 
  finalAnswer, 
  error, 
  goal 
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps, isExecuting, finalAnswer, error]);

  return (
    <div className="flex-1 flex flex-col bg-surface-900 border border-surface-800 rounded-lg min-h-[460px] overflow-hidden">
      {/* Feed Header */}
      <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between bg-surface-900">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-200">Execution and Reasoning Feed</h2>
          {steps.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-surface-800 text-slate-400 font-normal">
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </span>
          )}
        </div>

        {isExecuting && (
          <div className="flex items-center gap-1.5 text-xs text-primary-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Orchestrator active</span>
          </div>
        )}
      </div>

      {/* Feed Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {goal && (
          <div className="bg-surface-950 p-3 rounded-md border border-surface-800 text-xs">
            <span className="text-slate-400 font-medium block mb-1">Active request:</span>
            <p className="text-slate-200">{goal}</p>
          </div>
        )}

        {steps.length === 0 && !isExecuting && !finalAnswer && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <p className="text-sm font-medium text-slate-300">Agent waiting for request</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Enter a goal above. The agent will formulate steps, execute tools, and request your approval for write actions.
            </p>
          </div>
        )}

        {/* Timeline of steps with single deliberate animation */}
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            className="border border-surface-800 bg-surface-950 rounded-md p-3.5 space-y-3 motion-safe:animate-step-in"
          >
            {/* Step header */}
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-surface-850">
              <span className="font-medium text-slate-300">
                Step {step.step || idx + 1}
              </span>
              <span>{step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''}</span>
            </div>

            {/* 1. Reasoning */}
            {step.thought && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block">Reasoning:</span>
                <p className="text-xs text-slate-200 pl-3 border-l-2 border-primary-600 leading-relaxed">
                  {step.thought}
                </p>
              </div>
            )}

            {/* 2. Tool invocation */}
            {step.tool && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-slate-400">Tool requested:</span>
                  <span className="font-mono text-[11px] bg-surface-850 text-slate-200 px-2 py-0.5 rounded border border-surface-750">
                    {step.tool}
                  </span>
                  {step.isWriteAction && (
                    <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900">
                      Write action (requires confirmation)
                    </span>
                  )}
                </div>
                {step.args && Object.keys(step.args).length > 0 && (
                  <pre className="p-2.5 rounded bg-surface-900 text-slate-300 font-mono text-[11px] overflow-x-auto border border-surface-800">
                    {JSON.stringify(step.args, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* 3. Observation */}
            {step.result && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400 block">Observation:</span>
                <div className="p-2.5 rounded bg-surface-900 text-slate-300 font-mono text-[11px] overflow-x-auto border border-surface-800 max-h-40">
                  <pre>{typeof step.result === 'object' ? JSON.stringify(step.result, null, 2) : String(step.result)}</pre>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* In-progress status */}
        {isExecuting && (
          <div className="flex items-center gap-2 p-3 bg-surface-950 border border-surface-800 rounded-md text-xs text-slate-300">
            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
            <span>{currentAction || 'Evaluating next action in ReAct loop...'}</span>
          </div>
        )}

        {/* Final output */}
        {finalAnswer && (
          <div className="border border-emerald-800/80 bg-surface-950 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Goal completed</span>
            </div>
            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed pl-5">
              {finalAnswer}
            </p>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="border border-rose-900 bg-rose-950/30 rounded-md p-3 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Execution error</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
