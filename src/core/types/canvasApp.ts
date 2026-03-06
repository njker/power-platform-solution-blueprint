/**
 * Canvas App inventory record for solution/publisher scope.
 */
export interface CanvasApp {
  id: string;
  name: string;
  displayName: string;
  createdOn: string | null;
  modifiedOn: string | null;
  ownerName: string | null;
  state: string | null;
}
