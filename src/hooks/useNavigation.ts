import { useState, useMemo, useCallback, useRef } from 'react';
import type { VenueData, SeatData } from '../types';

export const useNavigation = (venue: VenueData | null) => {
  const [focusedSeat, setFocusedSeat] = useState<SeatData | null>(null);
  const seatRefs = useRef<Map<string, SVGCircleElement | null>>(new Map());

  // Build quick lookup maps for keyboard navigation (only considering available seats)
  const seatNavigation = useMemo(() => {
    const sectionsMap = new Map<string, Map<number, SeatData[]>>();
    const seatIdToLoc = new Map<string, { sectionId: string; rowIndex: number; idxInRow: number }>();

    if (!venue) return { sectionsMap, seatIdToLoc };

    for (const section of venue.sections) {
      const rowMap = new Map<number, SeatData[]>();
      for (const row of section.rows) {
        // Only consider available seats for navigation/selection
        const availableSeats = row.seats
          .filter(s => s.status === 'available')
          .slice()
          .sort((a, b) => a.col - b.col);

        if (availableSeats.length > 0) {
          rowMap.set(row.index, availableSeats);
          availableSeats.forEach((s, idx) => seatIdToLoc.set(s.id, { sectionId: section.id, rowIndex: row.index, idxInRow: idx }));
        }
      }
      sectionsMap.set(section.id, rowMap);
    }

    return { sectionsMap, seatIdToLoc };
  }, [venue]);

  const focusSeatById = useCallback((id: string | null) => {
    if (!id) return;
    const el = seatRefs.current.get(id);
    try {
      el?.focus();
    } catch (err) {
      console.error('Failed to focus seat', err);
    }
  }, []);

  const findNextSeat = useCallback((currentId: string, key: string): string | null => {
    const { sectionsMap, seatIdToLoc } = seatNavigation;
    const loc = seatIdToLoc.get(currentId);
    if (!loc) return null;

    const rowMap = sectionsMap.get(loc.sectionId);
    if (!rowMap) return null;

    const currentRowSeats = rowMap.get(loc.rowIndex) ?? [];

    if (key === 'ArrowLeft') {
      const prev = currentRowSeats[loc.idxInRow - 1];
      return prev ? prev.id : null;
    }

    if (key === 'ArrowRight') {
      const next = currentRowSeats[loc.idxInRow + 1];
      return next ? next.id : null;
    }

    if (key === 'ArrowUp' || key === 'ArrowDown') {
      // find the next row index in the direction that has available seats
      const rowIndices = Array.from(rowMap.keys()).sort((a, b) => a - b);
      const currentRowPos = rowIndices.indexOf(loc.rowIndex);
      const dir = key === 'ArrowUp' ? -1 : 1;
      let nextRowPos = currentRowPos + dir;

      while (nextRowPos >= 0 && nextRowPos < rowIndices.length) {
        const nextRowIndex = rowIndices[nextRowPos];
        const candidates = rowMap.get(nextRowIndex)!;
        if (candidates && candidates.length > 0) {
          // try to find seat with same col as current, otherwise nearest by col
          const currentSeat = currentRowSeats[loc.idxInRow];
          if (!currentSeat) return candidates[0].id;
          let best: SeatData | null = null;
          let bestDiff = Infinity;
          for (const c of candidates) {
            const diff = Math.abs(c.col - currentSeat.col);
            if (diff < bestDiff) {
              bestDiff = diff;
              best = c;
            }
          }
          return best ? best.id : null;
        }
        nextRowPos += dir;
      }
    }

    return null;
  }, [seatNavigation]);

  return { focusedSeat, setFocusedSeat, seatRefs, focusSeatById, findNextSeat };
};
