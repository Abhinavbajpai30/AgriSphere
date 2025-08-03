const mongoose = require('mongoose')
const fs = require('fs').promises
const path = require('path')
const logger = require('../utils/logger')

/**
 * Database Migration System
 * Handles schema changes, data migrations, and versioning
 */

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'scripts')
    this.migrationCollection = 'migrations'
    this.migrations = []
  }

  /**
   * Initialize migration system
   */
  async initialize() {
    try {
      // Ensure migrations collection exists
      await this.ensureMigrationsCollection()
      
      // Load migration files
      await this.loadMigrations()
      
      logger.info('Migration system initialized', { 
        totalMigrations: this.migrations.length 
      })
    } catch (error) {
      logger.error('Failed to initialize migration system', error)
      throw error
    }
  }

  /**
   * Load migration files from migrations directory
   */
  async loadMigrations() {
    try {
      const files = await fs.readdir(this.migrationsPath)
      const migrationFiles = files
        .filter(file => file.endsWith('.js'))
        .sort() // Ensure chronological order

      this.migrations = []

      for (const file of migrationFiles) {
        const migrationPath = path.join(this.migrationsPath, file)
        const migration = require(migrationPath)
        
        // Validate migration structure
        this.validateMigration(migration, file)
        
        this.migrations.push({
          filename: file,
          version: migration.version,
          description: migration.description,
          up: migration.up,
          down: migration.down,
          path: migrationPath
        })
      }

      logger.info('Loaded migrations', { 
        count: this.migrations.length,
        files: migrationFiles 
      })
    } catch (error) {
      logger.error('Failed to load migrations', error)
      throw error
    }
  }

  /**
   * Validate migration file structure
   */
  validateMigration(migration, filename) {
    const required = ['version', 'description', 'up', 'down']
    
    for (const field of required) {
      if (!migration[field]) {
        throw new Error(`Migration ${filename} missing required field: ${field}`)
      }
    }

    if (typeof migration.up !== 'function' || typeof migration.down !== 'function') {
      throw new Error(`Migration ${filename} up/down must be functions`)
    }

    if (!migration.version.match(/^\d{14}$/)) {
      throw new Error(`Migration ${filename} version must be timestamp format (YYYYMMDDHHMMSS)`)
    }
  }

  /**
   * Ensure migrations collection exists
   */
  async ensureMigrationsCollection() {
    const db = mongoose.connection.db
    const collections = await db.listCollections({ name: this.migrationCollection }).toArray()
    
    if (collections.length === 0) {
      await db.createCollection(this.migrationCollection)
      logger.info('Created migrations collection')
    }
  }

  /**
   * Get applied migrations from database
   */
  async getAppliedMigrations() {
    const db = mongoose.connection.db
    const appliedMigrations = await db
      .collection(this.migrationCollection)
      .find({})
      .sort({ version: 1 })
      .toArray()

    return appliedMigrations.map(m => m.version)
  }

  /**
   * Record migration as applied
   */
  async recordMigration(migration) {
    const db = mongoose.connection.db
    await db.collection(this.migrationCollection).insertOne({
      version: migration.version,
      description: migration.description,
      filename: migration.filename,
      appliedAt: new Date(),
      checksum: this.calculateChecksum(migration)
    })
  }

  /**
   * Remove migration record
   */
  async removeMigrationRecord(version) {
    const db = mongoose.connection.db
    await db.collection(this.migrationCollection).deleteOne({ version })
  }

  /**
   * Calculate migration checksum for integrity
   */
  calculateChecksum(migration) {
    const crypto = require('crypto')
    const content = migration.up.toString() + migration.down.toString()
    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations() {
    const appliedVersions = await this.getAppliedMigrations()
    return this.migrations.filter(m => !appliedVersions.includes(m.version))
  }

  /**
   * Run migrations up to target version
   */
  async migrate(targetVersion = null) {
    try {
      const pendingMigrations = await this.getPendingMigrations()
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations')
        return { applied: 0, migrations: [] }
      }

      let migrationsToRun = pendingMigrations
      
      if (targetVersion) {
        migrationsToRun = pendingMigrations.filter(m => m.version <= targetVersion)
      }

      const appliedMigrations = []

      for (const migration of migrationsToRun) {
        logger.info('Applying migration', { 
          version: migration.version, 
          description: migration.description 
        })

        const startTime = Date.now()

        try {
          // Run migration in transaction if possible
          await this.runWithTransaction(async () => {
            await migration.up()
            await this.recordMigration(migration)
          })

          const duration = Date.now() - startTime
          
          logger.info('Migration applied successfully', {
            version: migration.version,
            duration: `${duration}ms`
          })

          appliedMigrations.push({
            version: migration.version,
            description: migration.description,
            duration
          })

        } catch (error) {
          logger.error('Migration failed', {
            version: migration.version,
            error: error.message,
            stack: error.stack
          })
          
          // Stop on first failure
          throw new Error(`Migration ${migration.version} failed: ${error.message}`)
        }
      }

      logger.info('Migration batch completed', { 
        applied: appliedMigrations.length,
        total: migrationsToRun.length 
      })

      return {
        applied: appliedMigrations.length,
        migrations: appliedMigrations
      }

    } catch (error) {
      logger.error('Migration process failed', error)
      throw error
    }
  }

  /**
   * Rollback migrations to target version
   */
  async rollback(targetVersion = null, steps = 1) {
    try {
      const appliedVersions = await this.getAppliedMigrations()
      
      if (appliedVersions.length === 0) {
        logger.info('No migrations to rollback')
        return { rolledBack: 0, migrations: [] }
      }

      let migrationsToRollback = []

      if (targetVersion) {
        // Rollback to specific version
        const targetIndex = appliedVersions.indexOf(targetVersion)
        if (targetIndex === -1) {
          throw new Error(`Target version ${targetVersion} not found in applied migrations`)
        }
        migrationsToRollback = appliedVersions.slice(targetIndex + 1).reverse()
      } else {
        // Rollback specific number of steps
        migrationsToRollback = appliedVersions.slice(-steps).reverse()
      }

      const rolledBackMigrations = []

      for (const version of migrationsToRollback) {
        const migration = this.migrations.find(m => m.version === version)
        
        if (!migration) {
          logger.warn('Migration file not found for rollback', { version })
          continue
        }

        logger.info('Rolling back migration', { 
          version: migration.version, 
          description: migration.description 
        })

        const startTime = Date.now()

        try {
          await this.runWithTransaction(async () => {
            await migration.down()
            await this.removeMigrationRecord(version)
          })

          const duration = Date.now() - startTime
          
          logger.info('Migration rolled back successfully', {
            version: migration.version,
            duration: `${duration}ms`
          })

          rolledBackMigrations.push({
            version: migration.version,
            description: migration.description,
            duration
          })

        } catch (error) {
          logger.error('Rollback failed', {
            version: migration.version,
            error: error.message
          })
          
          throw new Error(`Rollback ${migration.version} failed: ${error.message}`)
        }
      }

      logger.info('Rollback completed', { 
        rolledBack: rolledBackMigrations.length 
      })

      return {
        rolledBack: rolledBackMigrations.length,
        migrations: rolledBackMigrations
      }

    } catch (error) {
      logger.error('Rollback process failed', error)
      throw error
    }
  }

  /**
   * Run function with transaction if supported
   */
  async runWithTransaction(fn) {
    if (mongoose.connection.db.serverConfig.s.description.type === 'ReplicaSetWithPrimary') {
      // Use transaction for replica sets
      const session = await mongoose.startSession()
      try {
        await session.withTransaction(fn)
      } finally {
        await session.endSession()
      }
    } else {
      // Run without transaction for standalone instances
      await fn()
    }
  }

  /**
   * Get migration status
   */
  async getStatus() {
    const appliedMigrations = await this.getAppliedMigrations()
    const pendingMigrations = await this.getPendingMigrations()

    return {
      total: this.migrations.length,
      applied: appliedMigrations.length,
      pending: pendingMigrations.length,
      appliedVersions: appliedMigrations,
      pendingVersions: pendingMigrations.map(m => m.version),
      lastApplied: appliedMigrations[appliedMigrations.length - 1] || null
    }
  }

  /**
   * Validate database state
   */
  async validate() {
    const db = mongoose.connection.db
    const appliedRecords = await db
      .collection(this.migrationCollection)
      .find({})
      .toArray()

    const issues = []

    for (const record of appliedRecords) {
      const migration = this.migrations.find(m => m.version === record.version)
      
      if (!migration) {
        issues.push({
          type: 'missing_file',
          version: record.version,
          description: 'Migration file not found for applied migration'
        })
        continue
      }

      const currentChecksum = this.calculateChecksum(migration)
      if (record.checksum && record.checksum !== currentChecksum) {
        issues.push({
          type: 'checksum_mismatch',
          version: record.version,
          description: 'Migration file has been modified after application'
        })
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * Create new migration file
   */
  async createMigration(name, description) {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.js`
    const filePath = path.join(this.migrationsPath, filename)

    const template = `/**
 * Migration: ${description}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
  version: '${timestamp}',
  description: '${description}',

  async up() {
    // TODO: Implement migration logic
    console.log('Running migration: ${description}')
    
    // Example: Create new collection
    // const db = require('mongoose').connection.db
    // await db.createCollection('new_collection')
    
    // Example: Add field to existing documents
    // await db.collection('users').updateMany(
    //   {},
    //   { $set: { newField: 'defaultValue' } }
    // )
  },

  async down() {
    // TODO: Implement rollback logic
    console.log('Rolling back migration: ${description}')
    
    // Example: Drop collection
    // const db = require('mongoose').connection.db
    // await db.dropCollection('new_collection')
    
    // Example: Remove field from documents
    // await db.collection('users').updateMany(
    //   {},
    //   { $unset: { newField: '' } }
    // )
  }
}`

    await fs.writeFile(filePath, template)
    
    logger.info('Migration file created', { filename, path: filePath })
    
    return {
      filename,
      version: timestamp,
      path: filePath
    }
  }
}

module.exports = MigrationRunner