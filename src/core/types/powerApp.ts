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

export interface PowerAppView {
  id: string;
  name: string;
  entityName: string | null;
  queryType: string | null;
  modifiedOn: string | null;
}

export interface PowerAppDashboard {
  id: string;
  name: string;
  dashboardType: string;
  modifiedOn: string | null;
}

export interface PowerAppComponentLibrary {
  id: string;
  name: string;
  displayName: string;
  modifiedOn: string | null;
  state: string | null;
}

export interface PcfControl {
  id: string;
  name: string;
  version: string | null;
  manifestPreview: string | null;
  resourceCount: number;
  modifiedOn: string | null;
}

export interface PowerAppsInventory {
  modelDrivenApps: ModelDrivenApp[];
  views: PowerAppView[];
  dashboards: PowerAppDashboard[];
  componentLibraries: PowerAppComponentLibrary[];
  pcfControls: PcfControl[];
  customPageCount: number;
  entityFormCount: number;
  warnings: string[];
}
