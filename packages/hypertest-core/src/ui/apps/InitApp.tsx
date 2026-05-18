import { Box, Text, useApp } from 'ink';
import { useEffect } from 'react';
import { icon, color } from '../theme.js';

interface Props {
  configPath: string;
}

export const InitApp = ({ configPath }: Props) => {
  const { exit } = useApp();

  useEffect(() => {
    exit();
  }, [exit]);

  return (
    <Box flexDirection="column" gap={0}>
      <Text>
        {color.inkSecondary(icon.arrow)}{' created '}
        <Text color="#97a3b6">{configPath}</Text>
      </Text>
      <Text> </Text>
      <Text color="#1ee600">{'hypertest initialized.'}</Text>
      <Text> </Text>
      <Text color="#97a3b6">{'Next steps:'}</Text>
      <Box gap={2} marginLeft={2}>
        <Text color="#3366ff">{'npx hypertest deploy'}</Text>
        <Text color="#475063">{'deploy tests to the cloud'}</Text>
      </Box>
      <Box gap={2} marginLeft={2}>
        <Text color="#3366ff">{'npx hypertest invoke'}</Text>
        <Text color="#475063">{'run tests in cloud'}</Text>
      </Box>
    </Box>
  );
};
