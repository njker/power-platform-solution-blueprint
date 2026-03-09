import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { CanvasApp } from '../types/canvasApp.js';

interface RawCanvasApp {
  canvasappid: string;
  name?: string | null;
  displayname?: string | null;
  canvasapptype?: number | null;
  'canvasapptype@OData.Community.Display.V1.FormattedValue'?: string;
  createdon?: string | null;
  modifiedon?: string | null;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  statecode?: number | null;
  'statecode@OData.Community.Display.V1.FormattedValue'?: string;
}

/**
 * Discovers Canvas Apps for selected solution scope.
 *
 * Phase 1 focuses on app-level inventory metadata. .msapp extraction and
 * screen/control/formula analysis can build on top of this discovery.
 */
export class CanvasAppDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  async getCanvasAppsByIds(canvasAppIds: string[]): Promise<CanvasApp[]> {
    if (canvasAppIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(canvasAppIds.map(id => this.normalizeGuid(id)).filter(Boolean)));
    const batchSize = 20;
    const rows: RawCanvasApp[] = [];

    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const filter = batch.map(id => `canvasappid eq ${id}`).join(' or ');

      const result = await this.client.query<RawCanvasApp>('canvasapps', {
        select: [
          'canvasappid',
          'name',
          'displayname',
          'canvasapptype',
          'createdon',
          'modifiedon',
          'statecode',
          '_ownerid_value',
        ],
        filter,
        orderBy: ['name asc'],
      });

      rows.push(...result.value);
    }

    return this.mapRows(rows);
  }

  async getAllCanvasApps(): Promise<CanvasApp[]> {
    const result = await this.client.query<RawCanvasApp>('canvasapps', {
      select: [
        'canvasappid',
        'name',
        'displayname',
        'canvasapptype',
        'createdon',
        'modifiedon',
        'statecode',
        '_ownerid_value',
      ],
      orderBy: ['name asc'],
    });

    return this.mapRows(result.value);
  }

  private mapRows(rows: RawCanvasApp[]): CanvasApp[] {
    return rows
      .map((row) => ({
        id: row.canvasappid,
        name: row.name || row.displayname || row.canvasappid,
        displayName: row.displayname || row.name || row.canvasappid,
        canvasAppType: row.canvasapptype ?? null,
        canvasAppTypeName: row['canvasapptype@OData.Community.Display.V1.FormattedValue'] || this.toCanvasAppTypeName(row.canvasapptype),
        createdOn: row.createdon || null,
        modifiedOn: row.modifiedon || null,
        ownerName: row['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || null,
        state: row['statecode@OData.Community.Display.V1.FormattedValue'] || this.toStateName(row.statecode),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  private normalizeGuid(value: string): string {
    return String(value).trim().replace(/[{}]/g, '').toLowerCase();
  }

  private toStateName(stateCode: number | null | undefined): string {
    if (stateCode === 0) return 'Active';
    if (stateCode === 1) return 'Inactive';
    return 'Unknown';
  }

  private toCanvasAppTypeName(canvasAppType: number | null | undefined): string {
    if (canvasAppType === 0) return 'Canvas App';
    if (canvasAppType === 1) return 'Component Library';
    if (canvasAppType === 2) return 'Custom Page';
    return 'Unknown';
  }
}
