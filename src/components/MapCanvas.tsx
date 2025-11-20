import React from 'react';
import type { VenueData, SeatData } from '../types';
import { Seat } from './Seat';

interface MapCanvasProps {
    venue: VenueData;
    allSeats: SeatData[];
    selectedSeats: Set<string>;
    focusedSeat: SeatData | null;
    heatMapMode: boolean;
    pan: { x: number; y: number };
    scale: number;
    svgRef: React.RefObject<SVGSVGElement>;
    seatRefs: React.MutableRefObject<Map<string, SVGCircleElement | null>>;
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
    onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
    onWheel: (e: React.WheelEvent<SVGSVGElement>) => void;
    onToggleSeat: (seat: SeatData) => void;
    onFocusSeat: (seat: SeatData | null) => void;
    onFindNextSeat: (currentId: string, key: string) => string | null;
    onFocusSeatById: (id: string | null) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
    venue,
    allSeats,
    selectedSeats,
    focusedSeat,
    heatMapMode,
    pan,
    scale,
    svgRef,
    seatRefs,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onToggleSeat,
    onFocusSeat,
    onFindNextSeat,
    onFocusSeatById
}) => {
    return (
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
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onWheel={onWheel}
                style={{ touchAction: "none" }}
            >
                <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
                    {allSeats.map(seat => (
                        <Seat
                            key={seat.id}
                            seat={seat}
                            isSelected={selectedSeats.has(seat.id)}
                            isFocused={focusedSeat?.id === seat.id}
                            heatMapMode={heatMapMode}
                            onToggle={onToggleSeat}
                            onFocus={onFocusSeat}
                            onBlur={() => onFocusSeat(null)}
                            seatRef={(el) => { seatRefs.current.set(seat.id, el); }}
                            onKeyDown={(e, s) => {
                                if (s.status !== 'available') return;
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onToggleSeat(s);
                                    return;
                                }

                                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                                    e.preventDefault();
                                    const next = onFindNextSeat(s.id, e.key);
                                    if (next) onFocusSeatById(next);
                                }
                            }}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
};
