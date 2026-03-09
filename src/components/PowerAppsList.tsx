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
    powerApps.customPageCount +
    powerApps.entityFormCount +
    powerApps.dashboardCount +
    powerApps.viewCount;

  return (
    <div className={styles.container}>
      <Text className={styles.summary}>
        {totalArtifacts} Power Apps artefact{totalArtifacts === 1 ? '' : 's'} discovered in selected scope.
      </Text>

      <div className={styles.metricsRow}>
        <Badge appearance="filled" color="informative">Model-Driven Apps: {powerApps.modelDrivenApps.length}</Badge>
        <Badge appearance="filled" color="informative">Custom Pages: {powerApps.customPageCount}</Badge>
        <Badge appearance="filled" color="informative">Forms in Scope: {powerApps.entityFormCount}</Badge>
        <Badge appearance="filled" color="informative">Views: {powerApps.viewCount}</Badge>
        <Badge appearance="filled" color="informative">Dashboards: {powerApps.dashboardCount}</Badge>
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
          <Title3>Scope Signals</Title3>
          <ul className={styles.list}>
            <li><Text>{powerApps.entityFormCount} form artefact(s) already discovered in the current solution scope.</Text></li>
            <li><Text>{powerApps.customPageCount} custom page component(s) are present and can be folded into deeper Power Apps analysis.</Text></li>
            <li><Text>{powerApps.viewCount} view artefact(s) detected via the Power Apps stream in this phase.</Text></li>
            <li><Text>{powerApps.dashboardCount} dashboard artefact(s) detected via the Power Apps stream in this phase.</Text></li>
          </ul>
          <Text className={styles.summary}>
            Phase 1 focuses on model-driven app inventory. Views, dashboards, component libraries, and PCF controls are left for later slices.
          </Text>
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
