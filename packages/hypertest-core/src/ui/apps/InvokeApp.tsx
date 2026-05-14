import { Box, Static, Text } from 'ink';
import { useEffect, useState } from 'react';
import type { HypertestEvents, HypertestRunResult, HypertestTestResult } from '@hypertest/hypertest-types';
import { Wordmark } from '../components/Wordmark.js';
import { Rule } from '../components/Rule.js';
import { TestRow } from '../components/TestRow.js';
import { InvokeSummary } from '../components/InvokeSummary.js';
import { formatDuration } from '../theme.js';

interface InvokeAppProps {
  events: HypertestEvents;
}

interface RunState {
  runId: string;
  testCount: number;
  concurrency: number;
  startMs: number;
}

export const InvokeApp = ({ events }: InvokeAppProps) => {
  const [run, setRun] = useState<RunState | null>(null);
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<HypertestTestResult[]>([]);
  const [result, setResult] = useState<HypertestRunResult | null>(null);
  const [artifactsBaseUrl, setArtifactsBaseUrl] = useState<string | undefined>(undefined);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const unsubscribe = events.on((event) => {
      if (event.type === 'run:start') {
        setRun({
          runId: event.runId,
          testCount: event.testCount,
          concurrency: event.concurrency,
          startMs: Date.now(),
        });
      } else if (event.type === 'test:start') {
        setRunning((prev) => new Set([...prev, event.testId]));
      } else if (event.type === 'test:end') {
        setRunning((prev) => {
          const next = new Set(prev);
          next.delete(event.testId);
          return next;
        });
        setDone((prev) => [...prev, event.result]);
      } else if (event.type === 'run:end') {
        setResult(event.result);
        setArtifactsBaseUrl(event.artifactsBaseUrl);
      }
    });
    return unsubscribe;
  }, [events]);

  useEffect(() => {
    if (!run || result) { return; }
    const id = setInterval(() => {
      setElapsed(Date.now() - run.startMs);
    }, 100);
    return () => clearInterval(id);
  }, [run, result]);

  const queued = run
    ? run.testCount - done.length - running.size
    : 0;

  const localPath = './hypertest.results.json';

  return (
    <Box flexDirection="column" gap={0}>
      <Wordmark />
      <Text> </Text>

      <Box gap={1}>
        <Text color="#97a3b6">{'INVOKE'}</Text>
        {run && !result && (
          <>
            <Text color="#3366ff">{`run ${run.runId.slice(0, 8)}`}</Text>
            <Text color="#97a3b6">·</Text>
            <Text color="#475063">{`concurrency ${run.concurrency}`}</Text>
          </>
        )}
        {result && (
          <>
            <Text color="#3366ff">{`run ${result.runId.slice(0, 8)}`}</Text>
            <Text color="#97a3b6">{'  '}</Text>
            <Text color="#1ee600">{'✓'}</Text>
            <Text color="#97a3b6">{formatDuration(result.duration)}</Text>
          </>
        )}
      </Box>
      <Rule />
      <Text> </Text>

      <Static items={done}>
        {(t) => <TestRow key={t.testId} status="done" result={t} />}
      </Static>

      {!result && (
        <>
          {[...running].map((testId) => (
            <TestRow key={testId} status="running" testId={testId} />
          ))}
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
              <Text color="#97a3b6">{`[ ${done.length}/${run.testCount} ]`}</Text>
              <Text color="#475063">{`elapsed ${formatDuration(elapsed)}`}</Text>
            </Box>
          )}
        </>
      )}

      {result && (
        <>
          <Text> </Text>
          <InvokeSummary result={result} localPath={localPath} artifactsBaseUrl={artifactsBaseUrl} />
        </>
      )}
    </Box>
  );
};
