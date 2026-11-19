import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing environment variable(s): ${missing.join(', ')}. Copy .env.example to .env first.`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
} catch (error) {
  console.error('Could not start the server:', error.message);
  process.exit(1);
}
