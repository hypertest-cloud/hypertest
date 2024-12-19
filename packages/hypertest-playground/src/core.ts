import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin as playwrightPlugin } from "@hypertest/hypertest-plugin-playwright";
import { HypertestProviderCloudAWS } from '@hypertest/hypertest-provider-cloud-aws'
import { PlaywrightLambdaContext } from "../../hypertest-plugin-playwright/dist/types.js";

const cloudProvider = HypertestProviderCloudAWS<PlaywrightLambdaContext>({})
cloudProvider.invoke('temp image reference', {
  grepString: ''
})

// const plugin = playwrightPlugin({
//   lambdaEnvironment: 'unix',
//   playwrightConfig: {
//     testDirectory: 'playwright/tests',
//     projectName: 'chromium',
//   },
//   cloudProvider,
// });

// const hypertest = HypertestCore({
//   plugin,
//   cloudProvider
// });

// hypertest.run();
