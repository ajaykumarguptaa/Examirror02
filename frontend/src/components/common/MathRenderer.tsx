import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * MathRenderer component for rendering mixed Text and KaTeX LaTeX formulas.
 * Supports inline math `$formula$` and block math `$$formula$$`.
 * Gracefully falls back to raw text if KaTeX encounters any syntax error.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // Regex to match $$block math$$ or $inline math$
    // Using positive lookahead or split pattern
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g;
    const parts = content.split(regex);

    return parts.map((part) => {
      if (!part) return '';

      // Block math: $$ ... $$
      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        const formula = part.slice(2, -2).trim();
        try {
          return katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
            output: 'htmlAndMathml'
          });
        } catch (_) {
          return `<span class="text-rose-500 font-mono text-xs">${escapeHtml(part)}</span>`;
        }
      }

      // Inline math: $ ... $
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        const formula = part.slice(1, -1).trim();
        try {
          return katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
            output: 'htmlAndMathml'
          });
        } catch (_) {
          return `<span class="text-rose-500 font-mono text-xs">${escapeHtml(part)}</span>`;
        }
      }

      // Regular text: preserve line breaks
      return escapeHtml(part).replace(/\n/g, '<br />');
    }).join('');
  }, [content]);

  return (
    <span
      className={`math-rendered-content ${inline ? 'inline' : 'block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default MathRenderer;
