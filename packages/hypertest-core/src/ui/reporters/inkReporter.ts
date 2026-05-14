import { render } from 'ink';
import React from 'react';
import type { HypertestEvents } from '@hypertest/hypertest-types';
import { InvokeApp } from '../apps/InvokeApp.js';
import { DeployApp } from '../apps/DeployApp.js';
import { DoctorApp } from '../apps/DoctorApp.js';

type Command = 'invoke' | 'deploy' | 'doctor';

export interface Reporter {
  done: () => Promise<void>;
}

export const createInkReporter = (
  command: Command,
  events: HypertestEvents,
): Reporter => {
  const app =
    command === 'invoke' ? React.createElement(InvokeApp, { events }) :
    command === 'deploy' ? React.createElement(DeployApp, { events }) :
                           React.createElement(DoctorApp, { events });

  const instance = render(app);

  return {
    done: async () => {
      // Two setImmediate ticks: first lets React flush batched state updates,
      // second lets ink write the final frame to the terminal.
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setImmediate(r));
      instance.unmount();
    },
  };
};
