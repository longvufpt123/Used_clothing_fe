import React, { useState } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Pagination from '@/components/common/Pagination';
import Dropdown from '@/components/common/Dropdown';
import Tooltip from '@/components/common/Tooltip';
import Modal from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import { UserPlus, Search, Trash2, Mail, Phone, ChevronDown, Lock, Unlock, User, UsersRound } from 'lucide-react';
import './Users.css';

interface UserItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive';
  joinedDate: string;
  avatarUrl?: string;
}

const INITIAL_USERS: UserItem[] = [
  { id: 1, name: 'Nguyễn Văn Hoàng', email: 'hoang.tv@usedclothing.vn', phone: '0912345678', role: 'admin', status: 'active', joinedDate: '2026-01-10', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80' },
  { id: 2, name: 'Lê Thị Thu Hà', email: 'ha.ltt@usedclothing.vn', phone: '0987654321', role: 'manager', status: 'active', joinedDate: '2026-02-15' },
  { id: 3, name: 'Phạm Minh Đức', email: 'duc.pm@usedclothing.vn', phone: '0901234567', role: 'staff', status: 'active', joinedDate: '2026-03-20' },
  { id: 4, name: 'Đỗ Hoàng Anh', email: 'anh.dh@usedclothing.vn', phone: '0934567890', role: 'staff', status: 'inactive', joinedDate: '2026-04-05' },
  { id: 5, name: 'Ngô Quốc Bảo', email: 'bao.nq@usedclothing.vn', phone: '0976543210', role: 'staff', status: 'active', joinedDate: '2026-04-12' },
  { id: 6, name: 'Vũ Minh Tuấn', email: 'tuan.vm@usedclothing.vn', phone: '0945678123', role: 'manager', status: 'active', joinedDate: '2026-05-01' },
];

export const Users: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'staff'>('staff');
  const [newAvatar, setNewAvatar] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Xác nhận xoá bằng modal trong app thay cho window.confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewAvatar(url);
    }
  };

  const validateForm = () => {
    const tempErrors: typeof errors = {};
    if (!newName.trim()) {
      tempErrors.name = 'Họ và tên không được để trống';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail.trim()) {
      tempErrors.email = 'Email không được để trống';
    } else if (!emailRegex.test(newEmail)) {
      tempErrors.email = 'Email không đúng định dạng (VD: nv.a@usedclothing.vn)';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!newPhone.trim()) {
      tempErrors.phone = 'Số điện thoại không được để trống';
    } else if (!phoneRegex.test(newPhone)) {
      tempErrors.phone = 'Số điện thoại phải gồm 10 chữ số';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin nhập liệu!');
      return;
    }

    try {
      const newUser: UserItem = {
        id: Date.now(),
        name: newName,
        email: newEmail,
        phone: newPhone,
        role: newRole,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
        avatarUrl: newAvatar || undefined,
      };

      setUsers(prev => [newUser, ...prev]);
      toast.success(`Đã thêm nhân viên "${newName}" vào hệ thống.`);
      
      // Reset Form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewRole('staff');
      setNewAvatar(null);
      setErrors({});
      setShowAddForm(false);
      setCurrentPage(1);
    } catch (apiError: any) {
      toast.error(apiError?.message || 'Có lỗi xảy ra khi tạo nhân viên trên hệ thống.');
    }
  };

  const handleToggleStatus = (id: number) => {
    setUsers(prev => prev.map(user => {
      if (user.id === id) {
        const nextStatus = user.status === 'active' ? 'inactive' : 'active';
        toast.success(`Đã cập nhật trạng thái hoạt động của ${user.name}`);
        return { ...user, status: nextStatus };
      }
      return user;
    }));
  };

  const handleDeleteUser = (id: number, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDeleteUser = () => {
    if (!deleteTarget) return;
    setUsers(prev => prev.filter(user => user.id !== deleteTarget.id));
    toast.success(`Đã xoá tài khoản của ${deleteTarget.name}`);
    setCurrentPage(1);
    setDeleteTarget(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const columns = [
    { 
      header: 'STT', 
      accessor: (_row: UserItem, index?: number) => (indexOfFirstItem + (index !== undefined ? index : 0) + 1)
    },
    { 
      header: 'Họ tên', 
      accessor: (row: UserItem) => {
        const nameParts = row.name.split(' ');
        const initials = nameParts.length > 1 
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : row.name.substring(0, 2).toUpperCase();
        
        return (
          <div className="user-name-cell">
            <div className={`user-avatar avatar-${row.role}`} style={{ overflow: 'hidden', padding: 0 }}>
              {row.avatarUrl ? (
                <img src={row.avatarUrl} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <span className="user-name-text">{row.name}</span>
          </div>
        );
      }
    },
    { 
      header: 'Email', 
      accessor: (row: UserItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mail size={14} className="text-secondary" />
          <span>{row.email}</span>
        </div>
      )
    },
    { 
      header: 'Số điện thoại', 
      accessor: (row: UserItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Phone size={14} className="text-secondary" />
          <span>{row.phone}</span>
        </div>
      )
    },
    { 
      header: 'Vai trò', 
      accessor: (row: UserItem) => {
        switch (row.role) {
          case 'admin':
            return <Badge variant="danger">Quản trị viên</Badge>;
          case 'manager':
            return <Badge variant="warning">Điều phối viên</Badge>;
          case 'staff':
            return <Badge variant="info">Nhân viên kho</Badge>;
          default:
            return <Badge variant="primary">{row.role}</Badge>;
        }
      }
    },
    {
      header: 'Trạng thái',
      accessor: (row: UserItem) => (
        <Tooltip content={row.status === 'active' ? 'Tài khoản đang hoạt động' : 'Tài khoản tạm thời bị khóa'} position="top">
          <div className="status-indicator-wrapper">
            <span className={`status-dot ${row.status === 'active' ? 'active-dot' : 'inactive-dot'}`}></span>
            <span className={`status-label-text ${row.status === 'active' ? 'text-success' : 'text-warning'}`}>
              {row.status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng'}
            </span>
          </div>
        </Tooltip>
      )
    },
    {
      header: 'Thao tác',
      accessor: (row: UserItem) => (
        <div className="action-buttons-cell">
          <Tooltip content={row.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'} position="top">
            <button 
              className={`action-btn ${row.status === 'active' ? 'btn-warning-light' : 'btn-success-light'}`}
              onClick={() => handleToggleStatus(row.id)}
            >
              {row.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          </Tooltip>
          <Tooltip content="Xóa tài khoản" position="top">
            <button 
              className="action-btn btn-danger-light"
              onClick={() => handleDeleteUser(row.id, row.name)}
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        </div>
      )
    }
  ];

  const breadcrumbItems = [
    { label: 'Trang quản trị', path: '/admin' },
    { label: 'Quản lý người dùng' },
  ];

  const getRoleLabel = (r: typeof newRole) => {
    if (r === 'admin') return 'Quản trị viên';
    if (r === 'manager') return 'Điều phối viên';
    return 'Nhân viên kho';
  };

  const getFilterRoleLabel = (filterVal: string) => {
    if (filterVal === 'admin') return 'Quản trị viên';
    if (filterVal === 'manager') return 'Điều phối viên';
    if (filterVal === 'staff') return 'Nhân viên kho';
    return 'Tất cả vai trò';
  };

  return (
    <AdminLayout>
      <div className="admin-users-page">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="users-actions-bar">
          <div className="search-box-wrapper glass">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân viên bằng tên, email hoặc SĐT..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="action-buttons-group">
            <Dropdown 
              trigger={
                <div className="custom-select-trigger filter-trigger">
                  <span>Vai trò: {getFilterRoleLabel(roleFilter)}</span>
                  <ChevronDown size={14} />
                </div>
              }
              items={[
                { label: 'Tất cả vai trò', onClick: () => { setRoleFilter('all'); setCurrentPage(1); } },
                { label: 'Quản trị viên', onClick: () => { setRoleFilter('admin'); setCurrentPage(1); } },
                { label: 'Điều phối viên', onClick: () => { setRoleFilter('manager'); setCurrentPage(1); } },
                { label: 'Nhân viên kho', onClick: () => { setRoleFilter('staff'); setCurrentPage(1); } },
              ]}
            />

            <button className="add-user-btn" onClick={() => setShowAddForm(!showAddForm)}>
              <UserPlus size={18} style={{ marginRight: '6px' }} />
              Thêm nhân viên mới
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="modal-overlay">
            <form className="add-user-form modal-content-900" onSubmit={handleAddUser}>
              <div className="modal-header-custom">
                <h3>Nhập thông tin nhân viên mới</h3>
                <button type="button" className="close-modal-btn" onClick={() => setShowAddForm(false)}>&times;</button>
              </div>
              
              <div className="form-cols-container">
                <div className="form-left-col">
                  <div className="avatar-picker-container">
                    {newAvatar ? (
                      <img src={newAvatar} alt="Xem trước ảnh đại diện" className="avatar-picker-preview" />
                    ) : (
                      <div className="avatar-picker-placeholder">
                        <User size={36} className="placeholder-icon" />
                        <span>Tải ảnh</span>
                      </div>
                    )}
                    <label className="upload-avatar-label">
                      Chọn ảnh đại diện
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                </div>
                
                <div className="form-right-col">
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} /> Họ và tên nhân viên
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Nguyễn Văn A" 
                      value={newName}
                      onChange={(e) => { setNewName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
                      className={errors.name ? 'error-input' : ''}
                      required 
                    />
                    {errors.name && <span className="error-message-text">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} /> Email liên hệ
                    </label>
                    <input 
                      type="email" 
                      placeholder="Ví dụ: nv.a@usedclothing.vn" 
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                      className={errors.email ? 'error-input' : ''}
                      required 
                    />
                    {errors.email && <span className="error-message-text">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} /> Số điện thoại
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: 09XXXXXXXX" 
                      value={newPhone}
                      onChange={(e) => { setNewPhone(e.target.value); if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined })); }}
                      className={errors.phone ? 'error-input' : ''}
                      required 
                    />
                    {errors.phone && <span className="error-message-text">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} /> Vai trò hệ thống
                    </label>
                    <Dropdown 
                      trigger={
                        <div className="custom-select-trigger">
                          <span>{getRoleLabel(newRole)}</span>
                          <ChevronDown size={14} />
                        </div>
                      }
                      items={[
                        { label: 'Nhân viên kho', onClick: () => setNewRole('staff') },
                        { label: 'Điều phối viên', onClick: () => setNewRole('manager') },
                      ]}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions-custom">
                <button type="submit" className="submit-form-btn">Xác nhận tạo</button>
                <button type="button" className="cancel-form-btn" onClick={() => setShowAddForm(false)}>Hủy bỏ</button>
              </div>
            </form>
          </div>
        )}

        <div className="users-table-container glass">
          {currentItems.length === 0 ? (
            <div className="users-empty">
              <UsersRound size={40} />
              <p>
                {searchTerm || roleFilter !== 'all'
                  ? 'Không tìm thấy nhân viên nào khớp với bộ lọc. Thử từ khoá khác hoặc đặt lại vai trò.'
                  : 'Chưa có nhân viên nào. Thêm nhân viên mới để bắt đầu.'}
              </p>
            </div>
          ) : (
            <Table columns={columns} data={currentItems} />
          )}
        </div>

        {/* Pagination Controls moved below container to the bottom of the page */}
        {filteredUsers.length > 0 && (
          <div className="table-pagination glass">
            <div className="pagination-left">
              <span className="pagination-info">
                Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} trong tổng số {filteredUsers.length} nhân viên
              </span>
              <div className="page-size-selector">
                <span className="selector-label">Số hàng:</span>
                <Dropdown 
                  trigger={
                    <div className="custom-select-trigger row-trigger">
                      <span>{itemsPerPage}</span>
                      <ChevronDown size={12} />
                    </div>
                  }
                  items={[
                    { label: '2', onClick: () => { setItemsPerPage(2); setCurrentPage(1); } },
                    { label: '4', onClick: () => { setItemsPerPage(4); setCurrentPage(1); } },
                    { label: '6', onClick: () => { setItemsPerPage(6); setCurrentPage(1); } },
                    { label: '10', onClick: () => { setItemsPerPage(10); setCurrentPage(1); } },
                  ]}
                />
              </div>
            </div>
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}

        <Modal
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Xoá tài khoản"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Huỷ bỏ</Button>
              <Button variant="primary" className="btn-danger-confirm" onClick={confirmDeleteUser}>Xoá tài khoản</Button>
            </>
          }
        >
          <p className="delete-confirm-text">
            Bạn có chắc chắn muốn xoá tài khoản của <strong>{deleteTarget?.name}</strong>? Thao tác này không thể hoàn tác.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Users;
