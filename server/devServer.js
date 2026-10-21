/**
 * devServer.js — Development entry point using mongodb-memory-server
 * Starts an in-process MongoDB instance so no local MongoDB installation is needed.
 * Seeds the DB with sample data for testing all workflows.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');

async function bootstrap() {
  console.log('[DevServer] Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27017 }
  });
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  console.log(`[DevServer] MongoDB in-memory running at: ${uri}`);

  // Now load the main server (which reads MONGO_URI from process.env)
  require('./server');
}

bootstrap().catch(err => {
  console.error('[DevServer] Fatal error:', err);
  process.exit(1);
});
