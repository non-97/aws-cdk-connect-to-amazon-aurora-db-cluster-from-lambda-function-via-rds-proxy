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
      rejectUnauthorized: false,
      cert: fs.readFileSync("global-bundle.pem").toString(),
    },
    // Also OK
    // ssl: true,
  });

  // DB Connect
  await dbClient.connect();

  // Query
  const res = await dbClient.query("SELECT $1::text as message", [
    "Hello world!",
  ]);
  console.log(res.rows[0].message); // Hello world!

  // DB Close
  await dbClient.end();

  return;
};
