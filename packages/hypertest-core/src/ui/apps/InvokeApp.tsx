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
  const [staticItems, setStaticItems] = useState<StaticItem[]>([{ type: 'wordmark' }]);
  const [run, setRun] = useState<RunState | null>(null);
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [doneCount, setDoneCount] = useState(0);
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
        setStaticItems((prev) => [
          ...prev,
          { type: 'header', runId: event.runId, concurrency: event.concurrency },
        ]);
      } else if (event.type === 'test:start') {
        setRunning((prev) => new Set([...prev, event.testId]));
      } else if (event.type === 'test:end') {
        setRunning((prev) => {
          const next = new Set(prev);
          next.delete(event.testId);
          return next;
        });
        setStaticItems((prev) => [
          ...prev,
          { type: 'test', testId: event.testId, result: event.result },
        ]);
        setDoneCount((prev) => prev + 1);
      } else if (event.type === 'run:end') {
        setResult(event.result);
        setArtifactsBaseUrl(event.artifactsBaseUrl);
      }
    });
    return unsubscribe;
  }, [events]);

  useEffect(() => {
    if (!run || result) { return; }
    const id = setInterval(() => setElapsed(Date.now() - run.startMs), 100);
    return () => clearInterval(id);
  }, [run, result]);

  useEffect(() => {
    if (result) { onExit?.(); }
  }, [result, onExit]);

  const queued = run ? run.testCount - doneCount - running.size : 0;
  const localPath = './hypertest.results.json';

  return (
    <Box flexDirection="column" gap={0}>
      <Static items={staticItems}>
        {renderStaticItem}
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
              <Text color="#97a3b6">{`[ ${doneCount}/${run.testCount} ]`}</Text>
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
