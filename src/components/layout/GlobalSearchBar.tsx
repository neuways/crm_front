import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  Building,
  Phone,
  User as UserIcon,
  ChevronRight,
  Flame,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { enquiryService } from "../../services/enquiry.service.js";
import { IEnquiry } from "../../types/enquiry.types.js";
import { UserProfile } from "../../types/auth.types.js";

export interface GlobalSearchBarProps {
  currentUser?: UserProfile;
  placeholder?: string;
  className?: string;
  onClose?: () => void;
  autoFocus?: boolean;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  currentUser: _currentUser,
  placeholder = "Search leads, clients, phone numbers or properties...",
  className = "",
  onClose,
  autoFocus = false,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [results, setResults] = useState<IEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSearchIdRef = useRef<number>(0);

  // Debounce query changes by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute backend search when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    const searchId = ++activeSearchIdRef.current;
    setIsLoading(true);
    setError(null);
    setIsOpen(true);
    setHighlightedIndex(-1);

    enquiryService
      .searchLeads(debouncedQuery, 8)
      .then((res) => {
        // Discard responses from older queries to prevent race conditions
        if (searchId !== activeSearchIdRef.current) return;

        if (res.success && res.data) {
          setResults(res.data.enquiries || []);
          setError(null);
        } else {
          setError(res.message || "Unable to retrieve search results.");
          setResults([]);
        }
      })
      .catch((err: any) => {
        if (searchId !== activeSearchIdRef.current) return;
        setError(err.message || "Network error while searching CRM leads.");
        setResults([]);
      })
      .finally(() => {
        if (searchId === activeSearchIdRef.current) {
          setIsLoading(false);
        }
      });
  }, [debouncedQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear query and close dropdown
  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setError(null);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Navigate to lead's detail / workflow page using existing routing
  const handleSelectLead = useCallback(
    (lead: IEnquiry) => {
      setIsOpen(false);
      setQuery("");
      setDebouncedQuery("");
      setHighlightedIndex(-1);
      if (onClose) onClose();

      const leadId = lead._id || lead.id;
      const isConfirmedDeal =
        lead.currentStage === "DEAL_DONE" || lead.dealDone?.isConfirmed === true;

      if (isConfirmedDeal) {
        navigate(`/sales/completed-deals/${leadId}`);
      } else {
        navigate(`/sales/leads/${leadId}/workflow`);
      }
    },
    [navigate, onClose]
  );

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      if (onClose) onClose();
      return;
    }

    if (!isOpen) {
      if (e.key === "ArrowDown" && results.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        handleSelectLead(results[highlightedIndex]);
      } else if (results.length > 0) {
        handleSelectLead(results[0]);
      }
    }
  };

  // Helper to get readable stage label and color classes
  const getStageBadge = (lead: IEnquiry) => {
    if (lead.status === "CLOSED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Closed Lead
        </span>
      );
    }

    if (lead.dealDone?.isConfirmed || lead.currentStage === "DEAL_DONE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          Deal Done
        </span>
      );
    }

    switch (lead.currentStage) {
      case "SITE_VISIT_PLAN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            03. Site Visit Plan
          </span>
        );
      case "MEETING_PLAN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            02. Meeting Plan
          </span>
        );
      case "FOLLOW_UP":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-brand-primary border border-blue-200">
            01. Follow-up
          </span>
        );
    }
  };

  // Resolved property/project name from lead
  const getProjectName = (lead: IEnquiry) => {
    return (
      lead.projectName ||
      lead.dealDone?.project ||
      lead.siteVisitPlan?.projectName ||
      lead.meetingPlan?.projectDetails ||
      "Property Unassigned"
    );
  };

  // Resolved assigned agent name
  const getAssignedName = (lead: IEnquiry) => {
    if (typeof lead.assignedTo === "object" && lead.assignedTo?.name) {
      return lead.assignedTo.name;
    }
    return lead.assignedToName || null;
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-subtle">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim()) setIsOpen(true);
          }}
          onFocus={() => {
            if (debouncedQuery && results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Global CRM Search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="w-full pl-9 pr-8 py-1.5 bg-surface-subtle/80 hover:bg-surface-subtle focus:bg-surface-card border border-edge focus:border-brand-primary rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all shadow-xs"
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-content-subtle hover:text-content-primary focus:outline-none"
            aria-label="Clear search input"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Results Box */}
      {isOpen && debouncedQuery.length > 0 && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1.5 bg-surface-card border border-edge rounded-card shadow-dropdown z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 w-full max-w-[calc(100vw-1.5rem)] sm:min-w-[420px]"
        >
          {/* State 1: Loading */}
          {isLoading && (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-5 w-5 animate-spin text-brand-primary mb-2" />
              <p className="text-xs font-medium text-content-secondary">
                Searching CRM leads and properties...
              </p>
              <span className="text-[10px] text-content-muted mt-0.5">
                Querying Atlas records for "{debouncedQuery}"
              </span>
            </div>
          )}

          {/* State 2: API Error */}
          {!isLoading && error && (
            <div className="p-4 flex items-start gap-3 bg-red-50/50">
              <div className="p-1.5 bg-red-100 text-status-danger rounded-lg shrink-0 mt-0.5">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-status-danger">
                  Search Request Failed
                </h4>
                <p className="text-[11px] text-content-secondary mt-0.5 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* State 3: No Results */}
          {!isLoading && !error && results.length === 0 && (
            <div className="py-7 px-4 text-center">
              <div className="h-9 w-9 rounded-full bg-surface-subtle flex items-center justify-center mx-auto mb-2 text-content-subtle">
                <Search className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-content-primary">
                No matching leads found
              </p>
              <p className="text-[11px] text-content-muted mt-1 max-w-xs mx-auto">
                No active or completed leads match "{debouncedQuery}". Try
                searching by customer name, 10-digit mobile number, or project.
              </p>
            </div>
          )}

          {/* State 4: Populated Matching Results */}
          {!isLoading && !error && results.length > 0 && (
            <div>
              {/* Header with Results Count */}
              <div className="px-3 py-2 bg-surface-subtle/50 border-b border-edge flex items-center justify-between text-[11px] text-content-muted font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-content-secondary">
                  <Layers className="h-3 w-3 text-brand-primary" />
                  Matching CRM Leads
                </span>
                <span className="text-[10px] bg-white border border-edge px-1.5 py-0.5 rounded-full font-bold text-content-primary">
                  {results.length} {results.length === 1 ? "result" : "results"}
                </span>
              </div>

              {/* List of Leads */}
              <ul className="max-h-80 overflow-y-auto divide-y divide-edge/60 custom-scrollbar">
                {results.map((lead, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const projectName = getProjectName(lead);
                  const assignedName = getAssignedName(lead);
                  const isHot = lead.qualification?.priority === "HOT";
                  const isPoss = lead.qualification?.priority === "POSSIBLE";

                  return (
                    <li
                      key={lead._id || lead.id}
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelectLead(lead)}
                      className={`px-3 py-2.5 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                        isHighlighted
                          ? "bg-brand-primary/5 border-l-3 border-brand-primary pl-2.5"
                          : "hover:bg-surface-subtle/80"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Row 1: Name, Stage Badge, Priority Pill */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold text-content-primary truncate">
                            {lead.name}
                          </span>
                          {getStageBadge(lead)}
                          {isHot && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-orange-100 text-orange-700">
                              <Flame className="h-2.5 w-2.5 text-orange-600" />
                              HOT
                            </span>
                          )}
                          {isPoss && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">
                              POSSIBLE
                            </span>
                          )}
                        </div>

                        {/* Row 2: Mobile & Project Details */}
                        <div className="flex items-center gap-3 text-[11px] text-content-secondary truncate">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-content-subtle" />
                            {lead.mobile}
                          </span>
                          <span className="text-edge">•</span>
                          <span className="inline-flex items-center gap-1 truncate">
                            <Building className="h-3 w-3 text-content-subtle shrink-0" />
                            <span className="truncate">{projectName}</span>
                          </span>
                        </div>

                        {/* Row 3: Assigned to (for Admin/Manager visibility) */}
                        {assignedName && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-content-muted">
                            <UserIcon className="h-2.5 w-2.5 text-content-subtle" />
                            <span>
                              Assigned to:{" "}
                              <strong className="text-content-secondary font-medium">
                                {assignedName}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Action Hint */}
                      <div className="shrink-0 flex items-center text-content-subtle">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Dropdown Footer with Navigation Hints */}
              <div className="px-3 py-1.5 bg-surface-subtle/60 border-t border-edge flex items-center justify-between text-[10px] text-content-muted">
                <span>
                  Use <kbd className="px-1 py-0.2 bg-white border border-edge rounded text-[9px] font-semibold text-content-primary">↑</kbd> <kbd className="px-1 py-0.2 bg-white border border-edge rounded text-[9px] font-semibold text-content-primary">↓</kbd> to navigate
                </span>
                <span>
                  Press <kbd className="px-1 py-0.2 bg-white border border-edge rounded text-[9px] font-semibold text-content-primary">↵ Enter</kbd> to open
                </span>
                <span>
                  <kbd className="px-1 py-0.2 bg-white border border-edge rounded text-[9px] font-semibold text-content-primary">Esc</kbd> to dismiss
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};