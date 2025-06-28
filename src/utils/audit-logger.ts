/**
 * Audit Logger - Security Auditing
 * 
 * KEEP - Specialized implementation
 * Strategy: KEEP_MULTIPLE_SPECIALIZED
 * 
 * Specialization: Security auditing
 * Unique Features:
 * - Compliance logging
 * - Security events
 * - Audit trails
 * 
 * Use Cases: Security, Compliance, Auditing
 * Decision: KEEP - Regulatory compliance required
 */

export interface AuditConfig {
  enableCompliance: boolean;
  retentionPeriod: number; // days
  encryptLogs: boolean;
  requireDigitalSignature: boolean;
  complianceStandards: string[]; // e.g., ['SOX', 'GDPR', 'HIPAA']
}

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  eventType: AuditEventType;
  actor: AuditActor;
  resource: AuditResource;
  action: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'UNKNOWN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details?: any;
  complianceContext?: ComplianceContext;
  digitalSignature?: string;
}

export interface AuditActor {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  roles?: string[];
  department?: string;
}

export interface AuditResource {
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  classification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
}

export interface ComplianceContext {
  standard: string;
  requirement: string;
  controlId?: string;
  riskLevel?: string;
}

export enum AuditEventType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  SYSTEM_ACCESS = 'SYSTEM_ACCESS',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  COMPLIANCE_EVENT = 'COMPLIANCE_EVENT'
}

export class AuditLogger {
  private config: AuditConfig;
  private auditTrail: AuditEvent[] = [];

  constructor(config: AuditConfig) {
    this.config = config;
  }

  /**
   * Log authentication events - compliance logging
   */
  logAuthentication(
    actor: AuditActor,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE',
    outcome: 'SUCCESS' | 'FAILURE',
    details?: any
  ): void {
    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTHENTICATION,
      actor,
      resource: {
        resourceType: 'AUTHENTICATION_SYSTEM',
        classification: 'INTERNAL'
      },
      action,
      outcome,
      severity: outcome === 'FAILURE' ? 'HIGH' : 'LOW',
      details,
      complianceContext: {
        standard: 'SOX',
        requirement: 'User Authentication Controls',
        controlId: 'AC-2'
      }
    };

    this.recordAuditEvent(event);
  }

  /**
   * Log data access events - security events
   */
  logDataAccess(
    actor: AuditActor,
    resource: AuditResource,
    action: 'READ' | 'EXPORT' | 'DOWNLOAD',
    outcome: 'SUCCESS' | 'FAILURE',
    details?: any
  ): void {
    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.DATA_ACCESS,
      actor,
      resource,
      action,
      outcome,
      severity: this.calculateDataAccessSeverity(resource, action),
      details,
      complianceContext: {
        standard: 'GDPR',
        requirement: 'Data Access Logging',
        controlId: 'Art-32'
      }
    };

    this.recordAuditEvent(event);
  }

  /**
   * Log data modification events - audit trails
   */
  logDataModification(
    actor: AuditActor,
    resource: AuditResource,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    outcome: 'SUCCESS' | 'FAILURE',
    beforeValue?: any,
    afterValue?: any
  ): void {
    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.DATA_MODIFICATION,
      actor,
      resource,
      action,
      outcome,
      severity: action === 'DELETE' ? 'HIGH' : 'MEDIUM',
      details: {
        beforeValue: this.sanitizeValue(beforeValue),
        afterValue: this.sanitizeValue(afterValue)
      },
      complianceContext: {
        standard: 'SOX',
        requirement: 'Data Integrity Controls',
        controlId: 'CC6.1'
      }
    };

    this.recordAuditEvent(event);
  }

  /**
   * Log privilege escalation events - security events
   */
  logPrivilegeEscalation(
    actor: AuditActor,
    action: 'ROLE_GRANTED' | 'ROLE_REVOKED' | 'PERMISSION_GRANTED' | 'PERMISSION_REVOKED',
    targetUserId: string,
    privilege: string,
    outcome: 'SUCCESS' | 'FAILURE'
  ): void {
    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.PRIVILEGE_ESCALATION,
      actor,
      resource: {
        resourceType: 'USER_PRIVILEGE',
        resourceId: targetUserId,
        classification: 'RESTRICTED'
      },
      action,
      outcome,
      severity: 'CRITICAL',
      details: {
        targetUserId,
        privilege
      },
      complianceContext: {
        standard: 'SOX',
        requirement: 'Access Control Management',
        controlId: 'AC-2'
      }
    };

    this.recordAuditEvent(event);
  }

  /**
   * Log security violations - security events
   */
  logSecurityViolation(
    actor: AuditActor,
    violationType: string,
    description: string,
    resource?: AuditResource,
    details?: any
  ): void {
    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.SECURITY_VIOLATION,
      actor,
      resource: resource || {
        resourceType: 'SECURITY_SYSTEM',
        classification: 'RESTRICTED'
      },
      action: violationType,
      outcome: 'FAILURE',
      severity: 'CRITICAL',
      details: {
        description,
        ...details
      },
      complianceContext: {
        standard: 'ISO27001',
        requirement: 'Incident Management',
        controlId: 'A.16.1'
      }
    };

    this.recordAuditEvent(event);

    // Immediate alert for security violations
    this.sendSecurityAlert(event);
  }

  /**
   * Log compliance events - compliance logging
   */
  logComplianceEvent(
    actor: AuditActor,
    complianceStandard: string,
    requirement: string,
    action: string,
    outcome: 'SUCCESS' | 'FAILURE',
    details?: any
  ): void {
    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.COMPLIANCE_EVENT,
      actor,
      resource: {
        resourceType: 'COMPLIANCE_CONTROL',
        classification: 'RESTRICTED'
      },
      action,
      outcome,
      severity: outcome === 'FAILURE' ? 'HIGH' : 'LOW',
      details,
      complianceContext: {
        standard: complianceStandard,
        requirement,
        riskLevel: outcome === 'FAILURE' ? 'HIGH' : 'LOW'
      }
    };

    this.recordAuditEvent(event);
  }

  /**
   * Record audit event with encryption and digital signature
   */
  private recordAuditEvent(event: AuditEvent): void {
    // Add digital signature if required
    if (this.config.requireDigitalSignature) {
      event.digitalSignature = this.generateDigitalSignature(event);
    }

    // Encrypt event if required
    const finalEvent = this.config.encryptLogs ? this.encryptEvent(event) : event;

    // Add to audit trail
    this.auditTrail.push(finalEvent);

    // Immediate console output for critical events
    if (event.severity === 'CRITICAL') {
      console.error('[CRITICAL AUDIT EVENT]', {
        eventId: event.eventId,
        eventType: event.eventType,
        action: event.action,
        actor: event.actor.userId,
        timestamp: event.timestamp
      });
    }

    // Store to persistent audit log
    this.persistAuditEvent(finalEvent);
  }

  /**
   * Calculate severity for data access events
   */
  private calculateDataAccessSeverity(resource: AuditResource, action: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (resource.classification === 'RESTRICTED') {
      return 'CRITICAL';
    }
    if (resource.classification === 'CONFIDENTIAL') {
      return 'HIGH';
    }
    if (action === 'EXPORT' || action === 'DOWNLOAD') {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Sanitize sensitive values for logging
   */
  private sanitizeValue(value: any): any {
    if (!value) return value;

    if (typeof value === 'object') {
      const sanitized = { ...value };
      
      // Remove sensitive fields
      const sensitiveFields = ['password', 'ssn', 'creditCard', 'token', 'secret'];
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }
      
      return sanitized;
    }

    return value;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate digital signature for audit event
   */
  private generateDigitalSignature(event: AuditEvent): string {
    // In real implementation, this would use cryptographic signing
    const eventString = JSON.stringify({
      eventId: event.eventId,
      timestamp: event.timestamp,
      eventType: event.eventType,
      action: event.action,
      actor: event.actor.userId
    });
    
    // Mock signature - in production use proper crypto library
    return Buffer.from(eventString).toString('base64');
  }

  /**
   * Encrypt audit event
   */
  private encryptEvent(event: AuditEvent): AuditEvent {
    // In real implementation, encrypt sensitive fields
    // For demo, just mark as encrypted
    return {
      ...event,
      details: event.details ? { encrypted: true, data: '[ENCRYPTED]' } : undefined
    };
  }

  /**
   * Persist audit event to secure storage
   */
  private async persistAuditEvent(event: AuditEvent): Promise<void> {
    // In real implementation, write to:
    // - Immutable audit database
    // - Write-only log files
    // - Blockchain for tamper-proof storage
    // - SIEM systems
    
    console.log(`[AUDIT] Persisting event ${event.eventId} to secure storage`);
  }

  /**
   * Send immediate security alert
   */
  private sendSecurityAlert(event: AuditEvent): void {
    // In real implementation, send to:
    // - Security Operations Center (SOC)
    // - SIEM systems
    // - Incident response team
    // - Email/SMS alerts
    
    console.error(`[SECURITY ALERT] ${event.eventType}: ${event.action} by ${event.actor.userId}`);
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(standard: string, startDate: Date, endDate: Date): any {
    const relevantEvents = this.auditTrail.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && 
             eventDate <= endDate &&
             event.complianceContext?.standard === standard;
    });

    return {
      standard,
      period: { startDate, endDate },
      totalEvents: relevantEvents.length,
      eventsByType: this.groupEventsByType(relevantEvents),
      criticalEvents: relevantEvents.filter(e => e.severity === 'CRITICAL'),
      failedEvents: relevantEvents.filter(e => e.outcome === 'FAILURE'),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Group events by type for reporting
   */
  private groupEventsByType(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get audit trail for investigation
   */
  getAuditTrail(filters?: {
    userId?: string;
    eventType?: AuditEventType;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
  }): AuditEvent[] {
    let filteredEvents = this.auditTrail;

    if (filters) {
      filteredEvents = filteredEvents.filter(event => {
        if (filters.userId && event.actor.userId !== filters.userId) return false;
        if (filters.eventType && event.eventType !== filters.eventType) return false;
        if (filters.severity && event.severity !== filters.severity) return false;
        if (filters.startDate && new Date(event.timestamp) < filters.startDate) return false;
        if (filters.endDate && new Date(event.timestamp) > filters.endDate) return false;
        return true;
      });
    }

    return filteredEvents;
  }
} 