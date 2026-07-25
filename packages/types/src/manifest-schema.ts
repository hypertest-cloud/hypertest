import { z } from 'zod';

export const ImageBuildManifestSchema = z.object({
  imageDigest: z.string(),
  testDirHash: z.string(),
  invokePayloadContexts: z.array(z.unknown()),
});
