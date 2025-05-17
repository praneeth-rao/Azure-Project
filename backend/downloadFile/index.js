const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  const blobName = req.query.blobName;
  const filename = req.query.filename;

  if (!blobName || !filename) {
    context.res = { status: 400, body: "Missing blobName or filename" };
    return;
  }

  try {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = "userfiles";

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const downloadBlockBlobResponse = await blobClient.download();

    const chunks = [];
    for await (const chunk of downloadBlockBlobResponse.readableStreamBody) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    context.res = {
      status: 200,
      isRaw: true,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`
      },
      body: buffer
    };
  } catch (err) {
    context.log.error("Error downloading blob:", err);
    context.res = {
      status: 500,
      body: "Error downloading file: " + err.message
    };
  }
};
