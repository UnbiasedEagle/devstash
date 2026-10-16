export interface ItemTypeSummary {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ItemTypeCount extends ItemTypeSummary {
  count: number;
}

export interface DashboardItem {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: Date;
  itemType: ItemTypeSummary;
  tags: string[];
}

export interface DashboardCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  color: string;
  itemTypes: ItemTypeSummary[];
}

export interface SidebarCollection {
  id: string;
  name: string;
  itemCount: number;
}

export interface SidebarCollections {
  favorites: SidebarCollection[];
  recent: SidebarCollection[];
}

export interface SidebarUser {
  name: string;
  email: string;
}

export interface DashboardStats {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
  itemTypeCounts: ItemTypeCount[];
}
