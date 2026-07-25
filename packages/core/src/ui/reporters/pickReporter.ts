import type { HypertestEvents } from '@hypertest-cloud/types';
import {
  type Command,
  type Reporter,
  createInkReporter,
} from './inkReporter.js';
import { createPlainReporter } from './plainReporter.js';

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
