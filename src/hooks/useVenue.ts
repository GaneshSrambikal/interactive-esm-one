import { useState, useEffect } from 'react';
import type { VenueData } from '../types';
import { loadVenueData } from '../utils';

export const useVenue = () => {
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const venueData = await loadVenueData();
        setVenue(venueData);
      } catch (err) {
        setError('Failed to load venue data. Please make sure venue.json exists in the public folder.');
        console.error('Error loading venue:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { venue, error, loading };
};
