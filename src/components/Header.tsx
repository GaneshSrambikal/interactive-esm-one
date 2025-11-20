import React from 'react';

interface HeaderProps {
    venueName: string;
    seatCount: number;
    darkMode: boolean;
    heatMapMode: boolean;
    onToggleDarkMode: () => void;
    onToggleHeatMap: () => void;
    onFindAdjacent: (count: number) => void;
    cardBg: string;
}

export const Header: React.FC<HeaderProps> = ({
    venueName,
    seatCount,
    darkMode,
    heatMapMode,
    onToggleDarkMode,
    onToggleHeatMap,
    onFindAdjacent,
    cardBg
}) => {
    return (
        <header className={`${cardBg} shadow-lg p-4 sticky top-0 z-50`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">📍</span>
                    <div>
                        <h1 className="text-2xl font-bold">{venueName}</h1>
                        <p className="text-sm opacity-70">{seatCount.toLocaleString()} seats</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => onFindAdjacent(2)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
                        aria-label="Find 2 adjacent seats"
                    >
                        🔍 Find 2 Seats
                    </button>
                    <button
                        onClick={onToggleHeatMap}
                        className={`px-3 py-2 rounded-lg text-sm transition ${heatMapMode ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
                        aria-label="Toggle heat map"
                    >
                        {heatMapMode ? '🎨 Normal View' : '🔥 Heat Map'}
                    </button>
                    <button
                        onClick={onToggleDarkMode}
                        className="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition text-2xl"
                        aria-label="Toggle dark mode"
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>
        </header>
    );
};
