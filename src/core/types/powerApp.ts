export interface ModelDrivenApp {
  id: string;
  name: string;
  uniqueName: string;
  description: string | null;
  createdOn: string | null;
  modifiedOn: string | null;
  state: string;
  isDefault: boolean;
}

export interface PowerAppsInventory {
  modelDrivenApps: ModelDrivenApp[];
  customPageCount: number;
  entityFormCount: number;
  dashboardCount: number;
  viewCount: number;
  warnings: string[];
}
