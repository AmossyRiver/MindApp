'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isPINSet } from '@/lib/pin/pin';
import { saveEntry } from '@/lib/storage/storage';
import { getCurrentWeather } from '@/lib/weather/weather';
import { JournalEntry, Mood, WeatherData } from '@/types/journal';

const MOODS = [
    { value: 'great' as Mood, emoji: '😄', label: 'Great', color: 'bg-green-500' },
    { value: 'good' as Mood, emoji: '🙂', label: 'Good', color: 'bg-blue-500' },
    { value: 'okay' as Mood, emoji: '😐', label: 'Okay', color: 'bg-yellow-500' },
    { value: 'bad' as Mood, emoji: '😟', label: 'Bad', color: 'bg-orange-500' },
    { value: 'terrible' as Mood, emoji: '😢', label: 'Terrible', color: 'bg-red-500' },
];

export default function HomePage() {
    const router = useRouter();
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [comment, setComment] = useState('');
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [weatherLoading, setWeatherLoading] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            console.log('🔍 Checking authentication...');
            try {
                const isSet = await isPINSet();
                if (!isSet) {
                    console.log('➡️ No PIN set, redirecting to setup');
                    router.push('/setup');
                    return;
                }

                const pin = sessionStorage.getItem('userPin');
                if (!pin) {
                    console.log('➡️ No PIN in session, redirecting to login');
                    router.push('/login');
                    return;
                }

                console.log('✅ Authentication successful');
                setChecking(false);
                fetchWeather();
            } catch (err) {
                console.error('❌ Auth check failed:', err);
                router.push('/login');
            }
        }

        checkAuth();
    }, [router]);

    async function fetchWeather() {
        console.log('🌤️ Fetching weather...');
        setWeatherLoading(true);
        try {
            const weatherData = await getCurrentWeather();
            setWeather(weatherData);
            console.log('✅ Weather loaded:', weatherData);
        } catch (err) {
            console.error('❌ Failed to fetch weather:', err);
            setWeather({ description: 'Unknown', temperature: 0 });
        } finally {
            setWeatherLoading(false);
        }
    }

    async function handleSubmit() {
        if (!selectedMood) {
            alert('Please select a mood');
            return;
        }

        const pin = sessionStorage.getItem('userPin');
        if (!pin) {
            router.push('/login');
            return;
        }

        setLoading(true);

        try {
            const now = new Date();
            const entry: JournalEntry = {
                id: crypto.randomUUID(),
                mood: selectedMood,
                comment: comment.trim(),
                date: now.toISOString().split('T')[0],
                time: now.toTimeString().slice(0, 5),
                weather: weather || { description: 'Unknown', temperature: 0 },
                timestamp: now.getTime(),
            };

            await saveEntry(entry, pin);

            setSelectedMood(null);
            setComment('');

            alert('Entry saved successfully! ✅');
        } catch (err) {
            console.error('❌ Failed to save entry:', err);
            alert('Failed to save entry. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('userPin');
        router.push('/login');
    }

    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Mental Health Journal</h1>
                    <button
                        onClick={handleLogout}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                    >
                        Logout
                    </button>

                    <button
                        onClick={() => router.push('/viewer')}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                        🔓 Viewer
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-3">
                    {weatherLoading ? (
                        <>
                            <div className="animate-pulse text-3xl">☁️</div>
                            <div>
                                <p className="text-sm text-gray-600">Loading weather...</p>
                            </div>
                        </>
                    ) : weather ? (
                        <>
                            <div className="text-3xl">🌤️</div>
                            <div>
                                <p className="text-sm text-gray-600">Current Weather</p>
                                <p className="font-semibold text-gray-800">
                                    {weather.description}, {weather.temperature}°C
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-3xl">❓</div>
                            <div>
                                <p className="text-sm text-gray-600">Weather unavailable</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">How are you feeling?</h2>
                    <div className="grid grid-cols-5 gap-3">
                        {MOODS.map((mood) => (
                            <button
                                key={mood.value}
                                onClick={() => setSelectedMood(mood.value)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                    selectedMood === mood.value
                                        ? `${mood.color} text-white border-transparent scale-105`
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <span className="text-4xl">{mood.emoji}</span>
                                <span className="text-xs font-semibold text-gray-800">{mood.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Add a comment (optional)</h2>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Describe your feelings, what happened today, or any thoughts you'd like to capture..."
                        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
                        maxLength={500}
                    />
                    <div className="mt-2 text-right text-sm text-gray-700">
                        {comment.length}/500
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedMood || loading}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-98"
                    >
                        {loading ? 'Saving...' : 'Save Entry'}
                    </button>
                    <button
                        onClick={() => router.push('/history')}
                        className="px-6 bg-white hover:bg-gray-50 text-gray-800 py-4 rounded-xl font-semibold transition-all shadow-md border border-gray-200 active:scale-98"
                    >
                        View History
                    </button>
                    <button
                    onClick={() => router.push('/share')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-semibold transition-all shadow-md">
                    📤 Share Data
                </button>
                </div>


                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>🔐 All entries are encrypted and stored locally on your device</p>
                    <p className="mt-1">📅 Date and time are automatically captured</p>
                </div>
            </main>
        </div>
    );
}
