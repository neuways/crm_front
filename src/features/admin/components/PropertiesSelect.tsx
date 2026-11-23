import React, { useState, useEffect, useCallback } from 'react';
import { Building, Plus, X, AlertCircle, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { propertyMappingService } from '../../../services/property-mapping.service.js';
import { IPropertyMappingItem } from '../../../types/property-mapping.types.js';

export interface PropertiesSelectProps {
  selectedPropertyIds: string[];
  onChange: (propertyIds: string[]) => void;
  disabled?: boolean;
}

export const PropertiesSelect: React.FC<PropertiesSelectProps> = ({
  selectedPropertyIds = [],
  onChange,
  disabled = false,
}) => {
  const [mappings, setMappings] = useState<IPropertyMappingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // "+ Add New Property" modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newPropertyName, setNewPropertyName] = useState<string>('');
  const [isCreatingProperty, setIsCreatingProperty] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await propertyMappingService.listMappings();
      if (res.success && res.data?.mappings) {
        setMappings(res.data.mappings);
      } else {
        setFetchError(res.message || 'Failed to load property list.');
      }
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Error fetching properties.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;

    if (val === '__ADD_NEW__') {
      setNewPropertyName('');
      setCreateError(null);
      setIsAddModalOpen(true);
    } else {
      if (!selectedPropertyIds.includes(val)) {
        onChange([...selectedPropertyIds, val]);
      }
    }
    // Reset select to empty placeholder
    e.target.value = '';
  };

  const handleRemoveProperty = (idToRemove: string) => {
    onChange(selectedPropertyIds.filter((id) => id !== idToRemove));
  };

  const handleCreateNewProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const trimmed = newPropertyName.trim();
    if (!trimmed || trimmed.length < 2) {
      setCreateError('Property name must be at least 2 characters.');
      return;
    }

    setIsCreatingProperty(true);
    try {
      const res = await propertyMappingService.upsertMapping({
        propertyName: trimmed,
        agentIds: [],
      });

      if (!res.success || !res.data?.mapping) {
        setCreateError(res.message || 'Failed to create new property.');
        return;
      }

      const createdMapping = res.data.mapping;
      const createdId = createdMapping._id || (createdMapping as any).id;

      // Refresh property list in background
      await loadProperties();

      // Automatically select the newly created property
      if (createdId && !selectedPropertyIds.includes(createdId)) {
        onChange([...selectedPropertyIds, createdId]);
      }

      // Close modal and reset
      setIsAddModalOpen(false);
      setNewPropertyName('');
      setCreateError(null);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred while saving property.');
    } finally {
      setIsCreatingProperty(false);
    }
  };

  // Filter out already selected properties for dropdown
  const availableOptions = mappings.filter(
    (m) => !selectedPropertyIds.includes(m._id) && !selectedPropertyIds.includes((m as any).id)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-content-primary">
          Properties to Handle
        </label>
        <button
          type="button"
          onClick={() => {
            setNewPropertyName('');
            setCreateError(null);
            setIsAddModalOpen(true);
          }}
          disabled={disabled}
          className="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          + Add New Property
        </button>
      </div>

      {fetchError && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Selected Properties Chips */}
      {selectedPropertyIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 p-2 bg-surface-subtle/50 border border-edge rounded-lg min-h-[40px] items-center">
          {selectedPropertyIds.map((id) => {
            const match = mappings.find((m) => m._id === id || (m as any).id === id);
            const name = match ? match.propertyName : 'Assigned Property';

            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200 animate-in fade-in duration-100"
              >
                <Building className="h-3 w-3 text-brand-primary shrink-0" />
                <span>{name}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemoveProperty(id)}
                  className="text-blue-400 hover:text-status-danger transition-colors ml-0.5"
                  aria-label={`Remove property ${name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <div className="p-2.5 bg-slate-50 border border-dashed border-edge rounded-lg text-[11px] text-content-muted italic">
          No properties currently assigned. This agent will not be eligible to receive leads for unassigned properties via Round Robin.
        </div>
      )}

      {/* Property Dropdown Selector */}
      <div className="relative">
        <select
          disabled={disabled || isLoading}
          value=""
          onChange={handleSelectChange}
          className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
        >
          <option value="">
            {isLoading ? 'Loading CRM properties...' : '-- Select a property to add --'}
          </option>
          {availableOptions.map((m) => (
            <option key={m._id} value={m._id}>
              {m.propertyName}
            </option>
          ))}
          <option value="__ADD_NEW__" className="font-semibold text-brand-primary">
            + Add New Property
          </option>
        </select>
      </div>

      <p className="text-[10px] text-content-muted">
        Assigns project/property eligibility. Round Robin routing will distribute incoming customer leads for these properties to this agent.
      </p>

      {/* "+ Add New Property" Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-card border border-edge rounded-xl shadow-dropdown max-w-sm w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-edge flex items-center justify-between bg-surface-header">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-brand-primary rounded-lg">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-content-primary">Add New Property</h3>
                  <p className="text-[10px] text-content-muted">Create a CRM property and assign it to this agent</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isCreatingProperty) {
                    setIsAddModalOpen(false);
                    setCreateError(null);
                  }
                }}
                className="p-1 text-content-subtle hover:text-content-primary rounded-md"
                aria-label="Close add property modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateNewProperty} className="p-5 space-y-4">
              {createError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-status-danger shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Property / Project Name <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  placeholder="e.g. Green Valley Villas"
                  className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <p className="text-[10px] text-content-muted mt-1">
                  This property will be registered in the CRM and mapped to this agent immediately.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-edge">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCreatingProperty}
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setCreateError(null);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isCreatingProperty}
                  icon={<Check className="h-3.5 w-3.5" />}
                  className="text-xs"
                >
                  Save & Assign
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
