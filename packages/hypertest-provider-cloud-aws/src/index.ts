import { ECRClient, GetAuthorizationTokenCommand } from '@aws-sdk/client-ecr';
import {
  InvokeCommand,
  LambdaClient,
  UpdateFunctionCodeCommand,
} from '@aws-sdk/client-lambda';
import { fromEnv } from '@aws-sdk/credential-providers';
import type {
  CloudPlugin,
  HypertestProviderCloud,
  ResolvedHypertestConfig,
} from '@hypertest/hypertest-types';
import { z } from 'zod';
import { runCommand } from './runCommand.js';

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
const HypertestProviderCloudAWS = <T>(
  settings: HypertestProviderCloudAwsConfig,
  config: ResolvedHypertestConfig,
): HypertestProviderCloud<T> => {
  const lambdaClient = new LambdaClient({
    credentials: fromEnv(),
    region: settings.region,
  });
  const ecrClient = new ECRClient({
    credentials: fromEnv(),
    region: settings.region,
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
        runCommand(`docker pull ${settings.baseImage}`);

        // Push the Docker image to ECR
        console.log(
          'Tagging local image with hypertest-local/playground-playwright...',
        );
        runCommand(
          `docker tag ${settings.baseImage} hypertest-local/playground-playwright`,
        );
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
    invoke: async (context) => {
      const command = new InvokeCommand({
        FunctionName: settings.functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(context),
      });
      const { Payload } = await lambdaClient.send(command);
      const result = Payload ? Buffer.from(Payload).toString('utf-8') : '';

      return result;
    },
    updateLambdaImage: async () => {
      const command = new UpdateFunctionCodeCommand({
        FunctionName: settings.functionName,
        ImageUri: getTargetImageName(),
      });
      try {
        const response = await lambdaClient.send(command);

        console.log(
          `Lambda ${settings.functionName} image update has been started, status: ${response.LastUpdateStatus}`,
        );
      } catch (error) {
        console.error('Error updating lambda by new image', error);
        process.exit(1);
      }
    },
  };
};

export const HypertestProviderCloudAwsConfigSchema = z.object({
  baseImage: z.string(),
  region: z.string(),
  ecrRegistry: z.string(),
  functionName: z.string(),
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
