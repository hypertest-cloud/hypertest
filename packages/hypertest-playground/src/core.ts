import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin as playwrightPlugin } from "@hypertest/hypertest-plugin-playwright";
import { HypertestProviderCloudAWS } from '@hypertest/hypertest-provider-cloud-aws'
import { PlaywrightCloudFunctionContext } from "../../hypertest-plugin-playwright/dist/types.js";

const cloudProvider = HypertestProviderCloudAWS<PlaywrightCloudFunctionContext>({})
// cloudProvider.invoke('temp image reference', {
//   grepString: ''
// })
console.log('Testing  plugin.buildImage')

const plugin = playwrightPlugin({
  lambdaEnvironment: 'unix',
  playwrightConfig: {
    testDirectory: 'playwright/tests',
    projectName: 'chromium',
  },
  cloudProvider,
});

const image = await plugin.buildImage();
cloudProvider.pushImage(image)


// const hypertest = HypertestCore({
//   plugin,
//   cloudProvider
// });

// hypertest.run();
