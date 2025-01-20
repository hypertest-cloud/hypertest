import { HypertestCore } from "@hypertest/hypertest-core";
import { Plugin as playwrightPlugin } from "@hypertest/hypertest-plugin-playwright";
import { HypertestProviderCloudAWS } from '@hypertest/hypertest-provider-cloud-aws'
import { PlaywrightLambdaContext } from "../../hypertest-plugin-playwright/dist/types.js";

const cloudProvider = HypertestProviderCloudAWS<PlaywrightLambdaContext>({})
// cloudProvider.invoke('temp image reference', {
//   grepString: ''
// })
console.log('Testing hypertest/dev:latest PUSH')
cloudProvider.pushImage('302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/dev2:latest')

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
