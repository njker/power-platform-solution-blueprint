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
import type { PowerPagesInventory } from '../core';
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
    gridTemplateColumns: '1fr 1fr',
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

export interface PowerPagesListProps {
  powerPages: PowerPagesInventory;
}

export function PowerPagesList({ powerPages }: PowerPagesListProps) {
  const styles = useStyles();

  const totalArtifacts =
    powerPages.websites.length +
    powerPages.pages.length +
    powerPages.webTemplates.length +
    powerPages.contentSnippets.length +
    powerPages.entityForms.length +
    powerPages.entityLists.length +
    powerPages.webForms.length +
    powerPages.webFormSteps.length +
    powerPages.webRoles.length +
    powerPages.tablePermissions.length +
    powerPages.pageAccessRules.length;

  return (
    <div className={styles.container}>
      <Text className={styles.summary}>
        {totalArtifacts} Power Pages artefact{totalArtifacts === 1 ? '' : 's'} discovered in selected scope.
      </Text>

      <div className={styles.metricsRow}>
        <Badge appearance="filled" color="informative">Websites: {powerPages.websites.length}</Badge>
        <Badge appearance="filled" color="informative">Pages: {powerPages.pages.length}</Badge>
        <Badge appearance="filled" color="informative">Templates: {powerPages.webTemplates.length}</Badge>
        <Badge appearance="filled" color="informative">Snippets: {powerPages.contentSnippets.length}</Badge>
        <Badge appearance="filled" color="warning">Table Permissions: {powerPages.tablePermissions.length}</Badge>
        <Badge appearance="filled" color="warning">Auth Providers: {powerPages.authProviders.length}</Badge>
        <Badge appearance="filled" color="warning">API Endpoints: {powerPages.apiEndpoints.length}</Badge>
      </div>

      <div className={styles.splitGrid}>
        <Card>
          <Title3>Page Inventory</Title3>
          {powerPages.pages.length === 0 ? (
            <Text className={styles.summary}>No pages found.</Text>
          ) : (
            <div className={styles.tableWrap}>
              <Table aria-label="Power Pages page inventory">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Page</TableHeaderCell>
                    <TableHeaderCell>Website</TableHeaderCell>
                    <TableHeaderCell>URL</TableHeaderCell>
                    <TableHeaderCell>Template</TableHeaderCell>
                    <TableHeaderCell>Modified</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {powerPages.pages.slice(0, 80).map((page) => (
                    <TableRow key={page.id}>
                      <TableCell><TableCellLayout>{page.name}</TableCellLayout></TableCell>
                      <TableCell>{page.websiteName || 'Unknown'}</TableCell>
                      <TableCell><span className={styles.code}>{page.partialUrl || '/'}</span></TableCell>
                      <TableCell>{page.pageTemplateName || page.webTemplateName || 'Unknown'}</TableCell>
                      <TableCell>{page.modifiedOn ? formatDate(page.modifiedOn) : 'Unknown'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Card>
          <Title3>Portal Components</Title3>
          <div className={styles.metricsRow}>
            <Badge appearance="tint" color="informative">Entity Forms: {powerPages.entityForms.length}</Badge>
            <Badge appearance="tint" color="informative">Entity Lists: {powerPages.entityLists.length}</Badge>
            <Badge appearance="tint" color="informative">Web Forms: {powerPages.webForms.length}</Badge>
            <Badge appearance="tint" color="informative">Web Form Steps: {powerPages.webFormSteps.length}</Badge>
            <Badge appearance="tint" color="informative">Content Snippets: {powerPages.contentSnippets.length}</Badge>
          </div>

          {powerPages.entityForms.length > 0 && (
            <>
              <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalS }}>Entity Forms</Text>
              <ul className={styles.list}>
                {powerPages.entityForms.slice(0, 12).map((item) => (
                  <li key={item.id}><Text>{item.name} ({item.entityName || 'Unknown'})</Text></li>
                ))}
              </ul>
            </>
          )}

          {powerPages.entityLists.length > 0 && (
            <>
              <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalS }}>Entity Lists</Text>
              <ul className={styles.list}>
                {powerPages.entityLists.slice(0, 12).map((item) => (
                  <li key={item.id}><Text>{item.name} ({item.entityName || 'Unknown'})</Text></li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className={styles.splitGrid}>
        <Card>
          <Title3>Security and Permissions</Title3>
          {powerPages.webRoles.length === 0 && powerPages.tablePermissions.length === 0 && powerPages.pageAccessRules.length === 0 ? (
            <Text className={styles.summary}>No Power Pages security artefacts found.</Text>
          ) : (
            <>
              <div className={styles.metricsRow}>
                <Badge appearance="tint" color="warning">Web Roles: {powerPages.webRoles.length}</Badge>
                <Badge appearance="tint" color="warning">Table Permissions: {powerPages.tablePermissions.length}</Badge>
                <Badge appearance="tint" color="warning">Page Access Rules: {powerPages.pageAccessRules.length}</Badge>
              </div>

              <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalS, display: 'block' }}>
                Table Permissions
              </Text>
              <div className={styles.tableWrap}>
                <Table aria-label="Power Pages table permissions">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell>Table</TableHeaderCell>
                      <TableHeaderCell>Scope</TableHeaderCell>
                      <TableHeaderCell>Rights</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {powerPages.tablePermissions.slice(0, 40).map((permission) => {
                      const rights = [
                        permission.canRead ? 'R' : '',
                        permission.canWrite ? 'W' : '',
                        permission.canCreate ? 'C' : '',
                        permission.canDelete ? 'D' : '',
                        permission.canAppend ? 'A' : '',
                        permission.canAppendTo ? 'AT' : '',
                      ].filter(Boolean).join(', ');

                      return (
                        <TableRow key={permission.id}>
                          <TableCell><TableCellLayout>{permission.name}</TableCellLayout></TableCell>
                          <TableCell><span className={styles.code}>{permission.entityName || 'Unknown'}</span></TableCell>
                          <TableCell>{permission.scope || 'Unknown'}</TableCell>
                          <TableCell>{rights || 'None'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>

        <Card>
          <Title3>Templates and Script Analysis</Title3>
          <div className={styles.metricsRow}>
            <Badge appearance="tint" color="informative">Liquid Analysed: {powerPages.liquidAnalyses.length}</Badge>
            <Badge appearance="tint" color="informative">JavaScript Analysed: {powerPages.javaScriptAnalyses.length}</Badge>
          </div>

          {powerPages.liquidAnalyses.length > 0 && (
            <>
              <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalS, display: 'block' }}>
                Top Liquid Complexity
              </Text>
              <div className={styles.tableWrap}>
                <Table aria-label="Power Pages liquid complexity">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Source</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Complexity</TableHeaderCell>
                      <TableHeaderCell>Score</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {powerPages.liquidAnalyses.slice(0, 25).map((analysis) => (
                      <TableRow key={`${analysis.sourceType}-${analysis.sourceName}`}>
                        <TableCell>{analysis.sourceName}</TableCell>
                        <TableCell>{analysis.sourceType}</TableCell>
                        <TableCell>
                          <Badge
                            appearance="tint"
                            color={
                              analysis.complexityBand === 'High'
                                ? 'danger'
                                : analysis.complexityBand === 'Medium'
                                  ? 'warning'
                                  : 'success'
                            }
                          >
                            {analysis.complexityBand}
                          </Badge>
                        </TableCell>
                        <TableCell>{analysis.complexityScore}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {powerPages.javaScriptAnalyses.length > 0 && (
            <>
              <Text weight="semibold" style={{ marginTop: tokens.spacingVerticalS, display: 'block' }}>
                JavaScript External Call Signals
              </Text>
              <ul className={styles.list}>
                {powerPages.javaScriptAnalyses.slice(0, 20).map((analysis) => (
                  <li key={`${analysis.sourceType}-${analysis.sourceName}`}>
                    <Text>
                      {analysis.sourceName}: {analysis.externalCallCount} call signal(s), {analysis.externalDomains.length} external domain(s)
                    </Text>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <Card>
        <Title3>Integration Points</Title3>
        {powerPages.authProviders.length === 0 && powerPages.apiEndpoints.length === 0 ? (
          <Text className={styles.summary}>No authentication or API integration hints were detected.</Text>
        ) : (
          <div className={styles.splitGrid}>
            <div>
              <Text weight="semibold">Authentication Provider Hints</Text>
              {powerPages.authProviders.length === 0 ? (
                <Text className={styles.summary}>No authentication settings detected.</Text>
              ) : (
                <ul className={styles.list}>
                  {powerPages.authProviders.slice(0, 40).map((provider, index) => (
                    <li key={`${provider.settingName}-${index}`}>
                      <Text>{provider.websiteName || 'Global'}: {provider.providerHint} ({provider.settingName})</Text>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <Text weight="semibold">External API Endpoints</Text>
              {powerPages.apiEndpoints.length === 0 ? (
                <Text className={styles.summary}>No external API endpoints detected.</Text>
              ) : (
                <ul className={styles.list}>
                  {powerPages.apiEndpoints.slice(0, 40).map((endpoint, index) => (
                    <li key={`${endpoint.url}-${index}`}>
                      <Text>{endpoint.domain} ({endpoint.sourceType}: {endpoint.sourceName})</Text>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Card>

      {powerPages.warnings.length > 0 && (
        <Card>
          <Title3>Discovery Warnings</Title3>
          <ul className={styles.list}>
            {powerPages.warnings.slice(0, 20).map((warning) => (
              <li key={warning}><Text>{warning}</Text></li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
