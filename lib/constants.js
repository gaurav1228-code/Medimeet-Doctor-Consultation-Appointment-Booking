  // lib/constants.js
export const USER_ROLES = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN',
  UNASSIGNED: 'UNASSIGNED'
};

export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

export const TRANSACTION_TYPES = {
  CREDIT_PURCHASE: 'CREDIT_PURCHASE',
  APPOINTMENT_DEDUCTION: 'APPOINTMENT_DEDUCTION',
  APPOINTMENT_REFUND: 'APPOINTMENT_REFUND',
  APPOINTMENT_EARNING: 'APPOINTMENT_EARNING',
  PAYOUT: 'PAYOUT'
};

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

export const PAYOUT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PROCESSED: 'PROCESSED'
};

export const APPOINTMENT_CREDIT_COST = 2;
export const CREDIT_VALUE_USD = 10;
export const PLATFORM_FEE_PER_CREDIT = 2;
export const DOCTOR_EARNINGS_PER_CREDIT = 8;



export const PLAN_CREDITS = {
  free_user: 0,
  standard: 10,
  premium: 25
};
export const VONAGE_ERRORS = {
  SESSION_CREATION_FAILED: 'Failed to create video session',
  TOKEN_GENERATION_FAILED: 'Failed to generate video token',
  NOT_CONFIGURED: 'Video service not configured',
};

export const APPOINTMENT_ERRORS = {
  INSUFFICIENT_CREDITS: 'Insufficient credits',
  CONFLICTING_APPOINTMENT: 'Time slot not available',
  DOCTOR_NOT_FOUND: 'Doctor not found',
  PATIENT_NOT_FOUND: 'Patient not found',
};
