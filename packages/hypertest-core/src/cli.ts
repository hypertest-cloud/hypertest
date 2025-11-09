#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import util from 'node:util';
import { Command } from '@commander-js/extra-typings';
import { ZodError } from 'zod';
import { getConfigFileURL, loadConfig } from './config.js';
import { setupHypertest } from './index.js';
import { promiseMap } from './utils.js';
import { CheckError, type Check } from '@hypertest/hypertest-types';
import { fileURLToPath } from 'node:url';
import { initializeHypertestConfig } from './init.js';

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
          message: 'Config loaded successfully.',
          data: {
            concurrency: config.concurrency,
            imageName: config.imageName,
            localImageName: config.localImageName,
            localBaseImageName: config.localBaseImageName,
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

const program = new Command();

const iconMap = {
  ok: '🟢',
  warn: '🟡',
  error: '🔴',
};

const processCheck = async (check: Check) => {
  console.log(check.title, '>', check.description, '\n');

  const result = await check
    .run()
    .then((output) => ({ status: 'ok' as const, ...output }))
    .catch((err) => {
      if (err instanceof CheckError) {
        return { status: 'warn' as const, message: err.message, data: null };
      }
      return { status: 'error' as const, message: err.message, data: null };
    });
  console.log(
    `${iconMap[result.status]} ${result.message}
${util.inspect(result?.data, false, null, true)} \n`,
  );
};

const runDoctor = async () => {
  await promiseMap(CORE_CHECKS, processCheck);

  const { config, cloudFunctionProvider } = await loadConfig();
  const cloudChecks = cloudFunctionProvider.getCliDoctorChecks?.(config) ?? [];
  await promiseMap(cloudChecks, processCheck);
};

program.name('hypertest').version('0.0.1');

program.command('init').action(initializeHypertestConfig);

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

// TODO grep option is only for tests, remove later
program
  .command('invoke')
  .option('--dry-run')
  .option('--grep <grep>', 'Grep pattern to filter tests')
  .action(async (opts) => {
    console.log(opts);
    const core = await setupHypertest(opts);
    await core.invoke(opts.grep);
  });

program.parse();
