import { ECRClient, GetAuthorizationTokenCommand } from '@aws-sdk/client-ecr';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { fromEnv } from '@aws-sdk/credential-providers';
import type {
  CloudPlugin,
  HypertestConfig,
  HypertestProviderCloud,
} from '@hypertest/hypertest-types';
import { execSync } from 'node:child_process';
import { z } from 'zod';

// biome-ignore lint/style/useNamingConvention: <explanation>

const AWS_REGION = 'eu-central-1'; // Replace with your AWS region
const FUNC_NAME = 'hypertestDevHelloWorld'; // Replace with your Lambda function name

const BASE_IMAGE_NAME =
  '302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/hypertest-playwright:latest';

// biome-ignore lint/style/useNamingConvention: <explanation>
export const HypertestProviderCloudAWS = <T>(
  settings: HypertestProviderCloudAwsConfig,
  config: HypertestConfig,
): HypertestProviderCloud<T> => {
  const lambdaClient = new LambdaClient({
    credentials: fromEnv(),
    region: AWS_REGION,
  });

  return {
    getTargetImageName() {
      return `${settings.ecrRegistry}/${config.imageName}:latest`;
    },
    async pullBaseImage() {
      const ecrClient = new ECRClient({
        credentials: lambdaClient.config.credentials,
        region: lambdaClient.config.region,
      });

      try {
        // Step 1: Get ECR Authorization Token
        const command = new GetAuthorizationTokenCommand({});
        const response = await ecrClient.send(command);

        if (
          !response.authorizationData ||
          response.authorizationData.length === 0
        ) {
          throw new Error('No authorization data received from ECR.');
        }

        const { authorizationToken, proxyEndpoint } =
          response.authorizationData[0];
        if (!authorizationToken || !proxyEndpoint) {
          throw new Error('Invalid authorization data received.');
        }
        console.log('proxyEndpoint:', proxyEndpoint);
        // Decode the authorization token (Base64 encoded "username:password")
        const decodedToken = Buffer.from(
          authorizationToken,
          'base64',
        ).toString();
        const [username, password] = decodedToken.split(':');

        // Log in to ECR
        console.log('Logging in to ECR...');
        execSync(
          `docker login -u ${username} -p ${password} ${proxyEndpoint}`,
          { stdio: 'inherit' },
        );

        // Push the Docker image to ECR
        console.log('Pulling base docker lambda runner image to local repo...');

        execSync(`docker pull ${BASE_IMAGE_NAME}`, { stdio: 'inherit' });
      } catch (error) {
        console.error('Error pushing Docker image to ECR:', error);
      }
    },
    pushImage: async ({ name: imageName }) => {
      const ecrClient = new ECRClient({
        credentials: lambdaClient.config.credentials,
        region: lambdaClient.config.region,
      });

      try {
        // Step 1: Get ECR Authorization Token
        const command = new GetAuthorizationTokenCommand({});
        const response = await ecrClient.send(command);

        if (
          !response.authorizationData ||
          response.authorizationData.length === 0
        ) {
          throw new Error('No authorization data received from ECR.');
        }

        const { authorizationToken, proxyEndpoint } =
          response.authorizationData[0];
        if (!authorizationToken || !proxyEndpoint) {
          throw new Error('Invalid authorization data received.');
        }
        console.log('proxyEndpoint:', proxyEndpoint);
        // Decode the authorization token (Base64 encoded "username:password")
        const decodedToken = Buffer.from(
          authorizationToken,
          'base64',
        ).toString();
        const [username, password] = decodedToken.split(':');

        // Log in to ECR
        console.log('Logging in to ECR...');
        execSync(
          `docker login -u ${username} -p ${password} ${proxyEndpoint}`,
          { stdio: 'inherit' },
        );

        // Push the Docker image to ECR
        console.log('Pushing Docker image to ECR...');
        execSync(`docker push ${imageName}`, { stdio: 'inherit' });

        console.log(`Docker image pushed successfully to ${imageName}`);
      } catch (error) {
        console.error('Error pushing Docker image to ECR:', error);
      }

      // TODO
      return '';
    },
    invoke: async (imageReference, context) => {
      // TODO: Implement
      // const command = new InvokeCommand({
      //   FunctionName: FUNC_NAME,
      //   Payload: JSON.stringify({
      //     region: AWS_REGION,
      //   }),
      // });
      // const { StatusCode, Payload, LogResult } = await lambdaClient.send(command);
      // if (StatusCode !== 200) {
      //   throw new Error(`Lambda invocation failed with status ${StatusCode}`);
      // }
      // console.log('StatusCode: ', StatusCode?.toString())
      // const logs = LogResult
      //   ? Buffer.from(LogResult, 'base64').toString('utf-8')
      //   : '';
      // const result = Payload
      //   ? Buffer.from(Payload).toString('utf-8')
      //   : '';
      // console.log('lambda spawn logs: ', logs)
      // console.log('lambda result: ', result)
    },
    getStatus: async (id: string) => {},
  };
};

export const HypertestProviderCloudAwsConfigSchema = z.object({
  ecrRegistry: z.string(),
});

type HypertestProviderCloudAwsConfig = z.infer<
  typeof HypertestProviderCloudAwsConfigSchema
>;

export const plugin = (
  options: HypertestProviderCloudAwsConfig,
): CloudPlugin => ({
  name: '',
  version: '0.0.1',
  validate: async () => {
    await HypertestProviderCloudAwsConfigSchema.parseAsync(options);
  },
  handler: (config) => {
    return HypertestProviderCloudAWS(options, config);
  },
});
