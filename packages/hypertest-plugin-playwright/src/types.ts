import type {
  HypertestConfig,
  HypertestProviderCloud,
} from '@hypertest/hypertest-core';

export interface PlaywrightCloudFunctionContext {
  grepString: string;
}

export interface PlaywrightPluginOptions {
  config: HypertestConfig;
  dryRun?: boolean;
  baseImage?: string;
  cloudProvider: HypertestProviderCloud<PlaywrightCloudFunctionContext>;
}
