import api from './api';
export interface ReceivingLimits { maxRequests: number; maxWeightKg: number }
export interface TeamLoad extends ReceivingLimits {
  id: string; teamName: string; warehouseId: string; shiftId: string; shiftName: string;
  shiftDate: string; startTime: string; endTime: string; status: string; teamType: string;
  assignedRequests: number; estimatedWeightKg: number; actualWeightKg: number; usesWarehouseDefaults: boolean;
}
export interface CapacityBoard { warehouses: (ReceivingLimits & { id: string; name: string })[]; teams: TeamLoad[] }
export interface PlanPreview {
  shiftId: string; teams: TeamLoad[];
  assignments: { requestId: string; code: string; address: string; estimateWeight: number; teamId: string; eligibleTeamIds: string[] }[];
  unassigned: { requestId: string; code: string; estimateWeight: number; reason: string }[];
}
export const receivingCapacity = {
  board: (warehouseId?: string, date?: string) => api.get<unknown, CapacityBoard>('/receiving-operations/capacity', { params: { warehouseId: warehouseId || undefined, date: date || undefined } }),
  warehouse: (id: string, data: ReceivingLimits) => api.put(`/receiving-operations/warehouses/${id}/receiving-limits`, data),
  team: (id: string, data: ReceivingLimits) => api.put(`/receiving-operations/teams/${id}/receiving-limits`, data),
  reset: (id: string) => api.delete(`/receiving-operations/teams/${id}/receiving-limits`),
  preview: (shiftId: string) => api.get<unknown, PlanPreview>(`/receiving-operations/plan-preview/${shiftId}`),
  apply: (plan: PlanPreview) => api.post('/receiving-operations/apply-plan', { shiftId: plan.shiftId, assignments: plan.assignments.map(({ requestId, teamId }) => ({ requestId, teamId })) }),
};
export const projectedLoads = (plan: PlanPreview) => plan.teams.map(team => {
  const added = plan.assignments.filter(a => a.teamId === team.id);
  return { ...team, assignedRequests: team.assignedRequests + added.length, estimatedWeightKg: team.estimatedWeightKg + added.reduce((sum, a) => sum + a.estimateWeight, 0) };
});
