const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

export async function derivePINKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const pinBuffer = encoder.encode(pin);

    const baseKey = await crypto.subtle.importKey(
        'raw',
        pinBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptEntry(
    data: object,
    pin: string,
    salt: Uint8Array
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> {
    const key = await derivePINKey(pin, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encoder = new TextEncoder();
    const jsonData = encoder.encode(JSON.stringify(data));

    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        jsonData
    );

    return { encryptedData, iv };
}

export async function decryptEntry(
    encryptedData: ArrayBuffer,
    iv: Uint8Array,
    pin: string,
    salt: Uint8Array
): Promise<object> {
    const key = await derivePINKey(pin, salt);

    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        encryptedData
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedData);
    return JSON.parse(jsonString);
}

export function generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
}

export async function hashPIN(pin: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const pinBuffer = encoder.encode(pin);

    const baseKey = await crypto.subtle.importKey(
        'raw',
        pinBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        256
    );

    return Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function verifyPIN(pin: string, hashedPIN: string, salt: Uint8Array): Promise<boolean> {
    const newHash = await hashPIN(pin, salt);
    return newHash === hashedPIN;
}
