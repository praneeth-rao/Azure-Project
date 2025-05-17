const { BlobServiceClient } = require('@azure/storage-blob');
const { TableClient } = require('@azure/data-tables');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Blob setup
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient("userfiles");

// Table setup
const tableName = "filesMetaData";
const tableClient = TableClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING, tableName);

module.exports = async function (context, req) {
  context.log("Delete file request received");

  const blobUuid = context.bindingData.filename; // filename is the UUID in route param
  const userEmail = req.headers["x-user-email"];

  if (!blobUuid || !userEmail) {
    context.res = {
      status: 400,
      body: "Missing blob ID or user email."
    };
    return;
  }

  try {
    // Try to fetch entity metadata from table
    let entity;
    try {
      entity = await tableClient.getEntity(userEmail, blobUuid);
    } catch (err) {
      if (err.statusCode === 404) {
        context.log(`⚠️ No metadata found for blob UUID: ${blobUuid}`);
        context.res = {
          status: 404,
          body: "File metadata not found."
        };
        return;
      }
      throw err;
    }

    // Delete blob if it exists
    const blobClient = containerClient.getBlockBlobClient(blobUuid);
    const exists = await blobClient.exists();
    if (exists) {
      await blobClient.delete();
      context.log(`Blob '${blobUuid}' deleted`);
    } else {
      context.log(`⚠️ Blob '${blobUuid}' not found`);
    }

    // Delete metadata
    await tableClient.deleteEntity(userEmail, blobUuid);
    context.log(`Metadata for '${blobUuid}' deleted`);

    context.res = {
      status: 200,
      body: `File '${entity.finalFilename}' deleted successfully`
    };
  } catch (err) {
    context.log("Delete error:", err.message);
    context.res = {
      status: 500,
      body: "Error deleting file or metadata"
    };
  }
};
