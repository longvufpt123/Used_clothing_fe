import { useEffect, useMemo, useState } from 'react';
import { Boxes, Building2, ChevronDown, ChevronRight, Layers3, MapPin, Package } from 'lucide-react';
import { warehouseService } from '@/services/warehouseService';
import type { WarehouseLayout } from '@/services/warehouseService';
import { useToast } from '@/context/ToastContext';
import '@/styles/ops-shared.css';
import './WarehouseAreas.css';

const percent=(current:number,capacity:number)=>capacity>0?Math.min(100,Math.round(current/capacity*100)):0;

export default function WarehouseAreas(){
  const toast=useToast();const [layout,setLayout]=useState<WarehouseLayout|null>(null);
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  useEffect(()=>{warehouseService.layout().then(data=>{setLayout(data);setExpanded(Object.fromEntries(data.areas.map((a,i)=>[a.id,i===0])));})
    .catch(()=>toast.error('Không thể tải sơ đồ khu vực kho.'));},[]);
  const totals=useMemo(()=>({locations:layout?.areas.reduce((s,a)=>s+a.locations.length,0)||0,
    occupied:layout?.areas.reduce((s,a)=>s+a.locations.filter(l=>l.currentWeightKg>0).length,0)||0,
    items:layout?.areas.reduce((s,a)=>s+a.locations.reduce((n,l)=>n+l.itemQuantity,0),0)||0}),[layout]);
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
      <div className="warehouse-area-list">{layout.areas.map(area=>{const used=percent(area.currentWeightKg,area.capacityKg),open=expanded[area.id];
        return <article className="warehouse-area" key={area.id}>
          <button className="warehouse-area-head" onClick={()=>setExpanded(x=>({...x,[area.id]:!open}))}>
            <span className="warehouse-area-icon"><Layers3/></span><span className="warehouse-area-title"><b>{area.areaName}</b><small>{area.description||'Khu vực lưu trữ'}</small></span>
            <span className="warehouse-area-cap"><b>{used}%</b><small>{area.currentWeightKg.toFixed(1)} / {area.capacityKg.toFixed(1)} kg</small></span>
            {open?<ChevronDown/>:<ChevronRight/>}
          </button>
          <div className="warehouse-cap-track"><span style={{width:`${used}%`}}/></div>
          {open&&<div className="warehouse-area-body">
            {area.groups.length>0&&<div className="warehouse-groups">{area.groups.map(group=><span key={group.id}>{group.groupName}<small>{group.currentWeightKg.toFixed(1)}/{group.capacityKg.toFixed(1)} kg</small></span>)}</div>}
            <div className="warehouse-location-grid">{area.locations.map(location=>{const load=percent(location.currentWeightKg,location.capacityKg);
              return <div className={`warehouse-location ${location.status.toLowerCase()} ${load>=90?'full':''}`} key={location.id}>
                <div><b>{location.locationCode}</b><span>{location.status}</span></div>
                <p>Hàng {location.aisleCode} · Kệ {location.rackCode} · Tầng {location.shelfCode} · Ô {location.binCode}</p>
                <div className="warehouse-location-tags"><span>{location.preferredGarmentGroup||'Đa loại'}</span><span>{location.preferredProcessingDirection||'Linh hoạt'}</span></div>
                <div className="warehouse-location-meter"><span style={{width:`${load}%`}}/></div>
                <small>{location.currentWeightKg.toFixed(1)}/{location.capacityKg.toFixed(1)} kg · {location.inventoryCount} SKU · {location.itemQuantity} item</small>
              </div>})}</div>
          </div>}
        </article>})}</div>
    </section>
  </div>;
}
