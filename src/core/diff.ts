import * as diff from 'diff';
import chalk from 'chalk';

export function getDiff(oldContent: string, newContent: string, fileName: string): string {
  const changes = diff.diffLines(oldContent, newContent);
  let output = chalk.bold.blue(`📝 Changes in ${fileName}:\n`);
  output += chalk.dim(`┌${'─'.repeat(78)}┐\n`);
  
  let oldLineNum = 1;
  let newLineNum = 1;

  changes.forEach((part) => {
    const lines = part.value.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();

    const color = part.added ? chalk.bgGreen.black : part.removed ? chalk.bgRed.white : chalk.gray;
    const prefix = part.added ? '+' : part.removed ? '-' : ' ';
    
    if (part.added || part.removed) {
      lines.forEach(line => {
        const ln = part.added ? `    :${newLineNum++}` : `${oldLineNum++}:    `;
        output += `${chalk.dim(ln.padStart(10))} ${color(prefix + ' ' + line)}\n`;
      });
    } else {
      // Show only a few lines of context for unchanged parts
      if (lines.length > 6) {
        // Top context
        lines.slice(0, 3).forEach(line => {
          output += `${chalk.dim(`${oldLineNum++}:${newLineNum++}`.padStart(10))}   ${color(line)}\n`;
        });
        output += chalk.dim(`${' '.repeat(11)}... (${lines.length - 6} lines hidden) ...\n`);
        oldLineNum += lines.length - 6;
        newLineNum += lines.length - 6;
        // Bottom context
        lines.slice(-3).forEach(line => {
          output += `${chalk.dim(`${oldLineNum++}:${newLineNum++}`.padStart(10))}   ${color(line)}\n`;
        });
      } else {
        lines.forEach(line => {
          output += `${chalk.dim(`${oldLineNum++}:${newLineNum++}`.padStart(10))}   ${color(line)}\n`;
        });
      }
    }
  });
  output += chalk.dim(`└${'─'.repeat(78)}┘\n`);
  return output;
}

export function showDiff(oldContent: string, newContent: string, fileName: string) {
  console.log(getDiff(oldContent, newContent, fileName));
}
