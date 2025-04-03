#!/usr/bin/env node
import 'dotenv/config';
import { Command } from '@commander-js/extra-typings';
import { ZodError } from 'zod';
import fs from 'node:fs';
import { getConfigFilepath, loadConfig } from './config.js';
import { setupHypertest } from './index.js';

const checks = [
  {
    title: 'Hypertest Config',
    description: 'Check for valid config',
    run: async () => {
      try {
        if (!fs.existsSync(getConfigFilepath())) {
          throw new CheckError('hypertest.config.js is missing');
        }
        return await loadConfig();
      } catch (err) {
        if (err instanceof ZodError) {
          throw new CheckError(err.message);
        }
        throw err;
      }
    },
    children: [],
  },
] as const;

const program = new Command();

class CheckError extends Error {
  constructor(public readonly problem: string) {
    super(problem);
  }
}

const iconMap = {
  ok: '🟢',
  warn: '🟡',
  error: '🔴',
};

const runDoctor = async () => {
  for (const check of checks) {
    console.log(check.title, '>', check.description, '\n');

    const result = await check
      .run()
      .then((message) => ({ status: 'ok' as const, message }))
      .catch((err) => {
        if (err instanceof CheckError) {
          return { status: 'warn' as const, message: err.message };
        }
        return { status: 'error' as const, message: err.message };
      });
    console.log(`${iconMap[result.status]} ${result.message}\n`);
  }
};

program.name('hypertest').version('0.0.1');
program.command('doctor').action(() => {
  runDoctor();
});

program
  .command('deploy')
  .option('--dry-run')
  .action(async (opts) => {
    console.log(opts);
    const core = await setupHypertest(opts);
    await core.deploy();
  });

program
  .command('invoke')
  .option('--dry-run')
  .action(async (opts) => {
    console.log(opts);
    const core = await setupHypertest(opts);
    await core.invoke();
  });

program.parse();
