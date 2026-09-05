import 'dotenv/config';
import { initializeDatabase, closeDatabase } from './database.js';

async function checkAtlas() {
  const uri = process.env.MONGODB_URI;
  const envDetected = Boolean(uri);
  let userDetected = false;

  if (uri) {
    const match = uri.match(/mongodb\+srv:\/\/([^:]+):/i) || uri.match(/mongodb:\/\/([^:]+):/i);
    if (match && match[1] && match[1] !== '<username>') {
      userDetected = true;
    }
  }

  console.log(`Environment variable MONGODB_URI detected: ${envDetected}`);
  console.log(`MongoDB username detected: ${userDetected}`);

  const connected = await initializeDatabase();
  if (connected) {
    await closeDatabase();
    console.log('MongoDB connection verified.');
  } else {
    console.log('MongoDB connection failed.');
  }
}

checkAtlas();
