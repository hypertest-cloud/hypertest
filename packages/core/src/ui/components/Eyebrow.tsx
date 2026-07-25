import { Text } from 'ink';

export const Eyebrow = ({ children }: { children: string }) => (
  <Text color="#97a3b6">{children.toUpperCase()}</Text>
);
