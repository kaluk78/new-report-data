/**
 * DES Encryption Implementation - LEGACY
 * 
 * MANUAL REVIEW REQUIRED - Security-critical code
 * Strategy: MANUAL_REVIEW_REQUIRED
 * 
 * Algorithm: 3DES
 * Use Case: Legacy system compatibility
 * Compliance Level: DEPRECATED
 * Performance: LOW
 * 
 * Concerns:
 * - Security vulnerability
 * - Should be migrated
 * 
 * Expert Review Required: Security architect - MIGRATION PLAN NEEDED
 */

export interface DESConfig {
  algorithm: 'DES' | '3DES';
  mode: 'CBC' | 'ECB';
  padding: 'PKCS7' | 'NONE';
  keyLength: 8 | 24; // bytes
}

export interface DESEncryptionResult {
  ciphertext: string;
  iv?: string;
  algorithm: string;
  deprecated: boolean;
  migrationWarning: string;
}

export class DESEncryption {
  private config: DESConfig;

  constructor(config: Partial<DESConfig> = {}) {
    this.config = {
      algorithm: '3DES',
      mode: 'CBC',
      padding: 'PKCS7',
      keyLength: 24,
      ...config
    };

    // Emit deprecation warnings
    this.emitDeprecationWarnings();
  }

  /**
   * Emit security warnings for DES usage
   */
  private emitDeprecationWarnings(): void {
    console.warn('⚠️  SECURITY WARNING: DES/3DES encryption is DEPRECATED and INSECURE');
    console.warn('⚠️  This implementation should only be used for legacy system compatibility');
    console.warn('⚠️  IMMEDIATE MIGRATION to AES-256 is strongly recommended');
    console.warn('⚠️  DES is vulnerable to brute force attacks');
    console.warn('⚠️  3DES has known vulnerabilities and performance issues');
  }

  /**
   * Generate DES key (INSECURE - for legacy compatibility only)
   * SECURITY CRITICAL: This is fundamentally insecure
   */
  generateKey(): Uint8Array {
    console.error('🚨 CRITICAL: Generating new DES keys is STRONGLY DISCOURAGED');
    console.error('🚨 Use this only for testing legacy systems');
    
    const key = new Uint8Array(this.config.keyLength);
    
    // Fill with random bytes (though DES keys are inherently weak)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(key);
    } else {
      // Fallback for environments without crypto API
      for (let i = 0; i < key.length; i++) {
        key[i] = Math.floor(Math.random() * 256);
      }
    }

    return key;
  }

  /**
   * Encrypt data using DES/3DES (INSECURE)
   * SECURITY CRITICAL: This provides minimal security
   */
  async encrypt(data: string, key: Uint8Array): Promise<DESEncryptionResult> {
    console.warn('🔓 INSECURE ENCRYPTION: Using deprecated DES algorithm');
    
    // Validate key length
    if (key.length !== this.config.keyLength) {
      throw new Error(`Invalid key length: expected ${this.config.keyLength} bytes, got ${key.length}`);
    }

    // Generate IV for CBC mode
    let iv: Uint8Array | undefined;
    if (this.config.mode === 'CBC') {
      iv = new Uint8Array(8); // DES block size is 8 bytes
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(iv);
      } else {
        for (let i = 0; i < iv.length; i++) {
          iv[i] = Math.floor(Math.random() * 256);
        }
      }
    }

    // Convert data to bytes
    const dataBytes = new TextEncoder().encode(data);
    
    // Apply padding
    const paddedData = this.applyPadding(dataBytes);
    
    // Simulate DES encryption (in real implementation, use actual DES library)
    const ciphertext = this.simulateDESEncryption(paddedData, key, iv);

    return {
      ciphertext: this.bytesToBase64(ciphertext),
      iv: iv ? this.bytesToBase64(iv) : undefined,
      algorithm: `${this.config.algorithm}-${this.config.mode}`,
      deprecated: true,
      migrationWarning: 'This data was encrypted with deprecated DES. Migrate to AES-256 immediately.'
    };
  }

  /**
   * Decrypt data using DES/3DES (INSECURE)
   */
  async decrypt(encryptionResult: DESEncryptionResult, key: Uint8Array): Promise<string> {
    console.warn('🔓 INSECURE DECRYPTION: Using deprecated DES algorithm');
    
    if (encryptionResult.deprecated) {
      console.error('🚨 DECRYPTING DEPRECATED DATA: Plan migration immediately');
    }

    // Validate key length
    if (key.length !== this.config.keyLength) {
      throw new Error(`Invalid key length: expected ${this.config.keyLength} bytes, got ${key.length}`);
    }

    const ciphertext = this.base64ToBytes(encryptionResult.ciphertext);
    const iv = encryptionResult.iv ? this.base64ToBytes(encryptionResult.iv) : undefined;

    // Simulate DES decryption
    const paddedData = this.simulateDESDecryption(ciphertext, key, iv);
    
    // Remove padding
    const data = this.removePadding(paddedData);
    
    return new TextDecoder().decode(data);
  }

  /**
   * Simulate DES encryption (placeholder for actual implementation)
   * In real code, this would use a proper DES library
   */
  private simulateDESEncryption(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): Uint8Array {
    console.warn('⚠️  Using simulated DES encryption - not cryptographically secure');
    
    // This is a MOCK implementation for demonstration
    // Real DES would involve complex bit operations, S-boxes, and permutations
    const result = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      // Simple XOR with key bytes (NOT actual DES!)
      const keyByte = key[i % key.length];
      const ivByte = iv ? iv[i % iv.length] : 0;
      result[i] = data[i] ^ keyByte ^ ivByte;
    }
    
    return result;
  }

  /**
   * Simulate DES decryption (placeholder for actual implementation)
   */
  private simulateDESDecryption(ciphertext: Uint8Array, key: Uint8Array, iv?: Uint8Array): Uint8Array {
    console.warn('⚠️  Using simulated DES decryption - not cryptographically secure');
    
    // For this mock, decryption is the same as encryption (XOR is symmetric)
    return this.simulateDESEncryption(ciphertext, key, iv);
  }

  /**
   * Apply PKCS7 padding
   */
  private applyPadding(data: Uint8Array): Uint8Array {
    if (this.config.padding !== 'PKCS7') {
      return data;
    }

    const blockSize = 8; // DES block size
    const paddingLength = blockSize - (data.length % blockSize);
    const paddedData = new Uint8Array(data.length + paddingLength);
    
    paddedData.set(data);
    for (let i = data.length; i < paddedData.length; i++) {
      paddedData[i] = paddingLength;
    }
    
    return paddedData;
  }

  /**
   * Remove PKCS7 padding
   */
  private removePadding(data: Uint8Array): Uint8Array {
    if (this.config.padding !== 'PKCS7') {
      return data;
    }

    const paddingLength = data[data.length - 1];
    return data.slice(0, data.length - paddingLength);
  }

  /**
   * Convert bytes to base64
   */
  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to bytes
   */
  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Generate migration plan from DES to AES
   */
  generateMigrationPlan(): {
    currentSecurity: string;
    recommendedAlgorithm: string;
    migrationSteps: string[];
    urgency: string;
    risks: string[];
  } {
    return {
      currentSecurity: 'CRITICALLY INSECURE',
      recommendedAlgorithm: 'AES-256-GCM',
      migrationSteps: [
        '1. Audit all systems using DES encryption',
        '2. Implement AES-256-GCM encryption alongside DES',
        '3. Decrypt existing data with DES keys',
        '4. Re-encrypt all data with AES-256 keys',
        '5. Update all applications to use AES',
        '6. Securely destroy all DES keys',
        '7. Remove DES code from all systems'
      ],
      urgency: 'IMMEDIATE - This should be treated as a security incident',
      risks: [
        'DES 56-bit keys can be broken in hours',
        '3DES is vulnerable to Sweet32 attacks',
        'Performance degradation compared to AES',
        'Compliance violations (PCI DSS, FIPS)',
        'Regulatory penalties possible',
        'Data breach liability'
      ]
    };
  }

  /**
   * Validate if DES usage is acceptable (spoiler: it's not)
   */
  validateSecurity(): {
    isAcceptable: boolean;
    securityLevel: string;
    recommendations: string[];
    complianceStatus: string;
  } {
    return {
      isAcceptable: false,
      securityLevel: 'UNACCEPTABLE',
      recommendations: [
        'STOP using DES immediately',
        'Migrate to AES-256-GCM',
        'Conduct security audit',
        'Implement key rotation',
        'Update compliance documentation'
      ],
      complianceStatus: 'NON-COMPLIANT with modern security standards'
    };
  }
} 