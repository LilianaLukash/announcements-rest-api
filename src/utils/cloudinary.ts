import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";
import logger from "../logger.ts";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageToCloudinary(
  filePath: string,
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "announcements",
    });

    logger.info({ imageUrl: result.secure_url }, "Photo uploaded to Cloudinary");

    return result.secure_url;
  } finally {
    await fs.unlink(filePath).catch(() => undefined);
  }
}
