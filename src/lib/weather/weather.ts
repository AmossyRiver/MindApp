import { WeatherData } from '@/types/journal';

export async function getCurrentWeather(): Promise<WeatherData> {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_WEATHER_API_URL;

    if (!apiKey || !apiUrl) {
        console.warn('⚠️ Weather API not configured');
        return {
            description: 'Unknown',
            temperature: 0,
        };
    }

    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
            });
        });

        const { latitude, longitude } = position.coords;

        const response = await fetch(
            `${apiUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
        );

        if (!response.ok) {
            throw new Error('Weather API request failed');
        }

        const data = await response.json();

        return {
            description: data.weather[0].description,
            temperature: Math.round(data.main.temp),
            icon: data.weather[0].icon,
        };
    } catch (error) {
        console.error('❌ Failed to fetch weather:', error);
        return {
            description: 'Unknown',
            temperature: 0,
        };
    }
}
