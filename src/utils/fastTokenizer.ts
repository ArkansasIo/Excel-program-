
export type Language = 'sql' | 'cpp' | 'csharp' | 'asm6502';

const KEYWORDS: Record<Language, RegExp> = {
  sql: /\b(SELECT|FROM|WHERE|JOIN|ON|GROUP|BY|COUNT|AND|OR|INSERT|UPDATE|DELETE|TABLE|INTO|VALUES|CREATE|DROP|ALTER|TABLE)\b/gi,
  cpp: /\b(int|float|double|char|void|bool|if|else|for|while|return|class|public|private|protected|namespace|using|include|#include|#define)\b/g,
  csharp: /\b(int|string|bool|void|if|else|for|foreach|while|return|class|public|private|protected|namespace|using|static|main|string|bool)\b/g,
  asm6502: /\b(LDA|LDX|LDY|STA|STX|STY|TAX|TAY|TXA|TYA|INC|DEC|INX|INY|DEX|DEY|CMP|CPX|CPY|BEQ|BNE|JMP|JSR|RTS|PHA|PLA|PHP|PLP|CLC|SEC|CLD|SED|CLI|SEI|CLV|NOP)\b/gi,
};

const STRINGS = /(".*?"|'.*?')/g;
const COMMENTS: Record<Language, RegExp> = {
  sql: /(--.*|#.*|\/\*[\s\S]*?\*\/)/g,
  cpp: /(\/\/.*|\/\*[\s\S]*?\*\/)/g,
  csharp: /(\/\/.*|\/\*[\s\S]*?\*\/)/g,
  asm6502: /(;.*)/g,
};

export const fastHighlight = (code: string, language: Language): string => {
  const commentRegex = COMMENTS[language];
  const keywordRegex = KEYWORDS[language];
  
  // Basic tokenization replacement strategy
  let escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Order matters: comments -> strings -> keywords
  escapedCode = escapedCode.replace(commentRegex, '<span class="token comment">$1</span>');
  escapedCode = escapedCode.replace(STRINGS, '<span class="token string">$1</span>');
  escapedCode = escapedCode.replace(keywordRegex, '<span class="token keyword">$1</span>');

  return escapedCode;
};
