import { Box, Text } from 'ink';
import type { HypertestRunResult } from '@hypertest/hypertest-types';
import { formatDuration } from '../theme.js';

export const InvokeSummary = ({
  result,
  localPath,
  artifactsBaseUrl,
}: {
  result: HypertestRunResult;
  localPath: string;
  artifactsBaseUrl?: string;
}) => {
  const { tests, testResults, runId } = result;
  const failed = testResults.filter((t) => t.status === 'failed');

  return (
    <Box flexDirection="column" gap={0}>
      <Box gap={1}>
        <Text color="#97a3b6">{`${tests.total} tests`}</Text>
        <Text color="#97a3b6">·</Text>
        <Text color="#1ee600">{`${tests.success} passed`}</Text>
        {tests.skipped > 0 && (
          <>
            <Text color="#97a3b6">·</Text>
            <Text color="#f5a524">{`${tests.skipped} skipped`}</Text>
          </>
        )}
        {tests.failed > 0 && (
          <>
            <Text color="#97a3b6">·</Text>
            <Text color="#f43d5e" bold={true}>{`${tests.failed} failed`}</Text>
          </>
        )}
      </Box>

      {failed.length > 0 && (
        <Box flexDirection="column" marginTop={1} gap={0}>
          <Text color="#97a3b6">{'FAILURES'}</Text>
          <Text> </Text>
          {failed.map((t) => (
            <Box key={t.testId} flexDirection="column" marginBottom={1}>
              <Box gap={1}>
                <Text color="#f43d5e">{'✕'}</Text>
                <Text color="#f43d5e">{t.name}</Text>
              </Box>
              {t.error && (
                <Box marginLeft={3} flexDirection="column">
                  <Text color="#475063" wrap="wrap">{t.error.message}</Text>
                  {t.error.stackTrace && (
                    <Text color="#475063" dimColor={true} wrap="wrap">
                      {t.error.stackTrace.split('\n').slice(0, 4).join('\n')}
                    </Text>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Box flexDirection="column" marginTop={1} gap={0}>
        <Box gap={2}>
          <Text color="#97a3b6">{'ARTIFACTS'}</Text>
          <Text color="#97a3b6">{artifactsBaseUrl ?? `run ${runId}`}</Text>
        </Box>
        <Box gap={2}>
          <Text color="#97a3b6">{'RESULTS  '}</Text>
          <Text color="#97a3b6">{localPath}</Text>
        </Box>
        <Box gap={2}>
          <Text color="#97a3b6">{'DURATION '}</Text>
          <Text color="#97a3b6">{formatDuration(result.duration)}</Text>
        </Box>
      </Box>
    </Box>
  );
};
