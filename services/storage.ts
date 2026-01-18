
import { Apartment } from '../types';

const DB_NAME = 'VTourEstatesDB';
const STORE_NAME = 'apartments';
const DB_VERSION = 1;

const DEFAULT_APARTMENTS: Apartment[] = [
  {
    id: '1',
    title: 'Azure Skyline Penthouse',
    price: '$1,250,000',
    location: 'Downtown Manhattan, NY',
    description: 'A stunning penthouse with floor-to-ceiling windows and panoramic city views.',
    area: '240 sqm',
    rooms: 4,
    mainImage: 'https://picsum.photos/seed/apt1/800/600',
    photos: [],
    floorPlanPoints: [
      { x: 50, y: 50 }, { x: 350, y: 50 }, { x: 350, y: 250 }, { x: 50, y: 250 }
    ],
    hotspots: []
  }
];

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getApartments = async (): Promise<Apartment[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.length > 0) {
          resolve(result);
        } else {
          resolve(DEFAULT_APARTMENTS);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting apartments from IndexedDB:', error);
    return DEFAULT_APARTMENTS;
  }
};

export const saveApartments = async (apartments: Apartment[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Clear existing to sync perfectly with the state
    store.clear().onsuccess = () => {
      let completed = 0;
      if (apartments.length === 0) resolve();
      
      apartments.forEach((apt) => {
        const request = store.add(apt);
        request.onsuccess = () => {
          completed++;
          if (completed === apartments.length) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    };

    transaction.onerror = () => reject(transaction.error);
  });
};

export const getApartmentById = async (id: string): Promise<Apartment | undefined> => {
  const apts = await getApartments();
  return apts.find(a => a.id === id);
};
