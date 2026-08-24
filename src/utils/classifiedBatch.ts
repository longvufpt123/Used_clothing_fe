export interface ClassifiedBatchGroupFields {
  garmentGroup: string;
  gender: string;
  targetUser: string;
}

export const getClassifiedBatchGroupLabel = (batch: ClassifiedBatchGroupFields) =>
  batch.targetUser === 'Người lớn'
    ? `${batch.garmentGroup} · Người lớn · ${batch.gender}`
    : `${batch.garmentGroup} · Trẻ em / Em bé`;
