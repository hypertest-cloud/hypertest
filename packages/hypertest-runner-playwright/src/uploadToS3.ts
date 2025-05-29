import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { glob } from 'glob';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface UploadResult {
  success: boolean;
}

// Helper function to determine content type based on file extension
function getContentType(relativeFilePath: string): string {
  const extension = relativeFilePath.split('.').pop()?.toLowerCase();

  const contentTypeMap: Record<string, string> = {
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    pdf: 'application/pdf',
  };

  return contentTypeMap[extension || ''] || 'application/octet-stream';
}

export const uploadToS3 = async (
  bucketName: string,
  testOutputDir: string,
  uuid: string,
): Promise<UploadResult> => {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
  });

  try {
    // Read all relative file paths from the testOutDir directory
    const relativeFilePaths = await glob('**/*', {
      cwd: testOutputDir,
      nodir: true,
      dot: true,
    });

    // Upload each file to S3
    const uploadPromises = relativeFilePaths.map(async (relativeFilePath) => {
      const filePath = join(testOutputDir, relativeFilePath);
      const fileContent = await readFile(filePath);

      const params = {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        Bucket: bucketName,
        // biome-ignore lint/style/useNamingConvention: <explanation>
        Key: `${uuid}/${relativeFilePath}`,
        // biome-ignore lint/style/useNamingConvention: <explanation>
        Body: fileContent,
        // biome-ignore lint/style/useNamingConvention: <explanation>
        ContentType: getContentType(relativeFilePath),
      };

      // Upload to S3
      const command = new PutObjectCommand(params);
      return s3Client.send(command);
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error uploading files to S3:', error);

    return {
      success: false,
    };
  }
};
