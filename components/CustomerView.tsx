
import React, { useState, useEffect, useRef } from 'react';
import { Apartment, Photo360 } from '../types';
import { getApartments } from '../services/storage';
import Viewer360 from './Viewer360';
import FloorPlanDesigner from './FloorPlanDesigner';
import { 
  ChevronLeft, 
  MapPin, 
  Maximize2, 
  BedDouble, 
  Camera, 
  Sofa, 
  Eraser, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff,
  Sun,
  Moon,
  Map as MapIcon
} from 'lucide-react';

const CustomerView: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<Photo360 | null>(null);
  const [activeHotspotId, setActiveHotspotId] = useState<string | undefined>();
  const [showFurniture, setShowFurniture] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [fov, setFov] = useState(90); 
  const [isCleanView, setIsCleanView] = useState(false);
  const spotMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getApartments();
      setApartments(data);
    };
    loadData();
  }, []);

  const selectedApt = apartments.find(a => a.id === selectedAptId);

  // Auto-initialize first photo when apt is selected
  useEffect(() => {
    if (selectedApt && selectedApt.photos.length > 0 && !activePhoto) {
      setActivePhoto(selectedApt.photos[0]);
      const firstHotspot = selectedApt.hotspots.find(h => h.photoId === selectedApt.photos[0].id);
      setActiveHotspotId(firstHotspot?.id);
    }
  }, [selectedApt, activePhoto]);

  useEffect(() => {
    if (activePhoto && spotMenuRef.current) {
      const activeBtn = spotMenuRef.current.querySelector(`[data-id="${activePhoto.id}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activePhoto]);

  const handleHotspotSelect = (id: string) => {
    const spot = selectedApt?.hotspots.find(h => h.id === id);
    if (spot) {
      const photo = selectedApt?.photos.find(p => p.id === spot.photoId);
      if (photo) {
        setActivePhoto({ ...photo }); 
        setActiveHotspotId(id);
        if (window.innerWidth < 768) setIsSheetOpen(false);
      }
    }
  };

  const handlePhotoSelect = (photo: Photo360) => {
    setActivePhoto({ ...photo });
    const relatedHotspot = selectedApt?.hotspots.find(h => h.photoId === photo.id);
    setActiveHotspotId(relatedHotspot?.id);
    if (window.innerWidth < 768) setIsSheetOpen(false);
  };

  if (selectedApt) {
    let currentImageUrl = '';
    if (activePhoto) {
      if (isNightMode) {
        currentImageUrl = (showFurniture ? activePhoto.nightUrl : activePhoto.emptyNightUrl) || 
                         (showFurniture ? activePhoto.url : activePhoto.emptyUrl) || 
                         activePhoto.url;
      } else {
        currentImageUrl = (showFurniture ? activePhoto.url : activePhoto.emptyUrl) || activePhoto.url;
      }
    }

    return (
      <div className="fixed inset-0 bg-black flex flex-col overflow-hidden animate-in fade-in duration-500">
        
        {/* Floating Top Bar - Hidden in Clean View */}
        <div className={`absolute top-0 left-0 right-0 z-30 p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pointer-events-none transition-all duration-700 ${isCleanView ? 'opacity-0 -translate-y-12' : 'opacity-100 translate-y-0'}`}>
          <button 
            onClick={() => { setSelectedAptId(null); setActivePhoto(null); setActiveHotspotId(undefined); setIsCleanView(false); }}
            className="pointer-events-auto flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-xl text-white px-4 py-2 rounded-full transition font-bold border border-white/10 shadow-2xl"
          >
            <ChevronLeft size={20} /> <span className="text-sm font-bold uppercase tracking-widest">Back</span>
          </button>
          
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 text-white px-5 py-2.5 rounded-2xl flex flex-col shadow-2xl max-w-[280px] md:max-w-md pointer-events-auto">
            <h1 className="text-base md:text-xl font-extrabold truncate uppercase tracking-tight">{selectedApt.title}</h1>
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-white/60 font-medium">
              <MapPin size={12} /> {selectedApt.location}
            </div>
          </div>
        </div>

        {/* Clean View Toggle - Top Right */}
        <div className="absolute top-4 md:top-6 right-4 md:right-6 z-[60] pointer-events-none flex items-center gap-2">
          {isCleanView ? (
            <button 
              onClick={() => setIsCleanView(false)}
              className="pointer-events-auto bg-white text-slate-900 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl animate-in zoom-in-50 duration-300 flex items-center gap-2 border border-slate-200"
            >
              <EyeOff size={16} /> Show Interface
            </button>
          ) : (
            <button 
              onClick={() => setIsCleanView(true)}
              title="Clean View"
              className="pointer-events-auto bg-black/40 hover:bg-black/60 backdrop-blur-xl text-white p-3.5 rounded-2xl transition border border-white/10 shadow-2xl group"
            >
              <Eye size={22} className="group-hover:scale-110 transition" />
            </button>
          )}
        </div>

        {/* Main 360 Viewport - Orientation is preserved by keeping the same activePhoto.id key */}
        <div className="absolute inset-0 z-0">
          {activePhoto ? (
            <Viewer360 
              key={activePhoto.id} 
              imageUrl={currentImageUrl} 
              fov={fov}
              className="w-full h-full" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
              <div className="animate-spin text-blue-500 mb-4"><Camera size={48} /></div>
              <p className="font-black uppercase tracking-widest text-[10px]">Preparing Tour...</p>
            </div>
          )}
        </div>

        {/* HUD Controls - Integrated Row */}
        <div className={`absolute left-0 right-0 z-20 transition-all duration-700 pointer-events-none ${isSheetOpen ? 'opacity-0 translate-y-20' : 'bottom-0 opacity-100 translate-y-0'}`}>
          <div className={`flex flex-col items-center gap-4 transition-all duration-700 ${isCleanView ? 'pb-8 md:pb-10' : 'pb-16 md:pb-20'}`}>
            
            {/* Control Strip (FOV + Furniture + Time) */}
            <div className="flex flex-col md:flex-row items-center gap-3 pointer-events-auto">
              <div className="glass-card p-1.5 rounded-[20px] flex items-center gap-4 shadow-2xl border border-white/10">
                
                {/* FOV Selection (Left side, only text deg, hidden in clean view) */}
                {!isCleanView && (
                  <div className="flex items-center gap-1 border-r border-white/10 pr-4">
                    {[60, 90, 120].map((val) => (
                      <button
                        key={val}
                        onClick={() => setFov(val)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-widest ${fov === val ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                      >
                        {val}°
                      </button>
                    ))}
                  </div>
                )}

                {/* State Toggles (Middle, icons only) */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setShowFurniture(true)}
                      title="Furnished"
                      className={`p-2.5 rounded-xl transition-all duration-500 ${showFurniture ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-white/30 hover:text-white'}`}
                    >
                      <Sofa size={18} />
                    </button>
                    <button 
                      onClick={() => setShowFurniture(false)}
                      title="Empty"
                      className={`p-2.5 rounded-xl transition-all duration-500 ${!showFurniture ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-white/30 hover:text-white'}`}
                    >
                      <Eraser size={18} />
                    </button>
                  </div>

                  {!isCleanView && (
                    <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                      <button 
                        onClick={() => setIsNightMode(false)}
                        title="Day Mode"
                        className={`p-2.5 rounded-xl transition-all duration-500 ${!isNightMode ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' : 'text-white/30 hover:text-white'}`}
                      >
                        <Sun size={18} />
                      </button>
                      <button 
                        onClick={() => setIsNightMode(true)}
                        title="Night Mode"
                        className={`p-2.5 rounded-xl transition-all duration-500 ${isNightMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-white/30 hover:text-white'}`}
                      >
                        <Moon size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Horizontal Spot Selector Menu - Apple-inspired smooth slider */}
            <div className="w-full max-w-2xl px-6 pointer-events-auto">
              <div 
                ref={spotMenuRef}
                className="flex items-center gap-3 overflow-x-auto no-scrollbar py-3 px-6 bg-black/40 backdrop-blur-3xl rounded-[28px] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] scroll-smooth snap-x"
              >
                {selectedApt.photos.map((photo) => {
                  const isActive = activePhoto?.id === photo.id;
                  const hotspot = selectedApt.hotspots.find(h => h.photoId === photo.id);
                  const label = hotspot?.label || photo.name;
                  
                  return (
                    <button
                      key={photo.id}
                      data-id={photo.id}
                      onClick={() => handlePhotoSelect(photo)}
                      className={`spot-item snap-center whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 border-2 ${
                        isActive 
                        ? 'bg-blue-600 text-white border-blue-400/30 shadow-[0_0_25px_rgba(37,99,235,0.45)]' 
                        : 'bg-white/5 text-white/30 border-transparent hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Drawer / Sidebar */}
        <div 
          className={`fixed inset-x-0 bottom-0 z-40 bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.4)] transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1) rounded-t-[40px] md:rounded-none md:relative md:inset-auto md:w-96 md:h-full md:translate-y-0 ${isCleanView ? 'translate-y-full opacity-0' : (isSheetOpen ? 'translate-y-0 h-[80vh] opacity-100' : 'translate-y-[calc(80vh-48px)] md:translate-y-0 h-[80vh] opacity-100')}`}
        >
          {/* Mobile Handle / Header */}
          <div 
            onClick={() => setIsSheetOpen(!isSheetOpen)}
            className="h-12 flex flex-col items-center justify-center cursor-pointer md:hidden border-b border-slate-50 bg-white rounded-t-[40px] px-8"
          >
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-1 opacity-50" />
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <MapIcon size={12} className="text-blue-600" /> Area Plan
              </span>
              <div className="bg-slate-50 p-1 rounded-full text-slate-300">
                {isSheetOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
            </div>
          </div>

          <div className="h-full flex flex-col overflow-hidden">
            <div className="hidden md:block p-8 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-1 uppercase tracking-tight">
                <MapIcon size={20} className="text-blue-600" /> Floor Map
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Select room to teleport</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 bg-slate-50 flex items-center justify-center border-b border-slate-100 overflow-x-hidden">
                <div className="w-full max-w-full overflow-hidden scale-90 md:scale-100 origin-center">
                  <FloorPlanDesigner 
                    isReadOnly
                    points={selectedApt.floorPlanPoints}
                    hotspots={selectedApt.hotspots}
                    photos={selectedApt.photos}
                    onUpdatePoints={() => {}}
                    onUpdateHotspots={() => {}}
                    activeHotspotId={activeHotspotId}
                    onSelectHotspot={handleHotspotSelect}
                  />
                </div>
              </div>

              <div className="p-8 space-y-10">
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Maximize2 size={12} className="text-blue-500"/> Total Area</div>
                    <div className="text-lg font-black text-slate-900">{selectedApt.area}</div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><BedDouble size={12} className="text-blue-500"/> Layout</div>
                    <div className="text-lg font-black text-slate-900">{selectedApt.rooms} Rooms</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Property Overview</div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedApt.description}</p>
                </div>

                <div className="pt-4 pb-16 md:pb-12">
                  <div className="flex flex-col gap-1 mb-8">
                    <span className="text-xs text-slate-400 font-black uppercase tracking-widest">Market Value</span>
                    <span className="text-4xl font-black text-blue-600 tracking-tighter">{selectedApt.price}</span>
                  </div>
                  <button className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-[24px] shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95 text-xs uppercase tracking-[0.3em]">
                    Contact Agent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <header className="mb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-none">V-Tour Estates</h1>
        <p className="text-slate-500 max-w-xl mx-auto font-medium text-lg md:text-xl">Discover architectural excellence through immersive spatial exploration.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {apartments.map(apt => (
          <div 
            key={apt.id} 
            className="group bg-white rounded-[40px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-3"
          >
            <div className="relative h-80 overflow-hidden">
              <img src={apt.mainImage} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" alt={apt.title} />
              <div className="absolute top-6 left-6 bg-white/95 px-5 py-2 rounded-full text-[10px] font-black text-blue-600 shadow-2xl tracking-[0.2em] uppercase">Premier Listing</div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-500 flex items-center justify-center p-8 backdrop-blur-[2px]">
                <button onClick={() => setSelectedAptId(apt.id)} className="bg-white text-slate-900 font-black px-10 py-4 rounded-[20px] shadow-2xl transform translate-y-6 group-hover:translate-y-0 transition duration-700 uppercase text-[10px] tracking-[0.3em]">Enter Virtual Home</button>
              </div>
            </div>
            <div className="p-8 md:p-10">
              <div className="flex flex-col mb-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1 truncate">{apt.title}</h3>
                <span className="text-xl font-black text-blue-600">{apt.price}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-8 font-black uppercase tracking-widest">
                <MapPin size={14} className="text-blue-500" /> {apt.location}
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest"><Maximize2 size={16} className="text-slate-300" /> {apt.area}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest"><Camera size={16} className="text-slate-300" /> {apt.photos.length} 360° Spots</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerView;
