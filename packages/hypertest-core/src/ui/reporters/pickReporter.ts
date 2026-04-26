import type { HypertestEvents } from '@hypertest/hypertest-types';
import { createInkReporter, type Reporter } from './inkReporter.js';
import { createPlainReporter } from './plainReporter.js';

type Command = 'invoke' | 'deploy' | 'doctor';

export const pickReporter = (
  command: Command,
  events: HypertestEvents,
  quiet = false,
): Reporter => {
  if (!quiet && process.stdout.isTTY) {
    return createInkReporter(command, events);
  }
  return createPlainReporter(events);
};
