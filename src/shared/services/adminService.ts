// Service for shared administrator/manager actions
export const adminService = {
  fetchStaffList: async () => {
    return [
      { id: 1, name: 'Nguyễn Văn An', role: 'manager', email: 'an.nv@rethreads.vn' },
      { id: 2, name: 'Trần Thị Bình', role: 'staff', email: 'binh.tt@rethreads.vn' },
    ];
  },
  updateProductStock: async (productId: number, quantity: number) => {
    console.log(`[Admin Service] Updated product ${productId} stock to ${quantity}`);
    return { success: true };
  }
};
export default adminService;
