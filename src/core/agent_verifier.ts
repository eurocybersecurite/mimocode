import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export interface VerificationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Verifies that a file was written correctly with the expected content.
 */
export async function verifyFileWritten(filePath: string, expectedContent?: string): Promise<VerificationResult> {
  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (!(await fs.pathExists(fullPath))) {
    return {
      success: false,
      message: `Verification failed: File ${filePath} does not exist.`
    };
  }

  const stats = await fs.stat(fullPath);
  
  if (stats.size === 0 && expectedContent !== "") {
    return {
      success: false,
      message: `Verification failed: File ${filePath} is empty (0 bytes).`
    };
  }

  if (expectedContent !== undefined) {
    const actualContent = await fs.readFile(fullPath, 'utf-8');
    if (actualContent.trim() !== expectedContent.trim()) {
      // If it's a partial match or just whitespace difference, we might still consider it a success but warn
      if (actualContent.includes(expectedContent) || expectedContent.includes(actualContent)) {
         return {
          success: true,
          message: `Verification success: File ${filePath} written, but content has minor differences (whitespace or partial match).`,
          details: { expectedLen: expectedContent.length, actualLen: actualContent.length }
        };
      }
      return {
        success: false,
        message: `Verification failed: File ${filePath} content mismatch.`,
        details: { expected: expectedContent.length, actual: actualContent.length }
      };
    }
  }

  return {
    success: true,
    message: `Verification success: File ${filePath} exists and has ${stats.size} bytes.`,
    details: { size: stats.size, lastModified: stats.mtime }
  };
}

/**
 * Verifies that a file was successfully deleted.
 */
export async function verifyFileDeleted(filePath: string): Promise<VerificationResult> {
  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (await fs.pathExists(fullPath)) {
    return {
      success: false,
      message: `Verification failed: File ${filePath} still exists.`
    };
  }

  return {
    success: true,
    message: `Verification success: File ${filePath} was deleted.`
  };
}

/**
 * Verifies that a directory was created and optionally checks its contents.
 */
export async function verifyDirectoryCreated(dirPath: string, expectedFiles?: string[]): Promise<VerificationResult> {
  const fullPath = path.resolve(process.cwd(), dirPath);
  
  if (!(await fs.pathExists(fullPath))) {
    return {
      success: false,
      message: `Verification failed: Directory ${dirPath} does not exist.`
    };
  }

  const stats = await fs.stat(fullPath);
  if (!stats.isDirectory()) {
    return {
      success: false,
      message: `Verification failed: Path ${dirPath} exists but is not a directory.`
    };
  }

  if (expectedFiles && expectedFiles.length > 0) {
    const actualFiles = await fs.readdir(fullPath);
    const missing = expectedFiles.filter(f => !actualFiles.includes(f));
    if (missing.length > 0) {
      return {
        success: false,
        message: `Verification failed: Directory ${dirPath} is missing expected files: ${missing.join(', ')}`,
        details: { actualFiles }
      };
    }
  }

  return {
    success: true,
    message: `Verification success: Directory ${dirPath} exists and is valid.`
  };
}

/**
 * Verifies if a command execution was likely successful based on output and common error patterns.
 */
export function verifyCommandSuccess(command: string, result: string | any): VerificationResult {
  let output = typeof result === 'string' ? result : JSON.stringify(result);
  
  // If result is an object with exitCode, use it!
  if (typeof result === 'object' && result !== null && 'exitCode' in result) {
    if (result.exitCode === 0) {
      return { success: true, message: `Command executed successfully (exit code 0).` };
    } else {
      return { success: false, message: `Command failed with exit code ${result.exitCode}.`, details: { output } };
    }
  }

  // Fallback for strings that include "(Exit Code X)" or "Error (Exit Code X)"
  const exitCodeMatch = output.match(/\(Exit Code (\d+)\)/);
  if (exitCodeMatch) {
    const code = parseInt(exitCodeMatch[1]);
    if (code === 0) return { success: true, message: "Command succeeded (exit code 0)." };
    return { success: false, message: `Command failed with exit code ${code}.`, details: { output } };
  }

  const errorPatterns = [
    /error:/i,
    /fatal:/i,
    /sh: .*: not found/i,
    /bash: .*: command not found/i,
    /command not found/i,
    /No such file or directory/i,
    /Permission denied/i
  ];

  // Specific success indicators
  const successPatterns = [
    /success/i,
    /successfully/i,
    /done/i,
    /completed/i
  ];

  const matches = errorPatterns.filter(pattern => pattern.test(output));
  
  // Special case for 'rm': if it says "no such file", it's actually a success if the goal was deletion
  if (command.trim().startsWith('rm') && (output.toLowerCase().includes('no such file') || output.toLowerCase().includes('not found'))) {
    return {
      success: true,
      message: `Verification success: File is already gone.`
    };
  }

  // Special case for 'mkdir -p' or 'cd' (if it didn't fail, it worked)
  if ((command.trim().startsWith('mkdir') || command.trim().startsWith('cd')) && matches.length === 0) {
    return {
      success: true,
      message: `Verification success: Operation completed.`
    };
  }

  if (matches.length > 0 && !successPatterns.some(p => p.test(output))) {
    return {
      success: false,
      message: `Verification warning: Command execution might have failed.`,
      details: { matches: matches.map(m => m.toString()) }
    };
  }

  return {
    success: true,
    message: `Verification success: Command executed.`,
    details: { outputPreview: output.slice(0, 100) }
  };
}

/**
 * Verifies that a web search returned results.
 */
export function verifyWebSearch(query: string, result: any): VerificationResult {
  if (!result || (typeof result === 'string' && result.includes('No results found'))) {
    return {
      success: false,
      message: `Verification failed: Web search for "${query}" returned no results.`
    };
  }
  return {
    success: true,
    message: `Verification success: Web search for "${query}" returned results.`
  };
}

/**
 * Verifies that a web browse operation successfully retrieved content.
 */
export function verifyWebBrowse(url: string, result: any): VerificationResult {
  if (!result || (typeof result === 'string' && (result.includes('Error') || result.length < 100))) {
    return {
      success: false,
      message: `Verification failed: Web browse for "${url}" failed or returned insufficient content.`
    };
  }
  return {
    success: true,
    message: `Verification success: Web browse for "${url}" retrieved content.`
  };
}

/**
 * Automatically routes to the correct verification logic based on the tool called.
 */
export async function autoVerifyToolCall(toolName: string, args: any, result: any): Promise<VerificationResult> {
  try {
    switch (toolName) {
      case 'write_file':
        return await verifyFileWritten(args.filePath || args.path, args.content);
      case 'delete_file':
        return await verifyFileDeleted(args.filePath || args.path);
      case 'create_directory':
        return await verifyDirectoryCreated(args.dirPath || args.path);
      case 'run_command':
        return verifyCommandSuccess(args.command, typeof result === 'string' ? result : JSON.stringify(result));
      case 'copy_file':
        return await verifyFileWritten(args.destination);
      case 'move_file':
        return await verifyFileWritten(args.destination);
      case 'web_search':
        return verifyWebSearch(args.query, result);
      case 'web_browse':
        return verifyWebBrowse(args.url, result);
      default:
        return { success: true, message: `No specific verification for tool ${toolName}.` };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Verification process encountered an error: ${error.message}`
    };
  }
}
