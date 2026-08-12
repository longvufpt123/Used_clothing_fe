const directionLabels: Record<string, string> = {
  Charity: 'Từ thiện',
  Recycling: 'Tái chế',
  Disposal: 'Tiêu hủy',
};

const directionClasses: Record<string, string> = {
  Charity: 'charity',
  Recycling: 'recycling',
  Disposal: 'disposal',
};

export const getProcessingDirectionLabel = (direction: string) =>
  directionLabels[direction] ?? direction;

export const getProcessingDirectionClass = (direction: string) =>
  directionClasses[direction] ?? 'unknown';
