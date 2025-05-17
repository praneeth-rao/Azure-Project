const { TableClient } = require('@azure/data-tables');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const usersTableName = "usersData";

const tableClient = TableClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING,
  usersTableName
);

module.exports = async function (context, req) {
  context.log("Register user request received");

  const { email, displayName } = req.body;

  if (!email || !displayName) {
    context.res = {
      status: 400,
      body: "Email and display name are required."
    };
    return;
  }

  try {
    const partitionKey = "User";
    const rowKey = email;

    // Check if the user already exists
    const existingUser = await tableClient.getEntity(partitionKey, rowKey).catch(() => null);

    if (existingUser) {
      context.res = {
        status: 200,
        body: { message: "User already registered", email }
      };
      return;
    }

    // Register new user
    const userEntity = {
      partitionKey,
      rowKey,
      displayName,
      email,
      signupDate: new Date().toISOString()
    };

    await tableClient.createEntity(userEntity);

    context.res = {
      status: 200,
      body: { message: "User registered successfully", email }
    };
  } catch (err) {
    context.log("Error registering user:", err.message);
    context.res = {
      status: 500,
      body: "Error registering the user"
    };
  }
};
