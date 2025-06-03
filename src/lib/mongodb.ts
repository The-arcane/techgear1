import { MongoClient, Db, ServerApiVersion } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env or .env.local');
}

if (!MONGODB_DB_NAME) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env or .env.local');
}

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

// Extend the NodeJS.Global interface to declare a cached connection.
// This helps in development mode to avoid creating new connections on every hot reload.
declare global {
  var mongo: {
    conn: MongoConnection | null;
    promise: Promise<MongoConnection> | null;
  }
}

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<MongoConnection> {
  if (cached.conn) {
     // Check if the client is still connected by pinging the admin database
    try {
      await cached.conn.client.db("admin").command({ ping: 1 });
      console.log("Using cached MongoDB connection.");
      return cached.conn;
    } catch (e) {
      console.warn("Cached MongoDB connection lost or invalid, creating a new one.", e);
      cached.conn = null; // Invalidate the connection
      cached.promise = null; // Allow promise to be recreated
    }
  }

  if (!cached.promise) {
    const opts = {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    };
    
    const client = new MongoClient(MONGODB_URI, opts);
    cached.promise = client.connect().then((connectedClient) => {
      const db = connectedClient.db(MONGODB_DB_NAME);
      console.log("New MongoDB connection established.");
      cached.conn = { client: connectedClient, db };
      return cached.conn;
    }).catch(err => {
        cached.promise = null; // Clear promise on error so it can be retried
        console.error("Failed to connect to MongoDB", err);
        throw err;
    });
  }
  
  try {
    const conn = await cached.promise;
    return conn;
  } catch (e) {
    cached.promise = null; // Ensure promise is cleared if it resolved to an error state for some reason
    throw e;
  }
}
