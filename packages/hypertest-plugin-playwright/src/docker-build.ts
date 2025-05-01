import { execa } from 'execa';
import type {
  AnyDockerfile,
  BuildArgsOf,
  Dockerfile,
  EnvOf,
} from '@hypertest/hypertest-types';

export type DockerBuildOptions<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  // biome-ignore lint/style/useNamingConvention: <explanation>
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  TDockerfile extends AnyDockerfile,
> = {
  dockerfile: TDockerfile;
  contextDir: string;
  imageTag?: string;
  platform?: 'linux/amd64';
  buildArgs: BuildArgsOf<TDockerfile>;
  env: EnvOf<TDockerfile>;
};

export async function runDockerBuild<
  // biome-ignore lint/style/useNamingConvention: <explanation>
  TDockerfile extends AnyDockerfile,
>({
  dockerfile,
  contextDir,
  imageTag,
  platform,
  buildArgs = {},
  env = {},
}: DockerBuildOptions<TDockerfile>): Promise<void> {
  const args = [
    'build',
    ['-f', '-'],
    platform ? ['--platform', platform] : [],
    imageTag ? ['-t', imageTag] : [],
  ].flat();

  for (const [key, value] of Object.entries(buildArgs)) {
    args.push('--build-arg', `${key}=${value}`);
  }

  args.push(contextDir);

  await execa('docker', args, {
    input: dockerfile,
    stdout: 'inherit',
    stderr: 'inherit',
    env: {
      // biome-ignore lint/style/useNamingConvention: <explanation>
      DOCKER_BUILDKIT: '1',
      ...env,
    },
  });
}
