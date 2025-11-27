'use client';

import { useState } from 'react';
import { isPINSet, setupPIN, validatePIN } from '@/lib/pin/pin';
import { saveEntry, getAllEntries, clearAllData } from '@/lib/storage/storage';
import type { MentalHealthEntry } from '@/types/journal';

export default function TestCryptoPage() {
    const [status, setStatus] = useState('');

    async function clearStorage() {
        try {
            await clearAllData();
            setStatus('✅ Storage cleared! Run tests again.');
        } catch (error) {
            setStatus(`❌ Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async function runTests() {
        try {
            // Test 1: Check if PIN is already set
            setStatus('Checking PIN status...');
            const isSet = await isPINSet();
            console.log('PIN already set?', isSet);

            if (isSet) {
                setStatus('⚠️ PIN already set. Testing validation...');
                const isValid = await validatePIN('1234');
                console.log('PIN valid?', isValid);

                if (!isValid) {
                    setStatus('❌ Wrong PIN or corrupted data. Click "Clear Storage" and try again.');
                    return;
                }
            } else {
                // Set up new PIN
                setStatus('Setting up new PIN (1234)...');
                await setupPIN('1234');
                console.log('PIN setup complete');
                setStatus('✅ PIN setup complete');
            }

            // Test 2: Validate PIN
            setStatus('Validating PIN...');
            const isValid = await validatePIN('1234');
            if (!isValid) {
                throw new Error('PIN validation failed after setup');
            }
            setStatus('✅ PIN validated');

            // Test 3: Save encrypted entry
            setStatus('Saving encrypted entry...');
            const testEntry: MentalHealthEntry = {
                id: crypto.randomUUID(),
                mood: '😊',
                comment: 'Test entry from ' + new Date().toLocaleTimeString(),
                weather: { description: 'clear sky', temperature: 15 },
                timestamp: new Date()
            };
            await saveEntry(testEntry, '1234');
            console.log('Entry saved:', testEntry);
            setStatus('✅ Entry saved');

            // Test 4: Retrieve and decrypt
            setStatus('Retrieving entries...');
            const entries = await getAllEntries('1234');
            console.log('Retrieved entries:', entries);

            if (entries.length === 0) {
                throw new Error('No entries found after saving');
            }

            setStatus(`✅ All tests passed! Found ${entries.length} entry/entries`);
        } catch (error) {
            console.error('Test error:', error);
            setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Crypto & Storage Test</h1>
            <div className="space-x-2">
                <button
                    onClick={runTests}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Run Tests
                </button>
                <button
                    onClick={clearStorage}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                    Clear Storage
                </button>
            </div>
            <div className="mt-4 p-4 bg-gray-100 rounded">
                {status || 'Click "Run Tests" to start'}
            </div>
            <div className="mt-4 text-sm text-gray-600">
                <p>💡 Open DevTools Console (F12) to see detailed logs</p>
                <p>💡 If tests fail, click &quot;Clear Storage&quot; first</p>
            </div>
        </div>
    );
}
