import { HypertestProviderCloud } from "@hypertest/hypertest-core"

export interface PlaywrightCloudFunctionContext {
  grepString: string
}
export interface PlaywrightPluginOptions {
  lambdaEnvironment: 'unix' // TODO | 'windows'
  playwrightConfig: {
    testDirectory: string
    projectName: string
  },
  cloudProvider: HypertestProviderCloud<PlaywrightCloudFunctionContext>
}
