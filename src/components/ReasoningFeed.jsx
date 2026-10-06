import React, { useEffect, useRef, useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Check, 
  X, 
  ShieldAlert, 
  Clock, 
  XCircle, 
  Copy, 
  Calendar 
} from 'lucide-react';

function parseInline(str) {
  if (!str) return '';
  const parts = [];
  const regex = /(\*\*.*?\*\*|\*[^*]+?\*|`[^`]+?`|https?:\/\/[^\s]+|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-zinc-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-zinc-800">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-800 rounded font-mono text-[11px] border border-zinc-200">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium break-all"
          >
            {linkMatch[1]}
          </a>
        );
      }
    } else if (token.startsWith('http://') || token.startsWith('https://')) {
      parts.push(
        <a
          key={match.index}
          href={token}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-medium break-all"
        >
          {token}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts.length > 0 ? parts : str;
}

function TableCell({ cell, header = '' }) {
  const [copied, setCopied] = useState(false);
  const val = (cell || '').trim();
  const valLower = val.toLowerCase();
  const headerLower = header.toLowerCase();

  // Status column formatting
  if (
    headerLower.includes('status') ||
    headerLower.includes('state') ||
    ['completed', 'done', 'pending', 'in_progress', 'in progress', 'todo', 'cancelled', 'canceled', 'failed'].includes(valLower)
  ) {
    if (valLower === 'completed' || valLower === 'done' || valLower === 'true') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
          <span>Completed</span>
        </span>
      );
    }
    if (valLower === 'pending' || valLower === 'todo' || valLower === 'open') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
          <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
          <span>Pending</span>
        </span>
      );
    }
    if (valLower.includes('progress')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80">
          <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
          <span>In Progress</span>
        </span>
      );
    }
    if (valLower === 'cancelled' || valLower === 'canceled' || valLower === 'failed' || valLower === 'false') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80">
          <XCircle className="w-3 h-3 text-rose-600 flex-shrink-0" />
          <span className="capitalize">{val}</span>
        </span>
      );
    }
  }

  // Priority column formatting
  if (
    headerLower.includes('priority') ||
    ['high', 'urgent', 'medium', 'med', 'low'].includes(valLower)
  ) {
    if (valLower === 'high' || valLower === 'urgent') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          High
        </span>
      );
    }
    if (valLower === 'medium' || valLower === 'med') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          Med
        </span>
      );
    }
    if (valLower === 'low') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
          Low
        </span>
      );
    }
  }

  // ID column formatting (MongoDB ObjectId or general ID)
  if (headerLower === 'id' || headerLower.includes('id') || /^[a-f0-9]{24}$/i.test(val)) {
    const isMongoId = /^[a-f0-9]{24}$/i.test(val);
    const handleCopy = (e) => {
      e.stopPropagation();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(val);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    return (
      <span
        onClick={handleCopy}
        className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded border border-zinc-200 select-all cursor-pointer transition-colors"
        title={copied ? 'Copied!' : `Click to copy ID: ${val}`}
      >
        <span>{isMongoId ? `${val.slice(0, 6)}…${val.slice(-4)}` : val}</span>
        {copied ? (
          <Check className="w-2.5 h-2.5 text-emerald-600" />
        ) : (
          <Copy className="w-2.5 h-2.5 text-zinc-400" />
        )}
      </span>
    );
  }

  // Due Date / Date column
  if (
    headerLower.includes('due') ||
    headerLower.includes('date') ||
    /^\d{4}-\d{2}-\d{2}/.test(val)
  ) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-600 whitespace-nowrap">
          <Calendar className="w-3 h-3 text-zinc-400" />
          <span>{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </span>
      );
    }
  }

  // Default: parsed inline markdown
  return <span>{parseInline(val)}</span>;
}

function MarkdownTable({ headers, rows }) {
  return (
    <div className="my-2.5 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-zinc-50/70 transition-colors">
                {headers.map((h, colIdx) => (
                  <td key={colIdx} className="px-3 py-2 text-zinc-700 align-middle">
                    <TableCell cell={row[colIdx] ?? ''} header={h} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormattedMessage({ text }) {
  if (!text) return null;

  // Parse text into structured blocks: paragraphs, markdown tables, and code blocks
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  function isTableRow(line) {
    if (!line.includes('|')) return false;
    const parts = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
    return parts.length >= 2;
  }

  function isTableSeparator(line) {
    if (!line.includes('|') || !line.includes('-')) return false;
    const parts = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
    if (parts.length < 2) return false;
    return parts.every(p => /^[:\s]*-+[:\s]*$/.test(p.trim()));
  }

  function splitRow(line) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().replace(/^```/, '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') });
      continue;
    }

    // Markdown table detection: row followed by separator
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Standard text line
    blocks.push({ type: 'text', content: line });
    i++;
  }

  return (
    <div className="space-y-1 text-xs text-zinc-800 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        if (block.type === 'table') {
          return <MarkdownTable key={idx} headers={block.headers} rows={block.rows} />;
        }

        if (block.type === 'code') {
          return (
            <div key={idx} className="my-2 rounded bg-zinc-900 text-zinc-100 p-2.5 font-mono text-[11px] overflow-x-auto border border-zinc-800">
              <pre>{block.content}</pre>
            </div>
          );
        }

        const line = block.content;
        if (!line.trim()) {
          return <div key={idx} className="h-1.5" />;
        }

        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ');
        const rawContent = isBullet ? line.trim().replace(/^[-*•]\s+/, '') : line;
        const content = rawContent.replace(/^(\+\+|\-\-|\#\#)\s*/, '');

        return (
          <div key={idx} className={isBullet ? 'flex items-start gap-1.5 pl-1' : ''}>
            {isBullet && <span className="text-zinc-400 mt-0.5">•</span>}
            <div className="flex-1">{parseInline(content)}</div>
          </div>
        );
      })}
    </div>
  );
}

export function ReasoningFeed({ 
  steps = [], 
  isExecuting, 
  currentAction, 
  finalAnswer, 
  error, 
  goal 
}) {
  const scrollContainerRef = useRef(null);

  // Only display steps that have actual execution trace information (thought, tool call, observation),
  // or the currently active step if the agent is still running.
  // Suppresses empty finalization placeholders once execution is finished.
  const visibleSteps = steps.filter(
    (step) => step.thought || step.tool || step.result || (isExecuting && !finalAnswer)
  );

  // Auto-scroll ONLY the inner timeline container, never the browser window
  useEffect(() => {
    if (visibleSteps.length === 0 && !isExecuting && !finalAnswer) return;

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleSteps.length, isExecuting, finalAnswer, error]);

  return (
    <div className="flex-1 flex flex-col bg-white min-h-[500px]">
      {/* Trace Header / Status strip */}
      <div className="p-3 border-b border-canvas-border flex items-center justify-between bg-canvas-subtle">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-xs font-semibold text-zinc-800">Live Execution Trace</span>
          {visibleSteps.length > 0 && (
            <span className="text-[10px] text-zinc-500 font-mono">
              ({visibleSteps.length} {visibleSteps.length === 1 ? 'cycle' : 'cycles'})
            </span>
          )}
        </div>

        {isExecuting && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />
            <span>Loop active</span>
          </div>
        )}
      </div>

      {/* Trace Timeline Body - Internal scroll container */}
      <div ref={scrollContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {goal && (
          <div className="p-2.5 rounded bg-canvas-subtle border-l-2 border-zinc-800 text-xs">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-0.5 font-medium">Active Request</span>
            <p className="text-zinc-800">{goal}</p>
          </div>
        )}

        {/* Empty state */}
        {visibleSteps.length === 0 && !isExecuting && !finalAnswer && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <p className="text-xs text-zinc-700 font-medium">Trace idle</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mt-1">
              Enter a goal above. The agent will autonomously break it into Reason, Act, and Observe steps, streaming its tool parameters and awaiting your approval for write actions.
            </p>
          </div>
        )}

        {/* Timeline Trace Spine */}
        {visibleSteps.length > 0 && (
          <div className="relative pl-6 border-l border-zinc-200 space-y-5 my-2">
            {visibleSteps.map((step, idx) => {
              const isApproved = step.confirmedStatus === 'approved' || step.status === 'approved';
              const isRejected = step.confirmedStatus === 'rejected' || step.status === 'rejected';
              const isAwaiting = (step.isWriteAction || step.status === 'awaiting_confirmation') && !isApproved && !isRejected && !finalAnswer;

              return (
                <div key={step.id || idx} className="relative space-y-2">
                  {/* Spine Node Marker */}
                  <div
                    className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                      isApproved
                        ? 'bg-emerald-500 ring-2 ring-emerald-100'
                        : isRejected
                        ? 'bg-rose-500 ring-2 ring-rose-100'
                        : isAwaiting
                        ? 'bg-amber-500 ring-2 ring-amber-100 animate-pulse'
                        : step.result
                        ? 'bg-zinc-800'
                        : 'bg-zinc-300'
                    }`}
                  />

                  {/* Step header */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="font-mono text-zinc-700 font-semibold">Cycle {step.step || idx + 1}</span>
                    <span className="font-mono">{step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''}</span>
                  </div>

                  {/* 1. Reasoning Section */}
                  {step.thought && (
                    <div className="pl-2 border-l border-zinc-300 text-xs text-zinc-700 leading-relaxed">
                      <span className="text-[10px] text-zinc-500 block mb-0.5 font-medium">Reasoning:</span>
                      <p>{step.thought}</p>
                    </div>
                  )}

                  {/* 2. Tool Invocation Section */}
                  {step.tool && (
                    <div className="bg-canvas-subtle p-2.5 rounded border border-canvas-border text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-zinc-500">$ call</span>
                          <span className="text-zinc-900 font-semibold">{step.tool}</span>
                        </div>

                        {/* Confirmation State Badges */}
                        {isApproved && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Approved & executed
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1 font-medium">
                            <X className="w-3 h-3 text-rose-600" />
                            Action rejected
                          </span>
                        )}
                        {isAwaiting && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-medium">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            Awaiting user confirmation
                          </span>
                        )}
                      </div>

                      {step.args && Object.keys(step.args).length > 0 && (
                        <pre className="p-2 rounded bg-white text-zinc-700 font-mono text-[10px] overflow-x-auto border border-canvas-border">
                          {JSON.stringify(step.args, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* 3. Observation Section */}
                  {step.result && (
                    <div className="bg-canvas-subtle p-2.5 rounded border border-canvas-border text-xs space-y-1">
                      <span className="text-[10px] text-zinc-500 font-medium block">Observation:</span>
                      <div className="p-2 rounded bg-white text-zinc-800 font-mono text-[10px] overflow-x-auto border border-canvas-border max-h-36">
                        <pre>{typeof step.result === 'object' ? JSON.stringify(step.result, null, 2) : String(step.result)}</pre>
                      </div>
                    </div>
                  )}

                  {/* 4. Active reasoning placeholder if waiting for tool */}
                  {!step.thought && !step.tool && !step.result && isExecuting && !finalAnswer && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 italic py-1">
                      <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                      <span>Evaluating next action in cycle...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Active execution indicator */}
        {isExecuting && (
          <div className="flex items-center gap-2 p-2.5 rounded bg-canvas-subtle border border-canvas-border text-xs text-zinc-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />
            <span>{currentAction || 'Evaluating next action in ReAct loop...'}</span>
          </div>
        )}

        {/* Final output */}
        {finalAnswer && (
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Goal completed</span>
            </div>
            <div className="pl-5">
              <FormattedMessage text={finalAnswer} />
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="border border-rose-200 bg-rose-50 rounded p-3 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Execution halted</span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
