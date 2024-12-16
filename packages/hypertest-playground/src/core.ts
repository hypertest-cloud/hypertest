import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin as playwrightPlugin } from "@hypertest/hypertest-plugin-playwright";
import { HypertestProviderCloudAWS } from '@hypertest/hypertest-provider-cloud-aws'

const cloudProvider = HypertestProviderCloudAWS({})
cloudProvider.invoke('temp image reference', {})

// const plugin = playwrightPlugin({
//   lambdaEnvironment: 'unix',
//   playwrightConfig: {
//     testDirectory: 'playwright/tests',
//     projectName: 'chromium',
//   }
// });

// const hypertest = HypertestCore({
//   plugin,
//   cloudProvider
// });

// hypertest.run();
