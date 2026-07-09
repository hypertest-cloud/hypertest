import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import type { HypertestEvent, HypertestEvents } from '@hypertest/hypertest-types';
import { Wordmark } from '../components/Wordmark.js';
import { Rule } from '../components/Rule.js';
import { DoctorCheck } from '../components/DoctorCheck.js';

type CheckResult = Extract<HypertestEvent, { type: 'doctor:check' }>;

interface DoctorAppProps {
  events: HypertestEvents;
  onExit?: () => void;
}

export const DoctorApp = ({ events, onExit }: DoctorAppProps) => {
  const [checks, setChecks] = useState<CheckResult[]>([]);

  useEffect(() => {
    const unsubscribe = events.on((event) => {
      if (event.type === 'doctor:check') {
        setChecks((prev) => [...prev, event]);
      } else if (event.type === 'doctor:done') {
        onExit?.();
      }
    });
    return unsubscribe;
  }, [events, onExit]);

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
