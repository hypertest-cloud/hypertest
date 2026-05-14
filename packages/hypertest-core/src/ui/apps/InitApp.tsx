import { Text, useApp } from 'ink';
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
    <Text>
      {color.inkSecondary(icon.arrow)}{' created '}
      <Text color="#97a3b6">{configPath}</Text>
    </Text>
  );
};
