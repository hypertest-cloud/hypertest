import type { Dockerfile } from '@hypertest/hypertest-types';

type BuildArgs = {
  // biome-ignore lint/style/useNamingConvention: <explanation>
  BASE_IMAGE: string;
  // biome-ignore lint/style/useNamingConvention: <explanation>
  TEST_DIR: string;
  // biome-ignore lint/style/useNamingConvention: <explanation>
  PLAYWRIGHT_CONFIG_FILEPATH: string;
};

// biome-ignore lint/complexity/noBannedTypes: <explanation>
declare const _dockerfile: Dockerfile<{ buildArgs: BuildArgs; env: {} }>;

// biome-ignore lint/style/noDefaultExport: <explanation>
export default _dockerfile;
export { _dockerfile as Dockerfile };
