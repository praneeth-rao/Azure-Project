const { BlobServiceClient } = require('@azure/storage-blob');
const { TableClient, TableServiceClient } = require('@azure/data-tables');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "userfiles";
const tableName = "filesMetaData";

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

const tableClient = TableClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING,
  tableName
);

module.exports = async function (context, req) {
  context.log("Upload file request received");

  const buffer = req.body;
  const userEmail = req.headers["x-user-email"];
  const originalFilename = req.headers["x-filename"] || req.query.filename;

  if (!buffer || !userEmail || !originalFilename) {
    context.log("Missing data");
    context.res = {
      status: 400,
      body: "Missing file data, user email, or filename."
    };
    return;
  }

  try {
    // Extract filename and extension
    const parsed = path.parse(originalFilename);
    let baseName = parsed.name;
    const ext = parsed.ext || ".bin";

    // Get all existing filenames for this user
    const existing = tableClient.listEntities({
      queryOptions: {
        filter: `PartitionKey eq '${userEmail}'`
      }
    });

    const existingNames = new Set();
    for await (const entity of existing) {
      existingNames.add(entity.finalFilename);
    }

    // Generate a unique final filename
    let finalFilename = `${baseName}${ext}`;
    let counter = 1;
    while (existingNames.has(finalFilename)) {
      finalFilename = `${baseName}(${counter})${ext}`;
      counter++;
    }

    // Upload to blob
    const blobName = uuidv4(); // use UUID as blob name
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(buffer);

    // Save metadata to table
    await tableClient.createEntity({
      partitionKey: userEmail,
      rowKey: blobName,
      finalFilename,
      originalFilename,
      uploadTime: new Date().toISOString()
    });

    context.log(`Uploaded & recorded: ${finalFilename}`);

    context.res = {
      status: 200,
      body: {
        message: "Upload successful",
        blobName,
        displayName: finalFilename
      }
    };
  } catch (err) {
    context.log("Error:", err.message);
    context.res = {
      status: 500,
      body: "Upload failed: " + err.message
    };
  }
};
