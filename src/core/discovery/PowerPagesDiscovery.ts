import type { IDataverseClient, QueryOptions } from '../dataverse/IDataverseClient.js';
import type {
  PowerPagesApiEndpoint,
  PowerPagesAuthProvider,
  PowerPagesContentSnippet,
  PowerPagesEntityForm,
  PowerPagesEntityList,
  PowerPagesInventory,
  PowerPagesJavaScriptAnalysis,
  PowerPagesLiquidAnalysis,
  PowerPagesPage,
  PowerPagesPageAccessRule,
  PowerPagesSiteSetting,
  PowerPagesTablePermission,
  PowerPagesWebForm,
  PowerPagesWebFormStep,
  PowerPagesWebRole,
  PowerPagesWebTemplate,
  PowerPagesWebsite,
} from '../types/powerPages.js';

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;
const LIQUID_TAG_PATTERN = /\{%-?\s*([a-zA-Z_][a-zA-Z0-9_]*)/g;
const SCRIPT_BLOCK_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const EXTERNAL_CALL_PATTERN = /(fetch\(|XMLHttpRequest|\.ajax\(|axios\.|PowerPages\.WebApi)/gi;
const AUTH_SETTING_PATTERN = /(authentication|openid|oauth|aad|microsoft|facebook|google|twitter|saml|wsfed|external)/i;

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

interface QueryFallbackResult<T> {
  records: T[];
  entitySetUsed: string | null;
  warnings: string[];
}

export class PowerPagesDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  async discover(componentIdFilter?: Set<string>): Promise<PowerPagesInventory> {
    const warnings: string[] = [];

    const websiteResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_websites', 'mspp_websites'],
      { select: ['adx_websiteid', 'adx_name', 'adx_primarydomainname', 'adx_languagecode', 'modifiedon'] },
      warnings
    );
    const websites = websiteResult.records
      .map(record => this.mapWebsite(record))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));

    const websiteNameMap = new Map(websites.map(item => [item.id, item.name]));

    const pageTemplateResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_pagetemplates', 'mspp_pagetemplates'],
      { select: ['adx_pagetemplateid', 'adx_name', 'modifiedon'] },
      warnings
    );
    const pageTemplateNameMap = new Map<string, string>();
    for (const row of pageTemplateResult.records) {
      const id = this.normaliseGuid(this.readString(row, 'adx_pagetemplateid'));
      const name = this.readString(row, 'adx_name') || id;
      if (id) {
        pageTemplateNameMap.set(id, name);
      }
    }

    const templateResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_webtemplates', 'mspp_webtemplates'],
      { select: ['adx_webtemplateid', 'adx_name', 'adx_source', 'adx_mimetype', '_adx_websiteid_value', 'modifiedon'] },
      warnings
    );
    const webTemplates = templateResult.records
      .map(record => this.mapWebTemplate(record, websiteNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));
    const webTemplateNameMap = new Map(webTemplates.map(item => [item.id, item.name]));

    const pagesResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_webpages', 'mspp_webpages'],
      {
        select: [
          'adx_webpageid',
          'adx_name',
          'adx_partialurl',
          '_adx_websiteid_value',
          '_adx_parentpageid_value',
          '_adx_pagetemplateid_value',
          '_adx_webtemplateid_value',
          '_adx_publishingstateid_value',
          'adx_copy',
          'modifiedon',
        ],
      },
      warnings
    );
    const pages = pagesResult.records
      .map(record => this.mapPage(record, websiteNameMap, pageTemplateNameMap, webTemplateNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));

    const pageNameMap = new Map(pages.map(item => [item.id, item.name]));

    const snippetsResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_contentsnippets', 'mspp_contentsnippets'],
      { select: ['adx_contentsnippetid', 'adx_name', 'adx_value', '_adx_websiteid_value', 'modifiedon'] },
      warnings
    );
    const contentSnippets = snippetsResult.records
      .map(record => this.mapContentSnippet(record, websiteNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));

    const entityFormsResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_entityforms', 'mspp_entityforms'],
      { select: ['adx_entityformid', 'adx_name', 'adx_entityname', 'adx_mode', '_adx_websiteid_value', 'modifiedon'] },
      warnings
    );
    const entityForms = entityFormsResult.records
      .map(record => this.mapEntityForm(record, websiteNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));

    const entityListsResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_entitylists', 'mspp_entitylists'],
      { select: ['adx_entitylistid', 'adx_name', 'adx_entityname', '_adx_websiteid_value', 'modifiedon'] },
      warnings
    );
    const entityLists = entityListsResult.records
      .map(record => this.mapEntityList(record, websiteNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));

    const webFormsResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_webforms', 'mspp_webforms'],
      { select: ['adx_webformid', 'adx_name', '_adx_startwebformstepid_value', '_adx_websiteid_value', 'modifiedon'] },
      warnings
    );
    const webForms = webFormsResult.records
      .map(record => this.mapWebForm(record, websiteNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));
    const webFormNameMap = new Map(webForms.map(item => [item.id, item.name]));

    const webFormStepsResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_webformsteps', 'mspp_webformsteps'],
      { select: ['adx_webformstepid', 'adx_name', '_adx_webformid_value', 'adx_entityname', 'adx_type', 'modifiedon'] },
      warnings
    );
    const webFormSteps = webFormStepsResult.records
      .map(record => this.mapWebFormStep(record, webFormNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));

    const webRolesResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_webroles', 'mspp_webroles'],
      {
        select: [
          'adx_webroleid',
          'adx_name',
          '_adx_websiteid_value',
          'adx_authenticatedusersrole',
          'adx_anonymoususersrole',
          'modifiedon',
        ],
      },
      warnings
    );
    const webRoles = webRolesResult.records
      .map(record => this.mapWebRole(record, websiteNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));
    const webRoleNameMap = new Map(webRoles.map(item => [item.id, item.name]));

    const tablePermissionResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_entitypermissions', 'mspp_tablepermissions'],
      {
        select: [
          'adx_entitypermissionid',
          'adx_name',
          '_adx_websiteid_value',
          'adx_entitylogicalname',
          'adx_scope',
          'adx_read',
          'adx_write',
          'adx_create',
          'adx_delete',
          'adx_append',
          'adx_appendto',
          'modifiedon',
        ],
      },
      warnings
    );
    const tablePermissions = tablePermissionResult.records
      .map(record => this.mapTablePermission(record, websiteNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));

    const accessRuleResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_webpageaccesscontrolrules', 'mspp_pageaccesscontrolrules'],
      {
        select: [
          'adx_webpageaccesscontrolruleid',
          'adx_name',
          '_adx_websiteid_value',
          '_adx_webpageid_value',
          '_adx_webroleid_value',
          'adx_right',
          'modifiedon',
        ],
      },
      warnings
    );
    const pageAccessRules = accessRuleResult.records
      .map(record => this.mapPageAccessRule(record, websiteNameMap, pageNameMap, webRoleNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));

    const siteSettingsResult = await this.queryWithFallback<Record<string, unknown>>(
      ['adx_sitesettings', 'mspp_sitesettings'],
      { select: ['adx_sitesettingid', 'adx_name', 'adx_value', '_adx_websiteid_value', 'modifiedon'] },
      warnings
    );
    const siteSettings = siteSettingsResult.records
      .map(record => this.mapSiteSetting(record, websiteNameMap))
      .filter(isDefined)
      .filter(record => this.includeRecord(record.id, componentIdFilter));

    const sourceTexts: Array<{ sourceType: 'WebTemplate' | 'ContentSnippet' | 'WebPage'; sourceName: string; sourceText: string }> = [];

    for (const template of webTemplates) {
      if (template.source) {
        sourceTexts.push({ sourceType: 'WebTemplate', sourceName: template.name, sourceText: template.source });
      }
    }

    for (const snippet of contentSnippets) {
      if (snippet.value) {
        sourceTexts.push({ sourceType: 'ContentSnippet', sourceName: snippet.name, sourceText: snippet.value });
      }
    }

    const pageTextLookup = new Map<string, string>();
    for (const row of pagesResult.records) {
      const id = this.normaliseGuid(this.readString(row, 'adx_webpageid'));
      const copy = this.readString(row, 'adx_copy');
      if (id && copy) {
        pageTextLookup.set(id, copy);
      }
    }
    for (const page of pages) {
      const sourceText = pageTextLookup.get(page.id);
      if (sourceText) {
        sourceTexts.push({ sourceType: 'WebPage', sourceName: page.name, sourceText });
      }
    }

    const liquidAnalyses = sourceTexts
      .map(item => this.analyseLiquid(item.sourceType, item.sourceName, item.sourceText))
      .sort((a, b) => b.complexityScore - a.complexityScore || a.sourceName.localeCompare(b.sourceName));

    const javaScriptAnalyses = sourceTexts
      .map(item => this.analyseJavaScript(item.sourceType, item.sourceName, item.sourceText))
      .filter(item => item.scriptBlockCount > 0 || item.externalCallCount > 0)
      .sort((a, b) => b.externalCallCount - a.externalCallCount || a.sourceName.localeCompare(b.sourceName));

    const apiEndpoints = this.collectApiEndpoints(sourceTexts, siteSettings);
    const authProviders = this.collectAuthProviders(siteSettings);

    return {
      websites,
      pages,
      webTemplates,
      contentSnippets,
      entityForms,
      entityLists,
      webForms,
      webFormSteps,
      webRoles,
      tablePermissions,
      pageAccessRules,
      siteSettings,
      liquidAnalyses,
      javaScriptAnalyses,
      authProviders,
      apiEndpoints,
      warnings,
    };
  }

  private async queryWithFallback<T extends Record<string, unknown>>(
    entitySets: string[],
    options: QueryOptions,
    warnings: string[]
  ): Promise<QueryFallbackResult<T>> {
    for (const entitySet of entitySets) {
      try {
        const result = await this.client.query<T>(entitySet, options);
        return { records: result.value, entitySetUsed: entitySet, warnings: [] };
      } catch {
        continue;
      }
    }

    warnings.push(`Power Pages table unavailable: ${entitySets.join(' or ')}`);
    return { records: [], entitySetUsed: null, warnings: [] };
  }

  private includeRecord(id: string, filter?: Set<string>): boolean {
    if (!filter || filter.size === 0) {
      return true;
    }
    return filter.has(id);
  }

  private mapWebsite(record: Record<string, unknown>): PowerPagesWebsite | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_websiteid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }
    return {
      id,
      name,
      primaryDomain: this.readString(record, 'adx_primarydomainname'),
      languageCode: this.readString(record, 'adx_languagecode'),
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapPage(
    record: Record<string, unknown>,
    websiteNameMap: Map<string, string>,
    pageTemplateNameMap: Map<string, string>,
    webTemplateNameMap: Map<string, string>
  ): PowerPagesPage | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_webpageid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    const parentPageId = this.normaliseGuid(this.readString(record, '_adx_parentpageid_value'));
    const pageTemplateId = this.normaliseGuid(this.readString(record, '_adx_pagetemplateid_value'));
    const webTemplateId = this.normaliseGuid(this.readString(record, '_adx_webtemplateid_value'));

    return {
      id,
      name,
      partialUrl: this.readString(record, 'adx_partialurl'),
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      pageTemplateName: pageTemplateId ? pageTemplateNameMap.get(pageTemplateId) : undefined,
      webTemplateName: webTemplateId ? webTemplateNameMap.get(webTemplateId) : undefined,
      parentPageId,
      parentPageName: parentPageId || undefined,
      publishingStateName: this.readString(record, '_adx_publishingstateid_value@OData.Community.Display.V1.FormattedValue'),
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapWebTemplate(record: Record<string, unknown>, websiteNameMap: Map<string, string>): PowerPagesWebTemplate | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_webtemplateid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    return {
      id,
      name,
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      mimeType: this.readString(record, 'adx_mimetype'),
      source: this.readString(record, 'adx_source'),
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapContentSnippet(record: Record<string, unknown>, websiteNameMap: Map<string, string>): PowerPagesContentSnippet | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_contentsnippetid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    return {
      id,
      name,
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      value: this.readString(record, 'adx_value'),
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapEntityForm(record: Record<string, unknown>, websiteNameMap: Map<string, string>): PowerPagesEntityForm | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_entityformid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    return {
      id,
      name,
      entityName: this.readString(record, 'adx_entityname'),
      mode: this.readString(record, 'adx_mode@OData.Community.Display.V1.FormattedValue') || this.readString(record, 'adx_mode'),
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapEntityList(record: Record<string, unknown>, websiteNameMap: Map<string, string>): PowerPagesEntityList | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_entitylistid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    return {
      id,
      name,
      entityName: this.readString(record, 'adx_entityname'),
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapWebForm(record: Record<string, unknown>, websiteNameMap: Map<string, string>): PowerPagesWebForm | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_webformid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    return {
      id,
      name,
      startStepId: this.normaliseGuid(this.readString(record, '_adx_startwebformstepid_value')),
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapWebFormStep(record: Record<string, unknown>, webFormNameMap: Map<string, string>): PowerPagesWebFormStep | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_webformstepid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const webFormId = this.normaliseGuid(this.readString(record, '_adx_webformid_value'));
    return {
      id,
      name,
      webFormId,
      webFormName: webFormId ? webFormNameMap.get(webFormId) : undefined,
      entityName: this.readString(record, 'adx_entityname'),
      stepType: this.readString(record, 'adx_type@OData.Community.Display.V1.FormattedValue') || this.readString(record, 'adx_type'),
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapWebRole(record: Record<string, unknown>, websiteNameMap: Map<string, string>): PowerPagesWebRole | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_webroleid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    return {
      id,
      name,
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      authenticatedUsersRole: this.readBoolean(record, 'adx_authenticatedusersrole'),
      anonymousUsersRole: this.readBoolean(record, 'adx_anonymoususersrole'),
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapTablePermission(record: Record<string, unknown>, websiteNameMap: Map<string, string>): PowerPagesTablePermission | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_entitypermissionid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    return {
      id,
      name,
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      entityName: this.readString(record, 'adx_entitylogicalname'),
      scope: this.readString(record, 'adx_scope@OData.Community.Display.V1.FormattedValue') || this.readString(record, 'adx_scope'),
      canRead: this.readBoolean(record, 'adx_read'),
      canWrite: this.readBoolean(record, 'adx_write'),
      canCreate: this.readBoolean(record, 'adx_create'),
      canDelete: this.readBoolean(record, 'adx_delete'),
      canAppend: this.readBoolean(record, 'adx_append'),
      canAppendTo: this.readBoolean(record, 'adx_appendto'),
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapPageAccessRule(
    record: Record<string, unknown>,
    websiteNameMap: Map<string, string>,
    pageNameMap: Map<string, string>,
    webRoleNameMap: Map<string, string>
  ): PowerPagesPageAccessRule | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_webpageaccesscontrolruleid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    const pageId = this.normaliseGuid(this.readString(record, '_adx_webpageid_value'));
    const webRoleId = this.normaliseGuid(this.readString(record, '_adx_webroleid_value'));

    return {
      id,
      name,
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      pageId,
      pageName: pageId ? pageNameMap.get(pageId) : undefined,
      webRoleId,
      webRoleName: webRoleId ? webRoleNameMap.get(webRoleId) : undefined,
      right: this.readString(record, 'adx_right@OData.Community.Display.V1.FormattedValue') || this.readString(record, 'adx_right'),
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private mapSiteSetting(record: Record<string, unknown>, websiteNameMap: Map<string, string>): PowerPagesSiteSetting | null {
    const id = this.normaliseGuid(this.readString(record, 'adx_sitesettingid'));
    const name = this.readString(record, 'adx_name');
    if (!id || !name) {
      return null;
    }

    const websiteId = this.normaliseGuid(this.readString(record, '_adx_websiteid_value'));
    return {
      id,
      name,
      value: this.readString(record, 'adx_value'),
      websiteId,
      websiteName: websiteId ? websiteNameMap.get(websiteId) : undefined,
      modifiedOn: this.readString(record, 'modifiedon'),
    };
  }

  private analyseLiquid(
    sourceType: 'WebTemplate' | 'ContentSnippet' | 'WebPage',
    sourceName: string,
    sourceText: string
  ): PowerPagesLiquidAnalysis {
    const tagMatches = sourceText.match(LIQUID_TAG_PATTERN) || [];
    const includeCount = (sourceText.match(/\{%-?\s*(include|render)\b/gi) || []).length;
    const fetchXmlCount = (sourceText.match(/\{%-?\s*fetchxml\b/gi) || []).length;
    const loopCount = (sourceText.match(/\{%-?\s*(for|tablerow)\b/gi) || []).length;
    const conditionalCount = (sourceText.match(/\{%-?\s*(if|unless|case)\b/gi) || []).length;

    const complexityScore = tagMatches.length + includeCount * 2 + fetchXmlCount * 3 + loopCount * 2 + conditionalCount;
    const complexityBand = complexityScore >= 45 ? 'High' : complexityScore >= 20 ? 'Medium' : 'Low';

    return {
      sourceType,
      sourceName,
      complexityScore,
      complexityBand,
      tagCount: tagMatches.length,
      includeCount,
      fetchXmlCount,
    };
  }

  private analyseJavaScript(
    sourceType: 'WebTemplate' | 'ContentSnippet' | 'WebPage',
    sourceName: string,
    sourceText: string
  ): PowerPagesJavaScriptAnalysis {
    const scriptBlocks = sourceText.match(SCRIPT_BLOCK_PATTERN) || [];
    const externalCallSignals = sourceText.match(EXTERNAL_CALL_PATTERN) || [];
    const domains = new Set<string>();

    for (const url of sourceText.match(URL_PATTERN) || []) {
      try {
        const domain = new URL(url).hostname.toLowerCase();
        domains.add(domain);
      } catch {
        continue;
      }
    }

    return {
      sourceType,
      sourceName,
      scriptBlockCount: scriptBlocks.length,
      externalCallCount: externalCallSignals.length,
      externalDomains: [...domains].sort((a, b) => a.localeCompare(b)),
    };
  }

  private collectApiEndpoints(
    sourceTexts: Array<{ sourceType: 'WebTemplate' | 'ContentSnippet' | 'WebPage'; sourceName: string; sourceText: string }>,
    siteSettings: PowerPagesSiteSetting[]
  ): PowerPagesApiEndpoint[] {
    const endpointMap = new Map<string, PowerPagesApiEndpoint>();

    for (const item of sourceTexts) {
      for (const url of item.sourceText.match(URL_PATTERN) || []) {
        this.tryAddEndpoint(endpointMap, {
          sourceType: item.sourceType,
          sourceName: item.sourceName,
          url,
        });
      }
    }

    for (const setting of siteSettings) {
      if (!setting.value) {
        continue;
      }
      for (const url of setting.value.match(URL_PATTERN) || []) {
        this.tryAddEndpoint(endpointMap, {
          sourceType: 'SiteSetting',
          sourceName: setting.name,
          url,
        });
      }
    }

    return [...endpointMap.values()].sort((a, b) => {
      if (a.domain !== b.domain) {
        return a.domain.localeCompare(b.domain);
      }
      return a.url.localeCompare(b.url);
    });
  }

  private tryAddEndpoint(
    endpointMap: Map<string, PowerPagesApiEndpoint>,
    source: { sourceType: PowerPagesApiEndpoint['sourceType']; sourceName: string; url: string }
  ): void {
    try {
      const parsedUrl = new URL(source.url);
      const domain = parsedUrl.hostname.toLowerCase();
      const key = `${source.sourceType}|${source.sourceName}|${source.url}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, {
          sourceType: source.sourceType,
          sourceName: source.sourceName,
          url: source.url,
          domain,
        });
      }
    } catch {
      return;
    }
  }

  private collectAuthProviders(siteSettings: PowerPagesSiteSetting[]): PowerPagesAuthProvider[] {
    const providers: PowerPagesAuthProvider[] = [];

    for (const setting of siteSettings) {
      if (!AUTH_SETTING_PATTERN.test(setting.name)) {
        continue;
      }

      const providerHint = this.deriveProviderHint(setting.name);
      providers.push({
        websiteName: setting.websiteName,
        settingName: setting.name,
        providerHint,
        valuePreview: setting.value ? this.toPreview(setting.value) : undefined,
      });
    }

    return providers.sort((a, b) => {
      if ((a.websiteName || '') !== (b.websiteName || '')) {
        return (a.websiteName || '').localeCompare(b.websiteName || '');
      }
      return a.settingName.localeCompare(b.settingName);
    });
  }

  private deriveProviderHint(settingName: string): string {
    const lower = settingName.toLowerCase();
    if (lower.includes('openid') || lower.includes('oauth') || lower.includes('aad')) {
      return 'OpenID/OAuth';
    }
    if (lower.includes('saml') || lower.includes('wsfed')) {
      return 'SAML/WS-Federation';
    }
    if (lower.includes('facebook') || lower.includes('google') || lower.includes('twitter')) {
      return 'Social identity provider';
    }
    if (lower.includes('authentication')) {
      return 'Authentication setting';
    }
    return 'External identity setting';
  }

  private toPreview(value: string): string {
    if (value.length <= 80) {
      return value;
    }
    return `${value.slice(0, 77)}...`;
  }

  private readString(record: Record<string, unknown>, key: string): string | undefined {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return undefined;
  }

  private readBoolean(record: Record<string, unknown>, key: string): boolean {
    const value = record[key];
    return value === true;
  }

  private normaliseGuid(value: string | undefined): string {
    if (!value) {
      return '';
    }
    return value.toLowerCase().replace(/[{}]/g, '');
  }
}
