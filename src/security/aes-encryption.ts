/**
 * AES Encryption Implementation
 * 
 * MANUAL REVIEW REQUIRED - Security-critical code
 * Strategy: MANUAL_REVIEW_REQUIRED
 * 
 * Algorithm: AES-256-GCM
 * Use Case: General data encryption
 * Compliance Level: FIPS-140-2
 * Performance: HIGH
 * 
 * Concerns:
 * - Key rotation
 * - IV generation
 * 
 * Expert Review Required: Security architect, compliance officer
 */

export interface AESConfig {
  keySize: 256 | 128;
  mode: 'GCM' | 'CBC' | 'CTR';
  ivLength: number;
  tagLength: number;
  keyDerivationIterations: number;
}

export interface EncryptionResult {
  ciphertext: string;
  iv: string;
  tag?: string;
  salt?: string;
}

export interface DecryptionInput {
  ciphertext: string;
  iv: string;
  tag?: string;
  salt?: string;
}

export class AESEncryption {
  private config: AESConfig;
  private masterKey?: CryptoKey;

  constructor(config: Partial<AESConfig> = {}) {
    this.config = {
      keySize: 256,
      mode: 'GCM',
      ivLength: 12, // 96 bits for GCM
      tagLength: 16, // 128 bits
      keyDerivationIterations: 100000,
      ...config
    };
  }

  /**
   * Generate a new encryption key
   * SECURITY CRITICAL: Key generation
   */
  async generateKey(): Promise<CryptoKey> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: this.config.keySize
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    return key;
  }

  /**
   * Derive key from password using PBKDF2
   * SECURITY CRITICAL: Key derivation
   */
  async deriveKeyFromPassword(password: string, salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    // Generate salt if not provided
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(16));
    }

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive actual encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.config.keyDerivationIterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: this.config.keySize
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );

    return { key, salt };
  }

  /**
   * Encrypt data using AES-GCM
   * SECURITY CRITICAL: Encryption implementation
   */
  async encrypt(data: string, key?: CryptoKey, password?: string): Promise<EncryptionResult> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    let encryptionKey: CryptoKey;
    let salt: Uint8Array | undefined;

    // Determine encryption key
    if (key) {
      encryptionKey = key;
    } else if (password) {
      const derived = await this.deriveKeyFromPassword(password);
      encryptionKey = derived.key;
      salt = derived.salt;
    } else if (this.masterKey) {
      encryptionKey = this.masterKey;
    } else {
      throw new Error('No encryption key provided');
    }

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));

    // Encrypt data
    const encodedData = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: this.config.tagLength * 8 // Convert to bits
      },
      encryptionKey,
      encodedData
    );

    // Extract ciphertext and authentication tag
    const ciphertext = new Uint8Array(encrypted.slice(0, -this.config.tagLength));
    const tag = new Uint8Array(encrypted.slice(-this.config.tagLength));

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
      tag: this.arrayBufferToBase64(tag),
      salt: salt ? this.arrayBufferToBase64(salt) : undefined
    };
  }

  /**
   * Decrypt data using AES-GCM
   * SECURITY CRITICAL: Decryption implementation
   */
  async decrypt(input: DecryptionInput, key?: CryptoKey, password?: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    let decryptionKey: CryptoKey;

    // Determine decryption key
    if (key) {
      decryptionKey = key;
    } else if (password && input.salt) {
      const salt = this.base64ToArrayBuffer(input.salt);
      const derived = await this.deriveKeyFromPassword(password, new Uint8Array(salt));
      decryptionKey = derived.key;
    } else if (this.masterKey) {
      decryptionKey = this.masterKey;
    } else {
      throw new Error('No decryption key provided');
    }

    // Reconstruct encrypted data with tag
    const ciphertext = this.base64ToArrayBuffer(input.ciphertext);
    const iv = this.base64ToArrayBuffer(input.iv);
    const tag = input.tag ? this.base64ToArrayBuffer(input.tag) : new ArrayBuffer(0);

    // Combine ciphertext and tag
    const encryptedData = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    encryptedData.set(new Uint8Array(ciphertext), 0);
    encryptedData.set(new Uint8Array(tag), ciphertext.byteLength);

    try {
      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv),
          tagLength: this.config.tagLength * 8
        },
        decryptionKey,
        encryptedData
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed: Invalid key or corrupted data');
    }
  }

  /**
   * Set master key for this instance
   */
  async setMasterKey(key: CryptoKey): Promise<void> {
    this.masterKey = key;
  }

  /**
   * Key rotation: Generate new key and re-encrypt data
   * SECURITY CRITICAL: Key rotation procedure
   */
  async rotateKey(oldKey: CryptoKey, data: EncryptionResult[]): Promise<{ newKey: CryptoKey; reencryptedData: EncryptionResult[] }> {
    // Generate new key
    const newKey = await this.generateKey();
    
    // Re-encrypt all data with new key
    const reencryptedData: EncryptionResult[] = [];
    
    for (const item of data) {
      // Decrypt with old key
      const decrypted = await this.decrypt(item, oldKey);
      
      // Encrypt with new key
      const encrypted = await this.encrypt(decrypted, newKey);
      reencryptedData.push(encrypted);
    }

    return { newKey, reencryptedData };
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Validate encryption configuration
   */
  validateConfig(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.config.keySize !== 256 && this.config.keySize !== 128) {
      issues.push('Invalid key size: must be 128 or 256 bits');
    }

    if (this.config.ivLength < 12) {
      issues.push('IV length too short: minimum 12 bytes for GCM');
    }

    if (this.config.keyDerivationIterations < 10000) {
      issues.push('Key derivation iterations too low: minimum 10,000 recommended');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
} 