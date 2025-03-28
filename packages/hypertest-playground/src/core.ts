import { Plugin as playwrightPlugin } from '@hypertest/hypertest-plugin-playwright';
import { HypertestProviderCloudAWS } from '@hypertest/hypertest-provider-cloud-aws';
import type { PlaywrightCloudFunctionContext } from '../../hypertest-plugin-playwright/dist/types.js';
import type { HypertestConfig } from '@hypertest/hypertest-core';

const hypertestConfig: HypertestConfig = await import(
  `${process.cwd()}/hypertest.config.js`
).then((mod) => mod.default);
console.log({ hypertestConfig });

const cloudProvider = HypertestProviderCloudAWS<PlaywrightCloudFunctionContext>(
  hypertestConfig.cloudProvider,
  hypertestConfig,
);
// cloudProvider.invoke('temp image reference', {
//   grepString: ''
// })

const plugin = playwrightPlugin({
  // lambdaEnvironment: 'unix',
  config: hypertestConfig,
  dryRun: process.env.DRY_RUN !== undefined,
  cloudProvider,
});
const contexts = await plugin.getCloudFunctionContexts();

console.log(contexts);

await cloudProvider.pullBaseImage();
const image = await plugin.buildImage();
await cloudProvider.pushImage(image);

// const hypertest = HypertestCore({
//   plugin,
//   cloudProvider
// });

// hypertest.run();
