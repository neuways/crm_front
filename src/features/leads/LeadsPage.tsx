import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, XCircle, Filter, FileSpreadsheet, Inbox, Copy } from 'lucide-react';
import { UserProfile } from '../../types/auth.types.js';
import { Button } from '../../components/ui/Button.js';
import { NewLeadTable } from '../sales-dashboard/components/NewLeadTable.js';
import { RejectedLeadTable } from './components/RejectedLeadTable.js';
import { UnassignedLeadTable } from './components/UnassignedLeadTable.js';
import { AssignLeadModal } from './components/AssignLeadModal.js';
import { DuplicateDataPage } from '../duplicate-data/DuplicateDataPage.js';
import { NewEnquiryModal } from '../sales-dashboard/components/NewEnquiryModal.js';
import { useSalesDashboard } from '../sales-dashboard/hooks/useSalesDashboard.js';
import { NewLeadItem } from '../sales-dashboard/types/dashboard.types.js';
import { enquiryService } from '../../services/enquiry.service.js';
import { IEnquiry } from '../../types/enquiry.types.js';

interface OutletContextType {
  currentUser: UserProfile;
  onShowPlaceholderNotice: (featureName: string) => void;
}

export type LeadTab = 'ACTIVE' | 'UNASSIGNED' | 'DUPLICATES' | 'REJECTED';

export interface LeadsPageProps {
  defaultTab?: LeadTab;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ defaultTab }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, onShowPlaceholderNotice } = useOutletContext<OutletContextType>();
  const [isNewEnquiryModalOpen, setIsNewEnquiryModalOpen] = useState<boolean>(false);

  const canAccessUnassigned = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

  // Determine initial tab from props or URL query param
  const getInitialTab = (): LeadTab => {
    if (defaultTab) return defaultTab;
    const tabParam = searchParams.get('tab')?.toLowerCase();
    if (tabParam === 'unassigned' && canAccessUnassigned) return 'UNASSIGNED';
    if (tabParam === 'duplicates' || tabParam === 'duplicate-data') return 'DUPLICATES';
    if (tabParam === 'rejected') return 'REJECTED';
    return 'ACTIVE';
  };

  const [activeTab, setActiveTab] = useState<LeadTab>(getInitialTab);

  // Rejected leads data state
  const [rejectedLeads, setRejectedLeads] = useState<IEnquiry[]>([]);
  const [isLoadingRejected, setIsLoadingRejected] = useState<boolean>(false);
  const [rejectedError, setRejectedError] = useState<string | null>(null);
  const [rejectedTotalCount, setRejectedTotalCount] = useState<number>(0);

  // Unassigned leads data state (Admin & Manager only)
  const [unassignedLeads, setUnassignedLeads] = useState<IEnquiry[]>([]);
  const [isLoadingUnassigned, setIsLoadingUnassigned] = useState<boolean>(false);
  const [unassignedError, setUnassignedError] = useState<string | null>(null);
  const [unassignedTotalCount, setUnassignedTotalCount] = useState<number>(0);

  // Duplicate count state for tab badge
  const [duplicateCount, setDuplicateCount] = useState<number>(0);

  // Assignment Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [leadsToAssign, setLeadsToAssign] = useState<IEnquiry[]>([]);

  const {
    newLeads,
    isLoadingLeads,
    leadsError,
    isDemoMode,
    refreshLeads
  } = useSalesDashboard();

  // Fetch real persisted rejected / lost enquiries from backend
  const fetchRejectedLeads = useCallback(async () => {
    setIsLoadingRejected(true);
    setRejectedError(null);
    try {
      const res = await enquiryService.getEnquiries({
        status: 'CLOSED',
        rejected: true,
        limit: 100
      });

      if (res.success && res.data) {
        setRejectedLeads(res.data.enquiries || []);
        const total = res.data.pagination?.total ?? res.data.pagination?.totalCount ?? (res.data.enquiries || []).length;
        setRejectedTotalCount(total);
      } else {
        setRejectedError(res.message || 'Failed to load rejected leads.');
      }
    } catch (err: unknown) {
      setRejectedError(err instanceof Error ? err.message : 'Error fetching rejected leads.');
    } finally {
      setIsLoadingRejected(false);
    }
  }, []);

  // Fetch unassigned leads from backend (Admin: org-wide, Manager: team-scoped)
  const fetchUnassignedLeads = useCallback(async () => {
    if (!canAccessUnassigned) return;
    setIsLoadingUnassigned(true);
    setUnassignedError(null);
    try {
      const res = await enquiryService.getEnquiries({
        unassigned: true,
        limit: 100
      });

      if (res.success && res.data) {
        setUnassignedLeads(res.data.enquiries || []);
        setUnassignedTotalCount(res.data.pagination?.total ?? res.data.pagination?.totalCount ?? (res.data.enquiries || []).length);
      } else {
        setUnassignedError(res.message || 'Failed to load unassigned leads.');
      }
    } catch (err: unknown) {
      setUnassignedError(err instanceof Error ? err.message : 'Error fetching unassigned leads.');
    } finally {
      setIsLoadingUnassigned(false);
    }
  }, [canAccessUnassigned]);

  // Fetch duplicate counts
  const fetchDuplicateSummary = useCallback(async () => {
    try {
      const count = await enquiryService.getDuplicateCount({ includeBulk: true });
      setDuplicateCount(count);
    } catch {
      setDuplicateCount(0);
    }
  }, []);

  // Load tab-specific or badge summary data on mount
  useEffect(() => {
    fetchDuplicateSummary();
    fetchRejectedLeads();
    if (canAccessUnassigned) {
      fetchUnassignedLeads();
    }
  }, [fetchDuplicateSummary, fetchRejectedLeads, fetchUnassignedLeads, canAccessUnassigned]);

  // Synchronize on reconnection or CRM event refresh
  useEffect(() => {
    const handleSync = () => {
      fetchDuplicateSummary();
      fetchRejectedLeads();
      if (canAccessUnassigned) {
        fetchUnassignedLeads();
      }
    };
    window.addEventListener('nueways:reconnected', handleSync);
    window.addEventListener('crm:notification-refresh', handleSync);
    return () => {
      window.removeEventListener('nueways:reconnected', handleSync);
      window.removeEventListener('crm:notification-refresh', handleSync);
    };
  }, [fetchDuplicateSummary, fetchRejectedLeads, fetchUnassignedLeads, canAccessUnassigned]);

  useEffect(() => {
    if (activeTab === 'REJECTED') {
      fetchRejectedLeads();
    } else if (activeTab === 'UNASSIGNED') {
      fetchUnassignedLeads();
    }
  }, [activeTab, fetchRejectedLeads, fetchUnassignedLeads]);

  // Sync tab with URL search parameter
  const handleTabChange = (tab: LeadTab) => {
    if (tab === 'UNASSIGNED' && !canAccessUnassigned) return;
    setActiveTab(tab);
    if (tab === 'ACTIVE') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tab.toLowerCase() });
    }
  };

  const handleFollowUpClick = (lead: NewLeadItem) => {
    navigate(`/sales/leads/${lead.id}/workflow`);
  };

  const handleViewRejectedDetails = (lead: IEnquiry) => {
    navigate(`/sales/leads/${lead.id || (lead as any)._id}/workflow`);
  };

  // Assign action handlers
  const handleOpenSingleAssign = (lead: IEnquiry) => {
    setLeadsToAssign([lead]);
    setIsAssignModalOpen(true);
  };

  const handleOpenBulkAssign = (selected: IEnquiry[]) => {
    setLeadsToAssign(selected);
    setIsAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    fetchUnassignedLeads();
    refreshLeads();
    onShowPlaceholderNotice(
      leadsToAssign.length === 1
        ? `Lead "${leadsToAssign[0].name}" assigned successfully.`
        : `${leadsToAssign.length} leads assigned successfully.`
    );
  };

  const handleRefreshAll = () => {
    refreshLeads();
    fetchDuplicateSummary();
    fetchRejectedLeads();
    if (canAccessUnassigned) {
      fetchUnassignedLeads();
    }
  };

  const isGlobalLoading = isLoadingLeads || isLoadingRejected || isLoadingUnassigned;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Leads</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Leads &amp; Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            {currentUser.role === 'ADMIN'
              ? 'Organization-wide lead pipeline, unassigned pool, duplicate matches and rejected enquiries directory.'
              : currentUser.role === 'MANAGER'
              ? `Team lead pipeline, unassigned pool, duplicate matches and rejected enquiries for ${currentUser.name}'s sales team.`
              : `Active pipeline enquiries assigned to ${currentUser.name}. Continue follow-up workflows and track customer requirements.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isGlobalLoading ? 'animate-spin' : ''}`} />}
            onClick={handleRefreshAll}
            disabled={isGlobalLoading}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
            onClick={() => navigate('/bulk-upload')}
            title="Bulk Data Upload (Excel / CSV)"
            className="hover:border-emerald-500 hover:text-emerald-700 font-medium"
          >
            <span>Bulk Data Upload</span>
            <span className="hidden sm:inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Excel / CSV
            </span>
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewEnquiryModalOpen(true)}
            className="shadow-sm shadow-blue-500/20"
          >
            New Lead Enquiry
          </Button>
        </div>
      </div>

      {/* Pipeline View Tabs */}
      <div className="flex items-center gap-2 border-b border-edge pb-2 overflow-x-auto scrollbar-none min-w-0">
        {/* 1. Active Pipeline Tab (All Roles) */}
        <button
          type="button"
          onClick={() => handleTabChange('ACTIVE')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-content-muted hover:text-content-primary hover:bg-slate-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Active Pipeline</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {newLeads.length}
          </span>
        </button>

        {/* 2. Unassigned Leads Tab (Admin & Manager Only - Hidden from Sales Agent) */}
        {canAccessUnassigned && (
          <button
            type="button"
            onClick={() => handleTabChange('UNASSIGNED')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'UNASSIGNED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-content-muted hover:text-content-primary hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Unassigned Leads</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'UNASSIGNED' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {unassignedTotalCount}
            </span>
          </button>
        )}

        {/* 3. Duplicate Data Tab (All Roles) */}
        <button
          type="button"
          onClick={() => handleTabChange('DUPLICATES')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'DUPLICATES'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-content-muted hover:text-content-primary hover:bg-slate-100'
          }`}
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Duplicate Data</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'DUPLICATES' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}
          >
            {duplicateCount}
          </span>
        </button>

        {/* 4. Rejected / Lost Leads Tab (All Roles) */}
        <button
          type="button"
          onClick={() => handleTabChange('REJECTED')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'REJECTED'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-content-muted hover:text-content-primary hover:bg-slate-100'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected / Lost Leads</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
            }`}
          >
            {rejectedTotalCount}
          </span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'ACTIVE' && (
        <NewLeadTable
          leads={newLeads}
          isLoading={isLoadingLeads}
          error={leadsError}
          isDemoMode={isDemoMode}
          onRetry={refreshLeads}
          onFollowUpClick={handleFollowUpClick}
          onShowNotice={onShowPlaceholderNotice}
          hideAgentFilter={currentUser.role === 'SALES'}
        />
      )}

      {activeTab === 'UNASSIGNED' && canAccessUnassigned && (
        <UnassignedLeadTable
          leads={unassignedLeads}
          isLoading={isLoadingUnassigned}
          error={unassignedError}
          onRetry={fetchUnassignedLeads}
          onAssignClick={handleOpenSingleAssign}
          onBulkAssignClick={handleOpenBulkAssign}
        />
      )}

      {activeTab === 'DUPLICATES' && (
        <DuplicateDataPage isEmbedded={true} currentUser={currentUser} />
      )}

      {activeTab === 'REJECTED' && (
        <RejectedLeadTable
          leads={rejectedLeads}
          isLoading={isLoadingRejected}
          error={rejectedError}
          totalCount={rejectedTotalCount}
          onRetry={fetchRejectedLeads}
          onViewDetails={handleViewRejectedDetails}
        />
      )}

      {/* Assign Lead Modal (Single & Bulk Allocation) */}
      <AssignLeadModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedLeads={leadsToAssign}
        currentUser={currentUser}
        onSuccess={handleAssignSuccess}
      />

      {/* New Enquiry Modal */}
      <NewEnquiryModal
        isOpen={isNewEnquiryModalOpen}
        onClose={() => setIsNewEnquiryModalOpen(false)}
        isDemoMode={isDemoMode}
        onEnquiryCreated={(lead, rawEnquiry) => {
          refreshLeads();
          if (canAccessUnassigned) {
            fetchUnassignedLeads();
          }
          const assignedId =
            lead.assignedTo?.id ||
            (rawEnquiry?.assignedTo as any)?._id?.toString() ||
            (rawEnquiry?.assignedTo as any)?.id?.toString() ||
            (typeof rawEnquiry?.assignedTo === 'string' ? rawEnquiry.assignedTo : null);

          if (currentUser.role === 'SALES' && assignedId && assignedId !== currentUser.id) {
            onShowPlaceholderNotice(
              `Lead "${lead.name}" created and assigned to ${lead.assignedTo?.name || 'peer agent'} via Round Robin.`
            );
          }
        }}
      />
    </div>
  );
};