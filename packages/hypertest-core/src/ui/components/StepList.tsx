import { Box, Text } from 'ink';
import type { DeployStep } from '@hypertest/hypertest-types';
import { formatDuration } from '../theme.js';
import { StatusIcon } from './StatusIcon.js';

const STEP_LABELS: Record<DeployStep, string> = {
  pullBase:     'pull base image',
  build:        'build container image',
  push:         'push image to cloud',
  manifest:     'build manifest',
  updateLambda: 'update lambda',
};

export type StepState =
  | { status: 'pending' }
  | { status: 'running' }
  | { status: 'done'; durationMs: number }
  | { status: 'error'; error: string };

export const StepList = ({
  steps,
}: {
  steps: Record<DeployStep, StepState>;
}) => {
  const order: DeployStep[] = ['pullBase', 'build', 'push', 'manifest', 'updateLambda'];
  return (
    <Box flexDirection="column" gap={0}>
      {order.map((key) => {
        const state = steps[key];
        const label = STEP_LABELS[key];
        return (
          <Box key={key}>
            <Box width={3}>
              <StatusIcon
                status={
                  state.status === 'done'    ? 'pass' :
                  state.status === 'error'   ? 'fail' :
                  state.status === 'running' ? 'running' :
                                               'pending'
                }
              />
            </Box>
            <Box width={32}>
              <Text color={state.status === 'error' ? '#f43d5e' : '#ffffff'}>
                {label}
              </Text>
            </Box>
            {state.status === 'done' && (
              <Text color="#97a3b6">{formatDuration(state.durationMs)}</Text>
            )}
            {state.status === 'error' && (
              <Text color="#f43d5e">{state.error}</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
