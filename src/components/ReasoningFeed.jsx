import React, { useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Wrench, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Terminal,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

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

  const renderToolArgs = (args) => {
    if (!args || Object.keys(args).length === 0) return null;
    return (
      <pre className="bg-dark-950/90 text-slate-300 p-2.5 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800/80 mt-1.5">
        {JSON.stringify(args, null, 2)}
      </pre>
    );
  };

  const renderToolResult = (result) => {
    if (!result) return null;
    let formatted = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    return (
      <div className="bg-dark-950/90 text-emerald-300/90 p-2.5 rounded-lg text-xs font-mono overflow-x-auto border border-emerald-950/60 mt-1.5 max-h-48">
        <pre>{formatted}</pre>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-dark-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md min-h-[480px]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-dark-900/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Live ReAct Reasoning Stream
          </h2>
          {steps.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </span>
          )}
        </div>
        
        {isExecuting && (
          <div className="flex items-center gap-2 text-xs text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping"></span>
            <span className="font-medium">Orchestrator Active</span>
          </div>
        )}
      </div>

      {/* Feed Content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans">
        {goal && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-xs text-slate-300">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
              Active Goal
            </span>
            <p className="font-medium text-slate-200">{goal}</p>
          </div>
        )}

        {steps.length === 0 && !isExecuting && !finalAnswer && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <BrainCircuit className="w-12 h-12 mb-3 text-slate-700 stroke-1" />
            <p className="text-sm font-medium text-slate-400">Agent Idle — Awaiting Goal</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Type a goal or click a suggestion chip above. The agent will autonomously break down the goal, call tools, and request human confirmation for write actions.
            </p>
          </div>
        )}

        {/* Steps Loop */}
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden shadow-sm animate-fade-in"
          >
            {/* Step Header */}
            <div className="bg-slate-850 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 font-mono">
                Step {step.step || idx + 1}
              </span>
              <span className="text-[11px] text-slate-400">
                {step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''}
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* 1. REASON */}
              {step.thought && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>REASON (Thought)</span>
                  </div>
                  <p className="text-xs text-slate-300 pl-5 leading-relaxed bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-900/30">
                    {step.thought}
                  </p>
                </div>
              )}

              {/* 2. ACT */}
              {step.tool && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>ACT (Tool Call)</span>
                    <span className="font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded text-[11px] border border-amber-500/20 ml-1">
                      {step.tool}
                    </span>
                    {step.isWriteAction && (
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/20 font-medium">
                        Write Guardrail
                      </span>
                    )}
                  </div>
                  <div className="pl-5">
                    {renderToolArgs(step.args)}
                  </div>
                </div>
              )}

              {/* 3. OBSERVE */}
              {step.result && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>OBSERVE (Result)</span>
                  </div>
                  <div className="pl-5">
                    {renderToolResult(step.result)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Current Execution State Indicator */}
        {isExecuting && (
          <div className="flex items-center gap-3 p-4 bg-slate-800/30 border border-slate-700/40 rounded-xl text-xs text-slate-300 animate-pulse">
            <BrainCircuit className="w-4 h-4 text-brand-400 animate-spin" />
            <div>
              <p className="font-medium text-slate-200">
                {currentAction ? `Executing: ${currentAction}...` : 'Analyzing next step in ReAct loop...'}
              </p>
              <p className="text-[11px] text-slate-400">Evaluating observations against available tools</p>
            </div>
          </div>
        )}

        {/* Final Completed Answer */}
        {finalAnswer && (
          <div className="border border-brand-500/40 bg-gradient-to-br from-brand-950/40 via-dark-900 to-emerald-950/30 rounded-xl p-4 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              <span>Goal Achieved — Final Response</span>
            </div>
            <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed pl-6 font-sans">
              {finalAnswer}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="border border-rose-500/40 bg-rose-950/30 rounded-xl p-4 shadow-lg text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Execution Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
