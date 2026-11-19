import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import User from './models/User.js';
import { autoSeedStockIfNeeded } from './controllers/stockController.js';

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing environment variable(s): ${missing.join(', ')}. Copy .env.example to .env first.`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const ensureAdminUser = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'jdguru7777@gmail.com').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || 'JD@1234').trim();

  let admin = await User.findOne({ email: adminEmail }).select('+password');
  if (!admin) {
    admin = await User.create({
      name: 'Store Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    console.log(`[Admin Setup] Created admin user: ${adminEmail}`);
  } else {
    let modified = false;
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      modified = true;
    }
    const isMatch = await admin.matchPassword(adminPassword);
    if (!isMatch) {
      admin.password = adminPassword;
      modified = true;
    }
    if (modified) {
      await admin.save();
      console.log(`[Admin Setup] Synced admin credentials for: ${adminEmail}`);
    } else {
      console.log(`[Admin Setup] Admin account verified: ${adminEmail}`);
    }
  }

  try {
    await autoSeedStockIfNeeded(admin._id);
  } catch (err) {
    console.warn('[Stock Setup] Auto-seed note:', err.message);
  }
};

try {
  await connectDB();
  await ensureAdminUser();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
} catch (error) {
  console.error('Could not start the server:', error.message);
  process.exit(1);
}
