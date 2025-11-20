
import type { VenueData } from "../types";

export const loadVenueData = async (): Promise<VenueData> => {
  try {
    const response = await fetch('/venue.json');
    if (!response.ok) {
      throw new Error('Failed to load venue data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading venue data:', error);
    throw error;
  }
};
