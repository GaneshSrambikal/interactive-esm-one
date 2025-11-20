export interface SeatData {
  id: string;
  col: number;
  x: number;
  y: number;
  priceTier: number;
  status: 'available' | 'reserved' | 'sold' | 'held';
}

export interface Row {
  index: number;
  seats: SeatData[];
}

export interface Section {
  id: string;
  label: string;
  transform: { x: number; y: number; scale: number };
  rows: Row[];
}

export interface VenueData {
  venueId: string;
  name: string;
  map: { width: number; height: number };
  sections: Section[];
}
