'use client';

import { useState, useEffect } from 'react';
import { Search, X, Package, MapPin, AlertTriangle, CheckCircle, XCircle, TrendingDown, Plus, Edit, Trash2, Save } from 'lucide-react';

export default function Page() {
  // API URL จาก environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentStock, setCurrentStock] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    StockID: '',
    Category: '',
    StockStatus: '',
    Location: '',
    ItemName: '',
    Unit: '',
    StockDate: '',
    Quantity: ''
  });

  // ข้อมูล dropdown
  const categories = ['เมล็ด', 'วัตถุดิบ', 'ไซรัป', 'อื่นๆ / ไม่ระบุ'];
  const locations = ['Roasting room', 'Stockroom', 'Coffee Bar'];
  const statuses = ['ปกติ', 'เหลือน้อย', 'สั่งด่วน', 'ไม่ใช้งาน'];
  const units = ['กิโลกรัม', 'ขวด', 'แกลลอน', 'กล่อง', 'ถุง', 'กระป๋อง'];

  // Fetch stocks
  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/dailystock`;
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterLocation) params.append('location', filterLocation);
      if (filterStatus) params.append('status', filterStatus);
      if ([...params].length) url += '/filter?' + params.toString();

      console.log('Fetching from:', url);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch stocks');
      const data = await res.json();
      setStocks(data);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError(err.message);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Add stock
  const handleAdd = async () => {
    try {
      const res = await fetch(`${API_URL}/dailystock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to add stock');
      
      setShowModal(false);
      resetForm();
      fetchStocks();
      alert('เพิ่มข้อมูลสำเร็จ!');
    } catch (err) {
      console.error('Error adding stock:', err);
      alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    }
  };

  // Update stock
  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API_URL}/dailystock/${formData.StockID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to update stock');
      
      setShowModal(false);
      resetForm();
      fetchStocks();
      alert('แก้ไขข้อมูลสำเร็จ!');
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    }
  };

  // Delete stock
  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) return;
    
    try {
      const res = await fetch(`${API_URL}/dailystock/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete stock');
      
      fetchStocks();
      alert('ลบข้อมูลสำเร็จ!');
    } catch (err) {
      console.error('Error deleting stock:', err);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  // Open add modal
  const openAddModal = () => {
    setModalMode('add');
    resetForm();
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (stock) => {
    setModalMode('edit');
    setCurrentStock(stock);
    setFormData({
      StockID: stock.StockID,
      Category: stock.Category,
      StockStatus: stock.StockStatus,
      Location: stock.Location,
      ItemName: stock.ItemName,
      Unit: stock.Unit,
      StockDate: stock.StockDate,
      Quantity: stock.Quantity
    });
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      StockID: '',
      Category: '',
      StockStatus: '',
      Location: '',
      ItemName: '',
      Unit: '',
      StockDate: new Date().toISOString().split('T')[0],
      Quantity: ''
    });
    setCurrentStock(null);
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      handleAdd();
    } else {
      handleUpdate();
    }
  };

  const clearFilters = () => {
    setFilterCategory('');
    setFilterLocation('');
    setFilterStatus('');
  };

  const hasActiveFilters = filterCategory || filterLocation || filterStatus;

  // คำนวณสถิติ
  const stats = {
    total: stocks.length,
    normal: stocks.filter(s => s.StockStatus === 'ปกติ').length,
    low: stocks.filter(s => s.StockStatus === 'เหลือน้อย').length,
    urgent: stocks.filter(s => s.StockStatus === 'สั่งด่วน').length,
    inactive: stocks.filter(s => s.StockStatus === 'ไม่ใช้งาน').length,
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ปกติ': return <CheckCircle className="w-4 h-4" />;
      case 'เหลือน้อย': return <TrendingDown className="w-4 h-4" />;
      case 'สั่งด่วน': return <AlertTriangle className="w-4 h-4" />;
      case 'ไม่ใช้งาน': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ปกติ': return 'badge-green';
      case 'เหลือน้อย': return 'badge-yellow';
      case 'สั่งด่วน': return 'badge-red';
      case 'ไม่ใช้งาน': return 'badge-gray';
      default: return 'badge-orange';
    }
  };

  useEffect(() => {
    console.log('API URL:', API_URL);
    fetchStocks();
  }, [filterCategory, filterLocation, filterStatus]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Daily Stock Management</h1>
              <p className="text-gray-600 text-sm">ระบบจัดการสต็อกสินค้าประจำวัน</p>
            </div>
          </div>
          <button onClick={openAddModal} className="btn-primary">
            <Plus className="w-5 h-5" />
            เพิ่มข้อมูล
          </button>
        </div>

        {/* API Info - แสดงเฉพาะตอน development */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>API URL:</strong> {API_URL}
            </p>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="stat-card border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium">ปกติ</p>
                  <p className="text-2xl font-bold text-green-600">{stats.normal}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="stat-card border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium">เหลือน้อย</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.low}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="stat-card border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium">สั่งด่วน</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="stat-card border-l-4 border-gray-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs font-medium">ไม่ใช้งาน</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            ค้นหาและกรองข้อมูล
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">หมวดหมู่</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="select-input">
                <option value="">-- ทั้งหมด --</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">สถานที่</label>
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="select-input">
                <option value="">-- ทั้งหมด --</option>
                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">สถานะสต็อก</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select-input">
                <option value="">-- ทั้งหมด --</option>
                {statuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={fetchStocks} className="btn-primary flex-1">
                <Search className="w-4 h-4" />
                ค้นหา
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-outline">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert alert-error mb-6">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">เกิดข้อผิดพลาด</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16">
              <div className="spinner mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : stocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-500">
              <Package className="w-20 h-20 mb-4 text-gray-300" />
              <p className="text-lg font-medium">ไม่พบข้อมูลสต็อก</p>
              <p className="text-sm">ลองปรับเงื่อนไขการค้นหาใหม่</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th className="w-20">รหัส</th>
                    <th>หมวดหมู่</th>
                    <th>สถานะ</th>
                    <th>สถานที่</th>
                    <th>ชื่อสินค้า</th>
                    <th className="w-24">หน่วย</th>
                    <th className="w-32">วันที่</th>
                    <th className="w-24 text-right">จำนวน</th>
                    <th className="w-32 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => (
                    <tr key={stock.StockID}>
                      <td className="text-center">
                        <span className="badge badge-gray text-xs">{stock.StockID}</span>
                      </td>
                      <td>
                        <span className="badge badge-orange">{stock.Category}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusClass(stock.StockStatus)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(stock.StockStatus)}
                          {stock.StockStatus}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {stock.Location}
                        </div>
                      </td>
                      <td className="font-medium text-gray-900">{stock.ItemName}</td>
                      <td className="text-gray-600">{stock.Unit}</td>
                      <td className="text-gray-600 text-sm">{stock.StockDate}</td>
                      <td className="text-right">
                        <span className="font-semibold text-gray-900">
                          {parseFloat(stock.Quantity).toLocaleString('th-TH', { 
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(stock)}
                            className="btn-icon btn-icon-edit"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(stock.StockID)}
                            className="btn-icon btn-icon-delete"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!loading && stocks.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            แสดง {stocks.length} รายการ
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-800">
                {modalMode === 'add' ? 'เพิ่มข้อมูลสต็อก' : 'แก้ไขข้อมูลสต็อก'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modalMode === 'add' && (
                  <div>
                    <label className="form-label">รหัสสต็อก *</label>
                    <input
                      type="number"
                      required
                      value={formData.StockID}
                      onChange={(e) => setFormData({...formData, StockID: e.target.value})}
                      placeholder="กรอกรหัสสต็อก"
                    />
                  </div>
                )}
                
                <div>
                  <label className="form-label">หมวดหมู่ *</label>
                  <select
                    required
                    value={formData.Category}
                    onChange={(e) => setFormData({...formData, Category: e.target.value})}
                    className="select-input"
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">สถานะสต็อก *</label>
                  <select
                    required
                    value={formData.StockStatus}
                    onChange={(e) => setFormData({...formData, StockStatus: e.target.value})}
                    className="select-input"
                  >
                    <option value="">-- เลือกสถานะ --</option>
                    {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">สถานที่ *</label>
                  <select
                    required
                    value={formData.Location}
                    onChange={(e) => setFormData({...formData, Location: e.target.value})}
                    className="select-input"
                  >
                    <option value="">-- เลือกสถานที่ --</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">ชื่อสินค้า *</label>
                  <input
                    type="text"
                    required
                    value={formData.ItemName}
                    onChange={(e) => setFormData({...formData, ItemName: e.target.value})}
                    placeholder="กรอกชื่อสินค้า"
                  />
                </div>

                <div>
                  <label className="form-label">หน่วย *</label>
                  <select
                    required
                    value={formData.Unit}
                    onChange={(e) => setFormData({...formData, Unit: e.target.value})}
                    className="select-input"
                  >
                    <option value="">-- เลือกหน่วย --</option>
                    {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">วันที่ *</label>
                  <input
                    type="date"
                    required
                    value={formData.StockDate}
                    onChange={(e) => setFormData({...formData, StockDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="form-label">จำนวน *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.Quantity}
                    onChange={(e) => setFormData({...formData, Quantity: e.target.value})}
                    placeholder="กรอกจำนวน"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary">
                  <Save className="w-4 h-4" />
                  {modalMode === 'add' ? 'เพิ่มข้อมูล' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}