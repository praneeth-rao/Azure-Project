const { TableClient } = require("@azure/data-tables");

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableName = "filesMetaData";

// Use TableClient directly (TableServiceClient not needed for most tasks)
const tableClient = TableClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING, tableName);

module.exports = async function (context, req) {
  context.log("Listing user files...");

  const userEmail = req.query.email || req.headers["x-user-email"];

  if (!userEmail) {
    context.res = {
      status: 400,
      body: { error: "Missing user email" }
    };
    return;
  }

  try {
    const files = [];

    for await (const entity of tableClient.listEntities({
      queryOptions: {
        filter: `PartitionKey eq '${userEmail}'`
      }
    })) {
      files.push({
        id: entity.rowKey,
        finalFilename: entity.finalFilename || null,
        originalFilename: entity.originalFilename || null,
        uploadDate: entity.uploadDate || entity.timestamp || null,
        size: entity.size || null
      });
    }

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: files
    };
  } catch (err) {
    context.log("Error listing files:", err.message);
    context.res = {
      status: 500,
      body: { error: "Internal server error while fetching files" }
    };
  }
};
