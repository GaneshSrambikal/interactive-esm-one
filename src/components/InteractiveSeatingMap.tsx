import React, { useState, useMemo, useRef } from 'react';
import { useVenue } from '../hooks/useVenue';
import { useSelection } from '../hooks/useSelection';
import { useNavigation } from '../hooks/useNavigation';
import { useMapInteraction } from '../hooks/useMapInteraction';
import { Header } from './Header';
import { StatusMessage } from './StatusMessage';
import { MapCanvas } from './MapCanvas';
import { Legend } from './Legend';
import { SeatDetails } from './SeatDetails';
import { SelectedSeats } from './SelectedSeats';

const InteractiveSeatingMap: React.FC = () => {
  const { venue, error, loading } = useVenue();
  const { selectedSeats, toggleSeat, findAdjacentSeats, clearSelection } = useSelection(venue);
  const { focusedSeat, setFocusedSeat, seatRefs, focusSeatById, findNextSeat } = useNavigation(venue);
  const { scale, pan, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel, zoomIn, zoomOut, resetZoom } = useMapInteraction();

  const [darkMode, setDarkMode] = useState(false);
  const [heatMapMode, setHeatMapMode] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null) as React.RefObject<SVGSVGElement>;

  const allSeats = useMemo(() => {
    if (!venue) return [];
    return venue.sections.flatMap(section =>
      section.rows.flatMap(row => row.seats)
    );
  }, [venue]);

  if (loading || error || !venue) {
    return <StatusMessage loading={loading} error={error} onRetry={() => window.location.reload()} />;
  }

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-100';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors`}>
      <Header
        venueName={venue.name}
        seatCount={allSeats.length}
        darkMode={darkMode}
        heatMapMode={heatMapMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onToggleHeatMap={() => setHeatMapMode(!heatMapMode)}
        onFindAdjacent={findAdjacentSeats}
        cardBg={cardBg}
      />

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto p-4 gap-4">
        <div className="flex-1">
          <div className={`${cardBg} rounded-xl shadow-lg p-4`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">🎭 Seating Map</h2>
              <div className="flex gap-2">
                <button
                  onClick={zoomOut}
                  className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 transition"
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  ➖
                </button>
                <button
                  onClick={resetZoom}
                  className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded text-sm hover:bg-gray-400 transition"
                  title="Reset zoom"
                >
                  Reset
                </button>
                <button
                  onClick={zoomIn}
                  className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 transition"
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  ➕
                </button>
              </div>
            </div>

            <MapCanvas
              venue={venue}
              allSeats={allSeats}
              selectedSeats={selectedSeats}
              focusedSeat={focusedSeat}
              heatMapMode={heatMapMode}
              pan={pan}
              scale={scale}
              svgRef={svgRef}
              seatRefs={seatRefs}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              onToggleSeat={toggleSeat}
              onFocusSeat={setFocusedSeat}
              onFindNextSeat={findNextSeat}
              onFocusSeatById={focusSeatById}
            />

            <Legend />
          </div>
        </div>

        <div className="lg:w-96 space-y-4">
          <SeatDetails focusedSeat={focusedSeat} cardBg={cardBg} />

          <SelectedSeats
            selectedSeats={selectedSeats}
            allSeats={allSeats}
            onClear={clearSelection}
            cardBg={cardBg}
          />

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
