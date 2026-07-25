import { render } from 'ink';
import React from 'react';
import type { HypertestEvents } from '@hypertest-cloud/types';
import { InvokeApp } from '../apps/InvokeApp.js';
import { DeployApp } from '../apps/DeployApp.js';
import { DoctorApp } from '../apps/DoctorApp.js';

export type Command = 'invoke' | 'deploy' | 'doctor';

export interface Reporter {
  done: () => Promise<void>;
  abort: () => void;
}

export const createInkReporter = (
  command: Command,
  events: HypertestEvents,
): Reporter => {
  let resolveExit!: () => void;
  const exitPromise = new Promise<void>((resolve) => { resolveExit = resolve; });
  const onExit = () => resolveExit();

  const app =
    command === 'invoke' ? React.createElement(InvokeApp, { events, onExit }) :
    command === 'deploy' ? React.createElement(DeployApp, { events, onExit }) :
                           React.createElement(DoctorApp, { events, onExit });

  const instance = render(app);

  return {
    done: async () => {
      await exitPromise;
      instance.unmount();
      process.stdout.write('\n');
    },
    abort: () => resolveExit(),
  };
};
