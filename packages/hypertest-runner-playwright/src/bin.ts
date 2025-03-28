import type { Context } from 'aws-lambda';
import { handler } from './index.js';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
handler(
  {
    grep:
      process.env.GREP ??
      '^chromium\\splaywright/tests/demo-todo-app\\.spec\\.ts\\sdesc\\stest2$',
  } as any,
  {} as Context,
);
