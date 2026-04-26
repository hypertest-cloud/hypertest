import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import type { HypertestEvents } from '@hypertest/hypertest-types';
import { Wordmark } from '../components/Wordmark.js';
import { Rule } from '../components/Rule.js';
import { DoctorCheck } from '../components/DoctorCheck.js';

interface CheckResult {
  title: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown> | null;
}

interface DoctorAppProps {
  events: HypertestEvents;
}

export const DoctorApp = ({ events }: DoctorAppProps) => {
  const [checks, setChecks] = useState<CheckResult[]>([]);

  useEffect(() => {
    const unsubscribe = events.on((event) => {
      if (event.type === 'doctor:check') {
        setChecks((prev) => [
          ...prev,
          {
            title: event.title,
            status: event.status,
            message: event.message,
            data: event.data,
          },
        ]);
      }
    });
    return unsubscribe;
  }, [events]);

  return (
    <Box flexDirection="column" gap={0}>
      <Wordmark />
      <Text> </Text>
      <Text color="#97a3b6">{'DOCTOR'}</Text>
      <Rule />
      <Text> </Text>
      {checks.map((c) => (
        <DoctorCheck
          key={c.title}
          title={c.title}
          status={c.status}
          message={c.message}
          data={c.data}
        />
      ))}
    </Box>
  );
};
