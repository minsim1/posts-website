# Database Scripts

This folder contains utility scripts for database management.

## init-db.ts

Database initialization script that sets up:
- **Admin account** (username: `admin`, password: `admin123`)
- **Default configuration** (rate limits, posting rules, username patterns, etc.)

### Prerequisites

1. Install `tsx` for running TypeScript files:
   ```bash
   npm install -D tsx
   ```

2. Ensure your `.env` file has the required variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/your-database
   PASSWORD_HASHING_ROUNDS=10
   ```

### Usage

Run the initialization script:
```bash
npx tsx scripts/init-db.ts
```

### Important Notes

- ⚠️ **Security Warning**: The script creates accounts with default passwords. **CHANGE THESE IMMEDIATELY** in production!
- The script is idempotent - it won't create duplicate users or configs if they already exist
- The script will exit with code 0 on success, 1 on failure

### Customization

To customize the initialization, edit `scripts/init-db.ts`:

**Add more users:**
```typescript
await createUser({
  username: 'moderator',
  password: 'mod123',
  role: 'moderator'
});
```

**Modify configuration defaults:**
Edit the `initializeConfig()` function to change rate limits, posting rules, or other settings.

### Output Example

```
🚀 Starting database initialization...

✅ Connected to MongoDB

✅ Created admin user: admin
✅ Created user user: testuser
✅ Created default configuration

✨ Database initialization completed successfully!

⚠️  IMPORTANT: Change default passwords in production!
   - Admin: username=admin, password=admin123
   - Test User: username=testuser, password=test123

🔌 Database connection closed
✅ Initialization script completed
```
