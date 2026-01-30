
import React, { useEffect, useRef } from 'react';

declare var MathJax: any;

interface LatexProps {
  content: string;
  className?: string;
  display?: 'inline' | 'block';
}

const Latex: React.FC<LatexProps> = ({ content, className = "", display = 'inline' }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      // Clear previous typesetting to avoid double rendering issues
      MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
        console.error("MathJax typesetting failed:", err);
      });
    }
  }, [content]);

  // Using span as default container prevents unintended line breaks for inline math
  return (
    <span 
      ref={containerRef} 
      className={`latex-container ${className}`}
      style={{ display: display === 'block' ? 'block' : 'inline' }}
    >
      {content}
    </span>
  );
};

export default Latex;
