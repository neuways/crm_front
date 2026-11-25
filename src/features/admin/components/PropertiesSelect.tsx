import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building, Plus, X, AlertCircle, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { propertyMappingService } from '../../../services/property-mapping.service.js';
import { IPropertyMappingItem } from '../../../types/property-mapping.types.js';

export interface PropertiesSelectProps {
  selectedPropertyIds: string[];
  onChange: (propertyIds: string[]) => void;
  disabled?: boolean;
}

const getMappingId = (m: IPropertyMappingItem): string => m._id || (m as any).id || '';

const mergeAndSortMappings = (
  base: IPropertyMappingItem[],
  incoming: IPropertyMappingItem[]
): IPropertyMappingItem[] => {
  const byNormalized = new Map<string, IPropertyMappingItem>();

  for (const item of [...base, ...incoming]) {
    const id = getMappingId(item);
    const name = item.propertyName?.trim();
    if (!id || !name) continue;
    const key = (item.normalizedName || name).trim().toLowerCase();
    byNormalized.set(key, {
      ...item,
      _id: id,
      id,
      propertyName: name,
      normalizedName: key,
    });
  }

  return Array.from(byNormalized.values()).sort((a, b) =>
    a.propertyName.localeCompare(b.propertyName, undefined, { sensitivity: 'base' })
  );
};

export const PropertiesSelect: React.FC<PropertiesSelectProps> = ({
  selectedPropertyIds = [],
  onChange,
  disabled = false,
}) => {
  const [mappings, setMappings] = useState<IPropertyMappingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Inline "+ Add New Property" state (never uses a nested <form>)
  const [isInlineAddOpen, setIsInlineAddOpen] = useState<boolean>(false);
  const [newPropertyName, setNewPropertyName] = useState<string>('');
  const [isCreatingProperty, setIsCreatingProperty] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await propertyMappingService.listMappings();
      const rawMappings = res.data?.mappings || (res as any)?.mappings;
      if (res.success && Array.isArray(rawMappings)) {
        setMappings((prev) => mergeAndSortMappings(prev, rawMappings));
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

  useEffect(() => {
    if (isInlineAddOpen) {
      inlineInputRef.current?.focus();
    }
  }, [isInlineAddOpen]);

  const handleOpenInlineAdd = () => {
    setNewPropertyName('');
    setCreateError(null);
    setIsInlineAddOpen(true);
  };

  const handleCancelInlineAdd = () => {
    if (isCreatingProperty) return;
    setIsInlineAddOpen(false);
    setNewPropertyName('');
    setCreateError(null);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;

    if (val === '__ADD_NEW__') {
      handleOpenInlineAdd();
    } else if (!selectedPropertyIds.includes(val)) {
      onChange([...selectedPropertyIds, val]);
    }
  };

  const handleRemoveProperty = (idToRemove: string) => {
    onChange(selectedPropertyIds.filter((id) => id !== idToRemove));
  };

  const handleCreateNewProperty = async () => {
    setCreateError(null);

    const trimmed = newPropertyName.trim();
    if (!trimmed || trimmed.length < 2) {
      setCreateError('Property name must be at least 2 characters.');
      return;
    }

    // Prevent case-insensitive duplicate creation and preserve existing mapped agents
    const normalizedInput = trimmed.toLowerCase();
    const existingMatch = mappings.find(
      (m) => (m.normalizedName || m.propertyName).trim().toLowerCase() === normalizedInput
    );

    if (existingMatch) {
      const existingId = getMappingId(existingMatch);
      if (existingId && !selectedPropertyIds.includes(existingId)) {
        onChange([...selectedPropertyIds, existingId]);
      }
      setIsInlineAddOpen(false);
      setNewPropertyName('');
      setCreateError(null);
      return;
    }

    setIsCreatingProperty(true);
    try {
      const res = await propertyMappingService.upsertMapping({
        propertyName: trimmed,
        agentIds: [],
      });

      const createdMapping = res.data?.mapping || (res as any)?.mapping;
      if (!res.success || !createdMapping) {
        setCreateError(res.message || 'Failed to save new property.');
        return;
      }

      const createdId = getMappingId(createdMapping);

      // Immediately update local dropdown options & select the newly created property chip
      setMappings((prev) => mergeAndSortMappings(prev, [createdMapping]));
      if (createdId && !selectedPropertyIds.includes(createdId)) {
        onChange([...selectedPropertyIds, createdId]);
      }

      // Close inline editor & reset state before refreshing in background
      setIsInlineAddOpen(false);
      setNewPropertyName('');
      setCreateError(null);

      // Refresh full list from backend so future selections stay synchronized
      void loadProperties();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred while saving property.');
    } finally {
      setIsCreatingProperty(false);
    }
  };

  // Filter out already selected properties for dropdown
  const availableOptions = mappings.filter((m) => {
    const mId = getMappingId(m);
    return Boolean(mId) && !selectedPropertyIds.includes(mId);
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-content-primary">
          Properties to Handle
        </label>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isInlineAddOpen) {
              handleCancelInlineAdd();
            } else {
              handleOpenInlineAdd();
            }
          }}
          disabled={disabled || isCreatingProperty}
          className="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          + Add New Property
        </button>
      </div>

      {fetchError && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              void loadProperties();
            }}
            className="font-semibold underline hover:text-amber-950 shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Selected Properties Chips */}
      {selectedPropertyIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 p-2 bg-surface-subtle/50 border border-edge rounded-lg min-h-[40px] items-center">
          {selectedPropertyIds.map((id) => {
            const match = mappings.find((m) => getMappingId(m) === id);
            const name = match ? match.propertyName : isLoading ? 'Loading property...' : 'Assigned Property';

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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveProperty(id);
                  }}
                  className="text-blue-400 hover:text-status-danger transition-colors ml-0.5 cursor-pointer"
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
          {availableOptions.map((m) => {
            const mId = getMappingId(m);
            return (
              <option key={mId} value={mId}>
                {m.propertyName}
              </option>
            );
          })}
          <option value="__ADD_NEW__" className="font-semibold text-brand-primary">
            + Add New Property
          </option>
        </select>
      </div>

      {/* Inline "+ Add New Property" Input Box (No nested <form>) */}
      {isInlineAddOpen && (
        <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-semibold text-content-primary flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-brand-primary" />
              <span>New Property / Project Name</span>
            </label>
          </div>

          {createError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-900 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-status-danger shrink-0 mt-0.5" />
              <span>{createError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              ref={inlineInputRef}
              type="text"
              value={newPropertyName}
              onChange={(e) => {
                setNewPropertyName(e.target.value);
                if (createError) setCreateError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleCreateNewProperty();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelInlineAdd();
                }
              }}
              placeholder="e.g. Green Valley Villas"
              disabled={isCreatingProperty || disabled}
              className="flex-1 px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isCreatingProperty}
                disabled={disabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleCreateNewProperty();
                }}
                icon={<Check className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCreatingProperty}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelInlineAdd();
                }}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-content-muted">
            Saves the property in the CRM for future Round Robin routing and selects it for this employee without submitting the form.
          </p>
        </div>
      )}

      <p className="text-[10px] text-content-muted">
        Assigns project/property eligibility. Round Robin routing will distribute incoming customer leads for these properties to this agent.
      </p>
    </div>
  );
};
