import { Box, Text } from 'ink';
import { StatusIcon } from './StatusIcon.js';

type CheckStatus = 'ok' | 'warn' | 'error';

const STATUS_MAP: Record<CheckStatus, { iconStatus: 'pass' | 'warn' | 'fail'; color: string }> = {
  ok:    { iconStatus: 'pass', color: '#ffffff' },
  warn:  { iconStatus: 'warn', color: '#f5a524' },
  error: { iconStatus: 'fail', color: '#f43d5e' },
};

export const DoctorCheck = ({
  title,
  status,
  message,
  data,
}: {
  title: string;
  status: CheckStatus;
  message: string;
  data?: Record<string, unknown> | null;
}) => {
  const { iconStatus, color: msgColor } = STATUS_MAP[status];

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Box width={3}>
          <StatusIcon status={iconStatus} />
        </Box>
        <Box width={28}>
          <Text>{title}</Text>
        </Box>
        <Text color={msgColor}>{message}</Text>
      </Box>
      {data && Object.keys(data).length > 0 && (
        <Box flexDirection="column" marginLeft={5} marginBottom={1}>
          {Object.entries(data).map(([k, v]) => (
            <Text key={k} color="#475063">{`${k}: ${v}`}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
};
