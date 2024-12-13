import { Lambda } from "@aws-sdk/client-lambda";
import { fromEnv } from "@aws-sdk/credential-providers";
import { HypertestProviderCloud } from "@hypertest/hypertest-core";
import { lambda } from "./lambda.js";

interface HypertestProviderCloudAWS extends HypertestProviderCloud { }

interface HypertestProviderCloudAWSSettings {}

const AWS_REGION = 'us-east-1';
const FUNC_NAME = 'my_func_name'
const PAYLOAD = 'console.log("hello world")'

export const HypertestProviderCloudAWS = (settings: HypertestProviderCloudAWSSettings): HypertestProviderCloudAWS => {
  const lambdaClient = new Lambda({
    credentials: fromEnv(),
    region: AWS_REGION,
  });

  return {
    setImage: async () => {},
    spawn: async () => {
      console.log(lambda.create({
        client: lambdaClient,
        args: {
          FunctionName: FUNC_NAME,
          Payload: PAYLOAD,
        }
      }))
    },
    getStatus: async (id: string) => {},
  }
}
