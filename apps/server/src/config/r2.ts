import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  // R2 recommends path-style addressing (endpoint/bucket) rather than
  // virtual-hosted style (bucket.endpoint) — avoids exactly the kind
  // of malformed-URL issue we just hit.
  forcePathStyle: true,
});