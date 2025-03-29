import { ConfigSchema, type HypertestConfig } from '@hypertest/hypertest-types';
import { z } from 'zod';

export const getConfigFilepath = () => `${process.cwd()}/hypertest.config.js`;
export const loadConfig = async (): Promise<HypertestConfig> => {
  const config: unknown = await import(getConfigFilepath());

  const module = await z
    .object({
      default: z.custom<unknown>((value) => value !== undefined, {
        message: 'hypertest.config.js is missing default export',
      }),
    })
    .parseAsync(config);

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return (await ConfigSchema.passthrough().parseAsync(module.default)) as any;
};
