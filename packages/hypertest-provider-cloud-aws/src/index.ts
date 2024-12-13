import { HypertestProviderCloud } from "@hypertest/hypertest-core";

interface HypertestProviderCloudAWS extends HypertestProviderCloud { }

interface HypertestProviderCloudAWSSettings {}

export const HypertestProviderCloudAWS = (settings: HypertestProviderCloudAWSSettings): HypertestProviderCloudAWS => ({
  setImage: async () => {},
  spawn: async () => {},
  getStatus: async (id: string) => {},
})
