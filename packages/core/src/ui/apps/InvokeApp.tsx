import { Box, Static, Text } from 'ink';
import { useEffect, useLayoutEffect, useState } from 'react';
import type { HypertestEvent, HypertestEvents, HypertestTestResult } from '@hypertest-cloud/types';
import { Wordmark } from '../components/Wordmark.js';
import { Rule } from '../components/Rule.js';
import { TestRow } from '../components/TestRow.js';
import { InvokeSummary } from '../components/InvokeSummary.js';
import { formatDuration } from '../theme.js';

interface InvokeAppProps {
  events: HypertestEvents;
  onExit?: () => void;
}

interface RunState {
  runId: string;
  testCount: number;
  concurrency: number;
  startMs: number;
}

type StaticItem =
  | { type: 'wordmark' }
  | { type: 'header'; runId: string; concurrency: number }
  | { type: 'test'; testId: string; result: HypertestTestResult };

interface InvokeState {
  staticItems: StaticItem[];
  run: RunState | null;
  running: Set<string>;
  doneCount: number;
  runEnd: Extract<HypertestEvent, { type: 'run:end' }> | null;
}

const INITIAL_STATE: InvokeState = {
  staticItems: [{ type: 'wordmark' }],
  run: null,
  running: new Set(),
  doneCount: 0,
  runEnd: null,
};

const renderStaticItem = (item: StaticItem) => {
  if (item.type === 'wordmark') {
    return (
      <Box key="wordmark" flexDirection="column">
        <Wordmark />
        <Text> </Text>
      </Box>
    );
  }
  if (item.type === 'header') {
    return (
      <Box key="header" flexDirection="column">
        <Box gap={1}>
          <Text color="#97a3b6">{'INVOKE'}</Text>
          <Text color="#3366ff">{`run ${item.runId.slice(0, 8)}`}</Text>
          <Text color="#97a3b6">·</Text>
          <Text color="#475063">{`concurrency ${item.concurrency}`}</Text>
        </Box>
        <Rule />
        <Text> </Text>
      </Box>
    );
  }
  return <TestRow key={item.testId} status="done" result={item.result} />;
};

export const InvokeApp = ({ events, onExit }: InvokeAppProps) => {
  const [state, setState] = useState<InvokeState>(INITIAL_STATE);
  const [elapsed, setElapsed] = useState(0);

  useLayoutEffect(() => {
    const unsubscribe = events.on((event) => {
      if (event.type === 'run:start') {
        setState((prev) => ({
          ...prev,
          run: { runId: event.runId, testCount: event.testCount, concurrency: event.concurrency, startMs: Date.now() },
          staticItems: [...prev.staticItems, { type: 'header', runId: event.runId, concurrency: event.concurrency }],
        }));
      } else if (event.type === 'test:start') {
        setState((prev) => {
          const running = new Set(prev.running);
          running.add(event.testId);
          return { ...prev, running };
        });
      } else if (event.type === 'test:end') {
        setState((prev) => {
          const running = new Set(prev.running);
          running.delete(event.testId);
          return {
            ...prev,
            running,
            doneCount: prev.doneCount + 1,
            staticItems: [...prev.staticItems, { type: 'test', testId: event.testId, result: event.result }],
          };
        });
      } else if (event.type === 'run:end') {
        setState((prev) => ({ ...prev, runEnd: event }));
      }
    });
    return unsubscribe;
  }, [events]);

  useEffect(() => {
    if (!state.run || state.runEnd) { return; }
    const { startMs } = state.run;
    const id = setInterval(() => setElapsed(Date.now() - startMs), 100);
    return () => clearInterval(id);
  }, [state.run, state.runEnd]);

  useEffect(() => {
    if (state.runEnd) { onExit?.(); }
  }, [state.runEnd, onExit]);

  const { run, running, doneCount, runEnd, staticItems } = state;
  const queued = run ? run.testCount - doneCount - running.size : 0;

  const MAX_VISIBLE_RUNNING = 8;
  const runningArr = [...running];
  const visibleRunning = runningArr.slice(0, MAX_VISIBLE_RUNNING);
  const hiddenRunning = running.size - visibleRunning.length;

  return (
    <Box flexDirection="column" gap={0}>
      <Static items={staticItems}>
        {renderStaticItem}
      </Static>

      {!runEnd && (
        <>
          {visibleRunning.map((testId) => (
            <TestRow key={testId} status="running" testId={testId} />
          ))}
          {hiddenRunning > 0 && (
            <Box gap={1}>
              <Text color="#97a3b6">{'  ·'}</Text>
              <Text color="#475063">{`${hiddenRunning} more running`}</Text>
            </Box>
          )}
          {queued > 0 && (
            <Box gap={1}>
              <Text color="#97a3b6">{'  ○'}</Text>
              <Text color="#97a3b6">{`${queued} queued`}</Text>
            </Box>
          )}
          <Text> </Text>
          <Rule />
          {run && (
            <Box gap={2}>
              <Text color="#97a3b6">{`[ ${doneCount}/${run.testCount} ]`}</Text>
              <Text color="#475063">{`elapsed ${formatDuration(elapsed)}`}</Text>
            </Box>
          )}
        </>
      )}

      {runEnd && (
        <>
          <Text> </Text>
          <InvokeSummary result={runEnd.result} localPath={runEnd.localPath} artifactsBaseUrl={runEnd.artifactsBaseUrl} />
        </>
      )}
    </Box>
  );
};
