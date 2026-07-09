import type { DeployStep, HypertestEvents } from '@hypertest/hypertest-types';
import { Box, Text } from 'ink';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Rule } from '../components/Rule.js';
import { StepList, type StepState } from '../components/StepList.js';
import { Wordmark } from '../components/Wordmark.js';
import { formatDuration } from '../theme.js';

const INITIAL_STEPS: Record<DeployStep, StepState> = {
  pullBase:     { status: 'pending' },
  build:        { status: 'pending' },
  push:         { status: 'pending' },
  manifest:     { status: 'pending' },
  updateLambda: { status: 'pending' },
};

interface DeployState {
  steps: Record<DeployStep, StepState>;
  doneReason: 'success' | 'error' | null;
}

const INITIAL_STATE: DeployState = { steps: INITIAL_STEPS, doneReason: null };

interface DeployAppProps {
  events: HypertestEvents;
  onExit?: () => void;
}

export const DeployApp = ({ events, onExit }: DeployAppProps) => {
  const [state, setState] = useState<DeployState>(INITIAL_STATE);
  const deployStartMs = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useLayoutEffect(() => {
    const unsubscribe = events.on((event) => {
      if (event.type === 'deploy:step') {
        if (event.status === 'start' && deployStartMs.current === null) {
          deployStartMs.current = Date.now();
        }
        setState((prev) => {
          const steps = { ...prev.steps };
          if (event.status === 'start') {
            steps[event.step] = { status: 'running' };
          } else if (event.status === 'end') {
            steps[event.step] = { status: 'done', durationMs: event.durationMs ?? 0 };
          } else {
            steps[event.step] = { status: 'error', error: event.error ?? 'unknown error' };
          }
          let doneReason = prev.doneReason;
          if (event.step === 'updateLambda' && event.status === 'end') {
            doneReason = 'success';
          } else if (event.status === 'error') {
            doneReason = 'error';
          }
          return { steps, doneReason };
        });
      }
    });
    return unsubscribe;
  }, [events]);

  useEffect(() => {
    if (state.doneReason) { return; }
    const id = setInterval(() => {
      if (deployStartMs.current !== null) {
        setElapsed(Date.now() - deployStartMs.current);
      }
    }, 100);
    return () => clearInterval(id);
  }, [state.doneReason]);

  useEffect(() => {
    if (state.doneReason) { onExit?.(); }
  }, [state.doneReason, onExit]);

  return (
    <Box flexDirection="column" gap={0}>
      <Wordmark />
      <Text> </Text>
      <Box gap={1}>
        <Text color="#97a3b6">{'DEPLOY'}</Text>
        {state.doneReason === 'success' && <Text color="#1ee600">{'✓ done'}</Text>}
        {state.doneReason === 'error' && <Text color="#f43d5e">{'✕ failed'}</Text>}
      </Box>
      <Rule />
      <Text> </Text>
      <StepList steps={state.steps} />
      <Text> </Text>
      <Text color="#475063">{`elapsed ${formatDuration(elapsed)}`}</Text>
    </Box>
  );
};
