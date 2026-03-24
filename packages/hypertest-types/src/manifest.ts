export interface ImageBuildManifest<CloudFunctionContext> {
  imageDigest: string;
  testDirHash: string;
  invokePayloadContexts: CloudFunctionContext[];
}
