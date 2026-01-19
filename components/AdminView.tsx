import React, { useState, useEffect } from 'react';
import { Apartment, Photo360, Point, Hotspot } from '../types';
import { getApartments, saveApartments } from '../services/storage';
import { Plus, Save, Trash2, Home, Camera, Image as ImageIcon, Map, CheckCircle2, AlertCircle, Sofa, Eraser, Moon, Sun } from 'lucide-react';
import FloorPlanDesigner from './FloorPlanDesigner';

const AdminView: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'layout'>('info');
  const [activeHotspotId, setActiveHotspotId] = useState<string | undefined>();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadData = async () => {
      const data = await getApartments();
      setApartments(data);
    };
    loadData();
  }, []);

  const selectedApt = apartments.find(a => a.id === selectedAptId);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await saveApartments(apartments);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('error');
      alert("Failed to save data to the browser.");
    }
  };

  const updateSelectedApt = (updates: Partial<Apartment>) => {
    if (!selectedAptId) return;
    setApartments(prev => prev.map(a => a.id === selectedAptId ? { ...a, ...updates } : a));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, photoId?: string, type: 'day' | 'night' | 'dayEmpty' | 'nightEmpty' = 'day') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      if (!photoId) {
        const newPhoto: Photo360 = {
          id: Math.random().toString(36).substr(2, 9),
          url: base64,
          name: file.name.split('.')[0],
          description: 'New 360 view'
        };
        if (selectedApt) {
          updateSelectedApt({ photos: [...selectedApt.photos, newPhoto] });
        }
      } else {
        const newPhotos = selectedApt!.photos.map(p => {
          if (p.id === photoId) {
            switch(type) {
              case 'day': return { ...p, url: base64 };
              case 'night': return { ...p, nightUrl: base64 };
              case 'dayEmpty': return { ...p, emptyUrl: base64 };
              case 'nightEmpty': return { ...p, emptyNightUrl: base64 };
              default: return p;
            }
          }
          return p;
        });
        updateSelectedApt({ photos: newPhotos });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Home size={20} className="text-blue-600" /> Dashboard
          </h2>
          <button 
            onClick={() => {
              const newApt: Apartment = {
                id: Math.random().toString(36).substr(2, 9),
                title: 'New Listing', price: '$0', location: 'City, State', description: '', area: '0 sqm', rooms: 0,
                mainImage: 'https://picsum.photos/seed/new/800/600', photos: [], floorPlanPoints: [], hotspots: []
              };
              setApartments([...apartments, newApt]);
              setSelectedAptId(newApt.id);
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-bold shadow-md shadow-blue-100"
          >
            <Plus size={18} /> New Apartment
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {apartments.map(apt => (
            <button
              key={apt.id}
              onClick={() => setSelectedAptId(apt.id)}
              className={`w-full text-left p-4 rounded-xl transition border ${selectedAptId === apt.id ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
            >
              <div className="font-bold text-slate-800 truncate">{apt.title}</div>
              <div className="text-sm text-slate-500 mt-1">{apt.location}</div>
            </button>
          ))}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition font-bold shadow-md ${
              saveStatus === 'success' ? 'bg-emerald-500 text-white' : 
              saveStatus === 'error' ? 'bg-red-500 text-white' :
              'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {saveStatus === 'success' ? <CheckCircle2 size={18} /> : 
             saveStatus === 'error' ? <AlertCircle size={18} /> : 
             <Save size={18} />}
            {saveStatus === 'saving' ? 'Saving...' : 
             saveStatus === 'success' ? 'Saved Successfully' : 
             status === 'error' ? 'Save Failed' : 'Save All Changes'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {!selectedApt ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="bg-slate-100 p-6 rounded-full mb-4"><Home size={48} /></div>
            <p className="text-lg">Select an apartment from the sidebar to begin editing</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900">{selectedApt.title}</h1>
              <button 
                onClick={() => { if (confirm("Delete this listing?")) { setApartments(prev => prev.filter(a => a.id !== selectedAptId)); setSelectedAptId(null); } }}
                className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm font-bold transition"
              >
                <Trash2 size={16} /> Delete Listing
              </button>
            </div>

            <div className="flex gap-4 border-b border-slate-200 mb-8">
              {[
                { id: 'info', label: 'Information', icon: <Home size={18} /> },
                { id: 'photos', label: '360 Photos', icon: <Camera size={18} /> },
                { id: 'layout', label: 'Floor Plan & Spots', icon: <Map size={18} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-4 px-2 text-sm font-bold transition border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                    <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none text-slate-900" value={selectedApt.title} onChange={e => updateSelectedApt({ title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Price</label>
                    <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none text-slate-900" value={selectedApt.price} onChange={e => updateSelectedApt({ price: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                    <input className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none text-slate-900" value={selectedApt.location} onChange={e => updateSelectedApt({ location: e.target.value })} />
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Virtual Tour Spots</h3>
                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-bold shadow-md">
                      <Plus size={18} /> Add New Spot
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e)} />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-8">
                    {selectedApt.photos.map(p => (
                      <div key={p.id} className="border border-slate-200 rounded-3xl p-6 bg-slate-50 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                          <input 
                            className="bg-transparent text-lg font-bold text-slate-800 border-b border-transparent focus:border-blue-500 outline-none w-1/2"
                            value={p.name}
                            onChange={e => updateSelectedApt({ photos: selectedApt.photos.map(ph => ph.id === p.id ? { ...ph, name: e.target.value } : ph) })}
                          />
                          <button onClick={() => updateSelectedApt({ photos: selectedApt.photos.filter(ph => ph.id !== p.id) })} className="text-red-500 hover:text-red-600 transition p-2"><Trash2 size={20} /></button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Day Furnished', type: 'day', icon: <Sun size={12}/>, url: p.url },
                            { label: 'Night Furnished', type: 'night', icon: <Moon size={12}/>, url: p.nightUrl },
                            { label: 'Day Empty', type: 'dayEmpty', icon: <Eraser size={12}/>, url: p.emptyUrl },
                            { label: 'Night Empty', type: 'nightEmpty', icon: <Moon size={12}/>, url: p.emptyNightUrl },
                          ].map((img) => (
                            <div key={img.type} className="space-y-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">{img.icon} {img.label}</span>
                              <div className="relative aspect-square bg-slate-200 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 group">
                                {img.url ? (
                                  <>
                                    <img src={img.url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                      <label className="cursor-pointer bg-white text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold">Replace</label>
                                    </div>
                                  </>
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                    <Plus size={16} className="text-slate-400" />
                                    <span className="text-[9px] text-slate-400 font-bold">Add</span>
                                  </div>
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handlePhotoUpload(e, p.id, img.type as any)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'layout' && (
                <FloorPlanDesigner 
                  points={selectedApt.floorPlanPoints}
                  hotspots={selectedApt.hotspots}
                  photos={selectedApt.photos}
                  onUpdatePoints={(points) => updateSelectedApt({ floorPlanPoints: points })}
                  onUpdateHotspots={(hotspots) => updateSelectedApt({ hotspots })}
                  activeHotspotId={activeHotspotId}
                  onSelectHotspot={setActiveHotspotId}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;