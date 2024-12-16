import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { ECRClient } from "@aws-sdk/client-ecr";
import { fromEnv } from "@aws-sdk/credential-providers";
import { HypertestProviderCloud } from "@hypertest/hypertest-core";
import { lambda } from "./lambda.js";

interface HypertestProviderCloudAWS extends HypertestProviderCloud { }

interface HypertestProviderCloudAWSSettings {}

const AWS_REGION = 'us-east-1';
const FUNC_NAME = 'my_func_name'
const PAYLOAD = 'console.log("hello world")'

export const HypertestProviderCloudAWS = (settings: HypertestProviderCloudAWSSettings): HypertestProviderCloudAWS => {
  const lambdaClient = new LambdaClient({
    credentials: fromEnv(),
    region: AWS_REGION,
  });
  const ecrClient = new ECRClient({
    credentials: fromEnv(),
    region: AWS_REGION,
  });

  return {
    setImage: async () => {},
    spawn: async () => {
      const command = new InvokeCommand({
        FunctionName: FUNC_NAME,
        Payload: PAYLOAD,
      });
      const { StatusCode, Payload, LogResult } = await lambdaClient.send(command);

      if (StatusCode !== 200) {
        throw new Error(`Lambda invocation failed with status ${StatusCode}`);
      }

      const logs = LogResult
        ? Buffer.from(LogResult, 'base64').toString('utf-8')
        : '';

      const result = Payload
        ? Buffer.from(Payload).toString('utf-8')
        : '';

      console.log('lambda spawn logs: ', logs)
      console.log('lambda result: ', result)
    },
    getStatus: async (id: string) => {},
  }
}
