import { execa } from 'execa';

export interface DockerBuildOptions {
  dockerfile: string;
  contextDir: string;
  imageTag?: string;
  platform?: 'linux/amd64';
  buildArgs?: Record<string, string>;
  env?: Record<string, string>;
}

export async function runDockerBuild({
  dockerfile,
  contextDir,
  imageTag,
  platform,
  buildArgs = {},
  env = {},
}: DockerBuildOptions): Promise<void> {
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
