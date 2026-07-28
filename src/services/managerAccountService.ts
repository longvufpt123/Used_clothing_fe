import { apiClient } from './api';

export interface ManagerRoleOption { id: string; name: string; }
export interface ManagerAccount {
  id: string; fullName: string; userName: string; email: string; phoneNumber: string;
  role: string; warehouseId: string | null; warehouseName: string | null;
  address: string; userStatus: string; avatarUrl: string | null; createdAt: string;
}
export interface ManagerAccountPage {
  items: ManagerAccount[]; totalCount: number; page: number; pageSize: number; roles: ManagerRoleOption[];
}
export interface SaveManagerAccount {
  fullName: string; userName: string; email: string; phoneNumber: string; password: string;
  roleId: string; warehouseId: string | null; address: string; userStatus: string; newPassword?: string;
}
export const managerAccountService = {
  search: (filter: { warehouseId: string; role: string; search: string; page: number; pageSize: number }) => {
    const params = new URLSearchParams();
    if (filter.warehouseId) params.set('warehouseId', filter.warehouseId);
    if (filter.role) params.set('role', filter.role);
    if (filter.search) params.set('search', filter.search);
    params.set('page', String(filter.page)); params.set('pageSize', String(filter.pageSize));
    return apiClient.get<unknown, ManagerAccountPage>(`/manager-accounts?${params}`);
  },
  create: (payload: SaveManagerAccount) => apiClient.post('/manager-accounts', payload),
  update: (id: string, payload: SaveManagerAccount) => apiClient.put(`/manager-accounts/${id}`, payload),
  setLocked: (id: string, locked: boolean) => apiClient.patch(`/manager-accounts/${id}/lock`, { locked }),
  remove: (id: string) => apiClient.delete(`/manager-accounts/${id}`),
};
