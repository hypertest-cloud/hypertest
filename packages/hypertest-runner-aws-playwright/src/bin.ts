import type { Context } from 'aws-lambda';
import { handler } from './index.js';

// TODO: Remove later on or replace with localstack.
// This is a temporary workaround to run Lambda handler locally.

handler(
  {
    runId: process.env.RUN_ID ?? 'local',
    testId: process.env.TEST_ID ?? 'local',
    bucketName: process.env.BUCKET_NAME ?? '',
    context: {
      grep:
        process.env.GREP ??
        '^chromium\\splaywright/tests/demo-todo-app\\.spec\\.ts\\sdesc\\stest2$',
    },
  },
  {} as Context,
);
