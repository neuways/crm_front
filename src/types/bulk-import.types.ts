export type BulkImportStatus =
  | 'PENDING_CONFIRMATION'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ImportRowErrorCategory = 'DUPLICATE' | 'INVALID' | 'FAILED';

export interface IImportRowError {
  rowNumber: number;
  customerIdentifier?: string;
  reason: string;
  field?: string;
  category: ImportRowErrorCategory;
  details?: string;
}

export interface ParseFileResult {
  importId: string;
  originalFilename: string;
  fileSize: number;
  totalRows: number;
  detectedHeaders: string[];
  suggestedMapping: Record<string, string>;
  previewRows: Array<Record<string, any>>;
}

export interface PreviewImportResult {
  importId: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  missingPropertyRows: number;
  assignmentSummary: {
    assignedTarget: string;
    willAssignCount: number;
    willBeUnassignedCount: number;
  };
  sampleValidatedRows: Array<{
    rowNumber: number;
    name: string;
    mobile: string;
    projectName?: string;
    status: 'VALID' | 'DUPLICATE' | 'INVALID';
    reason?: string;
  }>;
}

export interface BulkImportJobStatus {
  importId: string;
  status: BulkImportStatus;
  originalFilename: string;
  totalRows: number;
  processedRows: number;
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  failedCount: number;
  assignedCount: number;
  unassignedCount: number;
  currentBatch: number;
  totalBatches: number;
  assignmentConfig: {
    method: 'ROUND_ROBIN' | 'MANUAL' | 'SELF';
    assignedToId?: string | null;
    assignedToName?: string;
  };
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  rowErrors: IImportRowError[];
}
