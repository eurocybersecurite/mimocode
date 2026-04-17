import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

export async function ensureMarkItDownInstalled(): Promise<boolean> {
  try {
    execSync('markitdown --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    console.log(chalk.yellow('\n⚠️  MarkItDown is not installed. It is required to read PDF, Word, Excel, and PPT files.'));
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Would you like to install markitdown now?',
        default: true
      }
    ]);

    if (confirm) {
      const spinner = ora('Installing markitdown...').start();
      try {
        const isWindows = process.platform === 'win32';
        const installCmd = isWindows ? 'python -m pip install markitdown' : 'pip install markitdown';
        execSync(installCmd, { stdio: 'ignore' });
        spinner.succeed(chalk.green('MarkItDown installed successfully!'));
        return true;
      } catch (err: any) {
        spinner.fail(chalk.red(`Failed to install markitdown: ${err.message}`));
        console.log(chalk.dim('Please install it manually: pip install markitdown'));
        return false;
      }
    }
    return false;
  }
}

const cacheDir = path.join(process.cwd(), '.mimocode', 'cache', 'markitdown');

export async function convertDocument(filePath: string): Promise<string> {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!(await fs.pathExists(fullPath))) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check cache
  await fs.ensureDir(cacheDir);
  const stats = await fs.stat(fullPath);
  const cacheKey = Buffer.from(fullPath).toString('hex') + '_' + stats.mtimeMs;
  const cacheFile = path.join(cacheDir, `${cacheKey}.md`);

  if (await fs.pathExists(cacheFile)) {
    return await fs.readFile(cacheFile, 'utf-8');
  }

  const isInstalled = await ensureMarkItDownInstalled();
  if (!isInstalled) {
    throw new Error('MarkItDown is required for this operation.');
  }

  const spinner = ora(`Converting ${path.basename(filePath)} to Markdown...`).start();
  try {
    // markitdown <file> outputs to stdout
    const output = execSync(`markitdown "${fullPath}"`, { encoding: 'utf-8' });
    await fs.writeFile(cacheFile, output, 'utf-8');
    spinner.succeed(chalk.green('Conversion complete.'));
    return output;
  } catch (e: any) {
    spinner.fail(chalk.red(`Conversion failed: ${e.message}`));
    throw e;
  }
}

export async function searchInDocuments(dir: string, query: string): Promise<string[]> {
  const root = path.resolve(process.cwd(), dir);
  const results: string[] = [];
  const extensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt'];

  async function walk(currentDir: string) {
    const files = await fs.readdir(currentDir, { withFileTypes: true });
    for (const file of files) {
      const res = path.resolve(currentDir, file.name);
      if (file.isDirectory()) {
        if (['node_modules', '.git', 'dist', '.mimocode'].includes(file.name)) continue;
        await walk(res);
      } else {
        const ext = path.extname(file.name).toLowerCase();
        if (extensions.includes(ext)) {
          try {
            const content = await convertDocument(res);
            if (content.toLowerCase().includes(query.toLowerCase())) {
              results.push(path.relative(process.cwd(), res));
            }
          } catch (e) {
            // Skip files that fail to convert
          }
        }
      }
    }
  }

  const spinner = ora(`Searching for "${query}" in documents in ${dir}...`).start();
  await walk(root);
  spinner.stop();
  return results;
}
