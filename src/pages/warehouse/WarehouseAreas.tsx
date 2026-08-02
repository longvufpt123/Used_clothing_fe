import { useEffect, useMemo, useState } from 'react';
import { Boxes, Building2, ChevronDown, ChevronRight, ImageOff, Layers3, MapPin, Package, Scale, Search, ShoppingBag, X } from 'lucide-react';
import { warehouseService } from '@/services/warehouseService';
import type { WarehouseBatch, WarehouseInventory, WarehouseLayout, WarehouseLocationLayout } from '@/services/warehouseService';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/common/Modal';
import Pagination from '@/components/common/Pagination';
import '@/styles/ops-shared.css';
import '@/pages/distribution/ProductCatalogModal.css';
import './WarehouseAreas.css';

const percent=(current:number,capacity:number)=>capacity>0?Math.min(100,Math.round(current/capacity*100)):0;

export default function WarehouseAreas(){
  const toast=useToast();const [layout,setLayout]=useState<WarehouseLayout|null>(null);
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const [selectedLocation,setSelectedLocation]=useState<WarehouseLocationLayout|null>(null);
  const [locationInventory,setLocationInventory]=useState<WarehouseInventory[]>([]);
  const [loadingInventory,setLoadingInventory]=useState(false);
  const [search,setSearch]=useState('');
  const [modalSearch,setModalSearch]=useState('');const [modalPage,setModalPage]=useState(1);
  const [activeBatch,setActiveBatch]=useState<WarehouseBatch|null>(null);const [loadingBatch,setLoadingBatch]=useState(false);const [itemPage,setItemPage]=useState(1);
  const pageSize=6;
  const itemPageSize=6;
  useEffect(()=>{warehouseService.layout().then(data=>{setLayout(data);setExpanded(Object.fromEntries(data.areas.map((a,i)=>[a.id,i===0])));})
    .catch(()=>toast.error('Không thể tải sơ đồ khu vực kho.'));},[]);
  const totals=useMemo(()=>({locations:layout?.areas.reduce((s,a)=>s+a.locations.length,0)||0,
    occupied:layout?.areas.reduce((s,a)=>s+a.locations.filter(l=>l.currentWeightKg>0).length,0)||0,
    items:layout?.areas.reduce((s,a)=>s+a.locations.reduce((n,l)=>n+l.itemQuantity,0),0)||0}),[layout]);
  const filteredLocations=useMemo(()=>{if(!layout)return[];const q=search.trim().toLowerCase();return layout.areas.flatMap(area=>area.locations.map(location=>({area,location}))).filter(({area,location})=>!q||[area.areaName,location.locationCode,location.aisleCode,location.rackCode,location.shelfCode,location.binCode,location.preferredGarmentGroup,location.preferredProcessingDirection,location.status].some(value=>String(value||'').toLowerCase().includes(q)));},[layout,search]);
  const filteredLocationIds=new Set(filteredLocations.map(x=>x.location.id));
  const filteredModalInventory=useMemo(()=>{const q=modalSearch.trim().toLowerCase();return !q?locationInventory:locationInventory.filter(item=>[item.batchCode,item.sku,item.clothingType,item.fabricType,item.conditionGrade,item.gender,item.targetUser,item.size,item.processingDirection].some(value=>String(value||'').toLowerCase().includes(q)));},[locationInventory,modalSearch]);
  const modalPages=Math.max(1,Math.ceil(filteredModalInventory.length/pageSize));const pagedModalInventory=filteredModalInventory.slice((modalPage-1)*pageSize,modalPage*pageSize);
  useEffect(()=>setModalPage(1),[modalSearch,selectedLocation]);useEffect(()=>{if(modalPage>modalPages)setModalPage(modalPages);},[modalPage,modalPages]);
  const openLocation=async(location:WarehouseLocationLayout)=>{
    setSelectedLocation(location);setLocationInventory([]);setModalSearch('');setLoadingInventory(true);
    try{setLocationInventory(await warehouseService.locationInventory(location.id));}
    catch{toast.error('Không thể tải danh sách batch trong vị trí này.');}
    finally{setLoadingInventory(false);}
  };
  const openBatch=async(item:WarehouseInventory)=>{
    setLoadingBatch(true);setItemPage(1);
    try{setActiveBatch(await warehouseService.getBatch(item.classifiedBatchId));}
    catch{toast.error('Không thể tải chi tiết item trong Classified Batch này.');}
    finally{setLoadingBatch(false);}
  };
  const itemPages=Math.max(1,Math.ceil((activeBatch?.items.length||0)/itemPageSize));
  const pagedItems=activeBatch?.items.slice((itemPage-1)*itemPageSize,itemPage*itemPageSize)||[];
  if(!layout)return <div className="ops-page">Đang tải sơ đồ kho...</div>;
  return <div className="ops-page">
    <header className="ops-pagehead"><div className="ops-pagehead-main"><span className="ops-pagehead-kicker">Sơ đồ lưu trữ</span>
      <h1>{layout.warehouseName}</h1><p><MapPin size={14}/> {layout.address}</p></div></header>
    <div className="ops-stats">
      <div className="ops-stat-card"><span className="ops-stat-label">Khu vực</span><div className="ops-stat-value"><Building2 size={19}/>{layout.areas.length}</div></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Vị trí lưu trữ</span><div className="ops-stat-value"><Boxes size={19}/>{totals.locations}</div><span className="ops-stat-foot">{totals.occupied} vị trí đang sử dụng</span></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Tổng item</span><div className="ops-stat-value"><Package size={19}/>{totals.items}</div></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Sử dụng sức chứa</span><div className="ops-stat-value">{percent(layout.currentWeightKg,layout.capacityKg)}%</div><span className="ops-stat-foot">{layout.currentWeightKg.toFixed(1)} / {layout.capacityKg.toFixed(1)} kg</span></div>
    </div>
    <section><div className="ops-section-head"><h2>Các khu vực trong kho</h2><span>Chọn khu vực để xem hàng, kệ, tầng và ô</span></div>
      <div className="ops-list-toolbar"><label className="ops-list-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm khu vực, mã vị trí, hàng, kệ, hướng xử lý..."/></label><span className="ops-list-result">{filteredLocations.length} vị trí</span></div>
      <div className="warehouse-area-list">{layout.areas.map(area=>{const used=percent(area.currentWeightKg,area.capacityKg),open=expanded[area.id];const visibleLocations=area.locations.filter(location=>filteredLocationIds.has(location.id));if(!visibleLocations.length)return null;
        return <article className="warehouse-area" key={area.id}>
          <button className="warehouse-area-head" onClick={()=>setExpanded(x=>({...x,[area.id]:!open}))}>
            <span className="warehouse-area-icon"><Layers3/></span><span className="warehouse-area-title"><b>{area.areaName}</b><small>{area.description||'Khu vực lưu trữ'}</small></span>
            <span className="warehouse-area-cap"><b>{used}%</b><small>{area.currentWeightKg.toFixed(1)} / {area.capacityKg.toFixed(1)} kg</small></span>
            {open?<ChevronDown/>:<ChevronRight/>}
          </button>
          <div className="warehouse-cap-track"><span style={{width:`${used}%`}}/></div>
          {open&&<div className="warehouse-area-body">
            {area.groups.length>0&&<div className="warehouse-groups">{area.groups.map(group=><span key={group.id}>{group.groupName}<small>{group.currentWeightKg.toFixed(1)}/{group.capacityKg.toFixed(1)} kg</small></span>)}</div>}
            <div className="warehouse-location-grid">{visibleLocations.map(location=>{const load=percent(location.currentWeightKg,location.capacityKg);
              return <button type="button" className={`warehouse-location ${location.status.toLowerCase()} ${load>=90?'full':''}`} key={location.id} onClick={()=>void openLocation(location)}>
                <div><b>{location.locationCode}</b><span>{location.status}</span></div>
                <p>Hàng {location.aisleCode} · Kệ {location.rackCode} · Tầng {location.shelfCode} · Ô {location.binCode}</p>
                <div className="warehouse-location-tags"><span>{location.preferredGarmentGroup||'Đa loại'}</span><span>{location.preferredProcessingDirection||'Linh hoạt'}</span></div>
                <div className="warehouse-location-meter"><span style={{width:`${load}%`}}/></div>
                <small>{location.currentWeightKg.toFixed(1)}/{location.capacityKg.toFixed(1)} kg · {location.inventoryCount} SKU · {location.itemQuantity} item</small>
              </button>})}</div>
          </div>}
        </article>})}{!filteredLocations.length&&<div className="ops-empty"><MapPin size={34}/><h4>Không có vị trí phù hợp</h4></div>}</div>
    </section>
    <Modal isOpen={!!selectedLocation} onClose={()=>setSelectedLocation(null)}
      title={selectedLocation?`Hàng lưu tại ${selectedLocation.locationCode}`:''} className="warehouse-location-modal">
      {selectedLocation&&<div className="warehouse-location-summary">
        <span><Scale size={16}/><b>{selectedLocation.currentWeightKg.toFixed(1)} kg</b> / {selectedLocation.capacityKg.toFixed(1)} kg</span>
        <span><Package size={16}/><b>{selectedLocation.itemQuantity} item</b> · {selectedLocation.inventoryCount} SKU</span>
      </div>}
      {!loadingInventory&&locationInventory.length>0&&<div className="ops-list-toolbar"><label className="ops-list-search"><Search size={16}/><input value={modalSearch} onChange={e=>setModalSearch(e.target.value)} placeholder="Tìm batch, SKU, loại đồ..."/></label><span className="ops-list-result">{filteredModalInventory.length} batch</span></div>}
      {loadingInventory?<div className="ops-empty"><span className="ops-spinner"/><h4>Đang tải hàng trong vị trí...</h4></div>:
      filteredModalInventory.length?<><div className="warehouse-location-batches">{pagedModalInventory.map(item=><button type="button" key={item.id} onClick={()=>void openBatch(item)}>
        <header><div><span>CLASSIFIED BATCH</span><strong>{item.batchCode}</strong></div><b>Nhãn {item.conditionGrade}</b></header>
        <h4>{item.clothingType} · {item.fabricType}</h4>
        <p>{item.gender} · {item.targetUser} · Size {item.size} · {item.processingDirection}</p>
        <div className="warehouse-batch-compact-footer"><span><Package size={14}/>{item.quantity} item</span><span><Scale size={14}/>{item.totalWeightKg.toFixed(1)} kg</span><small>Xem sản phẩm</small></div>
      </button>)}</div>{filteredModalInventory.length>pageSize&&<div className="ops-list-pagination"><Pagination currentPage={modalPage} totalPages={modalPages} onPageChange={setModalPage}/></div>}</>:<div className="ops-empty"><Boxes size={34}/><h4>{locationInventory.length?'Không tìm thấy batch':'Vị trí đang trống'}</h4><p>{locationInventory.length?'Thử thay đổi từ khóa tìm kiếm.':'Chưa có Classified Batch nào được xếp vào vị trí này.'}</p></div>}
    </Modal>
    {loadingBatch&&<div className="product-modal-backdrop"><div className="warehouse-product-loading"><span className="ops-spinner"/><b>Đang tải sản phẩm...</b></div></div>}
    {activeBatch&&<div className="product-modal-backdrop" onMouseDown={()=>setActiveBatch(null)}><section className="product-modal warehouse-product-modal" role="dialog" aria-modal="true" onMouseDown={event=>event.stopPropagation()}>
      <header><div><span>DANH SÁCH SẢN PHẨM</span><h2>{activeBatch.clothingType} · {activeBatch.fabricType}</h2><p>{activeBatch.batchCode} · Nhãn {activeBatch.conditionGrade}</p></div><button type="button" aria-label="Đóng" onClick={()=>setActiveBatch(null)}><X/></button></header>
      <div className="product-modal-summary"><span><ShoppingBag/>{activeBatch.items.length} sản phẩm</span><span>{activeBatch.gender}</span><span>{activeBatch.targetUser}</span><span>Size {activeBatch.size}</span><span>{activeBatch.processingDirection}</span></div>
      <div className="product-grid">{pagedItems.map(item=><article className="product-tile" key={item.id}><div className="product-image">{item.imageUrls?.[0]?<img src={item.imageUrls[0]} alt={`${item.clothingType} ${item.itemCode}`}/>:<div><ImageOff/><span>Chưa có ảnh</span></div>}<span className="product-grade">Nhãn {item.conditionGrade}</span></div><div className="product-info"><small>{item.itemCode}</small><h3>{item.clothingType}</h3><p>{item.fabricType}</p><div><span>{item.gender}</span><span>{item.targetUser}</span><span>Size {item.size}</span></div>{item.notes&&<em>{item.notes}</em>}</div></article>)}</div>
      {activeBatch.items.length>itemPageSize&&<div className="warehouse-product-pagination"><span>Hiển thị {(itemPage-1)*itemPageSize+1}–{Math.min(itemPage*itemPageSize,activeBatch.items.length)} / {activeBatch.items.length} sản phẩm</span><Pagination currentPage={itemPage} totalPages={itemPages} onPageChange={setItemPage}/></div>}
      <footer><div><b>{activeBatch.items.length}</b><span> sản phẩm trong batch</span></div><div><button type="button" className="secondary" onClick={()=>setActiveBatch(null)}>Đóng</button></div></footer>
    </section></div>}
  </div>;
}
