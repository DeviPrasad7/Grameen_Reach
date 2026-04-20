'use client';
import React from 'react';

interface AiResponseRendererProps {
  text: string;
  accentColor?: 'primary' | 'blue' | 'amber' | 'emerald';
}

/**
 * Extracts clean text from AI responses that may be wrapped in JSON.
 * Handles: {"msg": "..."}, {"message": "..."}, {"response": "..."}, {"text": "..."},
 * or any object with a string field.
 */
function extractText(raw: string): string {
  const trimmed = raw.trim();

  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  // Not JSON-like? Return as-is
  if (!candidate.startsWith('{') && !candidate.startsWith('[')) {
    return candidate;
  }

  try {
    const parsed = JSON.parse(candidate);

    // If it's a string directly, return it
    if (typeof parsed === 'string') return parsed;

    // If it's an object, look for common text fields
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Priority list of fields that typically contain the main text
      const textFields = ['msg', 'message', 'response', 'text', 'content', 'answer', 'result', 'output', 'reply', 'data'];
      for (const field of textFields) {
        if (typeof parsed[field] === 'string' && parsed[field].length > 0) {
          return parsed[field];
        }
      }

      // If it's a structured listing object (from listing generator), keep it as JSON for structured rendering
      if (parsed.title || parsed.suggestedPrice || parsed.description) {
        return candidate; // Let the structured renderer handle it
      }

      // Last resort: join all string values
      const stringVals = Object.values(parsed).filter((v): v is string => typeof v === 'string' && v.length > 10);
      if (stringVals.length > 0) {
        return stringVals.join('\n\n');
      }
    }

    // Array of strings
    if (Array.isArray(parsed)) {
      const strings = parsed.filter((v): v is string => typeof v === 'string');
      if (strings.length > 0) return strings.join('\n');
    }
  } catch {
    // Not valid JSON, return as-is
  }

  return candidate;
}

/** Strips markdown bold markers and returns clean text */
function stripBold(text: string): string {
  return text.replace(/\*\*/g, '');
}

/** Renders a single line of markdown-like text into React elements */
function renderLine(line: string, index: number, accentColor: string): React.ReactNode {
  const trimmed = line.trim();

  // Empty line
  if (!trimmed) return <div key={index} className="h-3" />;

  // Heading: ### or ## or #
  if (/^#{1,3}\s+/.test(trimmed)) {
    const text = trimmed.replace(/^#{1,3}\s+/, '');
    return (
      <h3 key={index} className="text-base font-bold text-slate-800 mt-4 mb-1">
        {renderInlineFormatting(stripBold(text))}
      </h3>
    );
  }

  // Bold-only line: **Some Header**
  if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
    return (
      <p key={index} className="font-bold text-slate-800 mt-3 mb-1 text-sm">
        {stripBold(trimmed)}
      </p>
    );
  }

  // Bold prefix: **Label:** value
  if (/^\*\*[^*]+\*\*/.test(trimmed)) {
    const match = trimmed.match(/^\*\*([^*]+)\*\*(.*)/);
    if (match) {
      return (
        <p key={index} className="text-sm mt-1.5">
          <span className="font-semibold text-slate-800">{match[1]}</span>
          <span className="text-slate-600">{renderInlineFormatting(stripBold(match[2]))}</span>
        </p>
      );
    }
  }

  // Table separator row
  if (/^\|[\s-:|]+\|$/.test(trimmed)) {
    return null;
  }

  // Table header or data row
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    const cells = trimmed.split('|').filter(Boolean).map(c => c.trim());
    // Detect if it's a header (first table row)
    return (
      <div key={index} className="grid gap-2 py-2 border-b border-slate-100 text-sm" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
        {cells.map((cell, j) => (
          <span key={j} className={j === 0 ? 'font-medium text-slate-800' : 'text-slate-600'}>
            {renderInlineFormatting(stripBold(cell))}
          </span>
        ))}
      </div>
    );
  }

  // Bullet points: -, *, or bullet char
  if (/^[-*\u2022]\s/.test(trimmed)) {
    const bulletColors: Record<string, string> = {
      primary: 'text-green-500',
      blue: 'text-blue-500',
      amber: 'text-amber-500',
      emerald: 'text-emerald-500',
    };
    return (
      <div key={index} className="flex items-start gap-2 text-sm text-slate-700 ml-1 mt-1">
        <span className={`mt-1 text-xs ${bulletColors[accentColor] || 'text-green-500'}`}>&#9679;</span>
        <span className="flex-1">{renderInlineFormatting(stripBold(trimmed.replace(/^[-*\u2022]\s+/, '')))}</span>
      </div>
    );
  }

  // Numbered items: 1. or 1)
  if (/^\d+[.)]\s/.test(trimmed)) {
    const numColors: Record<string, string> = {
      primary: 'text-green-600',
      blue: 'text-blue-600',
      amber: 'text-amber-600',
      emerald: 'text-emerald-600',
    };
    const num = trimmed.match(/^(\d+)/)?.[1];
    return (
      <div key={index} className="flex items-start gap-2.5 text-sm text-slate-700 mt-1.5">
        <span className={`font-bold min-w-[1.5rem] ${numColors[accentColor] || 'text-green-600'}`}>{num}.</span>
        <span className="flex-1">{renderInlineFormatting(stripBold(trimmed.replace(/^\d+[.)]\s+/, '')))}</span>
      </div>
    );
  }

  // Regular paragraph
  return (
    <p key={index} className="text-sm text-slate-700 mt-1 leading-relaxed">
      {renderInlineFormatting(stripBold(trimmed))}
    </p>
  );
}

/** Renders inline formatting like bold, italic, code, and rupee amounts */
function renderInlineFormatting(text: string): React.ReactNode {
  // Split on inline bold **text** patterns
  const parts = text.split(/(\*\*[^*]+\*\*|\`[^`]+\`|₹[\d,]+(?:\.\d+)?)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-700">{part.slice(1, -1)}</code>;
    }
    if (/^₹[\d,]+/.test(part)) {
      return <span key={i} className="font-semibold text-emerald-700">{part}</span>;
    }
    return part;
  });
}

export default function AiResponseRenderer({ text, accentColor = 'primary' }: AiResponseRendererProps) {
  const cleanText = extractText(text);
  const lines = cleanText.split('\n');

  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => renderLine(line, i, accentColor))}
    </div>
  );
}

/**
 * Utility to extract clean text from an AI API response object.
 * Use this before setting state to avoid storing raw JSON.
 */
export function extractAiResponseText(data: Record<string, unknown>): string {
  // Try standard fields the backend returns
  if (typeof data.response === 'string' && data.response.length > 0) {
    return data.response;
  }
  if (typeof data.result === 'string' && data.result.length > 0) {
    return data.result;
  }
  if (typeof data.text === 'string' && data.text.length > 0) {
    return data.text;
  }
  if (typeof data.msg === 'string' && data.msg.length > 0) {
    return data.msg;
  }
  if (typeof data.message === 'string' && data.message.length > 0) {
    return data.message;
  }

  // If there's an error, show it
  if (typeof data.error === 'string') {
    return data.error;
  }

  // Fallback: try to find any long string in the response
  for (const val of Object.values(data)) {
    if (typeof val === 'string' && val.length > 20) {
      return val;
    }
  }

  // Absolute fallback
  return JSON.stringify(data, null, 2);
}
