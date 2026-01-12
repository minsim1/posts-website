/**
 * Database Initialization Script
 * Script made basically entirely by AI. Sorry I was really lazy :((
 * 
 * This script initializes the database with:
 * - An admin account
 * - Default configuration settings
 * 
 * Usage:
 *   npx tsx scripts/init-db.ts
 * 
 * Environment Variables Required:
 *   - MONGODB_URI
 *   - PASSWORD_HASHING_ROUNDS
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Users } from '../src/lib/server/db/models/user';
import { Config } from '../src/lib/server/db/models/config';
import bcrypt from 'bcrypt';

dotenv.config();

let isConnected = false;

async function connectDB() {
	if (isConnected) {
		return;
	}

	const MONGODB_URI = process.env.MONGODB_URI;

	if (!MONGODB_URI) {
		throw new Error('MONGODB_URI is not defined in environment variables');
	}

	try {
		await mongoose.connect(MONGODB_URI);
		isConnected = true;
		console.log('MongoDB connected successfully');
	} catch (error) {
		console.error('MongoDB connection error:', error);
		throw error;
	}
}

function HashString(rawString: string): Promise<string> {
	const SALT_ROUNDS = process.env.PASSWORD_HASHING_ROUNDS;

	if (!SALT_ROUNDS) {
		throw new Error('PASSWORD_HASHING_ROUNDS is not defined in environment variables');
	}

	return bcrypt.hash(rawString, parseInt(SALT_ROUNDS));
}

interface InitUserConfig {
	username: string;
	password: string;
	role: 'admin' | 'user' | 'moderator';
}

/**
 * Create a user in the database
 */
async function createUser(config: InitUserConfig) {
	const { username, password, role } = config;

	// Check if user already exists
	const existingUser = await Users.findOne({ username });
	if (existingUser) {
		console.log(`⚠️  User "${username}" already exists, skipping...`);
		return existingUser;
	}

	// Hash the password
	const passwordHash = await HashString(password);

	// Create the user
	const user = await Users.create({
		username,
		passwordHash,
		role,
		canChangeUsername: true,
		lastUsernameChangeTimestamp: Date.now(),
		latestInteractions: [],
		suspension: null,
		suspensionHistory: [],
		suspensionLiftHistory: [],
	});

	console.log(`✅ Created ${role} user: ${username}`);
	return user;
}

/**
 * Initialize default configuration
 */
async function initializeConfig() {
	// Check if config already exists
	const existingConfig = await Config.findOne({});
	if (existingConfig) {
		console.log('⚠️  Configuration already exists, skipping...');
		return existingConfig;
	}

	// Create default config
	const config = await Config.create({
		userInteractionLimits: [
			{
				limitId: crypto.randomUUID(),
				timeframe: 3600000, // 1 hour in milliseconds
				maxInteractions: 10,
				interactionTypes: ['post']
			},
			{
				limitId: crypto.randomUUID(),
				timeframe: 3600000, // 1 hour
				maxInteractions: 50,
				interactionTypes: ['comment']
			},
			{
				limitId: crypto.randomUUID(),
				timeframe: 3600000, // 1 hour
				maxInteractions: 100,
				interactionTypes: ['vote']
			}
		],
		postingRules: [],
		postsDiscordWebhookUrls: [],
		disallowedUsernamePatterns: [
			'admin',
			'moderator',
			'mod',
			'system',
			'anon',
			'an0n'
		],
		moderationRules: {
			maxPostAgeToInteract: 2592000000 // 30 days in milliseconds
		},
		limits: {
			maxInteractionsToSave: 100,
			maxInteractionAgeToSave: 2592000000, // 30 days
			maxPostLength: 10000,
			maxCommentLength: 2000,
			maxJwtAge: 86400000, // 24 hours
			maxPostAgeToAllowDelete: 3600000, // 1 hour
			maxCommentAgeToAllowDelete: 3600000, // 1 hour
			minWaitToChangeUsername: 2592000000 // 30 days
		}
	});

	console.log('✅ Created default configuration');
	return config;
}

/**
 * Main initialization function
 */
async function initDatabase() {
	console.log('🚀 Starting database initialization...\n');

	try {
		// Connect to database
		await connectDB();
		console.log('✅ Connected to MongoDB\n');

		// Create admin user
		await createUser({
			username: 'admin',
			password: 'admin123',
			role: 'admin'
		});

		// Initialize configuration
		await initializeConfig();

		console.log('\n✨ Database initialization completed successfully!');

	} catch (error) {
		console.error('❌ Error initializing database:', error);
		throw error;
	} finally {
		// Close the database connection
		await mongoose.connection.close();
		console.log('\n🔌 Database connection closed');
	}
}

// Run the initialization
initDatabase()
	.then(() => {
		console.log('✅ Initialization script completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Initialization script failed:', error);
		process.exit(1);
	});
