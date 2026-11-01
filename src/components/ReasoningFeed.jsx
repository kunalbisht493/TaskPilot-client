import React, { useEffect, useRef, useState } from 'react';
import { formatIndianDate } from '../utils/dateUtils';
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
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Bot,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

/**
 * Strips any literal double-asterisks or markdown bold artifacts from strings
 */
function cleanMarkdownArtifacts(str) {
  if (!str) return '';
  return String(str).replace(/\*\*/g, '').trim();
}

/**
 * Parses inline formatting (bold, italic, code, links) while guaranteeing
 * no literal ** artifacts ever appear in rendered text.
 */
function parseInline(str) {
  if (!str) return '';
  const parts = [];
  const regex = /(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`|https?:\/\/[^\s]+|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      // Remove any stray ** from plain text slices
      const plain = str.substring(lastIndex, match.index).replace(/\*\*/g, '');
      if (plain) parts.push(plain);
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const innerText = token.slice(2, -2).replace(/\*\*/g, '').trim();
      parts.push(
        <strong key={match.index} className="font-semibold text-zinc-900">
          {innerText}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      const innerText = token.slice(1, -1).replace(/\*/g, '').trim();
      parts.push(
        <em key={match.index} className="italic text-zinc-800">
          {innerText}
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
        const linkLabel = cleanMarkdownArtifacts(linkMatch[1]);
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-medium break-all"
          >
            <span>{linkLabel}</span>
            <ExternalLink className="w-2.5 h-2.5 inline" />
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
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-medium break-all"
        >
          <span>{token}</span>
          <ExternalLink className="w-2.5 h-2.5 inline" />
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    const remaining = str.substring(lastIndex).replace(/\*\*/g, '');
    if (remaining) parts.push(remaining);
  }

  return parts.length > 0 ? parts : cleanMarkdownArtifacts(str);
}

function TableCell({ cell, header = '' }) {
  const [copied, setCopied] = useState(false);
  const val = cleanMarkdownArtifacts(cell || '');
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
          <span>{formatIndianDate(val, 'short')}</span>
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
                  {cleanMarkdownArtifacts(h)}
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

/**
 * Renders structured event/meeting details cleanly with icons, zero markdown artifacts
 */
function MeetingCard({ items, isConflict = false }) {
  const getIcon = (label = '') => {
    const l = label.toLowerCase();
    if (l.includes('date')) return <Calendar className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
    if (l.includes('time')) return <Clock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
    if (l.includes('location') || l.includes('platform')) return <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
    if (l.includes('whom') || l.includes('participant') || l.includes('attendee')) return <Users className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
    if (l.includes('link')) return <ExternalLink className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />;
    return <FileText className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
  };

  const titleItem = items.find(i => /^(meeting|title|summary|event)$/i.test(i.key));
  const otherItems = items.filter(i => !/^(meeting|title|summary|event)$/i.test(i.key));

  return (
    <div className={`my-3 p-3.5 rounded-lg border text-xs ${
      isConflict 
        ? 'bg-amber-50/40 border-amber-200/90' 
        : 'bg-zinc-50/80 border-zinc-200/90'
    }`}>
      {titleItem && (
        <div className="font-semibold text-sm text-zinc-900 pb-2 mb-2 border-b border-zinc-200/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className={`w-4 h-4 flex-shrink-0 ${isConflict ? 'text-amber-600' : 'text-zinc-700'}`} />
            <span className="truncate">{cleanMarkdownArtifacts(titleItem.value)}</span>
          </div>
          {isConflict && (
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/80 flex-shrink-0">
              Existing Event
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-zinc-700">
        {otherItems.map((item, idx) => {
          const cleanKey = cleanMarkdownArtifacts(item.key);
          const cleanVal = cleanMarkdownArtifacts(item.value);

          return (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-0.5">{getIcon(cleanKey)}</span>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium block">
                  {cleanKey}
                </span>
                <span className="text-zinc-900 font-medium text-xs break-words">
                  {parseInline(cleanVal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormattedMessage({ text, isConflict = false }) {
  if (!text) return null;

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

  // Key-value matcher for meeting cards
  const kvPattern = /^[-*•]?\s*\*{0,2}(Meeting|Title|Date|Time|Location|Platform|With Whom|Participants|Attendees|Meeting Link|Link|Summary|Event)\*{0,2}\s*:\s*(.*)$/i;

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

    // Markdown table
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

    // Key-Value group (structured meeting details)
    if (kvPattern.test(line.trim())) {
      const cardItems = [];
      while (i < lines.length && (kvPattern.test(lines[i].trim()) || lines[i].trim() === '')) {
        if (lines[i].trim() !== '') {
          const match = lines[i].trim().match(kvPattern);
          if (match) {
            cardItems.push({ 
              key: cleanMarkdownArtifacts(match[1]), 
              value: cleanMarkdownArtifacts(match[2]) 
            });
          }
        }
        i++;
      }
      if (cardItems.length > 0) {
        blocks.push({ type: 'card', items: cardItems });
      }
      continue;
    }

    // Markdown headings (#, ##, ###)
    if (line.trim().startsWith('#')) {
      const level = (line.trim().match(/^#+/) || ['#'])[0].length;
      const rawContent = line.trim().replace(/^#+\s*/, '').replace(/^(?:📅|⚠️|🎉|🛑|💡|📌)\s*/u, '');
      const content = cleanMarkdownArtifacts(rawContent);
      blocks.push({ type: 'heading', level, content });
      i++;
      continue;
    }

    // Standalone prominent title line (e.g. "There's a scheduling conflict.")
    const isStandaloneTitle = i === 0 && /^there'?s a scheduling conflict/i.test(line.trim());
    if (isStandaloneTitle) {
      blocks.push({ type: 'heading', level: 3, content: cleanMarkdownArtifacts(line.trim()) });
      i++;
      continue;
    }

    // Standard text line
    blocks.push({ type: 'text', content: line });
    i++;
  }

  return (
    <div className="space-y-2.5 text-xs text-zinc-800 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        if (block.type === 'card') {
          return <MeetingCard key={idx} items={block.items} isConflict={isConflict} />;
        }

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

        if (block.type === 'heading') {
          return (
            <h4 key={idx} className="text-sm font-semibold text-zinc-900 mt-2 mb-1 flex items-center gap-1.5">
              <span>{block.content}</span>
            </h4>
          );
        }

        const line = block.content;
        if (!line.trim()) {
          return <div key={idx} className="h-1" />;
        }

        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ');
        const rawContent = isBullet ? line.trim().replace(/^[-*•]\s+/, '') : line;
        const content = rawContent.replace(/^(\+\+|--|##)\s*/, '');

        // Prompt / question call-out (e.g. "Would you like to choose another time?")
        const isPromptQuestion = /^(would you like|how would you like|please choose|please let me know)/i.test(content.trim()) || (content.trim().endsWith('?') && content.length < 80);

        if (isPromptQuestion) {
          return (
            <div key={idx} className="pt-2 font-medium text-zinc-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 flex-shrink-0"></span>
              <span>{parseInline(content)}</span>
            </div>
          );
        }

        return (
          <div key={idx} className={isBullet ? 'flex items-start gap-2 pl-1' : ''}>
            {isBullet && <span className="text-zinc-400 mt-0.5 font-bold">•</span>}
            <div className="flex-1">{parseInline(content)}</div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Maps raw backend ReAct steps into clean user-friendly activity items.
 * Strictly hides cycle counts, raw tool names, JSON payloads, and internal reasoning.
 */
function getCleanActivities(steps = [], isExecuting = false, finalAnswer = null) {
  const activities = [];

  // When execution begins before any steps exist
  if (isExecuting && steps.length === 0) {
    return [
      {
        id: 'init',
        label: 'Working on your request...',
        status: 'in_progress',
      },
    ];
  }

  steps.forEach((step, idx) => {
    const isLast = idx === steps.length - 1;
    const isStepExecuting = isExecuting && isLast && !finalAnswer;

    if (!step.tool) {
      if (isStepExecuting) {
        activities.push({
          id: `reasoning_${idx}`,
          label: 'Working on your request...',
          status: 'in_progress',
        });
      }
      return;
    }

    const tool = step.tool;
    const isDone = Boolean(step.result) || step.confirmedStatus === 'approved';
    const isRejected = step.confirmedStatus === 'rejected';
    const isAwaiting = (step.isWriteAction || step.status === 'awaiting_confirmation') && !step.confirmedStatus && !finalAnswer;

    if (tool === 'get_current_time') {
      activities.push({
        id: `time_${idx}`,
        label: isDone ? 'Checked current date and time' : 'Checking current date and time...',
        status: isDone ? 'completed' : 'in_progress',
      });
    } else if (tool === 'check_calendar_availability') {
      const hasConflicts = step.result?.hasConflicts || step.result?.totalEvents > 0;
      activities.push({
        id: `cal_avail_${idx}`,
        label: isDone ? 'Checked calendar availability' : 'Checking calendar availability...',
        status: isDone ? 'completed' : 'in_progress',
      });

      if (isDone) {
        activities.push({
          id: `cal_conflicts_${idx}`,
          label: hasConflicts ? 'Reviewed existing meetings & conflicts' : 'Verified schedule is clear',
          status: 'completed',
        });
      }
    } else if (tool === 'create_calendar_event') {
      const title = step.args?.summary ? `"${cleanMarkdownArtifacts(step.args.summary)}"` : 'meeting';
      if (isAwaiting) {
        activities.push({
          id: `cal_create_${idx}`,
          label: `Awaiting approval to schedule ${title}`,
          status: 'awaiting',
        });
      } else if (isRejected) {
        activities.push({
          id: `cal_create_${idx}`,
          label: `Meeting scheduling cancelled (${title})`,
          status: 'rejected',
        });
      } else {
        activities.push({
          id: `cal_create_${idx}`,
          label: isDone ? `Scheduled ${title} in Google Calendar` : `Preparing calendar event ${title}...`,
          status: isDone ? 'completed' : 'in_progress',
        });
      }
    } else if (tool === 'list_tasks') {
      activities.push({
        id: `task_list_${idx}`,
        label: isDone ? 'Reviewed existing tasks' : 'Checking existing tasks...',
        status: isDone ? 'completed' : 'in_progress',
      });
    } else if (tool === 'create_task') {
      const title = step.args?.title ? `"${cleanMarkdownArtifacts(step.args.title)}"` : 'task';
      if (isAwaiting) {
        activities.push({
          id: `task_create_${idx}`,
          label: `Awaiting approval to create ${title}`,
          status: 'awaiting',
        });
      } else if (isRejected) {
        activities.push({
          id: `task_create_${idx}`,
          label: `Task creation cancelled (${title})`,
          status: 'rejected',
        });
      } else {
        activities.push({
          id: `task_create_${idx}`,
          label: isDone ? `Created task ${title}` : `Creating task ${title}...`,
          status: isDone ? 'completed' : 'in_progress',
        });
      }
    } else if (tool === 'complete_task') {
      const title = step.args?.title ? `"${cleanMarkdownArtifacts(step.args.title)}"` : 'task';
      if (isAwaiting) {
        activities.push({
          id: `task_complete_${idx}`,
          label: `Awaiting approval to complete ${title}`,
          status: 'awaiting',
        });
      } else if (isRejected) {
        activities.push({
          id: `task_complete_${idx}`,
          label: `Task completion cancelled (${title})`,
          status: 'rejected',
        });
      } else {
        activities.push({
          id: `task_complete_${idx}`,
          label: isDone ? `Marked ${title} as completed` : `Updating ${title}...`,
          status: isDone ? 'completed' : 'in_progress',
        });
      }
    } else if (tool === 'calculate') {
      activities.push({
        id: `calc_${idx}`,
        label: isDone ? 'Calculated schedule duration' : 'Calculating schedule duration...',
        status: isDone ? 'completed' : 'in_progress',
      });
    } else {
      const friendlyName = cleanMarkdownArtifacts(tool.replace(/_/g, ' '));
      activities.push({
        id: `tool_${idx}`,
        label: isDone ? `Completed ${friendlyName}` : `Processing ${friendlyName}...`,
        status: isDone ? 'completed' : 'in_progress',
      });
    }
  });

  // If still actively running and all recorded activities are marked done, add current working state
  if (isExecuting && !finalAnswer) {
    const lastActivity = activities[activities.length - 1];
    if (!lastActivity || lastActivity.status === 'completed') {
      activities.push({
        id: 'working_current',
        label: 'Working on your request...',
        status: 'in_progress',
      });
    }
  }

  return activities;
}

/**
 * Compact, clean activity checklist component
 * Displays "X actions completed" summary with "View steps" / "Hide steps"
 */
function ActivityDisplay({ steps, isExecuting, finalAnswer }) {
  const [expanded, setExpanded] = useState(false);
  const activities = getCleanActivities(steps, isExecuting, finalAnswer);

  if (activities.length === 0 && !isExecuting) return null;

  const isCompleted = Boolean(finalAnswer) && !isExecuting;
  const completedCount = activities.filter((a) => a.status === 'completed').length;

  return (
    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-3 text-xs mb-3 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span className="font-medium text-zinc-800">
            {isExecuting
              ? 'Working on your request...'
              : `${completedCount} ${completedCount === 1 ? 'action' : 'actions'} completed`}
          </span>
        </div>

        {isCompleted && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 px-1.5 py-0.5 rounded hover:bg-zinc-200/60 transition-colors"
          >
            <span>{expanded ? 'Hide steps' : 'View steps'}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {(expanded || isExecuting) && (
        <div className="mt-2.5 space-y-1.5 pt-2 border-t border-zinc-200/60">
          {activities.map((act) => (
            <div key={act.id} className="flex items-center justify-between gap-2 py-0.5 text-zinc-700">
              <div className="flex items-center gap-2 min-w-0">
                {act.status === 'completed' && (
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                )}
                {act.status === 'in_progress' && (
                  <Loader2 className="w-3 h-3 animate-spin text-zinc-500 flex-shrink-0" />
                )}
                {act.status === 'awaiting' && (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                )}
                {act.status === 'rejected' && (
                  <X className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                )}
                <span className={`text-[12px] truncate ${act.status === 'in_progress' ? 'text-zinc-600 font-medium' : 'text-zinc-700'}`}>
                  {act.label}
                </span>
              </div>
              {act.status === 'completed' && (
                <span className="text-[11px] text-emerald-600 font-medium">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Polished, user-ready Assistant Response Card
 */
function AssistantResponseCard({ text }) {
  const [copied, setCopied] = useState(false);

  if (!text) return null;

  const isConflict = /conflict|overlap|already scheduled/i.test(text);
  const isSuccess = /scheduled successfully|created successfully|task created|task complete/i.test(text);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-5 shadow-xs transition-all ${
      isConflict 
        ? 'bg-white border-amber-200/90 ring-1 ring-amber-100/50' 
        : isSuccess
        ? 'bg-white border-emerald-200/90 ring-1 ring-emerald-100/50'
        : 'bg-white border-zinc-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-zinc-900">TaskPilot</span>
          {isConflict && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Scheduling Conflict
            </span>
          )}
          {isSuccess && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Confirmed
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="text-zinc-400 hover:text-zinc-700 p-1 rounded hover:bg-zinc-100 transition-colors flex items-center gap-1 text-[11px]"
          title={copied ? 'Copied to clipboard!' : 'Copy response'}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[10px] hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Formatted Content */}
      <FormattedMessage text={text} isConflict={isConflict} />
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

  // Auto-scroll the timeline container smoothly on new activities or answers
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [steps.length, isExecuting, finalAnswer, error]);

  const hasActivity = steps.length > 0 || isExecuting || finalAnswer;

  return (
    <div className="flex-1 flex flex-col bg-white min-h-[500px]">
      {/* Header / Status strip */}
      <div className="p-3 border-b border-canvas-border flex items-center justify-between bg-canvas-subtle">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-xs font-semibold text-zinc-800">Assistant Activity</span>
        </div>

        {isExecuting ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
            <span>{currentAction || 'Working on your request...'}</span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-400 font-sans">Ready</span>
        )}
      </div>

      {/* Content Body */}
      <div ref={scrollContainerRef} className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5">
        {/* Active Request bubble */}
        {goal && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 mb-3">
            <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
              You
            </div>
            <div className="flex-1 text-xs text-zinc-900 leading-relaxed font-medium">
              {goal}
            </div>
          </div>
        )}

        {/* Empty placeholder state */}
        {!hasActivity && (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-700 flex items-center justify-center mb-3">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800">How can I help you today?</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1.5 leading-relaxed">
              Ask me to check your calendar, book meetings, or organize your to-do tasks. I will always ask for your confirmation before making any changes.
            </p>
          </div>
        )}

        {/* Clean Activity Display (No cycles, no JSON, no raw tool names) */}
        {hasActivity && (
          <ActivityDisplay 
            steps={steps} 
            isExecuting={isExecuting} 
            finalAnswer={finalAnswer} 
          />
        )}

        {/* Polished Assistant Response */}
        {finalAnswer && (
          <AssistantResponseCard text={finalAnswer} />
        )}

        {/* Error notification */}
        {error && (
          <div className="border border-rose-200 bg-rose-50 rounded-lg p-3.5 text-xs text-rose-800 flex items-start gap-2">
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
