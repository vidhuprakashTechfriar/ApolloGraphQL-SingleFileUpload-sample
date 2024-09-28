// minioUpload.js
const { Client } = require("minio");
const dotenv = require("dotenv");

dotenv.config();
// MinIO Client Configuration
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT, 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Function to upload a file to MinIO
const uploadToMinio = async (stream, bucketName, filename, mimetype) => {
  try {
    // Log the bucket name, filename, and other parameters
    console.log("Uploading to MinIO with parameters:");
    console.log(`- Bucket: ${bucketName}`);
    console.log(`- Filename: ${filename}`);
    console.log(`- Mimetype: ${mimetype}`);
    console.log(`- Endpoint: ${process.env.MINIO_ENDPOINT}`);
    console.log(`- Port: ${process.env.MINIO_PORT}`);

    // Upload the file to MinIO
    await minioClient.putObject(bucketName, filename, stream, {
      "Content-Type": mimetype,
    });

    console.log("File uploaded successfully to MinIO.");

    // Construct the URL to access the file
    const fileUrl = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${filename}`;

    console.log(`File URL: ${fileUrl}`);

    return fileUrl;
  } catch (error) {
    console.error("Error uploading file to MinIO:", error.message);
    console.error("Stack Trace:", error.stack);
    throw new Error("File upload failed");
  }
};

module.exports = { minioClient, uploadToMinio };
