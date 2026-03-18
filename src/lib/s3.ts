import { S3Client } from "@aws-sdk/client-s3";

/**
 * Supabase S3-compatible client.
 * Using service role or specific access keys is recommended for server-side operations.
 */
export const s3Client = new S3Client({
  forcePathStyle: true,
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    // Note: In Supabase, you usually use the project reference as Access Key ID 
    // and the Service Role Key as Secret Access Key for full access.
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "supabase", 
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
});

export const S3_BUCKET = process.env.S3_BUCKET || "learntiers-assets";
