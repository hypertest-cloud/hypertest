import type { Tagged, GetTagMetadata } from 'type-fest';

export type AnyDockerfile = Dockerfile<{
  buildArgs: Record<string, string>;
  env: Record<string, string>;
}>;

export type Dockerfile<
  T extends {
    buildArgs: Record<string, string>;
    env: Record<string, string>;
  },
> = Tagged<string, 'Dockerfile', T>;

export type BuildArgsOf<
  T extends Dockerfile<{
    buildArgs: Record<string, string>;
    env: Record<string, string>;
  }>,
> = GetTagMetadata<T, 'Dockerfile'>['buildArgs'];

export type EnvOf<
  T extends Dockerfile<{
    buildArgs: Record<string, string>;
    env: Record<string, string>;
  }>,
> = GetTagMetadata<T, 'Dockerfile'>['env'];
