import type { Context } from 'aws-lambda';
import { handler } from './index.js';

// TODO: Remove later on or replace with localstack.
// This is a temporary workaround to run Lambda handler locally.
handler(
  {
    grep:
      process.env.GREP ??
      '^chromium\\splaywright/tests/demo-todo-app\\.spec\\.ts\\sdesc\\stest2$',
  } as unknown as Parameters<typeof handler>[0],
  {} as Context,
);
