import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  UserCheck,
  Building,
  HelpCircle,
  Eye,
  X,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  FileWarning
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { bulkImportClientService } from '../../services/bulk-import.service.js';
import { userService } from '../../services/user.service.js';
import { enquiryService } from '../../services/enquiry.service.js';
import {
  ParseFileResult,
  PreviewImportResult,
  BulkImportJobStatus
} from '../../types/bulk-import.types.js';

type ImportStep = 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'PROCESSING' | 'REPORT';

const TARGET_FIELDS = [
  { key: 'name', label: 'Customer Name *', required: true },
  { key: 'mobile', label: 'Mobile Number *', required: true },
  { key: 'email', label: 'Email Address', required: false },
  { key: 'projectName', label: 'Project / Property Name', required: false },
  { key: 'preferredLocation', label: 'Preferred Location', required: false },
  { key: 'requirement', label: 'Unit Requirement / BHK', required: false },
  { key: 'budgetMin', label: 'Minimum Budget', required: false },
  { key: 'budgetMax', label: 'Maximum Budget / Budget', required: false },
  { key: 'description', label: 'Remarks / Notes', required: false },
  { key: 'source', label: 'Lead Source', required: false },
  { key: 'preferredContactMethod', label: 'Preferred Contact Method (CALL/WHATSAPP/EMAIL)', required: false },
  { key: 'preferredContactTiming', label: 'Preferred Contact Timing', required: false },
  { key: '__IGNORE__', label: '-- Do Not Import / Skip Column --', required: false }
];

// Sample Template Definition (Strictly supported CRM schema fields only)
const SAMPLE_COLUMNS = [
  { key: 'name', label: 'Customer Name', required: true, excelCol: 'A' },
  { key: 'mobile', label: 'Mobile Number', required: true, excelCol: 'B' },
  { key: 'email', label: 'Email Address', required: false, excelCol: 'C' },
  { key: 'projectName', label: 'Project Name', required: false, excelCol: 'D' },
  { key: 'preferredLocation', label: 'Preferred Location', required: false, excelCol: 'E' },
  { key: 'requirement', label: 'Requirement', required: false, excelCol: 'F' },
  { key: 'budgetMin', label: 'Budget Min', required: false, excelCol: 'G' },
  { key: 'budgetMax', label: 'Budget Max', required: false, excelCol: 'H' },
  { key: 'description', label: 'Remarks / Notes', required: false, excelCol: 'I' },
  { key: 'source', label: 'Lead Source', required: false, excelCol: 'J' },
  { key: 'preferredContactMethod', label: 'Preferred Contact Method', required: false, excelCol: 'K' },
  { key: 'preferredContactTiming', label: 'Preferred Contact Timing', required: false, excelCol: 'L' }
];

const SAMPLE_RECORDS = [
  {
    name: 'Rajesh Sharma',
    mobile: '+919876543210',
    email: 'rajesh.sharma@example.com',
    projectName: 'Emerald Heights',
    preferredLocation: 'Whitefield, Bangalore',
    requirement: '3 BHK',
    budgetMin: '8500000',
    budgetMax: '12000000',
    description: 'Looking for park-facing high-floor unit',
    source: 'WEBSITE',
    preferredContactMethod: 'CALL',
    preferredContactTiming: 'Morning (10 AM - 12 PM)'
  },
  {
    name: 'Priya Patel',
    mobile: '+919823456789',
    email: 'priya.p@samplemail.com',
    projectName: 'Neuways Grandeur',
    preferredLocation: 'Electronic City, Bangalore',
    requirement: '2 BHK',
    budgetMin: '5500000',
    budgetMax: '7500000',
    description: 'Interested in ready possession tower B',
    source: 'HOUSING.COM',
    preferredContactMethod: 'WHATSAPP',
    preferredContactTiming: 'Afternoon (2 PM - 5 PM)'
  },
  {
    name: 'Amit Verma',
    mobile: '+919811223344',
    email: 'amit.verma@domain.org',
    projectName: 'Sapphire Towers',
    preferredLocation: 'Indiranagar, Bangalore',
    requirement: '4 BHK Penthouse',
    budgetMin: '20000000',
    budgetMax: '30000000',
    description: 'Investor looking for high ROI luxury properties',
    source: 'CAMPAIGN_99ACRES',
    preferredContactMethod: 'CALL',
    preferredContactTiming: 'Evening (6 PM - 8 PM)'
  },
  {
    name: 'Sneha Kulkarni',
    mobile: '+919870011223',
    email: 'sneha.k@company.in',
    projectName: 'Neuways Grandeur',
    preferredLocation: 'HSR Layout, Bangalore',
    requirement: '2 BHK',
    budgetMin: '6000000',
    budgetMax: '8000000',
    description: 'First-time home buyer with pre-approved loan',
    source: 'DIRECT_WALKIN',
    preferredContactMethod: 'WHATSAPP',
    preferredContactTiming: 'Weekend (Anytime)'
  },
  {
    name: 'Vikram Malhotra',
    mobile: '+919934567812',
    email: 'vikram.m@investments.co',
    projectName: 'Emerald Heights',
    preferredLocation: 'Sarjapur Road, Bangalore',
    requirement: '3 BHK Luxury',
    budgetMin: '11000000',
    budgetMax: '15000000',
    description: 'Requires two covered car parking slots',
    source: 'FACEBOOK_ADS',
    preferredContactMethod: 'EMAIL',
    preferredContactTiming: 'Morning (9 AM - 11 AM)'
  },
  {
    name: 'Ananya Roy',
    mobile: '+919845098765',
    email: 'ananya.roy@outlook.com',
    projectName: 'Palm Meadows',
    preferredLocation: 'Koramangala, Bangalore',
    requirement: 'Studio Apartment',
    budgetMin: '3500000',
    budgetMax: '4500000',
    description: 'Looking for rental yield investment',
    source: 'MAGICBRICKS',
    preferredContactMethod: 'CALL',
    preferredContactTiming: 'Afternoon (1 PM - 3 PM)'
  },
  {
    name: 'Sunita Aggarwal',
    mobile: '+919765432198',
    email: 'sunita.aggarwal@gmail.com',
    projectName: 'Neuways Grandeur',
    preferredLocation: 'Bellandur, Bangalore',
    requirement: '3 BHK',
    budgetMin: '9500000',
    budgetMax: '13000000',
    description: 'Corner apartment preference with balcony',
    source: 'GOOGLE_ADS',
    preferredContactMethod: 'WHATSAPP',
    preferredContactTiming: 'Evening (5 PM - 7 PM)'
  }
];

const RAW_CSV_SAMPLE = [
  SAMPLE_COLUMNS.map((c) => c.label).join(','),
  ...SAMPLE_RECORDS.map((r) =>
    [
      r.name,
      r.mobile,
      r.email,
      r.projectName,
      r.requirement,
      r.budgetMin,
      r.budgetMax,
      `"${r.description}"`,
      r.source,
      r.preferredContactMethod,
      `"${r.preferredContactTiming}"`
    ].join(',')
  )
].join('\n');

const STEP_DEFINITIONS: Array<{ id: ImportStep; num: number; title: string; subtitle: string }> = [
  { id: 'UPLOAD', num: 1, title: 'Select File', subtitle: 'Excel or CSV upload' },
  { id: 'MAPPING', num: 2, title: 'Map Columns', subtitle: 'Align headers to CRM' },
  { id: 'PREVIEW', num: 3, title: 'Preview & Rules', subtitle: 'Validation & lead routing' },
  { id: 'PROCESSING', num: 4, title: 'Batch Import', subtitle: '250-row batch queue' },
  { id: 'REPORT', num: 5, title: 'Summary Report', subtitle: 'Import results & report' }
];

export const BulkUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invalidSectionRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<ImportStep>('UPLOAD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summaryViewTab, setSummaryViewTab] = useState<'METRICS' | 'INVALID'>('METRICS');

  // Sample Template Modal State (View Only)
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [templateTab, setTemplateTab] = useState<'EXCEL' | 'CSV'>('EXCEL');
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Staged File Data
  const [stagedData, setStagedData] = useState<ParseFileResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Preview Data
  const [previewData, setPreviewData] = useState<PreviewImportResult | null>(null);

  // Assignment Configuration
  const [assignmentMethod, setAssignmentMethod] = useState<'ROUND_ROBIN' | 'MANUAL' | 'SELF'>(
    user?.role === 'SALES' ? 'SELF' : user?.role === 'MANAGER' ? 'MANUAL' : 'ROUND_ROBIN'
  );
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; name: string }>>([]);

  // Active Job Status
  const [currentJob, setCurrentJob] = useState<BulkImportJobStatus | null>(null);
  const [historyList, setHistoryList] = useState<BulkImportJobStatus[]>([]);

  // Load available sales agents and existing history on mount
  useEffect(() => {
    if (user?.role === 'MANAGER') {
      setAssignmentMethod('MANUAL');
    } else if (user?.role === 'SALES') {
      setAssignmentMethod('SELF');
    }
    loadEligibleAgents();
    loadHistory();
  }, [user?.role, user?.id]);

  // Polling active job while in progress
  useEffect(() => {
    let timer: any = null;
    if (step === 'PROCESSING' && currentJob?.importId) {
      if (['QUEUED', 'PROCESSING'].includes(currentJob.status)) {
        timer = setInterval(async () => {
          try {
            const res = await bulkImportClientService.getStatus(currentJob.importId);
            if (res.success && res.data) {
              setCurrentJob(res.data);
              if (
                res.data.status === 'COMPLETED' ||
                res.data.status === 'PARTIAL_SUCCESS' ||
                res.data.status === 'FAILED' ||
                res.data.status === 'CANCELLED'
              ) {
                setStep('REPORT');
                loadHistory();
              }
            }
          } catch (pollErr) {
            console.error('Error polling import status:', pollErr);
          }
        }, 1500);
      } else {
        setStep('REPORT');
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, currentJob?.status, currentJob?.importId]);

  const loadEligibleAgents = async () => {
    try {
      if (user?.role === 'ADMIN') {
        const res = await userService.listEmployees();
        if (res.success && res.data) {
          const sales = res.data
            .filter((e) => e.role === 'SALES' && e.isActive)
            .map((e) => ({ id: e.id, name: e.name }));
          setAvailableAgents(sales);
          if (sales.length > 0 && !assignedToId) {
            setAssignedToId(sales[0].id);
          }
        }
      } else if (user?.role === 'MANAGER') {
        const res = await enquiryService.getTeamRoster();
        if (res.success && res.data?.agents) {
          const agents = res.data.agents
            .filter((a) => a.isAssignedToCurrentManager && a.isActive && a.isTeamActive !== false)
            .map((a) => ({ id: a.id, name: a.name }));
          if (agents.length > 0) {
            setAvailableAgents(agents);
            if (!assignedToId || !agents.some((a) => a.id === assignedToId)) {
              setAssignedToId(agents[0].id);
            }
          } else if (user?.id) {
            const selfOption = [{ id: user.id, name: `${user.name || 'Self'} (Self — Manager)` }];
            setAvailableAgents(selfOption);
            setAssignedToId(user.id);
          } else {
            setAvailableAgents([]);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load eligible agents:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await bulkImportClientService.listHistory();
      if (res.success && res.data) {
        setHistoryList(res.data);
        const ongoing = res.data.find((j) => ['QUEUED', 'PROCESSING'].includes(j.status));
        if (ongoing && step === 'UPLOAD') {
          setCurrentJob(ongoing);
          setStep('PROCESSING');
        }
      }
    } catch {}
  };

  // STEP 1: Handle File Selection & Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'csv') {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('Invalid file format. Please upload an Excel (.xlsx) or CSV (.csv) file.');
      }
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select an Excel (.xlsx) or CSV (.csv) file.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage('Selected file exceeds the maximum 5 MB size limit.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await bulkImportClientService.uploadFile(selectedFile);
      if (res.success && res.data) {
        setStagedData(res.data);
        setColumnMapping(res.data.suggestedMapping || {});
        setStep('MAPPING');
      } else {
        setErrorMessage(res.message || 'Failed to upload and analyze file.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during file upload.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Handle Column Mapping
  const handleMappingChange = (header: string, targetField: string) => {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (targetField === '__IGNORE__') {
        delete next[header];
      } else {
        next[header] = targetField;
      }
      return next;
    });
  };

  const validateMapping = (): string | null => {
    const mappedCrmFields = Object.values(columnMapping);
    if (!mappedCrmFields.includes('name')) {
      return "Required CRM field 'Customer Name' must be mapped to a column.";
    }
    if (!mappedCrmFields.includes('mobile')) {
      return "Required CRM field 'Mobile Number' must be mapped to a column.";
    }

    const fieldCounts: Record<string, number> = {};
    for (const f of mappedCrmFields) {
      fieldCounts[f] = (fieldCounts[f] || 0) + 1;
      if (fieldCounts[f] > 1 && f !== 'description') {
        const fieldMeta = TARGET_FIELDS.find((tf) => tf.key === f);
        return `CRM field "${fieldMeta?.label || f}" is mapped to multiple columns. Each field may only be mapped once.`;
      }
    }
    return null;
  };

  const handleProceedToPreview = async () => {
    const valErr = validateMapping();
    if (valErr) {
      setErrorMessage(valErr);
      return;
    }
    if (!stagedData) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await bulkImportClientService.previewImport(
        stagedData.importId,
        columnMapping,
        assignmentMethod,
        user?.role === 'SALES' ? undefined : assignedToId
      );

      if (res.success && res.data) {
        setPreviewData(res.data);
        setStep('PREVIEW');
      } else {
        setErrorMessage(res.message || 'Failed to generate preview.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating preview.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Confirm and Start Import
  const handleConfirmImport = async () => {
    if (!stagedData) return;

    if (user?.role === 'MANAGER' && !assignedToId) {
      setErrorMessage('Please select an active Sales Agent from your team.');
      return;
    }

    if (user?.role === 'ADMIN' && assignmentMethod === 'MANUAL' && !assignedToId) {
      setErrorMessage('Please select an active Sales Agent for manual assignment.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const config = {
        method: user?.role === 'SALES' ? ('SELF' as const) : assignmentMethod,
        assignedToId: user?.role === 'SALES' ? null : assignedToId || null
      };

      const res = await bulkImportClientService.confirmImport(
        stagedData.importId,
        columnMapping,
        config
      );

      if (res.success && res.data) {
        const initialJobStatus: BulkImportJobStatus = {
          importId: res.data.importId,
          status: 'QUEUED',
          originalFilename: stagedData.originalFilename,
          totalRows: stagedData.totalRows,
          processedRows: 0,
          importedCount: 0,
          duplicateCount: 0,
          invalidCount: 0,
          failedCount: 0,
          assignedCount: 0,
          unassignedCount: 0,
          currentBatch: 0,
          totalBatches: res.data.totalBatches,
          assignmentConfig: config,
          rowErrors: []
        };
        setCurrentJob(initialJobStatus);
        setStep('PROCESSING');
      } else {
        setErrorMessage(res.message || 'Failed to start import.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error initiating bulk import.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 4: Cancel Import
  const handleCancelImport = async () => {
    if (!currentJob?.importId) return;
    try {
      const res = await bulkImportClientService.cancelImport(currentJob.importId);
      if (res.success) {
        setCurrentJob((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel import.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStagedData(null);
    setColumnMapping({});
    setPreviewData(null);
    setCurrentJob(null);
    setErrorMessage(null);
    setStep('UPLOAD');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    loadHistory();
  };

  const handleCopyCsv = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(RAW_CSV_SAMPLE);
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2200);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER & ACTIONS                                                */}
      {/* ========================================================================= */}
      <div className="bg-surface-card rounded-2xl p-6 border border-edge shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20 shadow-sm flex-shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-content-primary tracking-tight">Bulk Data Upload</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <Sparkles className="w-3 h-3" />
                Enterprise Ingestion
              </span>
            </div>
            <p className="text-content-secondary text-xs sm:text-sm mt-1 max-w-2xl">
              Import high-volume real estate prospects via Excel (.xlsx) or CSV (.csv). Enforces 500-record limits,
              automated collision filtering, and role-based lead distribution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          {/* PRIORITY 1: View Sample Template (View Only - Modal Trigger) */}
          <button
            onClick={() => setIsSampleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/15 border border-brand-primary/25 rounded-xl transition shadow-sm hover:shadow active:scale-[0.98]"
            title="View accepted sample upload template format and column specifications"
          >
            <Eye className="w-4 h-4" />
            <span>View Sample Template</span>
          </button>

          {step !== 'UPLOAD' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-surface-hover border border-edge rounded-xl transition"
              title="Reset current wizard and start a fresh upload"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start New Upload</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ERROR ALERT NOTIFICATION                                                  */}
      {/* ========================================================================= */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-3 shadow-sm animate-fadeIn">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Upload Notice / Validation Issue</p>
            <p className="text-xs sm:text-sm mt-0.5 text-rose-700">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 p-1 rounded-md transition"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPROVED STITCH FIVE-STEP PROGRESS INDICATOR (FLOATING CARDS STYLE)       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-surface-card rounded-2xl p-2.5 sm:p-3 md:p-3.5 border border-slate-200/90 dark:border-edge shadow-sm">
        <div className="flex md:grid md:grid-cols-5 gap-1.5 md:gap-2 lg:gap-2.5 overflow-x-auto md:overflow-visible items-stretch pb-1 md:pb-0">
          {STEP_DEFINITIONS.map((s, idx) => {
            const stepOrder: ImportStep[] = ['UPLOAD', 'MAPPING', 'PREVIEW', 'PROCESSING', 'REPORT'];
            const currentIndex = stepOrder.indexOf(step);
            const isAllCompleted = step === 'REPORT' && currentJob?.status === 'COMPLETED';
            const isCompleted = currentIndex > idx || (isAllCompleted && idx === 4);
            const isCurrent = step === s.id && !isAllCompleted;

            return (
              <div
                key={s.id}
                className={`min-w-[170px] sm:min-w-[190px] md:min-w-0 flex-1 rounded-xl p-2 sm:p-2.5 lg:p-3 flex items-center justify-between gap-2 transition-all duration-200 ${
                  isCurrent
                    ? 'bg-blue-50/70 border border-blue-200/90 shadow-sm'
                    : isCompleted
                    ? 'bg-white/90 dark:bg-surface-card border border-transparent'
                    : 'bg-transparent border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 min-w-0 flex-1">
                  {/* Left Icon / Number Badge */}
                  {isCompleted ? (
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center flex-shrink-0"
                      title={`Step 0${s.num} Completed`}
                    >
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    </div>
                  ) : isCurrent ? (
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-shrink-0 shadow-sm font-mono"
                      title={`Active Step 0${s.num}`}
                    >
                      0{s.num}
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center flex-shrink-0 font-mono"
                      title={`Pending Step 0${s.num}`}
                    >
                      0{s.num}
                    </div>
                  )}

                  {/* Step Text Stack */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={`text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase font-mono ${
                        isCurrent
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {isCurrent ? 'ACTIVE STEP' : isCompleted ? `STEP 0${s.num}` : 'PENDING'}
                    </span>
                    <span
                      className={`text-xs sm:text-[13px] lg:text-sm font-bold truncate leading-tight mt-0.5 ${
                        isCurrent
                          ? 'text-slate-900 dark:text-content-primary'
                          : isCompleted
                          ? 'text-slate-900 dark:text-content-primary'
                          : 'text-slate-700 dark:text-content-secondary font-semibold'
                      }`}
                    >
                      {s.title}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] truncate leading-tight mt-0.5 ${
                        isCurrent
                          ? 'text-blue-600 font-medium'
                          : isCompleted
                          ? 'text-slate-500 dark:text-content-secondary'
                          : 'text-slate-500 dark:text-content-muted'
                      }`}
                    >
                      {s.subtitle}
                    </span>
                  </div>
                </div>

                {/* Subtle Right Connector Chevron (Steps 1 to 4) */}
                {idx < 4 && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-colors ${
                      isCurrent
                        ? 'text-blue-400'
                        : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: FILE SELECTION & UPLOAD                                            */}
      {/* ========================================================================= */}
      {step === 'UPLOAD' && (
        <div className="space-y-6">
          <div className="bg-surface-card rounded-2xl p-4 sm:p-8 md:p-10 border border-edge shadow-sm text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.csv"
              className="hidden"
            />

            {!selectedFile ? (
              /* Drag-and-Drop Area */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 cursor-pointer transition-all duration-200 max-w-2xl mx-auto ${
                  isDragging
                    ? 'border-brand-primary bg-brand-primary/10 scale-[1.01]'
                    : 'border-edge hover:border-brand-primary/70 bg-surface-muted/20 hover:bg-brand-primary/5'
                }`}
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4 shadow-sm">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-content-primary">
                  Choose an Excel (.xlsx) or CSV (.csv) file to import
                </h3>
                <p className="text-xs sm:text-sm text-content-secondary mt-1.5 max-w-md mx-auto">
                  Drag and drop your spreadsheet here, or click to browse files from your computer
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-content-secondary">
                  <span className="px-2.5 py-1 bg-surface-card border border-edge rounded-md font-mono font-medium">
                    .xlsx
                  </span>
                  <span className="px-2.5 py-1 bg-surface-card border border-edge rounded-md font-mono font-medium">
                    .csv
                  </span>
                  <span className="text-content-tertiary px-1">&bull;</span>
                  <span className="font-medium text-content-secondary">Max 5 MB file size</span>
                  <span className="text-content-tertiary px-1">&bull;</span>
                  <span className="font-medium text-content-secondary">Max 500 records per upload</span>
                </div>
              </div>
            ) : (
              /* File Selected State Card */
              <div className="w-full max-w-xl mx-auto space-y-6 min-w-0">
                <div className="w-full min-w-0 p-4 sm:p-6 rounded-2xl border-2 border-brand-primary/30 bg-brand-primary/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 sm:gap-4 text-left shadow-xs">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-primary/15 flex items-center justify-center text-brand-primary shrink-0">
                      <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4
                          className="text-sm sm:text-base font-bold text-content-primary truncate min-w-0 flex-1"
                          title={selectedFile.name}
                        >
                          {selectedFile.name}
                        </h4>
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-semibold bg-brand-primary/20 text-brand-primary uppercase">
                          {selectedFile.name.endsWith('.csv') ? 'CSV' : 'XLSX'}
                        </span>
                      </div>
                      <p className="text-xs text-content-secondary mt-0.5 truncate" title={`${formatFileSize(selectedFile.size)} • Ready for schema validation`}>
                        {formatFileSize(selectedFile.size)} &bull; Ready for schema validation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end sm:justify-start gap-2 shrink-0 pt-2.5 sm:pt-0 border-t border-brand-primary/10 sm:border-t-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10 rounded-lg transition border border-brand-primary/30 flex-1 sm:flex-initial text-center justify-center"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200 flex-1 sm:flex-initial text-center justify-center"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    onClick={handleUploadAndAnalyze}
                    disabled={isLoading}
                    className="flex items-center gap-2.5 px-7 py-3 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing File Structure...</span>
                      </>
                    ) : (
                      <>
                        <span>Upload & Map Columns</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Business Rules Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-surface-card border border-edge rounded-2xl shadow-sm hover:border-edge/80 transition">
              <div className="flex items-center gap-2.5 text-amber-600 font-bold text-sm">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span>Duplicate Protection</span>
              </div>
              <p className="text-xs text-content-secondary mt-2.5 leading-relaxed">
                Duplicate phone numbers and emails matching active, completed or rejected leads are automatically skipped. Bulk duplicates never trigger noisy sidebar alert counts.
              </p>
            </div>

            <div className="p-5 bg-surface-card border border-edge rounded-2xl shadow-sm hover:border-edge/80 transition">
              <div className="flex items-center gap-2.5 text-blue-600 font-bold text-sm">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Building className="w-4 h-4" />
                </div>
                <span>Mixed Property Handling</span>
              </div>
              <p className="text-xs text-content-secondary mt-2.5 leading-relaxed">
                Leads with recognized property names follow project routing. Leads with missing or unmapped properties route safely to the Unassigned Queue.
              </p>
            </div>

            <div className="p-5 bg-surface-card border border-edge rounded-2xl shadow-sm hover:border-edge/80 transition">
              <div className="flex items-center gap-2.5 text-emerald-600 font-bold text-sm">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span>Role-Based Assignment</span>
              </div>
              <p className="text-xs text-content-secondary mt-2.5 leading-relaxed">
                Sales Agents retain ownership of their imported leads. Managers allocate to team agents. Admins can select Property Round Robin or direct agent assignment.
              </p>
            </div>
          </div>

          {/* Historical Imports Table */}
          {historyList.length > 0 && (
            <div className="bg-surface-card rounded-2xl p-6 border border-edge shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-content-secondary" />
                  <h3 className="text-base font-bold text-content-primary">Recent Bulk Upload History</h3>
                </div>
                <span className="text-xs text-content-secondary">
                  Showing last {Math.min(5, historyList.length)} imports
                </span>
              </div>

              <div className="overflow-x-auto border border-edge rounded-xl">
                <table className="w-full text-left text-xs text-content-secondary">
                  <thead className="bg-surface-muted text-content-primary font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Import ID</th>
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Total Rows</th>
                      <th className="py-3 px-4 text-center">Imported</th>
                      <th className="py-3 px-4 text-center">Assigned</th>
                      <th className="py-3 px-4 text-center">Unassigned</th>
                      <th className="py-3 px-4 text-center">Duplicates</th>
                      <th className="py-3 px-4 text-center">Invalid</th>
                      <th className="py-3 px-4 text-center">Failed</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge">
                    {historyList.slice(0, 5).map((job) => (
                      <tr key={job.importId} className="hover:bg-surface-hover/50 transition">
                        <td className="py-3.5 px-4 font-mono font-medium text-content-primary">{job.importId}</td>
                        <td className="py-3.5 px-4 font-medium text-content-primary max-w-xs truncate">
                          {job.originalFilename}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block ${
                              job.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : job.status === 'PARTIAL_SUCCESS'
                                ? 'bg-amber-100 text-amber-800'
                                : job.status === 'PROCESSING' || job.status === 'QUEUED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium">{job.totalRows}</td>
                        <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">{job.importedCount}</td>
                        <td className="py-3.5 px-4 text-center text-blue-600 font-semibold">{job.assignedCount ?? 0}</td>
                        <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">{job.unassignedCount ?? 0}</td>
                        <td className="py-3.5 px-4 text-center text-amber-600 font-semibold">{job.duplicateCount}</td>
                        <td className="py-3.5 px-4 text-center text-rose-600 font-semibold">{job.invalidCount}</td>
                        <td className="py-3.5 px-4 text-center text-purple-600 font-semibold">{job.failedCount ?? 0}</td>
                        <td className="py-3.5 px-4">
                          {job.startedAt ? new Date(job.startedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setCurrentJob(job);
                              setStep('REPORT');
                            }}
                            className="text-brand-primary hover:underline font-semibold"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: COLUMN MAPPING                                                    */}
      {/* ========================================================================= */}
      {step === 'MAPPING' && stagedData && (
        <div className="bg-surface-card rounded-2xl p-6 sm:p-8 border border-edge shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-edge gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-primary" />
                <h2 className="text-lg font-bold text-content-primary">Step 2: Map Columns to CRM Fields</h2>
              </div>
              <p className="text-xs text-content-secondary mt-1">
                File: <span className="font-semibold text-content-primary">{stagedData.originalFilename}</span> &bull; Found {stagedData.totalRows} data rows &bull; {stagedData.detectedHeaders.length} columns detected
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-semibold">
                * Required: Customer Name & Mobile Number
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-edge rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-content-primary uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-1/4">File Column Header</th>
                  <th className="py-3 px-4 w-1/3">Sample Values from File</th>
                  <th className="py-3 px-4 w-1/3">Target CRM Field</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {stagedData.detectedHeaders.map((header) => {
                  const sampleValues = stagedData.previewRows
                    .map((r) => r[header])
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(' | ');

                  const mappedField = columnMapping[header] || '__IGNORE__';

                  return (
                    <tr key={header} className="hover:bg-surface-hover/50 transition">
                      <td className="py-3.5 px-4 font-bold text-content-primary">
                        {header}
                      </td>
                      <td className="py-3.5 px-4 text-content-secondary truncate max-w-xs font-mono text-[11px]">
                        {sampleValues || <span className="text-content-tertiary italic">Empty</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={mappedField}
                          onChange={(e) => handleMappingChange(header, e.target.value)}
                          className={`w-full py-2.5 px-3 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-primary outline-none transition ${
                            mappedField === 'name' || mappedField === 'mobile'
                              ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold'
                              : mappedField === '__IGNORE__'
                              ? 'border-edge bg-surface-muted/60 text-content-tertiary'
                              : 'border-edge bg-surface-card text-content-primary'
                          }`}
                        >
                          {TARGET_FIELDS.map((tf) => (
                            <option key={tf.key} value={tf.key}>
                              {tf.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-edge">
            <button
              onClick={() => setStep('UPLOAD')}
              className="flex items-center gap-2 px-4 py-2.5 border border-edge text-content-secondary hover:text-content-primary rounded-xl text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleProceedToPreview}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-primary/90 transition shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Preview...
                </>
              ) : (
                <>
                  Preview & Configure Rules
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: PREVIEW & ASSIGNMENT RULES                                        */}
      {/* ========================================================================= */}
      {step === 'PREVIEW' && previewData && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="p-5 bg-surface-card border border-edge rounded-2xl shadow-sm">
              <span className="text-xs text-content-secondary font-medium">Total Rows</span>
              <p className="text-2xl font-bold text-content-primary mt-1">{previewData.totalRows}</p>
            </div>
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm">
              <span className="text-xs text-emerald-800 font-semibold">Valid to Import</span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{previewData.validRows}</p>
            </div>
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
              <span className="text-xs text-amber-800 font-semibold">Duplicates (Skip)</span>
              <p className="text-2xl font-bold text-amber-900 mt-1">{previewData.duplicateRows}</p>
            </div>
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm">
              <span className="text-xs text-rose-800 font-semibold">Invalid Rows (Skip)</span>
              <p className="text-2xl font-bold text-rose-900 mt-1">{previewData.invalidRows}</p>
            </div>
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
              <span className="text-xs text-blue-800 font-semibold">Missing Property</span>
              <p className="text-2xl font-bold text-blue-900 mt-1">{previewData.missingPropertyRows}</p>
            </div>
          </div>

          {/* Role-Specific Lead Assignment Configuration */}
          <div className="bg-surface-card rounded-2xl p-6 sm:p-7 border border-edge shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-edge">
              <UserCheck className="w-5 h-5 text-brand-primary" />
              <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider">
                Role-Based Assignment Configuration
              </h3>
            </div>

            {user?.role === 'SALES' && (
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs sm:text-sm text-blue-900">
                <span className="font-bold">Sales Agent Ownership:</span> All valid leads imported by you will remain assigned directly to your account.
              </div>
            )}

            {user?.role === 'MANAGER' && (
              <div className="space-y-3">
                <p className="text-xs text-content-secondary">
                  Managers may assign leads to eligible active Sales Agents within their own team.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1.5">
                    Assign Leads With Property To Team Agent:
                  </label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="py-2.5 px-3 border border-edge bg-surface-card rounded-xl text-xs font-medium w-full max-w-md focus:ring-2 focus:ring-brand-primary outline-none"
                  >
                    {availableAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name.includes('(Self') ? a.name : `${a.name} (Sales Team Member)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {user?.role === 'ADMIN' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${
                    assignmentMethod === 'ROUND_ROBIN'
                      ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                      : 'border-edge bg-surface-muted/30 hover:bg-surface-hover/30'
                  }`}>
                    <input
                      type="radio"
                      name="adminMethod"
                      checked={assignmentMethod === 'ROUND_ROBIN'}
                      onChange={() => setAssignmentMethod('ROUND_ROBIN')}
                      className="mt-1 text-brand-primary"
                    />
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-content-primary block">Property-wise Round Robin</span>
                      <span className="text-xs text-content-secondary mt-0.5 block">
                        Sequentially assigns leads with properties to mapped active agents. Missing-property leads route to the Unassigned Queue.
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition ${
                    assignmentMethod === 'MANUAL'
                      ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                      : 'border-edge bg-surface-muted/30 hover:bg-surface-hover/30'
                  }`}>
                    <input
                      type="radio"
                      name="adminMethod"
                      checked={assignmentMethod === 'MANUAL'}
                      onChange={() => setAssignmentMethod('MANUAL')}
                      className="mt-1 text-brand-primary"
                    />
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-content-primary block">Manual Assignment</span>
                      <span className="text-xs text-content-secondary mt-0.5 block">
                        Assigns leads with properties directly to a specific active Sales Agent.
                      </span>
                    </div>
                  </label>
                </div>

                {assignmentMethod === 'MANUAL' && (
                  <div>
                    <label className="block text-xs font-semibold text-content-primary mb-1.5">
                      Target Sales Agent:
                    </label>
                    <select
                      value={assignedToId}
                      onChange={(e) => setAssignedToId(e.target.value)}
                      className="py-2.5 px-3 border border-edge bg-surface-card rounded-xl text-xs font-medium w-full max-w-md focus:ring-2 focus:ring-brand-primary outline-none"
                    >
                      {availableAgents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Missing Property Confirmation Rule Notice */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold">Confirmed Business Policy on Missing Property: </span>
                {user?.role === 'SALES'
                  ? 'All leads are assigned directly to you, regardless of property information.'
                  : `Leads lacking project/property information (${previewData.missingPropertyRows} rows) will not be randomly assigned. They will be placed directly in the Unassigned Queue.`}
              </div>
            </div>
          </div>

          {/* Sample Validated Rows Table */}
          <div className="bg-surface-card rounded-2xl p-6 sm:p-7 border border-edge shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-content-primary">Data Validation Sample (First 10 Rows)</h3>
            <div className="overflow-x-auto border border-edge rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-content-primary uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-3.5">Excel Row</th>
                    <th className="py-3 px-3.5">Customer Name</th>
                    <th className="py-3 px-3.5">Mobile</th>
                    <th className="py-3 px-3.5">Project / Property</th>
                    <th className="py-3 px-3.5">Validation Status</th>
                    <th className="py-3 px-3.5">Action Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {previewData.sampleValidatedRows.map((r) => (
                    <tr key={r.rowNumber} className="hover:bg-surface-hover/50 transition">
                      <td className="py-3 px-3.5 font-mono font-medium">{r.rowNumber}</td>
                      <td className="py-3 px-3.5 font-semibold text-content-primary">{r.name}</td>
                      <td className="py-3 px-3.5 font-mono">{r.mobile}</td>
                      <td className="py-3 px-3.5">
                        {r.projectName || <span className="text-amber-600 italic font-medium">None (Unassigned)</span>}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            r.status === 'VALID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'DUPLICATE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-content-secondary">
                        {r.status === 'VALID' ? 'Ready to import' : r.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep('MAPPING')}
              className="flex items-center gap-2 px-4 py-2.5 border border-edge text-content-secondary hover:text-content-primary rounded-xl text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Mapping
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={isLoading || previewData.validRows === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Starting Import...
                </>
              ) : (
                <>
                  Confirm & Import {previewData.validRows} Valid Records
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: PROCESSING PROGRESS                                               */}
      {/* ========================================================================= */}
      {step === 'PROCESSING' && currentJob && (
        <div className="bg-surface-card rounded-2xl p-8 sm:p-12 border border-edge shadow-sm space-y-6 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto text-brand-primary shadow-sm">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">Importing Leads in Batches</h2>
            <p className="text-xs sm:text-sm text-content-secondary mt-1">
              Import ID: <span className="font-mono font-medium text-content-primary">{currentJob.importId}</span> &bull; {currentJob.originalFilename}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs sm:text-sm text-content-secondary font-semibold">
              <span>
                Processed {currentJob.processedRows} of {currentJob.totalRows} records
              </span>
              <span className="text-brand-primary font-bold">
                {currentJob.totalRows > 0
                  ? Math.round((currentJob.processedRows / currentJob.totalRows) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full h-3.5 bg-surface-muted rounded-full overflow-hidden border border-edge">
              <div
                className="h-full bg-brand-primary transition-all duration-300 rounded-full"
                style={{
                  width: `${
                    currentJob.totalRows > 0
                      ? Math.min(100, Math.round((currentJob.processedRows / currentJob.totalRows) * 100))
                      : 0
                  }%`
                }}
              />
            </div>
            <p className="text-[11px] text-content-tertiary">
              Processing sequentially in batches of 250 records. Progress is saved automatically in real-time.
            </p>
          </div>

          {/* Live Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 text-center pt-2">
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="text-[10px] sm:text-xs text-emerald-800 font-bold uppercase tracking-wider">Imported</span>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-900 mt-0.5">{currentJob.importedCount}</p>
            </div>
            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
              <span className="text-[10px] sm:text-xs text-amber-800 font-bold uppercase tracking-wider">Duplicates</span>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-0.5">{currentJob.duplicateCount}</p>
            </div>
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
              <span className="text-[10px] sm:text-xs text-rose-800 font-bold uppercase tracking-wider">Invalid</span>
              <p className="text-xl sm:text-2xl font-extrabold text-rose-900 mt-0.5">{currentJob.invalidCount}</p>
            </div>
            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="text-[10px] sm:text-xs text-blue-800 font-bold uppercase tracking-wider">Unassigned</span>
              <p className="text-xl sm:text-2xl font-extrabold text-blue-900 mt-0.5">{currentJob.unassignedCount}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleCancelImport}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
            >
              Cancel Import
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: FINAL REPORT & CSV DOWNLOADS                                      */}
      {/* ========================================================================= */}
      {step === 'REPORT' && currentJob && (
        <div className="space-y-6">
          <div className="bg-surface-card rounded-2xl p-6 sm:p-7 border border-edge shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  currentJob.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-600'
                    : currentJob.status === 'PARTIAL_SUCCESS'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {currentJob.status === 'COMPLETED' || currentJob.status === 'PARTIAL_SUCCESS' ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <XCircle className="w-7 h-7" />
                )}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-content-primary">
                  {currentJob.status === 'COMPLETED'
                    ? 'Import Completed Successfully'
                    : currentJob.status === 'PARTIAL_SUCCESS'
                    ? 'Import Completed with Partial Errors'
                    : 'Import Stopped / Failed'}
                </h2>
                <p className="text-xs text-content-secondary mt-0.5">
                  Job ID: <span className="font-mono font-medium text-content-primary">{currentJob.importId}</span> &bull;{' '}
                  {currentJob.completedAt ? new Date(currentJob.completedAt).toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-brand-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition shadow-sm"
            >
              Start Another Upload
            </button>
          </div>

          {/* Interactive Stat Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {/* Total Processed */}
            <div className="p-4 bg-surface-card border border-edge rounded-2xl shadow-sm flex flex-col justify-between">
              <span className="text-xs text-content-secondary font-medium">Total Processed</span>
              <p className="text-2xl font-bold text-content-primary mt-1">{currentJob.processedRows}</p>
              <span className="text-[10px] text-content-muted mt-1">Rows evaluated</span>
            </div>

            {/* Imported */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  currentJob.unassignedCount > 0 && currentJob.assignedCount === 0
                    ? '/leads?tab=unassigned'
                    : '/leads?tab=active'
                )
              }
              className="p-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl shadow-sm text-left transition cursor-pointer group flex flex-col justify-between"
              title={
                currentJob.unassignedCount > 0 && currentJob.assignedCount === 0
                  ? 'Click to view Unassigned Queue'
                  : 'Click to view Active Pipeline'
              }
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-emerald-800 font-semibold">Imported</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{currentJob.importedCount}</p>
              <span className="text-[10px] text-emerald-800/80 font-medium mt-0.5">
                Assigned: {currentJob.assignedCount} &bull; Unassigned: {currentJob.unassignedCount} &bull; Failed: {currentJob.failedCount ?? 0}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-0.5 group-hover:underline">
                {currentJob.unassignedCount > 0 && currentJob.assignedCount === 0
                  ? 'View in Unassigned Queue'
                  : 'View in Pipeline'} &rarr;
              </span>
            </button>

            {/* Duplicates Skipped */}
            <button
              type="button"
              onClick={() => navigate('/duplicate-data')}
              className="p-4 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-2xl shadow-sm text-left transition cursor-pointer group flex flex-col justify-between"
              title="Click to view Duplicate Records"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-amber-800 font-semibold">Duplicates Skipped</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold text-amber-900 mt-1">{currentJob.duplicateCount}</p>
              <span className="text-[10px] text-amber-700 font-medium mt-1 flex items-center gap-0.5 group-hover:underline">
                View Duplicates &rarr;
              </span>
            </button>

            {/* Invalid Skipped */}
            <button
              type="button"
              onClick={() => {
                setSummaryViewTab('INVALID');
                invalidSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-2xl shadow-sm text-left transition cursor-pointer group flex flex-col justify-between"
              title="Click to view Invalid Records"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-rose-800 font-semibold">Invalid Skipped</span>
                <ChevronRight className="w-3.5 h-3.5 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-2xl font-bold text-rose-900 mt-1">{currentJob.invalidCount}</p>
              <span className="text-[10px] text-rose-700 font-medium mt-1 flex items-center gap-0.5 group-hover:underline">
                View Invalid Rows &darr;
              </span>
            </button>

            {/* Assigned Leads */}
            <button
              type="button"
              onClick={() => navigate('/leads?tab=active')}
              className="p-4 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-2xl shadow-sm text-left transition cursor-pointer group flex flex-col justify-between"
              title="Click to view Assigned Leads in Pipeline"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-blue-800 font-semibold">Assigned Leads</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{currentJob.assignedCount}</p>
              <span className="text-[10px] text-blue-700 font-medium mt-1 flex items-center gap-0.5 group-hover:underline">
                Active in Pipeline &rarr;
              </span>
            </button>

            {/* Unassigned Queue */}
            <button
              type="button"
              onClick={() => navigate('/leads?tab=unassigned')}
              className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl shadow-sm text-left transition cursor-pointer group flex flex-col justify-between"
              title="Click to view Unassigned Leads Queue"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-800 font-semibold">Unassigned Queue</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{currentJob.unassignedCount}</p>
              <span className="text-[10px] text-slate-700 font-medium mt-1 flex items-center gap-0.5 group-hover:underline">
                Open Unassigned &rarr;
              </span>
            </button>
          </div>

          {/* Report Sub-Tabs: Overview vs Invalid Records */}
          <div className="flex items-center gap-2 border-b border-edge pt-2">
            <button
              type="button"
              onClick={() => setSummaryViewTab('METRICS')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
                summaryViewTab === 'METRICS'
                  ? 'border-b-2 border-brand-primary text-brand-primary bg-surface-muted/30'
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Audit Reports &amp; Downloads</span>
            </button>

            <button
              type="button"
              onClick={() => setSummaryViewTab('INVALID')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
                summaryViewTab === 'INVALID'
                  ? 'border-b-2 border-rose-600 text-rose-700 bg-rose-50/40'
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              <FileWarning className="w-3.5 h-3.5" />
              <span>Invalid Records Management</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  summaryViewTab === 'INVALID' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {currentJob.invalidCount}
              </span>
            </button>
          </div>

          {/* TAB 1: Audit Reports Download */}
          {summaryViewTab === 'METRICS' && (
            <div className="bg-surface-card rounded-2xl p-6 sm:p-7 border border-edge shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-brand-primary" />
                <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider">
                  Download Audit Reports
                </h3>
              </div>
              <p className="text-xs text-content-secondary">
                Export reconciliation CSV audit logs. All reports use RFC 4180 formula injection prevention for safe viewing in Excel.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                {currentJob.duplicateCount > 0 && (
                  <button
                    onClick={() => bulkImportClientService.downloadReport(currentJob.importId, 'DUPLICATE')}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Duplicate Rows ({currentJob.duplicateCount})
                  </button>
                )}

                {currentJob.invalidCount > 0 && (
                  <button
                    onClick={() => bulkImportClientService.downloadReport(currentJob.importId, 'INVALID')}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Invalid Rows ({currentJob.invalidCount})
                  </button>
                )}

                {currentJob.failedCount > 0 && (
                  <button
                    onClick={() => bulkImportClientService.downloadReport(currentJob.importId, 'FAILED')}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Failed Rows ({currentJob.failedCount})
                  </button>
                )}

                {currentJob.rowErrors && currentJob.rowErrors.length > 0 && (
                  <button
                    onClick={() => bulkImportClientService.downloadReport(currentJob.importId, 'ALL')}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-surface-muted hover:bg-surface-hover text-content-primary border border-edge rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Complete Log ({currentJob.rowErrors.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Invalid Records Management (Task 5) */}
          {summaryViewTab === 'INVALID' && (
            <div ref={invalidSectionRef} className="bg-surface-card rounded-2xl p-6 sm:p-7 border border-edge shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileWarning className="w-5 h-5 text-rose-600" />
                    <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider">
                      Invalid Records ({currentJob.invalidCount})
                    </h3>
                  </div>
                  <p className="text-xs text-content-secondary mt-1">
                    These rows could not be imported due to data validation errors. Download the CSV, correct the values, and re-upload.
                  </p>
                </div>

                {currentJob.invalidCount > 0 && (
                  <button
                    onClick={() => bulkImportClientService.downloadReport(currentJob.importId, 'INVALID')}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-sm cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Invalid Rows CSV</span>
                  </button>
                )}
              </div>

              {/* Table of Invalid Records */}
              {(() => {
                const invalidRows = (currentJob.rowErrors || []).filter(
                  (err) => err.category === 'INVALID' || err.category === 'FAILED'
                );

                if (invalidRows.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-content-muted flex flex-col items-center justify-center space-y-2 bg-surface-subtle/50 rounded-xl border border-edge">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="font-semibold text-content-primary">No Invalid Records Found</p>
                      <p className="text-content-secondary max-w-sm">
                        All rows in this file passed schema and format validation rules successfully.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto border border-edge rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-subtle border-b border-edge text-[11px] font-bold uppercase tracking-wider text-content-secondary">
                        <tr>
                          <th className="py-2.5 px-4">Row #</th>
                          <th className="py-2.5 px-4">Customer Details</th>
                          <th className="py-2.5 px-4">Field</th>
                          <th className="py-2.5 px-4">Validation Error Reason</th>
                          <th className="py-2.5 px-4">Batch ID</th>
                          <th className="py-2.5 px-4">Upload Date</th>
                          <th className="py-2.5 px-4 text-right">Resolution Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-edge">
                        {invalidRows.map((err, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/20 transition-colors">
                            <td className="py-2.5 px-4 font-mono font-semibold text-rose-700">
                              #{err.rowNumber}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-content-primary">
                              {err.customerIdentifier || 'N/A'}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {err.field}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-rose-800 text-xs">
                              {err.reason}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[10px] text-content-muted">
                              {currentJob.importId}
                            </td>
                            <td className="py-2.5 px-4 text-content-muted text-[11px] whitespace-nowrap">
                              {new Date(currentJob.createdAt || currentJob.startedAt || currentJob.completedAt || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Action Required: Fix &amp; Re-upload</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAMPLE TEMPLATE MODAL (VIEW ONLY — NO DOWNLOAD ACTION)                     */}
      {/* ========================================================================= */}
      {isSampleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-surface-card border border-edge rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col overflow-hidden max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-edge bg-surface-card">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-content-primary">Sample Upload Template</h2>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Accepted column structure and schema specifications for Excel (.xlsx) and CSV (.csv) lead imports
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSampleModalOpen(false)}
                className="p-2 text-content-tertiary hover:text-content-primary hover:bg-surface-hover rounded-xl transition"
                aria-label="Close sample template modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 pt-3.5 pb-2 border-b border-edge bg-surface-muted/30 gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTemplateTab('EXCEL')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
                    templateTab === 'EXCEL'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-content-secondary hover:text-content-primary hover:bg-surface-hover'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => setTemplateTab('CSV')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
                    templateTab === 'CSV'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-content-secondary hover:text-content-primary hover:bg-surface-hover'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>CSV (.csv)</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                <span>* Mandatory Fields: Customer Name & Mobile Number</span>
              </div>
            </div>

            {/* Modal Content Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {templateTab === 'EXCEL' ? (
                /* Excel Tab Content */
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-content-secondary">
                    <span className="font-medium">
                      Displaying standard spreadsheet view with 7 realistic prospect records
                    </span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Format: .xlsx (Excel Workbook)
                    </span>
                  </div>

                  {/* Spreadsheet Grid Simulation */}
                  <div className="border border-edge rounded-xl overflow-hidden shadow-inner bg-surface-card">
                    <div className="bg-emerald-800 text-emerald-100 px-4 py-2 text-xs font-mono flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Neuways_Leads_Template.xlsx &bull; Sheet1 (Preview Only)
                      </span>
                      <span className="text-[11px] opacity-80">11 Columns &bull; 7 Rows</span>
                    </div>

                    <div className="overflow-x-auto max-h-[380px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-surface-muted/80 text-content-primary sticky top-0 border-b border-edge font-semibold">
                          {/* Excel Column Letters Row */}
                          <tr className="bg-surface-muted text-content-tertiary text-[10px] font-mono border-b border-edge">
                            <th className="py-1 px-3 w-10 text-center bg-surface-muted/90 border-r border-edge">#</th>
                            {SAMPLE_COLUMNS.map((col) => (
                              <th key={col.excelCol} className="py-1 px-3 text-center border-r border-edge">
                                {col.excelCol}
                              </th>
                            ))}
                          </tr>
                          {/* Column Header Names */}
                          <tr>
                            <th className="py-2.5 px-3 text-center bg-surface-muted font-mono text-[11px] border-r border-edge text-content-tertiary">
                              1
                            </th>
                            {SAMPLE_COLUMNS.map((col) => (
                              <th
                                key={col.key}
                                className={`py-2.5 px-3.5 whitespace-nowrap border-r border-edge font-bold ${
                                  col.required ? 'text-rose-700 bg-rose-50/50' : 'text-content-primary'
                                }`}
                              >
                                {col.label} {col.required && <span className="text-rose-600 font-bold">*</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-edge font-sans">
                          {SAMPLE_RECORDS.map((row, idx) => (
                            <tr key={idx} className="hover:bg-surface-hover/50 transition">
                              <td className="py-2.5 px-3 text-center bg-surface-muted/40 font-mono text-[11px] text-content-tertiary border-r border-edge">
                                {idx + 2}
                              </td>
                              <td className="py-2.5 px-3.5 font-semibold text-content-primary whitespace-nowrap border-r border-edge">
                                {row.name}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-content-primary whitespace-nowrap border-r border-edge">
                                {row.mobile}
                              </td>
                              <td className="py-2.5 px-3.5 text-content-secondary whitespace-nowrap border-r border-edge font-mono text-[11px]">
                                {row.email}
                              </td>
                              <td className="py-2.5 px-3.5 text-content-primary whitespace-nowrap border-r border-edge font-medium">
                                {row.projectName}
                              </td>
                              <td className="py-2.5 px-3.5 text-content-secondary whitespace-nowrap border-r border-edge">
                                {row.requirement}
                              </td>
                              <td className="py-2.5 px-3.5 text-content-secondary whitespace-nowrap border-r border-edge font-mono">
                                {row.budgetMin}
                              </td>
                              <td className="py-2.5 px-3.5 text-content-secondary whitespace-nowrap border-r border-edge font-mono">
                                {row.budgetMax}
                              </td>
                              <td className="py-2.5 px-3.5 text-content-secondary whitespace-nowrap border-r border-edge max-w-xs truncate">
                                {row.description}
                              </td>
                              <td className="py-2.5 px-3.5 text-content-secondary whitespace-nowrap border-r border-edge font-mono text-[11px]">
                                {row.source}
                              </td>
                              <td className="py-2.5 px-3.5 text-content-secondary whitespace-nowrap border-r border-edge">
                                <span className="px-2 py-0.5 bg-surface-muted rounded text-[10px] font-semibold">
                                  {row.preferredContactMethod}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-content-secondary whitespace-nowrap">
                                {row.preferredContactTiming}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* CSV Tab Content */
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary font-medium">
                      Raw comma-delimited data matching RFC 4180 specification
                    </span>
                    <button
                      onClick={handleCopyCsv}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-lg transition"
                    >
                      {copiedCsv ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Sample CSV</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Monospace Raw CSV Block */}
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-700 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[360px] shadow-inner">
                    <pre className="whitespace-pre">{RAW_CSV_SAMPLE}</pre>
                  </div>
                </div>
              )}

              {/* Guidelines & Format Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="p-4 bg-surface-muted/40 border border-edge rounded-xl">
                  <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Mandatory Fields
                  </span>
                  <p className="text-[11px] text-content-secondary mt-1 leading-relaxed">
                    Customer Name and 10-digit Mobile Number are strictly required. All other columns are optional.
                  </p>
                </div>

                <div className="p-4 bg-surface-muted/40 border border-edge rounded-xl">
                  <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Accepted Contact Methods
                  </span>
                  <p className="text-[11px] text-content-secondary mt-1 leading-relaxed">
                    Preferred Contact Method accepts CALL, WHATSAPP, or EMAIL. Budget accepts plain numbers (e.g. 8500000).
                  </p>
                </div>

                <div className="p-4 bg-surface-muted/40 border border-edge rounded-xl">
                  <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Limits & Safe Routing
                  </span>
                  <p className="text-[11px] text-content-secondary mt-1 leading-relaxed">
                    Maximum 500 records per upload (5 MB size limit). Duplicate phone numbers are skipped automatically. Unmapped projects route to Unassigned Queue.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer (Strictly View-Only: No Download Button) */}
            <div className="flex items-center justify-between p-4 px-6 border-t border-edge bg-surface-muted/30">
              <span className="text-xs text-content-secondary italic">
                View-only template preview. Format your Excel or CSV file according to the headers above.
              </span>
              <button
                onClick={() => setIsSampleModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-content-primary bg-surface-card hover:bg-surface-hover border border-edge rounded-xl transition shadow-sm"
              >
                Close Template Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
