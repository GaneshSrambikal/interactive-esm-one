import React, { useMemo } from 'react';
import type { SeatData } from '../types';
import { PRICE_TIERS } from '../constants';

interface SelectedSeatsProps {
    selectedSeats: Set<string>;
    allSeats: SeatData[];
    onClear: () => void;
    cardBg: string;
}

export const SelectedSeats: React.FC<SelectedSeatsProps> = ({
    selectedSeats,
    allSeats,
    onClear,
    cardBg
}) => {
    const totalPrice = useMemo(() => {
        return allSeats
            .filter(seat => selectedSeats.has(seat.id))
            .reduce((sum, seat) => sum + PRICE_TIERS[seat.priceTier].price, 0);
    }, [allSeats, selectedSeats]);

    return (
        <div className={`${cardBg} rounded-xl shadow-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">🎫 Selected Seats ({selectedSeats.size}/8)</h3>
                {selectedSeats.size > 0 && (
                    <button
                        onClick={onClear}
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
    );
};
