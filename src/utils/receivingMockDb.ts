export interface MockBatch {
  id: string;
  code: string;
  route: string;
  date: string;
  status: 'Receiving' | 'Completed' | 'Transferring';
}

export interface MockRequest {
  id: string;
  batchId: string;
  code: string;
  donorName: string;
  phoneNumber: string;
  pickupAddress: string;
  category: string;
  weight: string;
  condition: string;
  status: 'Pending' | 'Received' | 'Rescheduled' | 'Canceled';
  date: string;
  actualWeight?: number | null;
  actualCategory?: string;
  actualCondition?: string;
  actualNotes?: string;
  imageUrls?: string[];
}

const DEFAULT_BATCHES: MockBatch[] = [
  { id: 'batch-1', code: 'INTAKE-2026-A', route: 'Tuyến Quận 1 - Quận 3 (Thu gom nội thành)', date: '2026-07-12', status: 'Receiving' },
  { id: 'batch-2', code: 'INTAKE-2026-B', route: 'Tuyến Bình Thạnh - Phú Nhuận (Gom bưu cục)', date: '2026-07-12', status: 'Completed' },
  { id: 'batch-3', code: 'INTAKE-2026-C', route: 'Tuyến Thủ Đức - Quận 9 (Kho tập trung)', date: '2026-07-11', status: 'Transferring' }
];

const DEFAULT_REQUESTS: MockRequest[] = [
  { 
    id: 'req-1', 
    batchId: 'batch-1', 
    code: 'RT-2026-803', 
    donorName: 'Trần Minh Cường', 
    phoneNumber: '0912345678', 
    pickupAddress: '789 Đường CMT8, Quận 3, TP. HCM', 
    category: 'Áo phông / Sơ mi', 
    weight: 'Dưới 5 kg', 
    condition: 'Hỗn hợp (Tốt & Tái chế)', 
    status: 'Pending', 
    date: '2026-07-12', 
    actualWeight: null, 
    actualCategory: '', 
    actualCondition: '', 
    actualNotes: '',
    imageUrls: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80']
  },
  { 
    id: 'req-2', 
    batchId: 'batch-1', 
    code: 'RT-2026-804', 
    donorName: 'Nguyễn Thị Mai', 
    phoneNumber: '0909876543', 
    pickupAddress: '12 Đường Lê Lợi, Quận 1, TP. HCM', 
    category: 'Quần denim / Quần dài', 
    weight: '5-10 kg', 
    condition: 'Còn tốt, giặt sạch', 
    status: 'Pending', 
    date: '2026-07-12', 
    actualWeight: null, 
    actualCategory: '', 
    actualCondition: '', 
    actualNotes: '' 
  },
  { 
    id: 'req-3', 
    batchId: 'batch-2', 
    code: 'RT-2026-805', 
    donorName: 'Lê Văn Tám', 
    phoneNumber: '0911223344', 
    pickupAddress: '45 Điện Biên Phủ, Bình Thạnh, TP. HCM', 
    category: 'Đồ ấm / Áo khoác', 
    weight: '10-20 kg', 
    condition: 'Còn tốt, giặt sạch', 
    status: 'Received', 
    date: '2026-07-12', 
    actualWeight: 12.5, 
    actualCategory: 'Đồ ấm / Áo khoác', 
    actualCondition: 'good', 
    actualNotes: 'Tiếp nhận thành công, đồ còn rất mới và sạch sẽ.',
    imageUrls: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=80']
  },
  { 
    id: 'req-4', 
    batchId: 'batch-2', 
    code: 'RT-2026-806', 
    donorName: 'Hoàng Thị Cúc', 
    phoneNumber: '0977665544', 
    pickupAddress: '238 CMT8, Quận 3, TP. HCM', 
    category: 'Quần áo trẻ em', 
    weight: 'Dưới 5 kg', 
    condition: 'Cũ rách / Cần tái chế', 
    status: 'Received', 
    date: '2026-07-12', 
    actualWeight: 3.8, 
    actualCategory: 'Quần áo trẻ em', 
    actualCondition: 'recycle', 
    actualNotes: 'Kiện hàng chủ yếu vải bông và thun cotton cũ hỏng dùng dệt sợi tái chế.' 
  }
];

export const initMockDb = () => {
  if (!localStorage.getItem('receiving_batches')) {
    localStorage.setItem('receiving_batches', JSON.stringify(DEFAULT_BATCHES));
  }
  if (!localStorage.getItem('receiving_requests')) {
    localStorage.setItem('receiving_requests', JSON.stringify(DEFAULT_REQUESTS));
  }
  if (localStorage.getItem('receiving_shift_active') === null) {
    localStorage.setItem('receiving_shift_active', 'false');
  }
};

export const getBatches = (): MockBatch[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem('receiving_batches') || '[]');
};

export const getRequests = (): MockRequest[] => {
  initMockDb();
  return JSON.parse(localStorage.getItem('receiving_requests') || '[]');
};

export const saveBatches = (batches: MockBatch[]) => {
  localStorage.setItem('receiving_batches', JSON.stringify(batches));
};

export const saveRequests = (requests: MockRequest[]) => {
  localStorage.setItem('receiving_requests', JSON.stringify(requests));
};

export const updateRequestStatus = (
  reqId: string, 
  status: MockRequest['status'], 
  actualData?: Partial<Pick<MockRequest, 'actualWeight' | 'actualCategory' | 'actualCondition' | 'actualNotes' | 'imageUrls'>>
) => {
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === reqId);
  if (index !== -1) {
    requests[index] = {
      ...requests[index],
      status,
      ...actualData
    };
    saveRequests(requests);

    // Auto update batch status to Completed if all requests in it are processed (not Pending)
    const batchId = requests[index].batchId;
    const batchRequests = requests.filter(r => r.batchId === batchId);
    const hasPending = batchRequests.some(r => r.status === 'Pending');

    if (!hasPending) {
      const batches = getBatches();
      const bIndex = batches.findIndex(b => b.id === batchId);
      if (bIndex !== -1 && batches[bIndex].status === 'Receiving') {
        batches[bIndex].status = 'Completed';
        saveBatches(batches);
      }
    }
  }
};

export const getShiftActive = (): boolean => {
  initMockDb();
  return localStorage.getItem('receiving_shift_active') === 'true';
};

export const setShiftActive = (active: boolean) => {
  localStorage.setItem('receiving_shift_active', active ? 'true' : 'false');
  
  if (active) {
    // Optionally set all batches with status Receiving to start if they are pending (simulated)
    // For our mockup, the shift activation sets the active indicator.
  }
};
