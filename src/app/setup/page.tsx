'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isPINSet, setupPIN } from '@/lib/pin/pin';

export default function SetupPage() {
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // Define handleSetup BEFORE useEffect that calls it
    const handleSetup = useCallback(async () => {
        if (pin !== confirmPin) {
            setError('PINs do not match');
            setTimeout(() => {
                setConfirmPin('');
            }, 1000);
            return;
        }

        setLoading(true);
        try {
            await setupPIN(pin);
            sessionStorage.setItem('userPin', pin); // Store PIN for session
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Setup failed');
            setLoading(false);
        }
    }, [pin, confirmPin, router]);

    useEffect(() => {
        async function checkPIN() {
            try {
                const isSet = await isPINSet();
                if (isSet) {
                    router.push('/login');
                } else {
                    setChecking(false);
                }
            } catch (err) {
                console.error('Error checking PIN:', err);
                setChecking(false);
            }
        }
        checkPIN();
    }, [router]);

    useEffect(() => {
        if (confirmPin.length === 4) {
            handleSetup();
        }
    }, [confirmPin, handleSetup]);

    const handleDigitClick = (digit: string) => {
        setError('');
        if (step === 'enter') {
            if (pin.length < 4) {
                const newPin = pin + digit;
                setPin(newPin);
                if (newPin.length === 4) {
                    setTimeout(() => setStep('confirm'), 300);
                }
            }
        } else {
            if (confirmPin.length < 4) {
                setConfirmPin(confirmPin + digit);
            }
        }
    };

    const handleDelete = () => {
        setError('');
        if (step === 'enter') {
            setPin(pin.slice(0, -1));
        } else {
            setConfirmPin(confirmPin.slice(0, -1));
        }
    };

    const handleReset = () => {
        setPin('');
        setConfirmPin('');
        setStep('enter');
        setError('');
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking PIN status...</p>
                </div>
            </div>
        );
    }

    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {step === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}
                    </h1>
                    <p className="text-gray-600">
                        {step === 'enter'
                            ? 'Choose a 4-digit PIN to secure your data'
                            : 'Enter your PIN again to confirm'}
                    </p>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all ${
                                (step === 'enter' ? pin : confirmPin).length > i
                                    ? 'bg-blue-500 text-white scale-110'
                                    : 'bg-white text-gray-300 border-2 border-gray-300'
                            }`}
                        >
                            {(step === 'enter' ? pin : confirmPin).length > i ? '●' : '○'}
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
                            disabled={loading || (step === 'enter' ? pin.length >= 4 : confirmPin.length >= 4)}
                            className="bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 text-2xl font-semibold py-6 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                        >
                            {digit}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleDelete}
                        disabled={loading || (step === 'enter' ? pin.length === 0 : confirmPin.length === 0)}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        ← Delete
                    </button>
                    {step === 'confirm' && (
                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50 transition-all"
                        >
                            Reset
                        </button>
                    )}
                </div>

                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>🔐 Your PIN encrypts all data locally</p>
                    <p>⚠️ There is no way to recover a forgotten PIN</p>
                </div>
            </div>
        </div>
    );
}
