import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { PowerAppsInventory } from '../core';
import { formatDate } from '../utils/dateFormat';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  summary: {
    color: tokens.colorNeutralForeground3,
  },
  metricsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 1000px)': {
      gridTemplateColumns: '1fr',
    },
  },
  tableWrap: {
    overflowX: 'auto',
  },
  code: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
  },
  list: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalM,
  },
});

export interface PowerAppsListProps {
  powerApps: PowerAppsInventory;
}

export function PowerAppsList({ powerApps }: PowerAppsListProps) {
  const styles = useStyles();
  const totalArtifacts =
    powerApps.modelDrivenApps.length +
    powerApps.views.length +
    powerApps.dashboards.length +
    powerApps.componentLibraries.length +
    powerApps.pcfControls.length +
    powerApps.customPageCount +
    powerApps.entityFormCount;

  return (
    <div className={styles.container}>
      <Text className={styles.summary}>
        {totalArtifacts} Power Apps artefact{totalArtifacts === 1 ? '' : 's'} discovered in selected scope.
      </Text>

      <div className={styles.metricsRow}>
        <Badge appearance="filled" color="informative">Model-Driven Apps: {powerApps.modelDrivenApps.length}</Badge>
        <Badge appearance="filled" color="informative">Component Libraries: {powerApps.componentLibraries.length}</Badge>
        <Badge appearance="filled" color="informative">Custom Pages: {powerApps.customPageCount}</Badge>
        <Badge appearance="filled" color="informative">Forms in Scope: {powerApps.entityFormCount}</Badge>
        <Badge appearance="filled" color="informative">Views: {powerApps.views.length}</Badge>
        <Badge appearance="filled" color="informative">Dashboards: {powerApps.dashboards.length}</Badge>
        <Badge appearance="filled" color="informative">PCF Controls: {powerApps.pcfControls.length}</Badge>
      </div>

      <div className={styles.splitGrid}>
        <Card>
          <Title3>Model-Driven Apps</Title3>
          {powerApps.modelDrivenApps.length === 0 ? (
            <Text className={styles.summary}>No model-driven apps found.</Text>
          ) : (
            <div className={styles.tableWrap}>
              <Table aria-label="Model-driven apps">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Unique Name</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Default</TableHeaderCell>
                    <TableHeaderCell>Modified</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {powerApps.modelDrivenApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell><TableCellLayout>{app.name}</TableCellLayout></TableCell>
                      <TableCell><span className={styles.code}>{app.uniqueName}</span></TableCell>
                      <TableCell>
                        <Badge appearance="tint" color={app.state.toLowerCase() === 'active' ? 'success' : 'warning'}>
                          {app.state}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.isDefault ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{app.modifiedOn ? formatDate(app.modifiedOn) : 'Unknown'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Card>
          <Title3>Libraries and Controls</Title3>
          <ul className={styles.list}>
            <li><Text>{powerApps.componentLibraries.length} component librar{powerApps.componentLibraries.length === 1 ? 'y' : 'ies'} detected from canvas app inventory.</Text></li>
            <li><Text>{powerApps.pcfControls.length} PCF control artefact(s) detected from custom control components.</Text></li>
            <li><Text>{powerApps.customPageCount} custom page component(s) are present in the selected scope.</Text></li>
            <li><Text>{powerApps.entityFormCount} form artefact(s) remain after dashboard forms are separated out.</Text></li>
          </ul>
        </Card>
      </div>

      <div className={styles.splitGrid}>
        <Card>
          <Title3>Views and Dashboards</Title3>
          <div className={styles.metricsRow}>
            <Badge appearance="tint" color="informative">Views: {powerApps.views.length}</Badge>
            <Badge appearance="tint" color="informative">Dashboards: {powerApps.dashboards.length}</Badge>
          </div>

          {powerApps.views.length > 0 && (
            <>
              <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalS, display: 'block' }}>Views</Text>
              <ul className={styles.list}>
                {powerApps.views.slice(0, 15).map((view) => (
                  <li key={view.id}><Text>{view.name} ({view.entityName || 'Unknown'})</Text></li>
                ))}
              </ul>
            </>
          )}

          {powerApps.dashboards.length > 0 && (
            <>
              <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalS, display: 'block' }}>Dashboards</Text>
              <ul className={styles.list}>
                {powerApps.dashboards.slice(0, 15).map((dashboard) => (
                  <li key={dashboard.id}><Text>{dashboard.name} ({dashboard.dashboardType})</Text></li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card>
          <Title3>Component Libraries and PCF</Title3>
          {powerApps.componentLibraries.length > 0 && (
            <>
              <Text weight="semibold" style={{ display: 'block', marginBottom: tokens.spacingVerticalS }}>Component Libraries</Text>
              <div className={styles.tableWrap}>
                <Table aria-label="Power Apps component libraries">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Modified</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {powerApps.componentLibraries.slice(0, 20).map((library) => (
                      <TableRow key={library.id}>
                        <TableCell><TableCellLayout>{library.displayName}</TableCellLayout></TableCell>
                        <TableCell>{library.state || 'Unknown'}</TableCell>
                        <TableCell>{library.modifiedOn ? formatDate(library.modifiedOn) : 'Unknown'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {powerApps.pcfControls.length > 0 && (
            <>
              <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalS, display: 'block' }}>PCF Controls</Text>
              <div className={styles.tableWrap}>
                <Table aria-label="Power Apps PCF controls">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell>Version</TableHeaderCell>
                      <TableHeaderCell>Resources</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {powerApps.pcfControls.slice(0, 20).map((control) => (
                      <TableRow key={control.id}>
                        <TableCell><TableCellLayout>{control.name}</TableCellLayout></TableCell>
                        <TableCell>{control.version || 'Unknown'}</TableCell>
                        <TableCell>{control.resourceCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>
      </div>

      {powerApps.warnings.length > 0 && (
        <Card>
          <Title3>Discovery Warnings</Title3>
          <ul className={styles.list}>
            {powerApps.warnings.map((warning) => (
              <li key={warning}><Text>{warning}</Text></li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
