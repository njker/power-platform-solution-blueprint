import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { ModelDrivenApp } from '../types/powerApp.js';

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

  private normalizeGuid(value: string): string {
    return String(value).trim().replace(/[{}]/g, '').toLowerCase();
  }

  private toStateName(stateCode: number | null | undefined): string {
    if (stateCode === 0) return 'Active';
    if (stateCode === 1) return 'Inactive';
    return 'Unknown';
  }
}
