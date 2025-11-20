import React from 'react';
import type { SeatData } from '../types';
import { PRICE_TIERS } from '../constants';

interface SeatProps {
    seat: SeatData;
    isSelected: boolean;
    isFocused: boolean;
    heatMapMode: boolean;
    onToggle: (seat: SeatData) => void;
    onFocus: (seat: SeatData) => void;
    onBlur: () => void;
    onKeyDown: (e: React.KeyboardEvent, seat: SeatData) => void;
    seatRef: (el: SVGCircleElement | null) => void;
}

export const Seat: React.FC<SeatProps> = ({
    seat,
    isSelected,
    isFocused,
    heatMapMode,
    onToggle,
    onFocus,
    onBlur,
    onKeyDown,
    seatRef
}) => {
    let fill = '#d1d5db';
    if (seat.status === 'available') {
        fill = heatMapMode ? PRICE_TIERS[seat.priceTier].color : '#10b981';
    } else if (seat.status === 'reserved') fill = '#f59e0b';
    else if (seat.status === 'sold') fill = '#ef4444';
    if (isSelected) fill = '#3b82f6';

    return (
        <circle
            ref={seatRef}
            cx={seat.x}
            cy={seat.y}
            r={3}
            fill={fill}
            stroke={isFocused ? '#fff' : 'none'}
            strokeWidth={isFocused ? 2 : 0}
            className={seat.status === 'available' ? 'cursor-pointer hover:opacity-80 transition' : 'cursor-not-allowed'}
            focusable="true"
            aria-disabled={seat.status !== 'available' ? 'true' : 'false'}
            aria-pressed={isSelected ? 'true' : 'false'}
            style={{ pointerEvents: 'auto' }}
            onPointerDown={(e) => {
                e.stopPropagation();
            }}
            onPointerUp={(e) => {
                e.stopPropagation();
            }}
            onClick={() => {
                if (seat.status === 'available') onToggle(seat);
            }}
            onFocus={() => onFocus(seat)}
            onBlur={onBlur}
            onMouseEnter={() => onFocus(seat)}
            onMouseLeave={onBlur}
            tabIndex={seat.status === 'available' ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, seat)}
            aria-label={`Seat ${seat.id}, ${seat.status}, $${PRICE_TIERS[seat.priceTier].price}`}
            role="button"
        />
    );
};
