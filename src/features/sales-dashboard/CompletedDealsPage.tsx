import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Search,
  RefreshCw,
  Eye,
  Building,
  Phone,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { enquiryService } from "../../services/enquiry.service.js";
import { IEnquiry, IDealDone, PaginationMeta } from "../../types/enquiry.types.js";

export const CompletedDealsPage: React.FC = () => {
  const navigate = useNavigate();

  const [deals, setDeals] = useState<IEnquiry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasMore: false,
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async (page: number = 1, search: string = searchQuery) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await enquiryService.getCompletedDeals({
        page,
        limit: 10,
        search: search.trim() || undefined,
      });

      const payload = res.data || ((res as any)?.deals ? (res as any) : null);
      if (!res.success || !payload) {
        setError(res.message || "Failed to retrieve completed deals from backend.");
        setDeals([]);
        return;
      }

      setDeals(payload.deals || []);
      setPagination(payload.pagination || {
        total: (payload.deals || []).length,
        page,
        limit: 10,
        totalPages: Math.ceil(((payload.deals || []).length) / 10) || 1,
        hasMore: false,
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected network error occurred while querying completed deals."
      );
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchDeals(1);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeals(1, searchQuery);
  };

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------
       * Page Header
       * ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Sales</span>
            <span className="text-slate-300">/</span>
            <span>Completed Deals</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
              Completed Deals
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {pagination.total} Closed Deal{pagination.total === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            Authorized repository of finalized real estate contracts, sales agreements, and confirmed buyer closures.
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-subtle">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, project, mobile..."
              className="pl-8 pr-2.5 py-1.5 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted hover:bg-surface-subtle transition-colors w-full sm:w-64 focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            />
          </form>

          {/* Refresh Action */}
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchDeals(pagination.page, searchQuery)}
            disabled={isLoading}
          >
            Refresh
          </Button>

          {/* Back to Dashboard */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/sales/dashboard')}
          >
            Sales Dashboard
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * Error State
       * ------------------------------------------------------------- */}
      {error && (
        <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => fetchDeals(pagination.page)}>
            Retry
          </Button>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Deals Table Card
       * ------------------------------------------------------------- */}
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-table-header border-b border-edge text-[11px] font-bold text-content-muted uppercase tracking-wider">
                <th scope="col" className="py-3.5 pl-6 pr-3 min-w-[200px]">
                  Deal / Customer
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[130px]">
                  Mobile Contact
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[150px]">
                  Project Name
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[130px]">
                  Property Type
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[130px]">
                  Final Deal Price
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[100px]">
                  Unit Size
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[140px]">
                  Completion Date
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[130px]">
                  Sales Agent
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-6 text-right min-w-[120px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-content-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
                      <span>Loading completed deals from database...</span>
                    </div>
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-content-muted">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <ShieldCheck className="w-8 h-8 text-slate-400" />
                      <span className="font-semibold text-content-secondary text-sm">
                        No Completed Deals Found
                      </span>
                      <p className="text-[11px] text-content-muted leading-relaxed">
                        {searchQuery
                          ? `No completed deals match "${searchQuery}". Try clearing the search query.`
                          : "When a lead successfully finishes all 4 workflow stages and Deal Done is confirmed, it will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                deals.map((deal) => {
                  const dealInfo: Partial<IDealDone> = deal.dealDone || {};
                  const agent = (deal as any).assignedTo;
                  const confirmedDate = dealInfo.confirmedAt
                    ? new Date(dealInfo.confirmedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : new Date(deal.updatedAt || deal.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });

                  return (
                    <tr
                      key={deal._id || (deal as any).id}
                      className="hover:bg-surface-table-hover transition-colors duration-100"
                    >
                      {/* Customer Name */}
                      <td className="py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                            {deal.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-content-primary block leading-tight">
                              {deal.name}
                            </span>
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Confirmed Deal
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Full Mobile Number (unmasked for authorized view) */}
                      <td className="py-3.5 px-4 font-mono font-medium text-xs text-content-secondary">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-content-muted shrink-0" />
                          <span>{deal.mobile}</span>
                        </div>
                      </td>

                      {/* Project Name */}
                      <td className="py-3.5 px-4 font-semibold text-content-primary">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-content-muted shrink-0" />
                          <span>{dealInfo.project || deal.projectName || "Standard Property"}</span>
                        </div>
                      </td>

                      {/* Property Type */}
                      <td className="py-3.5 px-4 text-content-secondary">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200">
                          {dealInfo.propertyType || deal.requirement || "Residential"}
                        </span>
                      </td>

                      {/* Final Deal Price */}
                      <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-xs">
                        {dealInfo.price
                          ? `₹${Number(dealInfo.price).toLocaleString()}`
                          : "Price Recorded"}
                      </td>

                      {/* Unit Size */}
                      <td className="py-3.5 px-4 text-xs text-content-secondary font-medium">
                        {dealInfo.size || "Standard"}
                      </td>

                      {/* Deal Completion Date */}
                      <td className="py-3.5 px-4 text-xs text-content-muted">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-content-muted shrink-0" />
                          <span>{confirmedDate}</span>
                        </div>
                      </td>

                      {/* Sales Agent */}
                      <td className="py-3.5 px-4 text-xs font-medium text-content-secondary">
                        {agent?.name ? (
                          <span className="text-content-primary font-semibold">{agent.name}</span>
                        ) : (
                          <span className="text-content-muted italic">Unassigned</span>
                        )}
                      </td>

                      {/* View Details Action */}
                      <td className="py-3.5 pl-4 pr-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Eye className="w-3.5 h-3.5 text-brand-primary" />}
                          onClick={() => navigate(`/sales/completed-deals/${deal._id || (deal as any).id}`)}
                          className="hover:bg-blue-50 hover:border-brand-primary hover:text-brand-primary"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3.5 sm:p-4 border-t border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-subtle/30 text-xs text-content-muted">
            <div>
              Showing Page <span className="font-semibold text-content-primary">{pagination.page}</span> of{" "}
              <span className="font-semibold text-content-primary">{pagination.totalPages}</span> (
              {pagination.total} total deals)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
                onClick={() => fetchDeals(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={() => fetchDeals(pagination.page + 1)}
                disabled={!pagination.hasMore && pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
