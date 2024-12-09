export interface PlaywrightPluginOptions {
  lambdaEnvironment: 'unix' // TODO | 'windows'
  playwrightConfig: {
    testDirectory: string
    projectName: string
  }
}
