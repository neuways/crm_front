export interface MappedAgentSummary {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isTeamActive?: boolean;
}

export interface IPropertyMappingItem {
  _id: string;
  id?: string;
  propertyName: string;
  normalizedName: string;
  agentIds: (string | MappedAgentSummary)[];
  lastAssignedAgentId?: string | MappedAgentSummary | null;
  lastAssignedIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPropertyMappingPayload {
  propertyName: string;
  agentIds: string[];
}

export interface PropertyMappingListResponse {
  mappings: IPropertyMappingItem[];
}

export interface PropertyMappingSingleResponse {
  mapping: IPropertyMappingItem;
}
