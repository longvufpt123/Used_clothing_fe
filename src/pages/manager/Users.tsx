import { useEffect, useMemo, useState } from 'react';
import { Edit3, Lock, Mail, Phone, Search, Trash2, Unlock, UserPlus, UsersRound, Warehouse } from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { useToast } from '@/context/ToastContext';
import { receivingService, type ManagerWarehouseOption } from '@/services/receivingService';
import { managerAccountService, type ManagerAccount, type ManagerRoleOption, type SaveManagerAccount } from '@/services/managerAccountService';
import '@/shared/pages/Users.css';
import './Users.css';

const roleLabels: Record<string, string> = {
  Donor: 'Donor',
  CharityOrganization: 'Tổ chức từ thiện',
  RecyclingOrganization: 'Tổ chức tái chế',
  ReceivingStaff: 'Nhân viên tiếp nhận',
  ClassificationStaff: 'Nhân viên phân loại',
  WarehouseStaff: 'Nhân viên kho',
};
const warehouseRoles = ['ReceivingStaff', 'ClassificationStaff', 'WarehouseStaff'];
const emptyForm: SaveManagerAccount = {
  fullName: '', userName: '', email: '', phoneNumber: '', password: '',
  roleId: '', warehouseId: null, address: '', userStatus: 'Active', newPassword: '',
};

export default function ManagerUsers() {
  const toast = useToast();
  const [users, setUsers] = useState<ManagerAccount[]>([]);
  const [roles, setRoles] = useState<ManagerRoleOption[]>([]);
  const [warehouses, setWarehouses] = useState<ManagerWarehouseOption[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ManagerAccount | null | 'create'>(null);
  const [form, setForm] = useState<SaveManagerAccount>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ManagerAccount | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const result = await managerAccountService.search({ warehouseId, role, search: debouncedSearch, page, pageSize });
      setUsers(result.items); setTotal(result.totalCount); setRoles(result.roles);
    } catch { toast.error('Không thể tải danh sách tài khoản.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [warehouseId, role, debouncedSearch, page, pageSize]);
  useEffect(() => {
    receivingService.getManagerSetup().then(data => setWarehouses(data.warehouses))
      .catch(() => setWarehouses([]));
  }, []);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const selectedRole = roles.find(x => x.id === form.roleId)?.name ?? '';
  const needsWarehouse = warehouseRoles.includes(selectedRole);
  const rangeStart = total ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, total);

  const openCreate = () => {
    setForm({ ...emptyForm, roleId: roles[0]?.id ?? '' });
    setEditing('create');
  };
  const openEdit = (user: ManagerAccount) => {
    setForm({
      fullName: user.fullName, userName: user.userName, email: user.email,
      phoneNumber: user.phoneNumber, password: '', roleId: roles.find(x => x.name === user.role)?.id ?? '',
      warehouseId: user.warehouseId, address: user.address, userStatus: user.userStatus,
      newPassword: '',
    });
    setEditing(user);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (![form.fullName, form.userName, form.email, form.phoneNumber, form.roleId, form.address].every(value => value?.trim())) {
      toast.error('Vui lòng nhập đầy đủ tất cả trường bắt buộc.'); return;
    }
    if (editing === 'create' && !form.password?.trim()) { toast.error('Vui lòng nhập mật khẩu ban đầu.'); return; }
    if (needsWarehouse && !form.warehouseId) { toast.error('Vui lòng chọn kho làm việc.'); return; }
    setSaving(true);
    try {
      if (editing === 'create') await managerAccountService.create(form);
      else if (editing) await managerAccountService.update(editing.id, form);
      toast.success(editing === 'create' ? 'Đã tạo tài khoản mới.' : 'Đã cập nhật tài khoản.');
      setEditing(null); await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Không thể lưu tài khoản.');
    } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!deleting) return;
    try {
      await managerAccountService.remove(deleting.id);
      toast.success(`Đã xóa tài khoản ${deleting.fullName}.`);
      setDeleting(null);
      if (users.length === 1 && page > 1) setPage(page - 1); else await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Không thể xóa tài khoản.');
    }
  };
  const toggleLock = async (user: ManagerAccount) => {
    const locked = user.userStatus === 'Active';
    try {
      await managerAccountService.setLocked(user.id, locked);
      toast.success(locked ? `Đã khóa tài khoản ${user.fullName}.` : `Đã mở khóa tài khoản ${user.fullName}.`);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Không thể thay đổi trạng thái tài khoản.');
    }
  };

  const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(-2).map(x => x[0]).join('').toUpperCase();
  const pageNumbers = useMemo(() => Array.from({ length: pages }, (_, index) => index + 1)
    .filter(value => value === 1 || value === pages || Math.abs(value - page) <= 1), [pages, page]);

  return (
    <AdminLayout role="manager">
      <div className="manager-accounts-page">
        <header className="manager-accounts-header">
          <div><span>QUẢN LÝ NHÂN SỰ</span><h1>Quản lý tài khoản</h1><p>Tạo và quản lý tài khoản cho các bộ phận vận hành.</p></div>
          <button type="button" onClick={openCreate}><UserPlus size={18} /> Thêm tài khoản</button>
        </header>

        <section className="manager-account-filters">
          <div className="account-search"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc số điện thoại..." /></div>
          <div><Warehouse size={16} /><select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setPage(1); }}><option value="">Tất cả các kho</option>{warehouses.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
          <div><UsersRound size={16} /><select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="">Tất cả vai trò</option>{roles.map(x => <option key={x.id} value={x.name}>{roleLabels[x.name] ?? x.name}</option>)}</select></div>
        </section>

        <section className="manager-account-table">
          <div className="account-table-head"><span>Nhân viên</span><span>Liên hệ</span><span>Vai trò / Kho</span><span>Trạng thái</span><span>Thao tác</span></div>
          {loading ? <div className="account-empty">Đang tải dữ liệu...</div> : users.length === 0 ? <div className="account-empty"><UsersRound size={36} /><strong>Không tìm thấy tài khoản</strong><span>Hãy thử thay đổi bộ lọc hoặc từ khóa.</span></div> :
            users.map(user => <div className="account-table-row" key={user.id}>
              <div className="account-person"><div className="account-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.fullName)}</div><div><strong>{user.fullName}</strong><span>@{user.userName}</span></div></div>
              <div className="account-contact"><span><Mail size={14} />{user.email}</span><span><Phone size={14} />{user.phoneNumber}</span></div>
              <div className="account-role"><b>{roleLabels[user.role] ?? user.role}</b><span>{user.warehouseName ?? 'Không thuộc kho'}</span></div>
              <div><span className={`account-status ${user.userStatus === 'Active' ? 'active' : 'inactive'}`}>{user.userStatus === 'Active' ? 'Đang hoạt động' : 'Tạm ngưng'}</span></div>
              <div className="account-actions">
                <button type="button" onClick={() => openEdit(user)} title="Chỉnh sửa"><Edit3 size={16} /></button>
                <button type="button" className={user.userStatus === 'Active' ? 'lock' : 'unlock'} onClick={() => void toggleLock(user)} title={user.userStatus === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
                  {user.userStatus === 'Active' ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
                <button type="button" className="delete" onClick={() => setDeleting(user)} title="Xóa"><Trash2 size={16} /></button>
              </div>
            </div>)}
        </section>

        <footer className="manager-account-pagination">
          <span>Hiển thị {rangeStart}–{rangeEnd} / {total} tài khoản</span>
          <div><label>Số hàng <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}><option>5</option><option>10</option><option>20</option></select></label>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button>
            {pageNumbers.map((value, index) => <span key={value}>{index > 0 && value - pageNumbers[index - 1] > 1 && <i>…</i>}<button className={value === page ? 'current' : ''} onClick={() => setPage(value)}>{value}</button></span>)}
            <button disabled={page === pages} onClick={() => setPage(page + 1)}>Sau</button>
          </div>
        </footer>

        {editing && <div className="manager-account-modal"><form onSubmit={save}>
          <header><div><span>{editing === 'create' ? 'TẠO TÀI KHOẢN' : 'CHỈNH SỬA TÀI KHOẢN'}</span><h2>{editing === 'create' ? 'Thông tin tài khoản mới' : editing.fullName}</h2></div><button type="button" onClick={() => setEditing(null)}>×</button></header>
          <div className="account-form-grid">
            <label><span>Họ và tên <b>*</b></span><input required minLength={2} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label>
            <label><span>Username <b>*</b></span><input required minLength={4} value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} /></label>
            <label><span>Email <b>*</b></span><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            <label><span>Số điện thoại <b>*</b></span><input required pattern="0[0-9]{9}" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></label>
            <label><span>Vai trò <b>*</b></span><select required value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value, warehouseId: null })}>{roles.map(x => <option key={x.id} value={x.id}>{roleLabels[x.name] ?? x.name}</option>)}</select></label>
            {needsWarehouse && <label><span>Kho làm việc <b>*</b></span><select required value={form.warehouseId ?? ''} onChange={e => setForm({ ...form, warehouseId: e.target.value || null })}><option value="">Chọn kho</option>{warehouses.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
            <label className="wide"><span>Địa chỉ <b>*</b></span><input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
            {editing === 'create' ? <label className="wide"><span>Mật khẩu ban đầu <b>*</b></span><input required type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Ít nhất 8 ký tự, chữ hoa, số và ký tự đặc biệt" /></label> :
              <><label><span>Trạng thái <b>*</b></span><select required value={form.userStatus} onChange={e => setForm({ ...form, userStatus: e.target.value })}><option value="Active">Đang hoạt động</option><option value="Inactive">Tạm ngưng</option></select></label><label><span>Mật khẩu mới <small>(không bắt buộc)</small></span><input type="password" minLength={8} value={form.newPassword ?? ''} onChange={e => setForm({ ...form, newPassword: e.target.value })} /></label></>}
          </div>
          <footer><button type="button" onClick={() => setEditing(null)}>Hủy</button><button disabled={saving} type="submit">{saving ? 'Đang lưu...' : 'Lưu tài khoản'}</button></footer>
        </form></div>}

        {deleting && <div className="manager-account-modal compact"><div className="delete-account-dialog"><h2>Xóa tài khoản?</h2><p>Tài khoản <strong>{deleting.fullName}</strong> sẽ không thể đăng nhập. Lịch sử hoạt động vẫn được giữ lại.</p><footer><button onClick={() => setDeleting(null)}>Hủy</button><button className="danger" onClick={() => void remove()}>Xóa tài khoản</button></footer></div></div>}
      </div>
    </AdminLayout>
  );
}
