import type { Context } from 'aws-lambda';
import { handler } from './index.js';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
handler({} as any, {} as Context);
