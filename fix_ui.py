import re

with open('src/cli/index.ts', 'r') as f:
    content = f.read()

# 1. Update drawStyledPrompt
new_draw_styled_prompt = """  const drawStyledPrompt = () => {
    if (isProcessing) return;
    
    const rows = process.stdout.rows || 24;
    const cols = process.stdout.columns || 80;
    const separator = chalk.yellow('─'.repeat(cols));
    const helpText = chalk.dim('auto-accept edits   Shift+Tab to plan');
    
    // Move to bottom, clear, and draw sticky UI
    process.stdout.write(`\\x1b[${rows - 3};1H\\x1b[J`); 
    process.stdout.write(`${helpText}\\n${separator}\\n${chalk.bold.hex('#6366f1')('> ')}\\n${separator}`);
    
    // Position cursor exactly at input point
    process.stdout.write(`\\x1b[${rows - 1};3H`);
    
    rl.setPrompt('');
  };"""

content = re.sub(r'const drawStyledPrompt = \(\) => \{[\s\S]+?rl\.prompt\(\);\s+\};', new_draw_styled_prompt, content)

# 2. Update processInput to clear area
new_process_input_start = """  const processInput = async (input: string) => {
    // Clear the sticky area before starting execution logs
    const rows = process.stdout.rows || 24;
    process.stdout.write(`\\x1b[${rows - 3};1H\\x1b[J`); 

    const trimmedInput = input.trim();"""

content = re.sub(r'const processInput = async \(input: string\) => \{\s+const trimmedInput = input\.trim\(\);', new_process_input_start, content)

# 3. Update keypress listener for ESC
new_keypress = """  process.stdin.on('keypress', (str, key) => {
    if (key && key.name === 'escape') {
      if (isProcessing) {
        abortController.abort();
      }
    }
    if (key && key.name === 'tab' && key.shift) {
      (rl as any).line = '/improve ';
      (rl as any)._refreshLine();
    }
  });"""

content = re.sub(r'process\.stdin\.on\(\'keypress\'[\s\S]+?\}\);', new_keypress, content)

with open('src/cli/index.ts', 'w') as f:
    f.write(content)
