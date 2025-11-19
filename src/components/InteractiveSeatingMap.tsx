import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Types
interface SeatData {
  id: string;
  col: number;
  x: number;
  y: number;
  priceTier: number;
  status: 'available' | 'reserved' | 'sold' | 'held';
}

interface Row {
  index: number;
  seats: SeatData[];
}

interface Section {
  id: string;
  label: string;
  transform: { x: number; y: number; scale: number };
  rows: Row[];
}

interface VenueData {
  venueId: string;
  name: string;
  map: { width: number; height: number };
  sections: Section[];
}

// Load venue data from JSON file
const loadVenueData = async (): Promise<VenueData> => {
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

const PRICE_TIERS: Record<number, { price: number; color: string }> = {
  1: { price: 150, color: '#10b981' },
  2: { price: 100, color: '#3b82f6' },
  3: { price: 50, color: '#8b5cf6' }
};

const STORAGE_KEY = 'selected-seats';

const InteractiveSeatingMap: React.FC = () => {
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [focusedSeat, setFocusedSeat] = useState<SeatData | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [heatMapMode, setHeatMapMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const seatRefs = useRef<Map<string, SVGCircleElement | null>>(new Map());

  const [pan, setPan] = useState({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  // const lastTouchDist = useRef<number | null>(null);


  useEffect(() => {
    const loadData = async () => {
      try {
        const venueData = await loadVenueData();
        setVenue(venueData);
      } catch (err) {
        setError('Failed to load venue data. Please make sure venue.json exists in the public folder.');
        console.error('Error loading venue:', err);
      }
    };

    loadData();
  }, []);

  const restoredRef = useRef(false);

  // Restore AFTER venue loads
  useEffect(() => {
    if (!venue) return;

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
      return;
    } catch (err) {
      console.warn("Failed to restore seats", err);
    }

    restoredRef.current = true;
  }, [venue]);

  // Save AFTER restore completed
  useEffect(() => {
    if (!restoredRef.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedSeats]));
  }, [selectedSeats]);


  // useEffect(() => {
  //   localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedSeats]));
  // }, [selectedSeats]);

  const allSeats = useMemo(() => {
    if (!venue) return [];
    return venue.sections.flatMap(section =>
      section.rows.flatMap(row => row.seats)
    );
  }, [venue]);

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
    const { sectionsMap, seatIdToLoc } = seatNavigation as { sectionsMap: Map<string, Map<number, SeatData[]>>; seatIdToLoc: Map<string, { sectionId: string; rowIndex: number; idxInRow: number }> };
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

  const totalPrice = useMemo(() => {
    return allSeats
      .filter(seat => selectedSeats.has(seat.id))
      .reduce((sum, seat) => sum + PRICE_TIERS[seat.priceTier].price, 0);
  }, [allSeats, selectedSeats]);

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md p-8 bg-red-900 bg-opacity-50 rounded-lg">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold mb-2">Error Loading Venue</h2>
          <p className="text-sm opacity-90 mb-4">{error}</p>
          <p className="text-xs opacity-75">Make sure venue.json is in the public folder</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading venue...</p>
        </div>
      </div>
    );
  }

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-100';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    isDragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging.current) return;

    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;

    last.current = { x: e.clientX, y: e.clientY };

    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;

    setScale((s) => Math.min(4, Math.max(0.4, s * zoom)));
  };

  // const getTouchDistance = (touches: TouchList) => {
  //   const [a, b] = [touches[0], touches[1]];
  //   return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  // };

  // const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
  //   if (e.touches.length === 2) {
  //     // Pinch zoom
  //     const dist = getTouchDistance(e.touches);

  //     if (lastTouchDist.current) {
  //       const zoom = dist > lastTouchDist.current ? 1.05 : 0.95;
  //       setScale((s) => Math.min(4, Math.max(0.4, s * zoom)));
  //     }

  //     lastTouchDist.current = dist;
  //     return;
  //   }
  // };

  // const handleTouchEnd = () => {
  //   lastTouchDist.current = null;
  // };



  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors`}>
      <header className={`${cardBg} shadow-lg p-4 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📍</span>
            <div>
              <h1 className="text-2xl font-bold">{venue.name}</h1>
              <p className="text-sm opacity-70">{allSeats.length.toLocaleString()} seats</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => findAdjacentSeats(2)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
              aria-label="Find 2 adjacent seats"
            >
              🔍 Find 2 Seats
            </button>
            <button
              onClick={() => setHeatMapMode(!heatMapMode)}
              className={`px-3 py-2 rounded-lg text-sm transition ${heatMapMode ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
              aria-label="Toggle heat map"
            >
              {heatMapMode ? '🎨 Normal View' : '🔥 Heat Map'}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition text-2xl"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto p-4 gap-4">
        <div className="flex-1">
          <div className={`${cardBg} rounded-xl shadow-lg p-4`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">🎭 Seating Map</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setScale(s => Math.max(s / 1.5, 0.5))}
                  className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 transition"
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  ➖
                </button>
                <button
                  onClick={() => setScale(1)}
                  className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded text-sm hover:bg-gray-400 transition"
                  title="Reset zoom"
                >
                  Reset
                </button>
                <button
                  onClick={() => setScale(s => Math.min(s * 1.5, 5))}
                  className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 transition"
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  ➕
                </button>
              </div>
            </div>

            <div
              className="border rounded-lg overflow-auto bg-gray-50 dark:bg-gray-950"
              style={{ height: '500px' }}
            >
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${venue.map.width} ${venue.map.height}`}
                className="mx-auto"
                role="application"
                aria-label="Interactive seating map"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
                // onTouchMove={handleTouchMove}
                // onTouchEnd={handleTouchEnd}
                style={{ touchAction: "none" }}
              >
                <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
                  {allSeats.map(seat => {
                    const isSelected = selectedSeats.has(seat.id);
                    const isFocused = focusedSeat?.id === seat.id;

                    let fill = '#d1d5db';
                    if (seat.status === 'available') {
                      fill = heatMapMode ? PRICE_TIERS[seat.priceTier].color : '#10b981';
                    } else if (seat.status === 'reserved') fill = '#f59e0b';
                    else if (seat.status === 'sold') fill = '#ef4444';
                    if (isSelected) fill = '#3b82f6';

                    return (
                      <circle
                        key={seat.id}
                        ref={(el: SVGCircleElement | null) => { seatRefs.current.set(seat.id, el); }}
                        cx={seat.x}
                        cy={seat.y}
                        r={3}
                        fill={fill}
                        stroke={isFocused ? '#fff' : 'none'}
                        strokeWidth={isFocused ? 2 : 0}
                        className={seat.status === 'available' ? 'cursor-pointer hover:opacity-80 transition' : 'cursor-not-allowed'}
                        focusable="true"
                        aria-disabled={seat.status !== 'available'}
                        aria-pressed={isSelected}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        onPointerUp={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={() => {
                          if (seat.status === 'available') toggleSeat(seat);
                        }}
                        onFocus={() => setFocusedSeat(seat)}
                        onBlur={() => setFocusedSeat(null)}
                        onMouseEnter={() => setFocusedSeat(seat)}
                        onMouseLeave={() => setFocusedSeat(null)}
                        tabIndex={seat.status === 'available' ? 0 : -1}
                        onKeyDown={(e) => {
                          if (seat.status !== 'available') return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSeat(seat);
                            return;
                          }

                          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                            e.preventDefault();
                            const next = findNextSeat(seat.id, e.key);
                            if (next) focusSeatById(next);
                          }
                        }}
                        aria-label={`Seat ${seat.id}, ${seat.status}, $${PRICE_TIERS[seat.priceTier].price}`}
                        role="button"
                      />
                    );
                  })}
                </g>
              </svg>
            </div>


            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>Sold</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-96 space-y-4">
          {focusedSeat && (
            <div className={`${cardBg} rounded-xl shadow-lg p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">ℹ️</span>
                <h3 className="font-semibold">Seat Details</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Seat ID:</strong> {focusedSeat.id}</p>
                <p><strong>Status:</strong> <span className="capitalize">{focusedSeat.status}</span></p>
                <p><strong>Price:</strong> ${PRICE_TIERS[focusedSeat.priceTier].price}</p>
                <p><strong>Tier:</strong> {focusedSeat.priceTier}</p>
              </div>
            </div>
          )}

          <div className={`${cardBg} rounded-xl shadow-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">🎫 Selected Seats ({selectedSeats.size}/8)</h3>
              {selectedSeats.size > 0 && (
                <button
                  onClick={() => setSelectedSeats(new Set())}
                  className="text-red-500 hover:text-red-700 text-xl transition"
                  aria-label="Clear selection"
                  title="Clear all selections"
                >
                  ✕
                </button>
              )}
            </div>

            {selectedSeats.size === 0 ? (
              <p className="text-sm opacity-70">No seats selected yet. Click on green seats to select.</p>
            ) : (
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {[...selectedSeats].map(seatId => {
                    const seat = allSeats.find(s => s.id === seatId);
                    if (!seat) return null;
                    return (
                      <div key={seatId} className="flex justify-between text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded">
                        <span className="font-mono">{seatId}</span>
                        <span className="font-semibold">${PRICE_TIERS[seat.priceTier].price}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600 dark:text-blue-400">${totalPrice}</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition transform hover:scale-105">
                  🛒 Proceed to Checkout
                </button>
              </div>
            )}
          </div>

          <div className={`${cardBg} rounded-xl shadow-lg p-4 text-xs opacity-75`}>
            <p>💡 <strong>Tip:</strong> Use Tab key to navigate, Enter/Space to select seats</p>
            <p className="mt-1">📱 Selections persist across page reloads</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveSeatingMap;