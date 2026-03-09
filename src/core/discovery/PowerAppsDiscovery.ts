import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type {
  ModelDrivenApp,
  PcfControl,
  PowerAppDashboard,
  PowerAppView,
} from '../types/powerApp.js';

interface RawAppModule {
  appmoduleid: string;
  name?: string | null;
  uniquename?: string | null;
  description?: string | null;
  createdon?: string | null;
  modifiedon?: string | null;
  isdefault?: boolean | null;
  statecode?: number | null;
  'statecode@OData.Community.Display.V1.FormattedValue'?: string;
}

interface RawSavedQuery {
  savedqueryid: string;
  name?: string | null;
  returnedtypecode?: string | null;
  querytype?: number | null;
  'querytype@OData.Community.Display.V1.FormattedValue'?: string;
  modifiedon?: string | null;
}

interface RawDashboard {
  formid: string;
  name?: string | null;
  type?: number | null;
  modifiedon?: string | null;
}

interface RawCustomControl {
  customcontrolid: string;
  name?: string | null;
  version?: string | null;
  manifest?: string | null;
  modifiedon?: string | null;
}

interface RawCustomControlResource {
  customcontrolresourceid: string;
  _customcontrolid_value?: string | null;
}

export class PowerAppsDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  async getModelDrivenAppsByIds(appModuleIds: string[]): Promise<ModelDrivenApp[]> {
    if (appModuleIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(appModuleIds.map((id) => this.normalizeGuid(id)).filter(Boolean)));
    const batchSize = 20;
    const rows: RawAppModule[] = [];

    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const filter = batch.map((id) => `appmoduleid eq ${id}`).join(' or ');

      const result = await this.client.query<RawAppModule>('appmodules', {
        select: [
          'appmoduleid',
          'name',
          'uniquename',
          'description',
          'createdon',
          'modifiedon',
          'isdefault',
          'statecode',
        ],
        filter,
        orderBy: ['name asc'],
      });

      rows.push(...result.value);
    }

    return this.mapRows(rows);
  }

  async getAllModelDrivenApps(): Promise<ModelDrivenApp[]> {
    const result = await this.client.query<RawAppModule>('appmodules', {
      select: [
        'appmoduleid',
        'name',
        'uniquename',
        'description',
        'createdon',
        'modifiedon',
        'isdefault',
        'statecode',
      ],
      orderBy: ['name asc'],
    });

    return this.mapRows(result.value);
  }

  async getViewsByIds(savedQueryIds: string[]): Promise<PowerAppView[]> {
    if (savedQueryIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(savedQueryIds.map((id) => this.normalizeGuid(id)).filter(Boolean)));
    const batchSize = 20;
    const rows: RawSavedQuery[] = [];

    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const filter = batch.map((id) => `savedqueryid eq ${id}`).join(' or ');

      const result = await this.client.query<RawSavedQuery>('savedqueries', {
        select: ['savedqueryid', 'name', 'returnedtypecode', 'querytype', 'modifiedon'],
        filter,
        orderBy: ['name asc'],
      });

      rows.push(...result.value);
    }

    return this.mapViews(rows);
  }

  async getDashboardsByFormIds(formIds: string[]): Promise<PowerAppDashboard[]> {
    if (formIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(formIds.map((id) => this.normalizeGuid(id)).filter(Boolean)));
    const batchSize = 20;
    const rows: RawDashboard[] = [];

    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const filter = batch.map((id) => `formid eq ${id}`).join(' or ');

      const result = await this.client.query<RawDashboard>('systemforms', {
        select: ['formid', 'name', 'type', 'modifiedon'],
        filter: `(${filter}) and (type eq 0 or type eq 10 or type eq 13)`,
        orderBy: ['name asc'],
      });

      rows.push(...result.value);
    }

    return this.mapDashboards(rows);
  }

  async getCustomControlsByIds(customControlIds: string[]): Promise<PcfControl[]> {
    if (customControlIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(customControlIds.map((id) => this.normalizeGuid(id)).filter(Boolean)));
    const batchSize = 20;
    const rows: RawCustomControl[] = [];

    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const filter = batch.map((id) => `customcontrolid eq ${id}`).join(' or ');

      const result = await this.client.query<RawCustomControl>('customcontrols', {
        select: ['customcontrolid', 'name', 'version', 'manifest', 'modifiedon'],
        filter,
        orderBy: ['name asc'],
      });

      rows.push(...result.value);
    }

    const resourceCountByControl = await this.getControlResourceCounts(uniqueIds);
    return this.mapCustomControls(rows, resourceCountByControl);
  }

  async getAllCustomControls(): Promise<PcfControl[]> {
    const result = await this.client.query<RawCustomControl>('customcontrols', {
      select: ['customcontrolid', 'name', 'version', 'manifest', 'modifiedon'],
      orderBy: ['name asc'],
    });

    const controlIds = result.value.map((row) => this.normalizeGuid(row.customcontrolid));
    const resourceCountByControl = await this.getControlResourceCounts(controlIds);
    return this.mapCustomControls(result.value, resourceCountByControl);
  }

  private mapRows(rows: RawAppModule[]): ModelDrivenApp[] {
    return rows
      .map((row) => ({
        id: row.appmoduleid,
        name: row.name || row.uniquename || row.appmoduleid,
        uniqueName: row.uniquename || row.name || row.appmoduleid,
        description: row.description || null,
        createdOn: row.createdon || null,
        modifiedOn: row.modifiedon || null,
        state: row['statecode@OData.Community.Display.V1.FormattedValue'] || this.toStateName(row.statecode),
        isDefault: row.isdefault === true,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private mapViews(rows: RawSavedQuery[]): PowerAppView[] {
    return rows
      .map((row) => ({
        id: row.savedqueryid,
        name: row.name || row.savedqueryid,
        entityName: row.returnedtypecode || null,
        queryType: row['querytype@OData.Community.Display.V1.FormattedValue'] || this.toQueryTypeName(row.querytype),
        modifiedOn: row.modifiedon || null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private mapDashboards(rows: RawDashboard[]): PowerAppDashboard[] {
    return rows
      .map((row) => ({
        id: row.formid,
        name: row.name || row.formid,
        dashboardType: this.toDashboardTypeName(row.type),
        modifiedOn: row.modifiedon || null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private mapCustomControls(
    rows: RawCustomControl[],
    resourceCountByControl: Map<string, number>
  ): PcfControl[] {
    return rows
      .map((row) => {
        const id = this.normalizeGuid(row.customcontrolid);
        const manifest = row.manifest || null;
        return {
          id: row.customcontrolid,
          name: row.name || row.customcontrolid,
          version: row.version || null,
          manifestPreview: manifest ? manifest.slice(0, 160) : null,
          resourceCount: resourceCountByControl.get(id) || 0,
          modifiedOn: row.modifiedon || null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private async getControlResourceCounts(controlIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (controlIds.length === 0) {
      return counts;
    }

    const batchSize = 20;
    for (let i = 0; i < controlIds.length; i += batchSize) {
      const batch = controlIds.slice(i, i + batchSize);
      const filter = batch.map((id) => `_customcontrolid_value eq ${id}`).join(' or ');

      const result = await this.client.query<RawCustomControlResource>('customcontrolresources', {
        select: ['customcontrolresourceid', '_customcontrolid_value'],
        filter,
      });

      for (const row of result.value) {
        const controlId = this.normalizeGuid(row._customcontrolid_value || '');
        if (!controlId) {
          continue;
        }
        counts.set(controlId, (counts.get(controlId) || 0) + 1);
      }
    }

    return counts;
  }

  private normalizeGuid(value: string): string {
    return String(value).trim().replace(/[{}]/g, '').toLowerCase();
  }

  private toStateName(stateCode: number | null | undefined): string {
    if (stateCode === 0) return 'Active';
    if (stateCode === 1) return 'Inactive';
    return 'Unknown';
  }

  private toQueryTypeName(queryType: number | null | undefined): string {
    if (queryType === 0) return 'Public';
    if (queryType === 4) return 'Associated';
    if (queryType === 64) return 'Lookup';
    return 'Unknown';
  }

  private toDashboardTypeName(type: number | null | undefined): string {
    if (type === 0) return 'Dashboard';
    if (type === 10) return 'Interactive Dashboard';
    if (type === 13) return 'Power BI Dashboard';
    return 'Unknown';
  }
}
