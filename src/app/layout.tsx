import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Mental Health Journal',
    description: 'Private, encrypted mental health tracking',
    manifest: '/manifest.json',
    themeColor: '#6366f1',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className="antialiased">{children}</body>
        </html>
    );
}
