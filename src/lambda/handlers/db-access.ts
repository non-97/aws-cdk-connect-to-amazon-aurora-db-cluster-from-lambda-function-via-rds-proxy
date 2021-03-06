import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { Client } from "pg";
import * as fs from "fs";

export const handler = async (): Promise<void | Error> => {
  // Get secret value
  const secretsManagerClient = new SecretsManagerClient({
    region: process.env.AWS_REGION!,
  });
  const getSecretValueCommand = new GetSecretValueCommand({
    SecretId: process.env.SECRET_ID,
  });
  const getSecretValueCommandResponse = await secretsManagerClient.send(
    getSecretValueCommand
  );
  const secret = JSON.parse(getSecretValueCommandResponse.SecretString!);

  // DB Client
  const dbClient = new Client({
    user: secret.username,
    host: process.env.PGHOST,
    database: secret.dbname,
    password: secret.password,
    port: secret.port,
    ssl: {
      rejectUnauthorized: true,
      cert: fs.readFileSync("global-bundle.pem", "utf-8").toString(),
    },
    // Also OK
    // ssl: true,
  });

  // DB Connect
  await dbClient.connect();

  // Query
  const beforeInsertQuery = await dbClient.query("SELECT * FROM test_table");
  console.log(beforeInsertQuery.rows);

  const insertQuery = await dbClient.query(
    "INSERT INTO test_table (name) VALUES ($1)",
    ["non-97"]
  );
  console.log(insertQuery.rows);

  const afterInsertQuery = await dbClient.query("SELECT * FROM test_table");
  console.log(afterInsertQuery.rows);

  // DB Connect Close
  await dbClient.end();

  return;
};
