export interface PlaywrightCloudFunctionContext {
  grep: string;
}

export interface PlaywrightPluginOptions {}

export interface DockerBuildManifest {
  invokePayloadContexts: PlaywrightCloudFunctionContext[];
}
