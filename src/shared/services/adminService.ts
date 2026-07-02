// Service for shared administrator/manager actions
export const adminService = {
  fetchStaffList: async () => {
    return [
      { id: 1, name: 'John Doe', role: 'manager', email: 'john@rewear.com' },
      { id: 2, name: 'Jane Smith', role: 'staff', email: 'jane@rewear.com' },
    ];
  },
  updateProductStock: async (productId: number, quantity: number) => {
    console.log(`[Admin Service] Updated product ${productId} stock to ${quantity}`);
    return { success: true };
  }
};
export default adminService;
