#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from '@commander-js/extra-typings';
import { ZodError } from 'zod';
import { CheckError, type Check } from '@hypertest/hypertest-types';
import type { HypertestEvents } from '@hypertest/hypertest-types';
import { getConfigFileURL, loadConfig } from './config.js';
import { createEventBus } from './events.js';
import { setupHypertest } from './index.js';
import { initializeHypertestConfig } from './init/init.js';
import { pickReporter } from './ui/reporters/pickReporter.js';

const CORE_CHECKS: Check[] = [
  {
    title: 'Hypertest Config',
    description: 'Check for valid config',
    run: async () => {
      try {
        if (!fs.existsSync(fileURLToPath(getConfigFileURL()))) {
          throw new CheckError('hypertest.config.js is missing');
        }
        const { config } = await loadConfig();
        return {
          message: 'config loaded successfully',
          data: {
            concurrency: config.concurrency,
            imageName: config.imageName,
          },
        };
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

const DEV_MODE = process.env.HYPERTEST_DEV === 'true';

const runCheck = async (check: Check) => {
  const result = await check
    .run()
    .then((output) => ({ status: 'ok' as const, ...output }))
    .catch((err) => {
      if (err instanceof CheckError) {
        return { status: 'warn' as const, message: err.message, data: null };
      }
      return { status: 'error' as const, message: String(err.message), data: null };
    });
  return { title: check.title, ...result };
};

const runDoctor = async (events: HypertestEvents) => {
  if (DEV_MODE) {
    events.emit({ type: 'doctor:check', title: 'Hypertest Config', status: 'ok', message: 'dev mode — config check skipped', data: null });
    events.emit({ type: 'doctor:check', title: 'AWS Credentials',  status: 'ok', message: 'dev mode — AWS check skipped',    data: null });
    return;
  }

  for (const check of CORE_CHECKS) {
    events.emit({ type: 'doctor:check', ...(await runCheck(check)) });
  }

  const { config, cloudProvider } = await loadConfig();
  const cloudChecks = cloudProvider.getCliDoctorChecks?.(config) ?? [];
  for (const check of cloudChecks) {
    events.emit({ type: 'doctor:check', ...(await runCheck(check)) });
  }
};

const program = new Command();

program.name('hypertest').version('0.0.1');

program.command('init').action(initializeHypertestConfig);

program
  .command('doctor')
  .option('--quiet', 'plain text output (no ink)')
  .action(async (opts) => {
    const events = createEventBus();
    const reporter = pickReporter('doctor', events, opts.quiet);
    try {
      await runDoctor(events);
    } finally {
      await reporter.done();
    }
  });

program
  .command('deploy')
  .option('--dry-run')
  .option('--quiet', 'plain text output (no ink)')
  .action(async (opts) => {
    const events = createEventBus();
    const reporter = pickReporter('deploy', events, opts.quiet);
    try {
      const core = await setupHypertest({ dryRun: opts.dryRun, events });
      await core.deploy();
    } finally {
      await reporter.done();
    }
  });

program
  .command('invoke')
  .option('--dry-run')
  .option('--quiet', 'plain text output (no ink)')
  .action(async (opts) => {
    const events = createEventBus();
    const reporter = pickReporter('invoke', events, opts.quiet);
    try {
      const core = await setupHypertest({ dryRun: opts.dryRun, events });
      await core.invoke();
    } finally {
      await reporter.done();
    }
  });

program.parse();
