import { __MetadataBearer } from "@aws-sdk/client-lambda";

export function isAwsSdkError(err: unknown): err is __MetadataBearer & { name?: string } {
  return typeof err === 'object' && err !== null && '$metadata' in err;
}
