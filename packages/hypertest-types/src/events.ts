import type { HypertestRunResult, HypertestTestResult } from './run-result.js';

export type DeployStep =
  | 'pullBase'
  | 'build'
  | 'push'
  | 'manifest'
  | 'updateLambda';

export type HypertestEvent =
  | { type: 'run:start'; runId: string; testCount: number; concurrency: number }
  | { type: 'run:end'; runId: string; result: HypertestRunResult; artifactsBaseUrl?: string }
  | { type: 'test:start'; testId: string }
  | { type: 'test:end'; testId: string; result: HypertestTestResult }
  | {
      type: 'deploy:step';
      step: DeployStep;
      status: 'start' | 'end' | 'error';
      durationMs?: number;
      error?: string;
    }
  | { type: 'log'; level: 'info' | 'warn' | 'error' | 'debug'; message: string }
  | {
      type: 'doctor:check';
      title: string;
      status: 'ok' | 'warn' | 'error';
      message: string;
      data?: Record<string, unknown> | null;
    };

export interface HypertestEvents {
  emit(event: HypertestEvent): void;
  on(listener: (event: HypertestEvent) => void): () => void;
}
