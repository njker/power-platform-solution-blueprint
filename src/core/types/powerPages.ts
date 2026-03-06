export interface PowerPagesWebsite {
  id: string;
  name: string;
  primaryDomain?: string;
  languageCode?: string;
  modifiedOn?: string;
}

export interface PowerPagesPage {
  id: string;
  name: string;
  partialUrl?: string;
  websiteId?: string;
  websiteName?: string;
  pageTemplateName?: string;
  webTemplateName?: string;
  parentPageId?: string;
  parentPageName?: string;
  publishingStateName?: string;
  modifiedOn?: string;
}

export interface PowerPagesWebTemplate {
  id: string;
  name: string;
  websiteId?: string;
  websiteName?: string;
  mimeType?: string;
  source?: string;
  modifiedOn?: string;
}

export interface PowerPagesContentSnippet {
  id: string;
  name: string;
  websiteId?: string;
  websiteName?: string;
  value?: string;
  modifiedOn?: string;
}

export interface PowerPagesEntityForm {
  id: string;
  name: string;
  entityName?: string;
  mode?: string;
  websiteId?: string;
  websiteName?: string;
  modifiedOn?: string;
}

export interface PowerPagesEntityList {
  id: string;
  name: string;
  entityName?: string;
  websiteId?: string;
  websiteName?: string;
  modifiedOn?: string;
}

export interface PowerPagesWebForm {
  id: string;
  name: string;
  startStepId?: string;
  startStepName?: string;
  websiteId?: string;
  websiteName?: string;
  modifiedOn?: string;
}

export interface PowerPagesWebFormStep {
  id: string;
  name: string;
  webFormId?: string;
  webFormName?: string;
  entityName?: string;
  stepType?: string;
  modifiedOn?: string;
}

export interface PowerPagesWebRole {
  id: string;
  name: string;
  websiteId?: string;
  websiteName?: string;
  authenticatedUsersRole: boolean;
  anonymousUsersRole: boolean;
  modifiedOn?: string;
}

export interface PowerPagesTablePermission {
  id: string;
  name: string;
  websiteId?: string;
  websiteName?: string;
  entityName?: string;
  scope?: string;
  canRead: boolean;
  canWrite: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canAppend: boolean;
  canAppendTo: boolean;
  modifiedOn?: string;
}

export interface PowerPagesPageAccessRule {
  id: string;
  name: string;
  websiteId?: string;
  websiteName?: string;
  pageId?: string;
  pageName?: string;
  webRoleId?: string;
  webRoleName?: string;
  right?: string;
  modifiedOn?: string;
}

export interface PowerPagesSiteSetting {
  id: string;
  name: string;
  value?: string;
  websiteId?: string;
  websiteName?: string;
  modifiedOn?: string;
}

export interface PowerPagesLiquidAnalysis {
  sourceType: 'WebTemplate' | 'ContentSnippet' | 'WebPage';
  sourceName: string;
  complexityScore: number;
  complexityBand: 'High' | 'Medium' | 'Low';
  tagCount: number;
  includeCount: number;
  fetchXmlCount: number;
}

export interface PowerPagesJavaScriptAnalysis {
  sourceType: 'WebTemplate' | 'ContentSnippet' | 'WebPage';
  sourceName: string;
  scriptBlockCount: number;
  externalCallCount: number;
  externalDomains: string[];
}

export interface PowerPagesAuthProvider {
  websiteName?: string;
  settingName: string;
  providerHint: string;
  valuePreview?: string;
}

export interface PowerPagesApiEndpoint {
  sourceType: 'WebTemplate' | 'ContentSnippet' | 'WebPage' | 'SiteSetting';
  sourceName: string;
  url: string;
  domain: string;
}

export interface PowerPagesInventory {
  websites: PowerPagesWebsite[];
  pages: PowerPagesPage[];
  webTemplates: PowerPagesWebTemplate[];
  contentSnippets: PowerPagesContentSnippet[];
  entityForms: PowerPagesEntityForm[];
  entityLists: PowerPagesEntityList[];
  webForms: PowerPagesWebForm[];
  webFormSteps: PowerPagesWebFormStep[];
  webRoles: PowerPagesWebRole[];
  tablePermissions: PowerPagesTablePermission[];
  pageAccessRules: PowerPagesPageAccessRule[];
  siteSettings: PowerPagesSiteSetting[];
  liquidAnalyses: PowerPagesLiquidAnalysis[];
  javaScriptAnalyses: PowerPagesJavaScriptAnalysis[];
  authProviders: PowerPagesAuthProvider[];
  apiEndpoints: PowerPagesApiEndpoint[];
  warnings: string[];
}
