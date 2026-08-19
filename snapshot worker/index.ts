import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

const s3Client = new S3Client({
  region: process.env.AWS_REGION
});

async function main() {
  try {
    const fileBuffer = readFileSync("D:/Projects/TradeDesk/engine/redis-data/dump.rdb");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backups/engine-dump-${timestamp}.rdb`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
    });

    await s3Client.send(command);
    console.log(`Successfully backed up ${fileName} to S3.`);

  } catch (error) {
    console.error("Failed to backup to S3:", error);
  }

}

setInterval(() => {
  main()
}, 6 * 60 * 60 * 1000);