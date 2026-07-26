import type { AnyDockerfile, BuildArgsOf, EnvOf } from '@hypertest-cloud/types';
import { execa } from 'execa';

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
  silent?: boolean;
};

export async function buildDockerImage<
  // biome-ignore lint/style/useNamingConvention: <explanation>
  TDockerfile extends AnyDockerfile,
>({
  dockerfile,
  contextDir,
  imageTag,
  platform,
  buildArgs = {},
  env = {},
  silent = false,
}: DockerBuildOptions<TDockerfile>): Promise<void> {
  const args = [
    'buildx',
    'build',
    '--provenance=false',
    '--sbom=false',
    '--load',
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
    stdout: silent ? 'pipe' : 'inherit',
    stderr: silent ? 'pipe' : 'inherit',
    env: {
      // biome-ignore lint/style/useNamingConvention: <explanation>
      DOCKER_BUILDKIT: '1',
      ...env,
    },
  });
}
