import { useState, useEffect, useRef, useCallback } from 'react';
import type { VenueData, SeatData } from '../types';
import { STORAGE_KEY } from '../constants';

export const useSelection = (venue: VenueData | null) => {
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const restoredRef = useRef(false);

  // Restore AFTER venue loads
  useEffect(() => {
    if (!venue) return;
    if (restoredRef.current) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      restoredRef.current = true;
      return;
    }

    try {
      const ids = JSON.parse(saved) as string[];
      const valid = new Set<string>();

      for (const s of venue.sections.flatMap(sec => sec.rows.flatMap(r => r.seats))) {
        if (s.status === "available" && ids.includes(s.id)) {
          valid.add(s.id);
        }
      }

      // schedule the state update asynchronously to avoid cascading renders inside an effect
      setTimeout(() => {
        setSelectedSeats(valid);
        restoredRef.current = true;
      }, 0);
    } catch (err) {
      console.warn("Failed to restore seats", err);
      restoredRef.current = true;
    }
  }, [venue]);

  // Save AFTER restore completed
  useEffect(() => {
    if (!restoredRef.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedSeats]));
  }, [selectedSeats]);

  const toggleSeat = useCallback((seat: SeatData) => {
    if (seat.status !== 'available') return;

    setSelectedSeats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seat.id)) {
        newSet.delete(seat.id);
      } else if (newSet.size < 8) {
        newSet.add(seat.id);
      }
      return newSet;
    });
  }, []);

  const findAdjacentSeats = useCallback((count: number) => {
    if (!venue) return;

    for (const section of venue.sections) {
      for (const row of section.rows) {
        const availableSeats = row.seats.filter(s => s.status === 'available');
        for (let i = 0; i <= availableSeats.length - count; i++) {
          const consecutive = availableSeats.slice(i, i + count);
          const areAdjacent = consecutive.every((seat, idx) =>
            idx === 0 || seat.col === consecutive[idx - 1].col + 1
          );

          if (areAdjacent) {
            setSelectedSeats(new Set(consecutive.map(s => s.id)));
            return;
          }
        }
      }
    }
    alert(`No ${count} adjacent seats found`);
  }, [venue]);

  const clearSelection = useCallback(() => {
    setSelectedSeats(new Set());
  }, []);

  return { selectedSeats, toggleSeat, findAdjacentSeats, clearSelection };
};
