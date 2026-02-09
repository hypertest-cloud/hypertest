import { ECRClient, GetAuthorizationTokenCommand } from '@aws-sdk/client-ecr';
import {
  InvokeCommand,
  LambdaClient,
  UpdateFunctionCodeCommand,
} from '@aws-sdk/client-lambda';
import {
  GetServiceQuotaCommand,
  ServiceQuotasClient,
} from '@aws-sdk/client-service-quotas';
import { fromEnv } from '@aws-sdk/credential-providers';
import {
  CheckError,
  type CloudFunctionProviderPlugin,
  type CloudFunctionProviderPluginDefinition,
  type ResolvedHypertestConfig,
} from '@hypertest/hypertest-types';
import type winston from 'winston';
import { z } from 'zod';
import { runCommand } from './runCommand.js';
import { isAwsSdkError } from './ts-guards.js';
import { isDockerRunning } from './isDockerRunning.js';

const getEcrAuth = async (ecrClient: ECRClient, logger: winston.Logger) => {
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

  logger.debug('ECR authorization proxy endpoint:', proxyEndpoint);
  // Decode the authorization token (Base64 encoded "username:password")
  const decodedToken = Buffer.from(authorizationToken, 'base64').toString();
  const [username, password] = decodedToken.split(':');

  return {
    username,
    password,
    proxyEndpoint,
  };
};

export const TestInvokeResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    name: z.string(),
    filePath: z.string(),
    duration: z.number(),
  }),
  z.object({
    success: z.literal(false),
    message: z.string(),
    name: z.string().optional(),
    filePath: z.string().optional(),
    stackTrace: z.string().optional(),
  }),
]);

// biome-ignore lint/style/useNamingConvention: <explanation>
const HypertestProviderCloudAWS = (
  settings: HypertestProviderCloudAwsConfig,
  config: ResolvedHypertestConfig,
): CloudFunctionProviderPlugin => {
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

  const assertDockerDaemon = () => {
    if (!isDockerRunning()) {
      config.logger.error(
        'Error: Docker daemon is not running. Please start Docker and try again.',
      );
      process.exit(1);
    }
  };

  return {
    async pullBaseImage() {
      assertDockerDaemon();

      try {
        const { username, password, proxyEndpoint } = await getEcrAuth(
          ecrClient,
          config.logger,
        );

        config.logger.verbose('Logging in to ECR...');
        runCommand(
          `docker login -u ${username} --password-stdin ${proxyEndpoint}`,
          { input: password },
        );

        // Push the Docker image to ECR
        config.logger.verbose(
          'Pulling base docker lambda runner image to local repo...',
        );
        runCommand(`docker pull ${settings.baseImage}`);

        // Push the Docker image to ECR
        config.logger.verbose(
          `Tagging local image with ${config.localBaseImageName} ...`,
        );
        runCommand(
          `docker tag ${settings.baseImage} ${config.localBaseImageName}`,
        );
      } catch (error) {
        config.logger.error(`Error pushing Docker image to ECR: ${error}`);
        process.exit(1);
      }
    },
    pushImage: async () => {
      assertDockerDaemon();

      try {
        const { username, password, proxyEndpoint } = await getEcrAuth(
          ecrClient,
          config.logger,
        );

        config.logger.verbose('Logging in to ECR...');
        runCommand(
          `docker login -u ${username} --password-stdin ${proxyEndpoint}`,
          { input: password },
        );

        const targetName = getTargetImageName();

        config.logger.verbose('Tagging local image with remote tag');
        runCommand(`docker tag ${config.localImageName} ${targetName}`);

        config.logger.verbose('Pushing Docker image to ECR...');
        runCommand(`docker push ${targetName}`);

        config.logger.verbose(
          `Docker image pushed successfully to ${targetName}`,
        );
      } catch (error) {
        config.logger.error(`Error pushing Docker image to ECR: ${error}`);
        process.exit(1);
      }
    },
    invoke: async (payload) => {
      const ingestedPayload = {
        ...payload,
        bucketName: settings.bucketName,
      };

      const command = new InvokeCommand({
        FunctionName: settings.functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(ingestedPayload),
      });

      try {
        const { Payload } = await lambdaClient.send(command);
        const result = JSON.parse(
          Payload ? Buffer.from(Payload).toString('utf-8') : '',
        );

        return TestInvokeResponseSchema.parseAsync(result);
      } catch (error) {
        config.logger.error(`Failed to send lambda: ${error}`);

        if (isAwsSdkError(error) && error.$metadata.httpStatusCode === 429) {
          config.logger.error(
            `Rate limit exceeded (HTTP 429) while invoking Lambda function.` +
              `Refer to the README for instructions on how to increase the maximum number of allowed Lambda invocations for your account.`,
          );
        }

        process.exit(1);
      }
    },
    updateLambdaImage: async () => {
      const command = new UpdateFunctionCodeCommand({
        FunctionName: settings.functionName,
        ImageUri: getTargetImageName(),
      });

      try {
        const response = await lambdaClient.send(command);

        config.logger.verbose(
          `Lambda ${settings.functionName} image update has been started, status: ${response.LastUpdateStatus}`,
        );
      } catch (error) {
        config.logger.error(`Error updating lambda by new image ${error}`);
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
  bucketName: z.string(),
});

type HypertestProviderCloudAwsConfig = z.infer<
  typeof HypertestProviderCloudAwsConfigSchema
>;

const plugin = (
  options: HypertestProviderCloudAwsConfig,
): CloudFunctionProviderPluginDefinition => ({
  name: '',
  version: '0.0.1',
  validate: async () => {
    await HypertestProviderCloudAwsConfigSchema.parseAsync(options);
  },
  getCliDoctorChecks: (config) => [
    {
      title: 'AWS Concurrency limits',
      description: 'Check if AWS account have sufficient concurrency limit',
      run: async () => {
        const client = new ServiceQuotasClient({ region: options.region });

        // TODO Encounter adding proper permissions for the cloud account in Pulumi procedures.
        const response = await client.send(
          new GetServiceQuotaCommand({
            ServiceCode: 'lambda',
            QuotaCode: 'L-B99A9384', // Lambda invocations per account per region
          }),
        );

        if (!response.Quota?.Value) {
          throw new CheckError(
            `Unable to retrieve the Lambda invocation quota for your account in ${options.region} region.`,
          );
        }

        if (config.concurrency > response.Quota.Value) {
          throw new CheckError(
            'The configured concurrency exceeds the maximum allowed Lambda invocations for your account. Please refer to the README for instructions on how to resolve this.',
          );
        }

        return {
          message: 'Concurrency limit is sufficient for correct config',
          data: {
            configConcurrencyLimit: config.concurrency,
            cloudConcurrencyLimit: response.Quota.Value,
          },
        };
      },
      children: [],
    },
  ],
  handler: (config) => {
    return HypertestProviderCloudAWS(options, config);
  },
});

// biome-ignore lint/style/noDefaultExport: <explanation>
export default plugin;
