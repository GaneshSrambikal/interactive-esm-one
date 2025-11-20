import React from 'react';

interface StatusMessageProps {
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ loading, error, onRetry }) => {
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center max-w-md p-8 bg-red-900 bg-opacity-50 rounded-lg">
                    <span className="text-5xl mb-4 block">⚠️</span>
                    <h2 className="text-xl font-bold mb-2">Error Loading Venue</h2>
                    <p className="text-sm opacity-90 mb-4">{error}</p>
                    <p className="text-xs opacity-75">Make sure venue.json is in the public folder</p>
                    <button
                        onClick={onRetry}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                        🔄 Retry
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading venue...</p>
                </div>
            </div>
        );
    }

    return null;
};
