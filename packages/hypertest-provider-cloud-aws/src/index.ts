import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { fromEnv } from "@aws-sdk/credential-providers";
import { ECRClient, GetAuthorizationTokenCommand } from "@aws-sdk/client-ecr";
import { HypertestProviderCloud } from "@hypertest/hypertest-core";
import { execSync } from "child_process";
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
    pushImage: async (imageName) => {
      const ecrClient = new ECRClient({
        credentials: lambdaClient.config.credentials,
        region: lambdaClient.config.region,
      });

      try {
        // Step 1: Get ECR Authorization Token
        const command = new GetAuthorizationTokenCommand({});
        const response = await ecrClient.send(command);

        if (!response.authorizationData || response.authorizationData.length === 0) {
          throw new Error("No authorization data received from ECR.");
        }

        const { authorizationToken, proxyEndpoint } = response.authorizationData[0];
        if (!authorizationToken || !proxyEndpoint) {
          throw new Error("Invalid authorization data received.");
        }
        console.log('proxyEndpoint:', proxyEndpoint)
        // Decode the authorization token (Base64 encoded "username:password")
        const decodedToken = Buffer.from(authorizationToken, "base64").toString();
        const [username, password] = decodedToken.split(":");

        // Log in to ECR
        console.log("Logging in to ECR...");
        execSync(`docker login -u ${username} -p ${password} ${proxyEndpoint}`, { stdio: "inherit" });

        // Push the Docker image to ECR
        console.log("Pushing Docker image to ECR...");
        execSync(`docker push ${imageName}`, { stdio: "inherit" });

        console.log(`Docker image pushed successfully to ${imageName}`);
      } catch (error) {
        console.error("Error pushing Docker image to ECR:", error);
      }

      return ''
    },
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
