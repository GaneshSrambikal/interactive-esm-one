import React from 'react';
import type { SeatData } from '../types';
import { PRICE_TIERS } from '../constants';

interface SeatDetailsProps {
    focusedSeat: SeatData | null;
    cardBg: string;
}

export const SeatDetails: React.FC<SeatDetailsProps> = ({ focusedSeat, cardBg }) => {
    if (!focusedSeat) return null;

    return (
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
    );
};
