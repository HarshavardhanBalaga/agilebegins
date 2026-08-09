import { MongoClient, type Db } from "mongodb";

// Read credentials lazily inside connectDB(). Some entry points (seed
// scripts) load process.env AFTER importing this module, so capturing the
// variables here at module scope would leave them permanently undefined.
// A single shared MongoClient is reused across all requests.
let clientPromise: Promise<MongoClient> | undefined;

// In development, Next.js re-evaluates modules on hot reload, which would
// otherwise create a fresh MongoClient every time. Storing the promise on
// globalThis keeps the same connection alive across reloads.
const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

/**
 * Connects to MongoDB and returns the database instance.
 *
 * The connection is a singleton: subsequent calls reuse the already
 * established client instead of opening a new one.
 *
 * @throws If the connection string is missing or the connection fails.
 */
export async function connectDB(): Promise<Db> {
  // Read credentials from the environment only.
  // Never hardcode secrets — they live in .env.local.
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to your .env.local file.");
  }
  if (!dbName) {
    throw new Error("DB_NAME is missing. Add it to your .env.local file.");
  }

  // Create the client (and cache its connection promise) only on first use.
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise =
      process.env.NODE_ENV === "development"
        ? (globalWithMongo._mongoClientPromise ??= client.connect())
        : client.connect();
  }

  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (error) {
    // Reset the cached promise so a future call can retry the connection.
    clientPromise = undefined;
    globalWithMongo._mongoClientPromise = undefined;

    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to connect to MongoDB: ${reason}`);
  }
}
