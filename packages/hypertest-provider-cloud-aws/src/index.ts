import { ECRClient, GetAuthorizationTokenCommand } from '@aws-sdk/client-ecr';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { fromEnv } from '@aws-sdk/credential-providers';
import type {
  CloudPlugin,
  HypertestConfig,
  HypertestProviderCloud,
  ResolvedHypertestConfig,
} from '@hypertest/hypertest-types';
import { execSync } from 'node:child_process';
import { z } from 'zod';
import { runCommand } from './runCommand.js';

// biome-ignore lint/style/useNamingConvention: <explanation>

const AWS_REGION = 'eu-central-1'; // Replace with your AWS region
const FUNC_NAME = 'hypertestDevHelloWorld'; // Replace with your Lambda function name

const BASE_IMAGE_NAME =
  '302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/hypertest-playwright:latest';

const getEcrAuth = async (ecrClient: ECRClient) => {
  const command = new GetAuthorizationTokenCommand({});
  const response = await ecrClient.send(command);

  if (!response.authorizationData || response.authorizationData.length === 0) {
    throw new Error('No authorization data received from ECR.');
  }

  const { authorizationToken, proxyEndpoint } = response.authorizationData[0];
  // biome-ignore lint/complexity/useSimplifiedLogicExpression: <explanation>
  if (!authorizationToken || !proxyEndpoint) {
    throw new Error('Invalid authorization data received.');
  }

  console.log('proxyEndpoint:', proxyEndpoint);
  // Decode the authorization token (Base64 encoded "username:password")
  const decodedToken = Buffer.from(authorizationToken, 'base64').toString();
  const [username, password] = decodedToken.split(':');

  return {
    username,
    password,
    proxyEndpoint,
  };
};

// biome-ignore lint/style/useNamingConvention: <explanation>
export const HypertestProviderCloudAWS = <T>(
  settings: HypertestProviderCloudAwsConfig,
  config: ResolvedHypertestConfig,
): HypertestProviderCloud<T> => {
  const lambdaClient = new LambdaClient({
    credentials: fromEnv(),
    region: AWS_REGION,
  });
  const ecrClient = new ECRClient({
    credentials: lambdaClient.config.credentials,
    region: lambdaClient.config.region,
  });

  const getTargetImageName = () => {
    return `${settings.ecrRegistry}/${config.imageName}:latest`;
  };

  return {
    async pullBaseImage() {
      try {
        const { username, password, proxyEndpoint } =
          await getEcrAuth(ecrClient);

        console.log('Logging in to ECR...');
        runCommand(
          `docker login -u ${username} -p ${password} ${proxyEndpoint}`,
        );

        // Push the Docker image to ECR
        console.log('Pulling base docker lambda runner image to local repo...');
        runCommand(`docker pull ${BASE_IMAGE_NAME}`);
      } catch (error) {
        console.error('Error pushing Docker image to ECR:', error);
        process.exit(1);
      }
    },
    pushImage: async () => {
      try {
        const { username, password, proxyEndpoint } =
          await getEcrAuth(ecrClient);

        console.log('Logging in to ECR...');
        runCommand(
          `docker login -u ${username} -p ${password} ${proxyEndpoint}`,
        );

        const targetName = getTargetImageName();

        console.log('Tagging with remote tag');
        runCommand(`docker tag ${config.localImageName} ${targetName}`);

        console.log('Pushing Docker image to ECR...');
        runCommand(`docker push ${targetName}`);

        console.log(`Docker image pushed successfully to ${targetName}`);
      } catch (error) {
        console.error('Error pushing Docker image to ECR:', error);
        process.exit(1);
      }
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
