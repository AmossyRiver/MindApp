'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isPINSet } from '@/lib/pin/pin';
import { getAllEntries, deleteEntry } from '@/lib/storage/storage';
import { JournalEntry, Mood } from '@/types/journal';

const MOOD_EMOJI: Record<Mood, string> = {
    great: '😄',
    good: '🙂',
    okay: '😐',
    bad: '😟',
    terrible: '😢',
};

const MOOD_COLOR: Record<Mood, string> = {
    great: 'bg-green-100 border-green-300',
    good: 'bg-blue-100 border-blue-300',
    okay: 'bg-yellow-100 border-yellow-300',
    bad: 'bg-orange-100 border-orange-300',
    terrible: 'bg-red-100 border-red-300',
};

export default function HistoryPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        async function loadEntries() {
            console.log('📖 Loading history...');
            try {
                const isSet = await isPINSet();
                if (!isSet) {
                    router.push('/setup');
                    return;
                }

                const pin = sessionStorage.getItem('userPin');
                if (!pin) {
                    router.push('/login');
                    return;
                }

                const allEntries = await getAllEntries(pin);
                setEntries(allEntries);
                console.log(`✅ Loaded ${allEntries.length} entries`);
            } catch (err) {
                console.error('❌ Failed to load entries:', err);
                alert('Failed to load entries. Please try logging in again.');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        }

        loadEntries();
    }, [router]);

    async function handleDelete() {
        if (!selectedEntry) return;

        try {
            await deleteEntry(selectedEntry.id);
            setEntries(entries.filter((e) => e.id !== selectedEntry.id));
            setSelectedEntry(null);
            setShowDeleteConfirm(false);
            alert('Entry deleted successfully');
        } catch (err) {
            console.error('❌ Failed to delete entry:', err);
            alert('Failed to delete entry');
        }
    }

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            });
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your journal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        ← Back
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Journal History</h1>
                    <div className="w-16"></div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {entries.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📔</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Entries Yet</h2>
                        <p className="text-gray-600 mb-6">Start logging your mental health journey</p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                        >
                            Create First Entry
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4">
                            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                        </div>

                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                onClick={() => setSelectedEntry(entry)}
                                className={`bg-white rounded-xl shadow-sm p-4 border-2 cursor-pointer transition-all hover:shadow-md ${
                                    MOOD_COLOR[entry.mood]
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">{MOOD_EMOJI[entry.mood]}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {formatDate(entry.date)}
                                                </p>
                                                <p className="text-sm text-gray-600">{entry.time}</p>
                                            </div>
                                            <div className="text-right text-sm text-gray-600">
                                                <p>🌤️ {entry.weather.description}</p>
                                                <p>{entry.weather.temperature}°C</p>
                                            </div>
                                        </div>
                                        {entry.comment && (
                                            <p className="text-gray-700 line-clamp-2">{entry.comment}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Entry Detail Modal */}
            {selectedEntry && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedEntry(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Entry Details</h2>
                            <button
                                onClick={() => setSelectedEntry(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="text-6xl">{MOOD_EMOJI[selectedEntry.mood]}</div>
                                <div>
                                    <p className="text-xl font-semibold text-gray-800 capitalize">
                                        {selectedEntry.mood}
                                    </p>
                                    <p className="text-gray-600">
                                        {formatDate(selectedEntry.date)} at {selectedEntry.time}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-600 mb-1">Weather</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {selectedEntry.weather.description}, {selectedEntry.weather.temperature}°C
                                </p>
                            </div>

                            {selectedEntry.comment && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-600 mb-2">Your Notes</p>
                                    <p className="text-gray-800 whitespace-pre-wrap">{selectedEntry.comment}</p>
                                </div>
                            )}

                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all"
                            >
                                Delete Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Entry?</h3>
                        <p className="text-gray-600 mb-6">
                            This action cannot be undone. The entry will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
