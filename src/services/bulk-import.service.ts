import { api } from './api.js';
import { ApiResponse } from '../types/enquiry.types.js';
import {
  ParseFileResult,
  PreviewImportResult,
  BulkImportJobStatus
} from '../types/bulk-import.types.js';

export class BulkImportClientService {
  /**
   * Uploads and stages an Excel (.xlsx) or CSV (.csv) file.
   */
  async uploadFile(file: File): Promise<ApiResponse<ParseFileResult>> {
    const formData = new FormData();
    formData.append('file', file);
    return api.postFormData<ParseFileResult>('/bulk-import/upload', formData);
  }

  /**
   * Generates a validation and duplicate preview for the staged import.
   */
  async previewImport(
    importId: string,
    columnMapping: Record<string, string>,
    assignmentMethod?: 'ROUND_ROBIN' | 'MANUAL' | 'SELF',
    assignedToId?: string
  ): Promise<ApiResponse<PreviewImportResult>> {
    return api.post<PreviewImportResult>('/bulk-import/preview', {
      importId,
      columnMapping,
      assignmentMethod,
      assignedToId
    });
  }

  /**
   * Confirms mapping and starts background sequential processing.
   */
  async confirmImport(
    importId: string,
    columnMapping: Record<string, string>,
    assignmentConfig: {
      method: 'ROUND_ROBIN' | 'MANUAL' | 'SELF';
      assignedToId?: string | null;
    }
  ): Promise<ApiResponse<{ importId: string; status: string; totalRows: number; totalBatches: number }>> {
    return api.post('/bulk-import/confirm', {
      importId,
      columnMapping,
      assignmentConfig
    });
  }

  /**
   * Polls persistent progress and status of an import job.
   */
  async getStatus(importId: string): Promise<ApiResponse<BulkImportJobStatus>> {
    return api.get<BulkImportJobStatus>(`/bulk-import/status/${importId}`);
  }

  /**
   * Requests cancellation of an in-progress or queued import.
   */
  async cancelImport(importId: string): Promise<ApiResponse<{ importId: string; status: string }>> {
    return api.post(`/bulk-import/cancel/${importId}`, {});
  }

  /**
   * Lists historical imports.
   */
  async listHistory(): Promise<ApiResponse<BulkImportJobStatus[]>> {
    return api.get<BulkImportJobStatus[]>('/bulk-import/history');
  }

  /**
   * Downloads safe CSV error report.
   */
  async downloadReport(importId: string, category: 'DUPLICATE' | 'INVALID' | 'FAILED' | 'ALL'): Promise<void> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('nueways_auth_token') : null;
    const response = await fetch(`/api/v1/bulk-import/report/${importId}?category=${category}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      throw new Error(`Failed to download report: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-report-${importId}-${category.toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Downloads standard sample template CSV.
   */
  async downloadTemplate(): Promise<void> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('nueways_auth_token') : null;
    const response = await fetch('/api/v1/bulk-import/template', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      throw new Error(`Failed to download template: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neuways-lead-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const bulkImportClientService = new BulkImportClientService();
