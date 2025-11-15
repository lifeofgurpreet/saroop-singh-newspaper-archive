/**
 * Session Persistence Manager
 * Handles saving and restoring session state across step boundaries
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

export class SessionPersistence {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [SessionPersistence] ${level}: ${message}`;
        })
      ),
      transports: [new winston.transports.Console()]
    });

    // Session storage configuration
    this.storageDir = process.env.SESSION_STORAGE_DIR || 
      path.join(process.cwd(), 'sessions');
    this.compressionEnabled = process.env.SESSION_COMPRESSION === 'true';
    this.encryptionEnabled = process.env.SESSION_ENCRYPTION === 'true';
    
    // In-memory cache for frequently accessed sessions
    this.sessionCache = new Map();
    this.maxCacheSize = 100;
    
    // Initialize storage
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      this.logger.info(`Session storage initialized: ${this.storageDir}`);
    } catch (error) {
      this.logger.error(`Failed to initialize session storage: ${error.message}`);
    }
  }

  /**
   * Save session state to persistent storage
   */
  async saveSession(sessionId, sessionData, options = {}) {
    try {
      const startTime = Date.now();
      
      // Create session snapshot
      const snapshot = this.createSessionSnapshot(sessionData, options);
      
      // Determine storage path
      const sessionPath = this.getSessionPath(sessionId);
      const tempPath = `${sessionPath}.tmp`;
      
      // Serialize data
      let serializedData = JSON.stringify(snapshot, null, options.pretty ? 2 : 0);
      
      // Apply compression if enabled
      if (this.compressionEnabled) {
        serializedData = await this.compress(serializedData);
      }
      
      // Apply encryption if enabled
      if (this.encryptionEnabled) {
        serializedData = await this.encrypt(serializedData);
      }
      
      // Write to temporary file first (atomic write)
      await fs.writeFile(tempPath, serializedData);
      
      // Atomic move to final location
      await fs.rename(tempPath, sessionPath);
      
      // Update cache
      this.updateCache(sessionId, snapshot);
      
      const saveTime = Date.now() - startTime;
      this.logger.debug(`Session saved: ${sessionId} (${saveTime}ms)`);
      
      return {
        sessionId: sessionId,
        path: sessionPath,
        size: serializedData.length,
        saveTime: saveTime,
        compressed: this.compressionEnabled,
        encrypted: this.encryptionEnabled
      };
      
    } catch (error) {
      this.logger.error(`Failed to save session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load session state from persistent storage
   */
  async loadSession(sessionId, options = {}) {
    try {
      const startTime = Date.now();
      
      // Check cache first
      if (this.sessionCache.has(sessionId)) {
        const cachedSession = this.sessionCache.get(sessionId);
        this.logger.debug(`Session loaded from cache: ${sessionId}`);
        return cachedSession.data;
      }
      
      const sessionPath = this.getSessionPath(sessionId);
      
      // Check if session file exists
      try {
        await fs.access(sessionPath);
      } catch {
        throw new Error(`Session not found: ${sessionId}`);
      }
      
      // Read session file
      let sessionData = await fs.readFile(sessionPath, 'utf8');
      
      // Apply decryption if enabled
      if (this.encryptionEnabled) {
        sessionData = await this.decrypt(sessionData);
      }
      
      // Apply decompression if enabled
      if (this.compressionEnabled) {
        sessionData = await this.decompress(sessionData);
      }
      
      // Parse JSON
      const sessionObject = JSON.parse(sessionData);
      
      // Validate session structure
      this.validateSessionStructure(sessionObject);
      
      // Update cache
      this.updateCache(sessionId, sessionObject);
      
      const loadTime = Date.now() - startTime;
      this.logger.debug(`Session loaded: ${sessionId} (${loadTime}ms)`);
      
      return sessionObject.data;
      
    } catch (error) {
      this.logger.error(`Failed to load session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if session exists in storage
   */
  async sessionExists(sessionId) {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      await fs.access(sessionPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete session from storage
   */
  async deleteSession(sessionId) {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      
      // Remove from cache
      this.sessionCache.delete(sessionId);
      
      // Remove from disk
      try {
        await fs.unlink(sessionPath);
        this.logger.debug(`Session deleted: ${sessionId}`);
        return true;
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.logger.debug(`Session not found for deletion: ${sessionId}`);
          return false;
        }
        throw error;
      }
      
    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all stored sessions
   */
  async listSessions(options = {}) {
    try {
      const files = await fs.readdir(this.storageDir);
      const sessions = [];
      
      for (const file of files) {
        if (file.endsWith('.json') && !file.endsWith('.tmp')) {
          const sessionId = path.basename(file, '.json');
          const filePath = path.join(this.storageDir, file);
          
          try {
            const stats = await fs.stat(filePath);
            const sessionInfo = {
              sessionId: sessionId,
              path: filePath,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              age: Date.now() - stats.mtime.getTime()
            };
            
            // Load session metadata if requested
            if (options.includeMetadata) {
              try {
                const session = await this.loadSession(sessionId);
                sessionInfo.metadata = session.metadata || {};
                sessionInfo.status = session.status;
                sessionInfo.progress = session.progress;
              } catch (error) {
                sessionInfo.error = error.message;
              }
            }
            
            sessions.push(sessionInfo);
          } catch (error) {
            this.logger.warn(`Failed to get stats for session file ${file}: ${error.message}`);
          }
        }
      }
      
      // Sort by modification time (newest first)
      sessions.sort((a, b) => b.modified - a.modified);
      
      return sessions;
      
    } catch (error) {
      this.logger.error(`Failed to list sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create checkpoint for session at specific step
   */
  async createCheckpoint(sessionId, stepName, sessionData, options = {}) {
    try {
      const checkpointId = `${sessionId}_${stepName}_${Date.now()}`;
      const checkpointData = {
        ...sessionData,
        checkpointInfo: {
          sessionId: sessionId,
          stepName: stepName,
          timestamp: Date.now(),
          checkpointId: checkpointId
        }
      };
      
      await this.saveSession(checkpointId, checkpointData, options);
      
      this.logger.info(`Checkpoint created: ${checkpointId} for step ${stepName}`);
      
      return checkpointId;
      
    } catch (error) {
      this.logger.error(`Failed to create checkpoint for ${sessionId} at ${stepName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restore session from checkpoint
   */
  async restoreFromCheckpoint(checkpointId) {
    try {
      const checkpointData = await this.loadSession(checkpointId);
      
      if (!checkpointData.checkpointInfo) {
        throw new Error('Invalid checkpoint data');
      }
      
      this.logger.info(`Session restored from checkpoint: ${checkpointId}`);
      
      return checkpointData;
      
    } catch (error) {
      this.logger.error(`Failed to restore from checkpoint ${checkpointId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up old sessions and checkpoints
   */
  async cleanup(maxAgeHours = 24, keepCheckpoints = false) {
    try {
      this.logger.info(`Starting session cleanup (max age: ${maxAgeHours} hours)`);
      
      const sessions = await this.listSessions();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      const now = Date.now();
      
      let deletedCount = 0;
      
      for (const session of sessions) {
        const shouldDelete = session.age > maxAgeMs && 
          (keepCheckpoints === false || !session.sessionId.includes('_checkpoint_'));
        
        if (shouldDelete) {
          try {
            await this.deleteSession(session.sessionId);
            deletedCount++;
          } catch (error) {
            this.logger.warn(`Failed to delete old session ${session.sessionId}: ${error.message}`);
          }
        }
      }
      
      // Clean up cache
      this.cleanCache();
      
      this.logger.info(`Session cleanup completed: ${deletedCount} sessions deleted`);
      
      return deletedCount;
      
    } catch (error) {
      this.logger.error(`Session cleanup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create session snapshot for storage
   */
  createSessionSnapshot(sessionData, options = {}) {
    const snapshot = {
      version: '1.0',
      timestamp: Date.now(),
      sessionId: sessionData.id,
      data: this.serializeSessionData(sessionData, options),
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        options: options,
        size: 0 // Will be calculated later
      }
    };
    
    // Calculate approximate size
    snapshot.metadata.size = JSON.stringify(snapshot.data).length;
    
    return snapshot;
  }

  /**
   * Serialize session data, handling special types
   */
  serializeSessionData(sessionData, options = {}) {
    const serialized = { ...sessionData };
    
    // Handle large binary data
    if (options.excludeBinaryData) {
      // Remove or reference large image data
      if (serialized.results && serialized.results.original && serialized.results.original.data) {
        serialized.results.original.dataReference = `binary_data_${serialized.id}_original`;
        delete serialized.results.original.data;
      }
      
      if (serialized.results && serialized.results.final) {
        serialized.results.finalReference = `binary_data_${serialized.id}_final`;
        delete serialized.results.final;
      }
    }
    
    // Handle functions and circular references
    return JSON.parse(JSON.stringify(serialized, (key, value) => {
      if (typeof value === 'function') {
        return '[Function]';
      }
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack
        };
      }
      return value;
    }));
  }

  /**
   * Validate session structure
   */
  validateSessionStructure(sessionObject) {
    if (!sessionObject.version) {
      throw new Error('Invalid session: missing version');
    }
    
    if (!sessionObject.data) {
      throw new Error('Invalid session: missing data');
    }
    
    if (!sessionObject.data.id) {
      throw new Error('Invalid session: missing session ID');
    }
    
    // Add more validation as needed
  }

  /**
   * Get file path for session
   */
  getSessionPath(sessionId) {
    // Sanitize session ID for filesystem
    const sanitized = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.storageDir, `${sanitized}.json`);
  }

  /**
   * Update in-memory cache
   */
  updateCache(sessionId, sessionData) {
    // Implement LRU cache behavior
    if (this.sessionCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.sessionCache.keys().next().value;
      this.sessionCache.delete(firstKey);
    }
    
    this.sessionCache.set(sessionId, {
      data: sessionData,
      timestamp: Date.now()
    });
  }

  /**
   * Clean cache of old entries
   */
  cleanCache(maxAgeMinutes = 30) {
    const cutoff = Date.now() - (maxAgeMinutes * 60 * 1000);
    
    for (const [sessionId, cacheEntry] of this.sessionCache.entries()) {
      if (cacheEntry.timestamp < cutoff) {
        this.sessionCache.delete(sessionId);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.sessionCache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses
      entries: Array.from(this.sessionCache.keys())
    };
  }

  // Placeholder methods for compression and encryption
  // In a production system, these would use actual compression/encryption libraries
  
  async compress(data) {
    // Placeholder - would use zlib or similar
    return data;
  }

  async decompress(data) {
    // Placeholder - would use zlib or similar  
    return data;
  }

  async encrypt(data) {
    // Placeholder - would use crypto library
    return data;
  }

  async decrypt(data) {
    // Placeholder - would use crypto library
    return data;
  }
}