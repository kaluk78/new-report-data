/**
 * RSA Encryption Implementation
 * 
 * MANUAL REVIEW REQUIRED - Security-critical code
 * Strategy: MANUAL_REVIEW_REQUIRED
 * 
 * Algorithm: RSA-4096
 * Use Case: Asymmetric key exchange
 * Compliance Level: FIPS-140-2
 * Performance: MEDIUM
 * 
 * Concerns:
 * - Key size vs performance
 * - Quantum resistance
 * 
 * Expert Review Required: Security architect, performance engineer
 */

export interface RSAConfig {
  keySize: 2048 | 3072 | 4096;
  hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
  paddingScheme: 'OAEP' | 'PKCS1';
  mgf: 'MGF1';
}

export interface RSAKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface RSAEncryptionResult {
  ciphertext: string;
  keySize: number;
  algorithm: string;
}

export class RSAEncryption {
  private config: RSAConfig;
  private keyPair?: RSAKeyPair;

  constructor(config: Partial<RSAConfig> = {}) {
    this.config = {
      keySize: 4096,
      hashAlgorithm: 'SHA-256',
      paddingScheme: 'OAEP',
      mgf: 'MGF1',
      ...config
    };
  }

  /**
   * Generate RSA key pair
   * SECURITY CRITICAL: Key generation
   */
  async generateKeyPair(): Promise<RSAKeyPair> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: this.config.keySize,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: this.config.hashAlgorithm
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    this.keyPair = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    };

    return this.keyPair;
  }

  /**
   * Import RSA public key from PEM format
   * SECURITY CRITICAL: Key import
   */
  async importPublicKey(pemKey: string): Promise<CryptoKey> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    // Remove PEM headers and decode base64
    const pemContents = pemKey
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');
    
    const keyData = this.base64ToArrayBuffer(pemContents);

    return await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: this.config.hashAlgorithm
      },
      false,
      ['encrypt']
    );
  }

  /**
   * Import RSA private key from PEM format
   * SECURITY CRITICAL: Private key import
   */
  async importPrivateKey(pemKey: string): Promise<CryptoKey> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    // Remove PEM headers and decode base64
    const pemContents = pemKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    const keyData = this.base64ToArrayBuffer(pemContents);

    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: this.config.hashAlgorithm
      },
      false,
      ['decrypt']
    );
  }

  /**
   * Encrypt data with RSA public key
   * SECURITY CRITICAL: Encryption implementation
   */
  async encrypt(data: string, publicKey?: CryptoKey): Promise<RSAEncryptionResult> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    const encryptionKey = publicKey || this.keyPair?.publicKey;
    if (!encryptionKey) {
      throw new Error('No public key available for encryption');
    }

    // Check data size limits
    const maxDataSize = this.getMaxDataSize();
    const dataBytes = new TextEncoder().encode(data);
    
    if (dataBytes.length > maxDataSize) {
      throw new Error(`Data too large for RSA encryption. Max size: ${maxDataSize} bytes, got: ${dataBytes.length} bytes`);
    }

    try {
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP'
        },
        encryptionKey,
        dataBytes
      );

      return {
        ciphertext: this.arrayBufferToBase64(encrypted),
        keySize: this.config.keySize,
        algorithm: `RSA-${this.config.keySize}-OAEP-${this.config.hashAlgorithm}`
      };
    } catch (error) {
      throw new Error(`RSA encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data with RSA private key
   * SECURITY CRITICAL: Decryption implementation
   */
  async decrypt(encryptionResult: RSAEncryptionResult, privateKey?: CryptoKey): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    const decryptionKey = privateKey || this.keyPair?.privateKey;
    if (!decryptionKey) {
      throw new Error('No private key available for decryption');
    }

    try {
      const ciphertext = this.base64ToArrayBuffer(encryptionResult.ciphertext);
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP'
        },
        decryptionKey,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error(`RSA decryption failed: ${error instanceof Error ? error.message : 'Invalid key or corrupted data'}`);
    }
  }

  /**
   * Export public key to PEM format
   */
  async exportPublicKey(publicKey?: CryptoKey): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    const keyToExport = publicKey || this.keyPair?.publicKey;
    if (!keyToExport) {
      throw new Error('No public key available for export');
    }

    const exported = await crypto.subtle.exportKey('spki', keyToExport);
    const base64 = this.arrayBufferToBase64(exported);
    
    return `-----BEGIN PUBLIC KEY-----\n${this.formatPEM(base64)}\n-----END PUBLIC KEY-----`;
  }

  /**
   * Export private key to PEM format
   * SECURITY CRITICAL: Private key export
   */
  async exportPrivateKey(privateKey?: CryptoKey): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('WebCrypto API not available');
    }

    const keyToExport = privateKey || this.keyPair?.privateKey;
    if (!keyToExport) {
      throw new Error('No private key available for export');
    }

    const exported = await crypto.subtle.exportKey('pkcs8', keyToExport);
    const base64 = this.arrayBufferToBase64(exported);
    
    return `-----BEGIN PRIVATE KEY-----\n${this.formatPEM(base64)}\n-----END PRIVATE KEY-----`;
  }

  /**
   * Hybrid encryption: RSA + AES for large data
   * SECURITY CRITICAL: Hybrid encryption scheme
   */
  async hybridEncrypt(data: string, publicKey?: CryptoKey): Promise<{
    encryptedData: string;
    encryptedKey: RSAEncryptionResult;
    iv: string;
  }> {
    // Generate random AES key
    const aesKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data with AES
    const dataBytes = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      dataBytes
    );

    // Export AES key and encrypt with RSA
    const exportedAESKey = await crypto.subtle.exportKey('raw', aesKey);
    const aesKeyBase64 = this.arrayBufferToBase64(exportedAESKey);
    const encryptedKey = await this.encrypt(aesKeyBase64, publicKey);

    return {
      encryptedData: this.arrayBufferToBase64(encryptedData),
      encryptedKey,
      iv: this.arrayBufferToBase64(iv)
    };
  }

  /**
   * Hybrid decryption: RSA + AES for large data
   */
  async hybridDecrypt(hybridResult: {
    encryptedData: string;
    encryptedKey: RSAEncryptionResult;
    iv: string;
  }, privateKey?: CryptoKey): Promise<string> {
    // Decrypt AES key with RSA
    const aesKeyBase64 = await this.decrypt(hybridResult.encryptedKey, privateKey);
    const aesKeyData = this.base64ToArrayBuffer(aesKeyBase64);

    // Import AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      aesKeyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt data with AES
    const encryptedData = this.base64ToArrayBuffer(hybridResult.encryptedData);
    const iv = this.base64ToArrayBuffer(hybridResult.iv);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      aesKey,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  }

  /**
   * Get maximum data size for RSA encryption
   */
  private getMaxDataSize(): number {
    // RSA-OAEP max data size = key_size_bytes - 2 * hash_size_bytes - 2
    const keySizeBytes = this.config.keySize / 8;
    const hashSizeBytes = this.getHashSizeBytes();
    return keySizeBytes - 2 * hashSizeBytes - 2;
  }

  /**
   * Get hash algorithm size in bytes
   */
  private getHashSizeBytes(): number {
    switch (this.config.hashAlgorithm) {
      case 'SHA-256': return 32;
      case 'SHA-384': return 48;
      case 'SHA-512': return 64;
      default: return 32;
    }
  }

  /**
   * Format base64 string for PEM
   */
  private formatPEM(base64: string): string {
    return base64.match(/.{1,64}/g)?.join('\n') || base64;
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
   * Validate RSA configuration
   */
  validateConfig(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.config.keySize < 2048) {
      issues.push('Key size too small: minimum 2048 bits recommended');
    }

    if (this.config.keySize < 3072) {
      issues.push('Consider using 3072+ bit keys for long-term security');
    }

    // Quantum resistance warning
    issues.push('WARNING: RSA is vulnerable to quantum attacks. Consider post-quantum alternatives for long-term data protection.');

    return {
      isValid: issues.filter(i => !i.startsWith('WARNING')).length === 0,
      issues
    };
  }
} 