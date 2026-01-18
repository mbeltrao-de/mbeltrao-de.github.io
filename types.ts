
export interface Point {
  x: number;
  y: number;
}

export interface Hotspot {
  id: string;
  photoId: string;
  position: Point;
  label: string;
}

export interface Photo360 {
  id: string;
  url: string; // Day Furnished
  emptyUrl?: string; // Day Empty
  nightUrl?: string; // Night Furnished
  emptyNightUrl?: string; // Night Empty
  name: string;
  description: string;
}

export interface Apartment {
  id: string;
  title: string;
  price: string;
  location: string;
  description: string;
  area: string;
  rooms: number;
  mainImage: string;
  photos: Photo360[];
  floorPlanPoints: Point[];
  hotspots: Hotspot[];
}

export type ViewMode = 'customer' | 'admin';
