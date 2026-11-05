import { z } from "zod";

// ============================================================================
// MODULE 1: AI DOCUMENT INTELLIGENCE (RATE CON & POD)
// ============================================================================

export const RateConStopSchema = z.object({
  stopSequence: z.number().int().min(1),
  stopType: z.enum(["PICKUP", "DELIVERY"]),
  facilityName: z.string().min(1),
  address: z.string().default("Facility Dock"),
  city: z.string().min(1),
  state: z.string().length(2).toUpperCase(),
  zip: z.string().default("00000"),
  apptWindowStart: z.string(), // ISO string or date
  apptWindowEnd: z.string(),
  timezone: z.string().default("America/Chicago"),
  notes: z.string().optional(),
});

export const RateConParsedDataSchema = z.object({
  division: z.enum(["BROKERAGE", "DISPATCH"]).default("BROKERAGE"),
  brokerName: z.string().min(1),
  brokerPhone: z.string().optional(),
  brokerRefNumber: z.string().optional(),
  customerRate: z.number().min(0).default(0), // For Brokerage: Shipper rate
  carrierRate: z.number().min(0).default(0), // For Brokerage: Carrier contracted pay
  grossFreightRate: z.number().min(0).default(0), // For Dispatch: Gross broker payout
  equipment: z.string().default("DRY_VAN"),
  commodity: z.string().default("General Freight"),
  weightLbs: z.number().default(40000),
  palletCount: z.number().default(24),
  targetTempF: z.number().optional(),
  isHazmat: z.boolean().default(false),
  totalMiles: z.number().min(0).default(500),
  stops: z.array(RateConStopSchema).min(2),
  notes: z.string().optional(),
  confidenceScore: z.number().min(0).max(100).default(95),
});

export type RateConParsedData = z.infer<typeof RateConParsedDataSchema>;

export const PodVerificationSchema = z.object({
  receiverSigned: z.boolean().default(true),
  receiverName: z.string().default("Authorized Receiver"),
  deliveryTimestamp: z.string(),
  hasOsAndD: z.boolean().default(false), // Overages, shortages, damages
  osAndDNotes: z.string().optional(),
  billedCarrierRate: z.number().default(0),
  agreedCarrierRate: z.number().default(0),
  rateDiscrepancy: z.number().default(0),
  rateMatches: z.boolean().default(true),
  verificationPassed: z.boolean().default(true),
  recommendedAction: z.enum(["APPROVE_AND_INVOICE", "HOLD_FOR_AUDIT", "REJECT_POD"]),
  auditSummary: z.string(),
});

export type PodVerificationData = z.infer<typeof PodVerificationSchema>;

// ============================================================================
// MODULE 2: AI SMART QUOTE INTAKE & FLEET MATCHER
// ============================================================================

export const EmailQuoteParsedSchema = z.object({
  shipperCompanyName: z.string().default("Prospective Shipper"),
  contactName: z.string().default("Logistics Coordinator"),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  originCity: z.string().min(1),
  originState: z.string().length(2).toUpperCase(),
  destCity: z.string().min(1),
  destState: z.string().length(2).toUpperCase(),
  equipment: z.string().default("DRY_VAN"),
  weightLbs: z.number().default(42000),
  totalMiles: z.number().min(1).default(500),
  suggestedCustomerRate: z.number().min(1),
  suggestedCarrierCost: z.number().min(1),
  projectedMargin: z.number(),
  projectedMarginPercent: z.number(),
  requiresManagerApproval: z.boolean().default(false),
  approvalReason: z.string().optional(),
  specialRequirements: z.string().optional(),
  reasoning: z.string(),
});

export type EmailQuoteParsedData = z.infer<typeof EmailQuoteParsedSchema>;

export interface FleetMatchResult {
  truckId: string;
  unitNumber: string;
  clientName: string;
  ownerName: string;
  trailerType: string;
  homeBase: string;
  currentLocation: string;
  deadheadMiles: number;
  loadedMiles: number;
  totalMiles: number;
  grossFreightRate: number;
  ratePerMile: number;
  minRatePerMile: number;
  isRateAcceptable: boolean;
  carrierNetPayout: number;
  aceDispatchFee: number;
  score: number; // 0 - 100
  matchReason: string;
}

// ============================================================================
// MODULE 3: AUTOMATED AI CHECK-CALL & WEBHOOK
// ============================================================================

export const CheckCallWebhookPayloadSchema = z.object({
  loadId: z.string().min(1),
  division: z.enum(["BROKERAGE", "DISPATCH"]).default("BROKERAGE"),
  driverPhone: z.string().optional(),
  transcript: z.string().min(1),
  rawLocation: z.string().optional(),
  reportedEta: z.string().optional(),
  detentionHours: z.number().optional().default(0),
  hasBreakdown: z.boolean().optional().default(false),
});

export type CheckCallWebhookPayload = z.infer<typeof CheckCallWebhookPayloadSchema>;

export interface CheckCallProcessingResult {
  location: string;
  eta: string;
  milesToDest?: number;
  statusUpdate: string;
  recommendedExecutionStatus?: string; // "AT_PICKUP" | "IN_TRANSIT" | "DELIVERED"
  detentionHours: number;
  isIssueDetected: boolean;
  issueSeverity: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  issueTitle?: string;
  issueDescription?: string;
  createdTaskId?: string;
  summaryNote: string;
}

// ============================================================================
// MODULE 4: ROLE-AWARE ERP AI COMMAND COPILOT
// ============================================================================

export interface CopilotActionItem {
  id: string;
  label: string;
  description: string;
  variant: "primary" | "warning" | "success" | "neutral";
  actionType: "NAVIGATE" | "SERVER_ACTION";
  targetUrl?: string;
  serverActionName?: string;
  payload?: any;
}

export interface CopilotRoleBrief {
  role: string;
  userName: string;
  headline: string;
  urgencyLevel: "NORMAL" | "ATTENTION" | "CRITICAL";
  keyMetrics: { label: string; value: string | number; change?: string }[];
  insights: string[];
  recommendedActions: CopilotActionItem[];
}
