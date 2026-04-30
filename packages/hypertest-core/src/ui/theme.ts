import chalk from 'chalk';

export const color = {
  zap: chalk.hex('#1ee600'),
  zapDim: chalk.hex('#128a05'),
  cobalt: chalk.hex('#3366ff'),
  cobaltDim: chalk.hex('#5a8cff'),
  amber: chalk.hex('#f5a524'),
  rose: chalk.hex('#f43d5e'),
  inkMuted: chalk.hex('#97a3b6'),
  inkSecondary: chalk.hex('#475063'),
  inkRule: chalk.hex('#e7ebf2'),
  white: chalk.white,
  bold: chalk.bold,
};

export const icon = {
  pass: '✓',
  fail: '✕',
  skip: '◯',
  queued: '○',
  pending: '·',
  warn: '▲',
  arrow: '→',
} as const;

export const label = {
  pass: color.zap(icon.pass),
  fail: color.rose(icon.fail),
  skip: color.amber(icon.skip),
  queued: color.inkMuted(icon.queued),
  pending: color.inkMuted(icon.pending),
  warn: color.amber(icon.warn),
  arrow: color.inkSecondary(icon.arrow),
} as const;

export const formatDuration = (ms: number): string => {
  if (ms >= 60_000) {
    return `${(ms / 60_000).toFixed(1)}m`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
};
