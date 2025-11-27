'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isPINSet, validatePIN } from '@/lib/pin/pin';

export default function LoginPage() {
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        async function checkPIN() {
            const isSet = await isPINSet();
            if (!isSet) {
                router.push('/setup');
            }
        }
        checkPIN();
    }, [router]);

    const handleDigitClick = (digit: string) => {
        setError('');
        if (pin.length < 4) {
            const newPin = pin + digit;
            setPin(newPin);

            if (newPin.length === 4) {
                handleLogin(newPin);
            }
        }
    };

    const handleDelete = () => {
        setError('');
        setPin(pin.slice(0, -1));
    };

    async function handleLogin(pinToValidate: string) {
        setLoading(true);
        try {
            const isValid = await validatePIN(pinToValidate);
            if (isValid) {
                // Store PIN in sessionStorage for this session
                sessionStorage.setItem('userPin', pinToValidate);
                router.push('/');
            } else {
                setError('Incorrect PIN');
                setShake(true);
                setTimeout(() => {
                    setPin('');
                    setShake(false);
                }, 500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            setPin('');
        } finally {
            setLoading(false);
        }
    }

    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🌸</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Enter your PIN to continue</p>
                </div>

                <div className={`flex justify-center gap-4 mb-8 ${shake ? 'animate-shake' : ''}`}>
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all ${
                                pin.length > i
                                    ? error
                                        ? 'bg-red-500 text-white'
                                        : 'bg-purple-500 text-white scale-110'
                                    : 'bg-white text-gray-300 border-2 border-gray-300'
                            }`}
                        >
                            {pin.length > i ? '●' : '○'}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-4">
                    {digits.map((digit) => (
                        <button
                            key={digit}
                            onClick={() => handleDigitClick(digit)}
                            disabled={loading || pin.length >= 4}
                            className="bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 text-2xl font-semibold py-6 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                        >
                            {digit}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleDelete}
                    disabled={loading || pin.length === 0}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    ← Delete
                </button>
            </div>
        </div>
    );
}
