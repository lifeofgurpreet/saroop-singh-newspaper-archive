/**
 * Idempotency Manager - Prevents duplicate processing using content hashing
 * Implements SHA256 content hashing and idempotency key generation
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class IdempotencyManager {
  constructor(airtableManager) {
    this.airtable = airtableManager;
    this.processedHashes = new Map(); // In-memory cache for session
  }

  /**
   * Generate SHA256 content hash for image data
   */
  generateContentHash(imageData) {
    try {
      let buffer;
      
      if (Buffer.isBuffer(imageData)) {
        buffer = imageData;
      } else if (typeof imageData === 'string') {
        // Assume base64 string
        buffer = Buffer.from(imageData, 'base64');
      } else {
        throw new Error('Invalid image data format for hashing');
      }

      const hash = crypto.createHash('sha256')
        .update(buffer)
        .digest('hex');
      
      return hash;
      
    } catch (error) {
      console.error('Failed to generate content hash:', error);
      throw error;
    }
  }

  /**
   * Generate idempotency key combining content hash and processing parameters
   */
  generateIdempotencyKey(contentHash, mode, workflowId = null, additionalParams = {}) {
    try {
      const keyData = {
        contentHash,
        mode,
        workflowId,
        ...additionalParams
      };

      // Create deterministic key from parameters
      const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
      const idempotencyKey = crypto.createHash('sha256')
        .update(keyString)
        .digest('hex')
        .substring(0, 32); // Keep first 32 characters

      return idempotencyKey;
      
    } catch (error) {
      console.error('Failed to generate idempotency key:', error);
      throw error;
    }
  }

  /**
   * Check if image with this content and parameters has been processed before
   */
  async checkForDuplicateRun(imageData, mode, workflowId = null, additionalParams = {}) {
    try {
      const contentHash = this.generateContentHash(imageData);
      const idempotencyKey = this.generateIdempotencyKey(contentHash, mode, workflowId, additionalParams);

      // Check in-memory cache first
      if (this.processedHashes.has(idempotencyKey)) {
        const cachedResult = this.processedHashes.get(idempotencyKey);
        console.log(`Found cached result for idempotency key: ${idempotencyKey}`);
        return {
          isDuplicate: true,
          existingResult: cachedResult,
          contentHash,
          idempotencyKey
        };
      }

      // Check Airtable for existing records
      const existingPhotos = await this.findExistingRecords(contentHash, idempotencyKey);
      
      if (existingPhotos.length > 0) {
        const existingPhoto = existingPhotos[0];
        console.log(`Found existing record for content hash: ${contentHash}`);
        
        // Cache for future lookups in this session
        this.processedHashes.set(idempotencyKey, existingPhoto);
        
        return {
          isDuplicate: true,
          existingResult: existingPhoto,
          contentHash,
          idempotencyKey
        };
      }

      console.log(`No duplicate found for content hash: ${contentHash}`);
      return {
        isDuplicate: false,
        existingResult: null,
        contentHash,
        idempotencyKey
      };

    } catch (error) {
      console.error('Failed to check for duplicate run:', error);
      // Don't fail the entire process - allow processing to continue
      return {
        isDuplicate: false,
        existingResult: null,
        contentHash: null,
        idempotencyKey: null,
        error: error.message
      };
    }
  }

  /**
   * Find existing records by content hash or idempotency key
   */
  async findExistingRecords(contentHash, idempotencyKey) {
    try {
      // Search by content hash first
      let records = await this.airtable.tables.photoGallery
        .select({
          filterByFormula: `{Content Hash} = '${contentHash}'`
        })
        .all();

      // If no records found by content hash, search by idempotency key
      if (records.length === 0) {
        records = await this.airtable.tables.photoGallery
          .select({
            filterByFormula: `{Idempotency Key} = '${idempotencyKey}'`
          })
          .all();
      }

      return records.map(record => ({
        id: record.id,
        fields: record.fields,
        contentHash: record.fields['Content Hash'],
        idempotencyKey: record.fields['Idempotency Key'],
        status: record.fields['Status'],
        qualityScore: record.fields['Quality Score'],
        resultUrl: record.fields['Result URL']
      }));

    } catch (error) {
      console.error('Failed to search for existing records:', error);
      return [];
    }
  }

  /**
   * Store processing result with idempotency data
   */
  async storeProcessingResult(contentHash, idempotencyKey, result) {
    try {
      // Store in in-memory cache
      this.processedHashes.set(idempotencyKey, result);
      
      console.log(`Stored processing result for idempotency key: ${idempotencyKey}`);
      
      return true;
      
    } catch (error) {
      console.error('Failed to store processing result:', error);
      return false;
    }
  }

  /**
   * Create new photo record with idempotency data
   */
  async createPhotoRecordWithIdempotency(imageData, mode, workflowId = null, additionalParams = {}) {
    try {
      const contentHash = this.generateContentHash(imageData);
      const idempotencyKey = this.generateIdempotencyKey(contentHash, mode, workflowId, additionalParams);
      
      const recordData = {
        'Content Hash': contentHash,
        'Idempotency Key': idempotencyKey,
        'Status': 'Pending',
        'Mode': mode,
        'Processing Started': new Date().toISOString()
      };

      if (workflowId) {
        recordData['Workflow'] = [workflowId];
      }

      // Add any additional parameters to notes
      if (Object.keys(additionalParams).length > 0) {
        recordData['Notes'] = `Additional Parameters: ${JSON.stringify(additionalParams)}`;
      }

      const record = await this.airtable.tables.photoGallery.create(recordData);
      
      console.log(`Created photo record with idempotency: ${record.id}`);
      
      return {
        recordId: record.id,
        contentHash,
        idempotencyKey
      };

    } catch (error) {
      console.error('Failed to create photo record with idempotency:', error);
      throw error;
    }
  }

  /**
   * Update photo record with processing results
   */
  async updatePhotoRecordWithResults(recordId, results, contentHash, idempotencyKey) {
    try {
      const updateData = {
        'Status': results.status || 'Completed',
        'Quality Score': results.qualityScore,
        'Preservation Score': results.preservationScore,
        'Defect Removal Score': results.defectRemovalScore,
        'Enhancement Score': results.enhancementScore,
        'Naturalness Score': results.naturalnessScore,
        'Technical Score': results.technicalScore,
        'QC Decision': results.qcDecision,
        'Result URL': results.resultUrl,
        'Processing Completed': new Date().toISOString(),
        'Processing Time (s)': results.processingTime,
        'Retry Count': results.retryCount || 0,
        'Router Rules Version': results.routerRulesVersion,
        'Notes': results.notes || ''
      };

      if (results.error) {
        updateData['Error Message'] = results.error.substring(0, 500); // Limit error message length
        updateData['Status'] = 'Failed';
      }

      await this.airtable.tables.photoGallery.update(recordId, updateData);
      
      // Update in-memory cache
      const cacheData = {
        id: recordId,
        fields: updateData,
        contentHash,
        idempotencyKey
      };
      
      this.processedHashes.set(idempotencyKey, cacheData);
      
      console.log(`Updated photo record with results: ${recordId}`);
      
      return true;

    } catch (error) {
      console.error('Failed to update photo record with results:', error);
      return false;
    }
  }

  /**
   * Generate unique run ID
   */
  generateRunId(contentHash = null) {
    const timestamp = Date.now();
    const randomId = uuidv4().split('-')[0];
    const hashPrefix = contentHash ? contentHash.substring(0, 8) : 'unknown';
    
    return `run_${timestamp}_${hashPrefix}_${randomId}`;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${uuidv4()}`;
  }

  /**
   * Check if content has changed since last processing
   */
  async hasContentChanged(recordId, currentImageData) {
    try {
      const record = await this.airtable.tables.photoGallery.find(recordId);
      const storedHash = record.fields['Content Hash'];
      
      if (!storedHash) {
        console.warn(`No content hash found for record ${recordId}`);
        return true; // Assume changed if no hash stored
      }

      const currentHash = this.generateContentHash(currentImageData);
      const hasChanged = storedHash !== currentHash;
      
      if (hasChanged) {
        console.log(`Content changed for record ${recordId}: ${storedHash} -> ${currentHash}`);
      }
      
      return hasChanged;

    } catch (error) {
      console.error('Failed to check content changes:', error);
      return true; // Assume changed if check fails
    }
  }

  /**
   * Clear in-memory cache
   */
  clearCache() {
    this.processedHashes.clear();
    console.log('Idempotency cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.processedHashes.size,
      memoryUsage: `${Math.round(JSON.stringify(Array.from(this.processedHashes.entries())).length / 1024)} KB`
    };
  }

  /**
   * Validate content hash format
   */
  isValidContentHash(hash) {
    return typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash);
  }

  /**
   * Validate idempotency key format
   */
  isValidIdempotencyKey(key) {
    return typeof key === 'string' && /^[a-f0-9]{32}$/.test(key);
  }
}