import { Box, Text } from 'ink';
import type { HypertestTestResult } from '@hypertest/hypertest-types';
import { formatDuration } from '../theme.js';
import { StatusIcon } from './StatusIcon.js';

interface TestRowRunning {
  status: 'running';
  testId: string;
}

interface TestRowDone {
  status: 'done';
  result: HypertestTestResult;
}

type TestRowProps = TestRowRunning | TestRowDone;

const truncate = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

export const TestRow = (props: TestRowProps) => {
  if (props.status === 'running') {
    return (
      <Box>
        <Box width={3}>
          <StatusIcon status="running" />
        </Box>
        <Text color="#97a3b6">{truncate(props.testId.slice(0, 8), 50)}</Text>
        <Text color="#97a3b6">{'  running'}</Text>
      </Box>
    );
  }

  const { result } = props;
  const iconStatus =
    result.status === 'success' ? 'pass' :
    result.status === 'failed'  ? 'fail' :
                                   'skip';
  const nameColor =
    result.status === 'success' ? '#ffffff' :
    result.status === 'failed'  ? '#f43d5e' :
                                   '#f5a524';
  const durationColor = result.status === 'success' ? '#97a3b6' : '#475063';

  return (
    <Box>
      <Box width={3}>
        <StatusIcon status={iconStatus} />
      </Box>
      <Box flexGrow={1}>
        <Text color={nameColor}>{truncate(result.name, 56)}</Text>
      </Box>
      <Text color={durationColor}>{formatDuration(result.duration)}</Text>
    </Box>
  );
};
