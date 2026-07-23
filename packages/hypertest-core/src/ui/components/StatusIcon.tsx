import { Text } from 'ink';
import Spinner from 'ink-spinner';

type Status = 'pass' | 'fail' | 'skip' | 'running' | 'queued' | 'pending' | 'warn';

const STATUS_PROPS: Record<Status, { color: string; char?: string; spin?: boolean }> = {
  pass:    { color: '#1ee600', char: '✓' },
  fail:    { color: '#f43d5e', char: '✕' },
  skip:    { color: '#f5a524', char: '◯' },
  running: { color: '#3366ff', spin: true },
  queued:  { color: '#97a3b6', char: '○' },
  pending: { color: '#97a3b6', char: '·' },
  warn:    { color: '#f5a524', char: '▲' },
};

export const StatusIcon = ({ status }: { status: Status }) => {
  const props = STATUS_PROPS[status];
  if (props.spin) {
    return (
      <Text color={props.color}>
        <Spinner type="dots" />
      </Text>
    );
  }
  return <Text color={props.color}>{props.char}</Text>;
};
