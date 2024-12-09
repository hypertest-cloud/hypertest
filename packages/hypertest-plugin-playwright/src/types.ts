export interface PlaywrightPluginOptions {
  lambdaEnvironment: 'unix' // TODO | 'windows'
  playwrightConfig: {
    testsDirectory: string
    projectName: string
  }
}
