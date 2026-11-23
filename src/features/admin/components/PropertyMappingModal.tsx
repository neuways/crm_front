import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Building,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { propertyMappingService } from '../../../services/property-mapping.service.js';
import { userService } from '../../../services/user.service.js';
import { IPropertyMappingItem, MappedAgentSummary } from '../../../types/property-mapping.types.js';
import { EmployeeProfile } from '../../../types/user.types.js';

export interface PropertyMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyMappingModal: React.FC<PropertyMappingModalProps> = ({ isOpen, onClose }) => {
  const [mappings, setMappings] = useState<IPropertyMappingItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State for creating/editing mapping
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string>('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mappingsRes, empRes] = await Promise.all([
        propertyMappingService.listMappings(),
        userService.listEmployees(),
      ]);

      if (mappingsRes.success && mappingsRes.data?.mappings) {
        setMappings(mappingsRes.data.mappings);
      } else {
        setError(mappingsRes.message || 'Failed to retrieve property mappings.');
      }

      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error loading data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setIsFormOpen(false);
      setEditingMappingId(null);
      setPropertyName('');
      setSelectedAgentIds([]);
      setSuccessMessage(null);
      setError(null);
    }
  }, [isOpen, fetchData]);

  if (!isOpen) return null;

  // Active Sales Agents eligible for mapping
  const activeSalesAgents = employees.filter((e) => e.role === 'SALES' && e.isActive);

  const handleStartCreate = () => {
    setEditingMappingId(null);
    setPropertyName('');
    setSelectedAgentIds([]);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleStartEdit = (m: IPropertyMappingItem) => {
    setEditingMappingId(m._id || m.id || '');
    setPropertyName(m.propertyName);
    const agentIds = m.agentIds.map((a) => (typeof a === 'string' ? a : a.id || a._id || ''));
    setSelectedAgentIds(agentIds);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleToggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleMoveAgent = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedAgentIds.length) return;

    setSelectedAgentIds((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = propertyName.trim();
    if (!trimmed) {
      setFormError('Property name is required.');
      return;
    }
    if (selectedAgentIds.length === 0) {
      setFormError('Select at least one Sales Agent for this property Round Robin sequence.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const res = await propertyMappingService.upsertMapping({
        propertyName: trimmed,
        agentIds: selectedAgentIds,
      });

      if (!res.success) {
        setFormError(res.message || 'Failed to save property mapping.');
        return;
      }

      setSuccessMessage(`Mapping for "${trimmed}" saved successfully.`);
      setIsFormOpen(false);
      setEditingMappingId(null);
      setPropertyName('');
      setSelectedAgentIds([]);
      await fetchData();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving mapping.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the Round Robin mapping for "${name}"?`)) {
      return;
    }

    try {
      const res = await propertyMappingService.deleteMapping(id);
      if (res.success) {
        setSuccessMessage(`Mapping for "${name}" deleted.`);
        await fetchData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(res.message || 'Failed to delete property mapping.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting mapping.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-mapping-title"
    >
      <div className="bg-surface-card border border-edge rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-surface-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 id="property-mapping-title" className="text-sm sm:text-base font-bold text-content-primary">
                Property-Wise Round Robin Mappings
              </h2>
              <p className="text-xs text-content-muted">
                Configure dedicated Sales Agent assignment pools per property or project.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-subtle hover:text-content-primary hover:bg-surface-subtle transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Notification Messages */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-status-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-status-danger flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Modal / Inline Editor */}
          {isFormOpen ? (
            <form onSubmit={handleSaveMapping} className="p-4 bg-slate-50 border border-edge rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-edge">
                <h3 className="text-xs font-bold uppercase tracking-wider text-content-primary flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-brand-primary" />
                  {editingMappingId ? 'Edit Property Mapping' : 'Create Property Mapping'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-content-muted hover:text-content-primary"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-status-danger flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Property Name Input */}
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Property / Project Name <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. Greenfield Heights"
                  className="w-full px-3 py-2 text-xs bg-surface-card border border-edge rounded-lg text-content-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  required
                />
                <p className="text-[11px] text-content-muted mt-1">
                  Case-insensitive match with project names entered on lead enquiries.
                </p>
              </div>

              {/* Sales Agent Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-content-primary">
                    Select Sales Agents for Round Robin Pool <span className="text-status-danger">*</span>
                  </label>
                  <span className="text-[11px] text-content-muted">
                    {selectedAgentIds.length} agent(s) selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-surface-card border border-edge rounded-lg">
                  {activeSalesAgents.length === 0 ? (
                    <p className="text-xs text-content-muted p-2 col-span-2">
                      No active Sales Agents found in the organization.
                    </p>
                  ) : (
                    activeSalesAgents.map((agent) => {
                      const isSelected = selectedAgentIds.includes(agent.id);
                      return (
                        <label
                          key={agent.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs border transition-colors ${
                            isSelected
                              ? 'bg-blue-50/70 border-brand-primary text-brand-primary font-medium'
                              : 'bg-white border-edge text-content-primary hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleAgent(agent.id)}
                            className="rounded text-brand-primary focus:ring-brand-primary h-3.5 w-3.5"
                          />
                          <div className="flex-1 truncate">
                            <span className="block truncate">{agent.name}</span>
                            <span className="text-[10px] text-content-muted block truncate">
                              {agent.email}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Sequence Order Controls */}
              {selectedAgentIds.length > 1 && (
                <div>
                  <label className="block text-[11px] font-semibold text-content-muted uppercase tracking-wider mb-1">
                    Round Robin Sequence Order
                  </label>
                  <div className="space-y-1 bg-surface-card p-2 border border-edge rounded-lg">
                    {selectedAgentIds.map((agentId, index) => {
                      const agent = activeSalesAgents.find((a) => a.id === agentId);
                      return (
                        <div
                          key={agentId}
                          className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400 w-4">
                              #{index + 1}
                            </span>
                            <span className="font-medium text-slate-700">
                              {agent?.name || 'Sales Agent'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveAgent(index, 'UP')}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-400 hover:text-brand-primary disabled:opacity-30"
                              title="Move up"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveAgent(index, 'DOWN')}
                              disabled={index === selectedAgentIds.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-brand-primary disabled:opacity-30"
                              title="Move down"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  icon={<UserCheck className="h-3.5 w-3.5" />}
                >
                  {isSaving ? 'Saving...' : 'Save Mapping'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleStartCreate}
              >
                Add Property Mapping
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                onClick={fetchData}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </div>
          )}

          {/* Mappings Table / List */}
          {isLoading && !isFormOpen ? (
            <div className="py-8 text-center text-xs text-content-muted">
              Loading property mappings...
            </div>
          ) : mappings.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-edge rounded-xl">
              <Building className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-content-secondary">No Property Mappings Defined</p>
              <p className="text-[11px] text-content-muted mt-0.5">
                Add a property mapping above to enable automated, property-wise Round Robin lead distribution.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mappings.map((m) => {
                const mappedAgents = (m.agentIds || []) as MappedAgentSummary[];
                const lastAgent = m.lastAssignedAgentId as MappedAgentSummary | null | undefined;
                return (
                  <div
                    key={m._id || m.id}
                    className="p-3.5 bg-surface-card border border-edge rounded-xl hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-edge">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-brand-primary" />
                        <h4 className="text-xs font-bold text-content-primary">{m.propertyName}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {mappedAgents.length} Agent(s)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(m)}
                          className="text-xs h-7 px-2"
                        >
                          Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m._id || m.id || '', m.propertyName)}
                          className="p-1.5 rounded text-slate-400 hover:text-status-danger transition-colors"
                          title="Delete Mapping"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider mr-1">
                        Sequence:
                      </span>
                      {mappedAgents.map((agent, i) => {
                        const isLastAssigned =
                          lastAgent &&
                          ((agent.id && lastAgent.id && agent.id === lastAgent.id) ||
                            (agent._id && lastAgent._id && agent._id === lastAgent._id));
                        return (
                          <span
                            key={agent.id || agent._id || i}
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${
                              isLastAssigned
                                ? 'bg-blue-50 border-brand-primary text-brand-primary font-bold'
                                : agent.isActive === false
                                ? 'bg-slate-100 border-slate-300 text-slate-400 line-through'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                            title={agent.isActive === false ? 'Agent is inactive (skipped)' : ''}
                          >
                            <span className="font-mono text-[9px] text-slate-400">#{i + 1}</span>
                            <span>{agent.name}</span>
                            {isLastAssigned && (
                              <span className="text-[9px] bg-blue-200 text-blue-800 px-1 rounded ml-0.5">
                                Last
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-edge bg-surface-subtle/50 flex items-center justify-between">
          <span className="text-[11px] text-content-muted">
            Independent Round Robin sequences are maintained per property.
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
