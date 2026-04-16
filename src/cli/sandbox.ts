import vm from 'node:vm';
import { Config } from './config';
import fs from 'fs-extra';
import axios from 'axios';

export interface SandboxOptions {
  allowNetwork?: boolean;
  allowFilesystem?: boolean;
}

export async function runInSandbox(config: Config, code: string, options: SandboxOptions = {}, context: any = {}) {
  const sandbox = {
    console: {
      log: (...args: any[]) => console.log('\x1b[36m[Sandbox Log]:\x1b[0m', ...args),
      error: (...args: any[]) => console.error('\x1b[31m[Sandbox Error]:\x1b[0m', ...args),
    },
    process: {
      env: { NODE_ENV: 'sandbox' },
    },
    setTimeout,
    clearTimeout,
    // Add network if allowed
    fetch: options.allowNetwork ? axios.get : undefined,
    axios: options.allowNetwork ? axios : undefined,
    // Add filesystem if allowed
    fs: options.allowFilesystem ? fs : undefined,
    ...context,
  };

  const script = new vm.Script(code);
  const vmContext = vm.createContext(sandbox);
  
  try {
    const result = await script.runInContext(vmContext, { timeout: 10000 });
    return result;
  } catch (e: any) {
    throw new Error(`Sandbox Execution Error: ${e.message}`);
  }
}
