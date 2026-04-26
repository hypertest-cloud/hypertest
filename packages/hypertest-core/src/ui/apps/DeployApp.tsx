import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import type { DeployStep, HypertestEvents } from '@hypertest/hypertest-types';
import { Wordmark } from '../components/Wordmark.js';
import { Rule } from '../components/Rule.js';
import { StepList, type StepState } from '../components/StepList.js';
import { formatDuration } from '../theme.js';

const INITIAL_STEPS: Record<DeployStep, StepState> = {
  pullBase:     { status: 'pending' },
  build:        { status: 'pending' },
  push:         { status: 'pending' },
  manifest:     { status: 'pending' },
  updateLambda: { status: 'pending' },
};

interface DeployAppProps {
  events: HypertestEvents;
}

export const DeployApp = ({ events }: DeployAppProps) => {
  const [steps, setSteps] = useState<Record<DeployStep, StepState>>(INITIAL_STEPS);
  const [done, setDone] = useState(false);
  const [startMs] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const unsubscribe = events.on((event) => {
      if (event.type === 'deploy:step') {
        setSteps((prev) => {
          const next = { ...prev };
          if (event.status === 'start') {
            next[event.step] = { status: 'running' };
          } else if (event.status === 'end') {
            next[event.step] = { status: 'done', durationMs: event.durationMs ?? 0 };
          } else {
            next[event.step] = { status: 'error', error: event.error ?? 'unknown error' };
          }
          return next;
        });
        if (event.step === 'updateLambda' && event.status === 'end') {
          setDone(true);
        }
      }
    });
    return unsubscribe;
  }, [events]);

  useEffect(() => {
    if (done) { return; }
    const id = setInterval(() => setElapsed(Date.now() - startMs), 100);
    return () => clearInterval(id);
  }, [done, startMs]);

  return (
    <Box flexDirection="column" gap={0}>
      <Wordmark />
      <Text> </Text>
      <Box gap={1}>
        <Text color="#97a3b6">{'DEPLOY'}</Text>
        {done && <Text color="#1ee600">{'✓ done'}</Text>}
      </Box>
      <Rule />
      <Text> </Text>
      <StepList steps={steps} />
      <Text> </Text>
      <Text color="#475063">{`elapsed ${formatDuration(elapsed)}`}</Text>
    </Box>
  );
};
