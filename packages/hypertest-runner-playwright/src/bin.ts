import type { Context } from 'aws-lambda';
import { handler } from './index.js';

// TODO: Remove later on or replace with localstack.
// This is a temporary workaround to run Lambda handler locally.

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
handler(
  {
    grep:
      process.env.GREP ??
      '^chromium\\splaywright/tests/demo-todo-app\\.spec\\.ts\\sdesc\\stest2$',
  } as any,
  {} as Context,
);
