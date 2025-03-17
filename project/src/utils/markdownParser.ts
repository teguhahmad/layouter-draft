import { useMemo } from 'react';

interface ParserState {
  currentHeadingLevel: number;
  currentListLevel: number;
  inOrderedList: boolean;
  inUnorderedList: boolean;
  orderedListCounter: number;
}

const initialParserState: ParserState = {
  currentHeadingLevel: 0,
  currentListLevel: 0,
  inOrderedList: false,
  inUnorderedList: false,
  orderedListCounter: 1,
};

function formatInlineMarkdown(text: string): string {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  return text;
}

function addIndent(level: number): string {
  return level > 0 ? ` style="margin-left: ${level * 20}px;"` : '';
}

function parseMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const state: ParserState = { ...initialParserState };
  let html = '';
  let currentList: string[] = [];

  function closeCurrentList() {
    if (state.inOrderedList) {
      html += `<ol${addIndent(state.currentListLevel - 1)}>${currentList.join('')}</ol>`;
    } else if (state.inUnorderedList) {
      html += `<ul${addIndent(state.currentListLevel - 1)}>${currentList.join('')}</ul>`;
    }
    currentList = [];
    state.inOrderedList = false;
    state.inUnorderedList = false;
    state.orderedListCounter = 1;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (state.inOrderedList || state.inUnorderedList) {
        closeCurrentList();
      }
      continue;
    }

    // Calculate indentation level
    const indentLevel = Math.floor((lines[i].length - lines[i].trimLeft().length) / 4);

    // Horizontal rule
    if (line === '---') {
      if (state.inOrderedList || state.inUnorderedList) {
        closeCurrentList();
      }
      html += '<br><br>';
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s(.+)/);
    if (headingMatch) {
      if (state.inOrderedList || state.inUnorderedList) {
        closeCurrentList();
      }
      const level = headingMatch[1].length;
      const text = formatInlineMarkdown(headingMatch[2]);
      const margin = level > 1 ? ` style="margin-left: ${(level - 1) * 10}px;"` : '';
      html += `<h${level}${margin}>${text}</h${level}>`;
      state.currentHeadingLevel = level;
      continue;
    }

    // Ordered list
    const orderedListMatch = line.match(/^(\d+)\.\s(.+)/);
    if (orderedListMatch) {
      const content = formatInlineMarkdown(orderedListMatch[2]);
      if (!state.inOrderedList) {
        if (state.inUnorderedList) {
          closeCurrentList();
        }
        state.inOrderedList = true;
        state.currentListLevel = indentLevel + 1;
      }
      currentList.push(`<li${addIndent(indentLevel)}>${content}</li>`);
      continue;
    }

    // Unordered list
    if (line.startsWith('- ')) {
      const content = formatInlineMarkdown(line.slice(2));
      if (!state.inUnorderedList) {
        if (state.inOrderedList) {
          closeCurrentList();
        }
        state.inUnorderedList = true;
        state.currentListLevel = indentLevel + 1;
      }
      currentList.push(`<li${addIndent(indentLevel)}>${content}</li>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (state.inOrderedList || state.inUnorderedList) {
        closeCurrentList();
      }
      const content = formatInlineMarkdown(line.slice(2));
      html += `<blockquote${addIndent(indentLevel)}>${content}</blockquote>`;
      continue;
    }

    // Regular paragraph
    if (state.inOrderedList || state.inUnorderedList) {
      closeCurrentList();
    }
    const content = formatInlineMarkdown(line);
    html += `<p${addIndent(indentLevel)}>${content}</p>`;
  }

  // Close any remaining lists
  if (state.inOrderedList || state.inUnorderedList) {
    closeCurrentList();
  }

  return html;
}

export function useMarkdownParser(markdown: string): string {
  return useMemo(() => parseMarkdown(markdown), [markdown]);
}