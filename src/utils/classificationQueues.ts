export const PENDING_CLASSIFICATION_STATUSES = new Set([
  'PendingConfirmation', 'AssignedToClassification', 'AwaitingClassificationCount',
  'ReadyForClassification', 'Classifying',
]);
export const CLASSIFIED_INTAKE_STATUSES = new Set(['Classified', 'InClassifiedArea']);
export const isOpenClassifiedGroup = (batch: { status: string }) =>
  ['ReadyForPlacement', 'PlacedInClassifiedArea', 'Open'].includes(batch.status);
export const isPendingWarehouseGroup = (batch: { status: string }) => batch.status === 'PendingWarehouseReceipt';
export const isSentWarehouseGroup = (batch: { status: string }) => ['WarehouseReceived', 'Stored'].includes(batch.status);
export const classificationDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
