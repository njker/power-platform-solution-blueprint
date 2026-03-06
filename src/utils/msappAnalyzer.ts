import JSZip from 'jszip';

export interface MsAppControlSummary {
  controlType: string;
  count: number;
}

export interface MsAppAnalysisResult {
  fileCount: number;
  totalCompressedBytes: number;
  screenNames: string[];
  navigationTargets: string[];
  controlTypes: MsAppControlSummary[];
  dataSourceHints: string[];
  warnings: string[];
}

const TEXT_FILE_PATTERN = /\.(json|txt|yaml|yml|fx|md)$/i;
const SCREEN_FILE_PATTERN = /(^|\/)(screen|screens)[^/]*\.(json|yaml|yml|fx)$/i;
const NAVIGATE_PATTERN = /Navigate\(\s*([A-Za-z0-9_]+)/g;
const DATASOURCE_HINT_PATTERN = /\b(dataverse|sharepoint|sql|office365|salesforce|oracle|mysql|postgres|azureblob|onedrive|servicenow|customconnector)\b/gi;
const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;

export async function analyzeMsAppFile(file: File): Promise<MsAppAnalysisResult> {
  const zip = await JSZip.loadAsync(file);

  const screenNames = new Set<string>();
  const navigationTargets = new Set<string>();
  const dataSourceHints = new Set<string>();
  const controlCountMap = new Map<string, number>();
  const warnings: string[] = [];

  let fileCount = 0;
  let totalCompressedBytes = 0;

  const entries = Object.values(zip.files).filter(entry => !entry.dir);

  for (const entry of entries) {
    fileCount += 1;
    const internalData = (entry as unknown as { _data?: { compressedSize?: number } })._data;
    totalCompressedBytes += internalData?.compressedSize || 0;

    const normalisedPath = entry.name.replace(/\\/g, '/');

    if (SCREEN_FILE_PATTERN.test(normalisedPath)) {
      const screenName = normalisedPath.split('/').pop()?.replace(/\.(json|yaml|yml|fx)$/i, '') || normalisedPath;
      screenNames.add(screenName);
    }

    if (!TEXT_FILE_PATTERN.test(normalisedPath)) {
      continue;
    }

    let text = '';
    try {
      text = await entry.async('string');
    } catch {
      warnings.push(`Could not read ${normalisedPath}`);
      continue;
    }

    scanTextForNavigation(text, navigationTargets);
    scanTextForDataSources(text, dataSourceHints);
    scanTextForUrls(text, dataSourceHints);

    if (/\.json$/i.test(normalisedPath)) {
      try {
        const parsed = JSON.parse(text);
        scanObjectForControls(parsed, controlCountMap);
      } catch {
        // Not all .msapp JSON files are strict JSON; skip parse errors.
      }
    }
  }

  const controlTypes = [...controlCountMap.entries()]
    .map(([controlType, count]) => ({ controlType, count }))
    .sort((a, b) => b.count - a.count || a.controlType.localeCompare(b.controlType));

  return {
    fileCount,
    totalCompressedBytes,
    screenNames: [...screenNames].sort((a, b) => a.localeCompare(b)),
    navigationTargets: [...navigationTargets].sort((a, b) => a.localeCompare(b)),
    controlTypes,
    dataSourceHints: [...dataSourceHints].sort((a, b) => a.localeCompare(b)),
    warnings,
  };
}

function scanTextForNavigation(text: string, targets: Set<string>): void {
  let match: RegExpExecArray | null;
  while ((match = NAVIGATE_PATTERN.exec(text)) !== null) {
    if (match[1]) {
      targets.add(match[1]);
    }
  }
}

function scanTextForDataSources(text: string, hints: Set<string>): void {
  let match: RegExpExecArray | null;
  while ((match = DATASOURCE_HINT_PATTERN.exec(text)) !== null) {
    if (match[1]) {
      hints.add(match[1].toLowerCase());
    }
  }
}

function scanTextForUrls(text: string, hints: Set<string>): void {
  const urls = text.match(URL_PATTERN) || [];
  for (const url of urls) {
    try {
      hints.add(new URL(url).hostname.toLowerCase());
    } catch {
      // Ignore invalid URLs.
    }
  }
}

function scanObjectForControls(value: unknown, controlCountMap: Map<string, number>): void {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      scanObjectForControls(item, controlCountMap);
    }
    return;
  }

  const record = value as Record<string, unknown>;
  const controlType =
    asString(record.controlType) ||
    asString(record.ControlType) ||
    asString(record.type) ||
    asString(record.Type);

  if (controlType && looksLikeControlType(controlType)) {
    controlCountMap.set(controlType, (controlCountMap.get(controlType) || 0) + 1);
  }

  for (const child of Object.values(record)) {
    scanObjectForControls(child, controlCountMap);
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function looksLikeControlType(value: string): boolean {
  const lower = value.toLowerCase();
  if (lower.length < 3 || lower.length > 60) {
    return false;
  }

  return /(control|button|label|gallery|screen|form|icon|textinput|dropdown|combobox|container|timer|media|chart|map)/i.test(value);
}
