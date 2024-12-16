import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

import { fromEnv } from "@aws-sdk/credential-providers";
import { HypertestProviderCloud } from "@hypertest/hypertest-core";
import { lambda } from "./lambda.js";

interface HypertestProviderCloudAWSSettings {}

const AWS_REGION = "eu-central-1"; // Replace with your AWS region
const FUNC_NAME = "hypertestDevHelloWorld"; // Replace with your Lambda function name

export const HypertestProviderCloudAWS = <T>(settings: HypertestProviderCloudAWSSettings): HypertestProviderCloud<T> => {
  const lambdaClient = new LambdaClient({
    credentials: fromEnv(),
    region: AWS_REGION,
  });

  return {
    pushImage: async (image) => '',
    invoke: async (imageReference, context) => {
      const command = new InvokeCommand({
        FunctionName: FUNC_NAME,
        Payload: JSON.stringify({
          region: AWS_REGION,
        }),
      });
      const { StatusCode, Payload, LogResult } = await lambdaClient.send(command);

      if (StatusCode !== 200) {
        throw new Error(`Lambda invocation failed with status ${StatusCode}`);
      }

      console.log('StatusCode: ', StatusCode?.toString())

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
