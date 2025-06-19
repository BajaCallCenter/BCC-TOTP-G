import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

interface TOTPAccount {
    name: string;
    otp: string;
    time_remaining: number;
}

export const useTOTP = () => {
    const { getAccessTokenSilently, user } = useAuth0();
    const [totpAccounts, setTotpAccounts] = useState<TOTPAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTOTPs = useCallback(async () => {
        if (!user?.sub) {
            setError('User not authenticated');
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                }
            });
            
            const response = await fetch(`/api/totp`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setTotpAccounts(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch TOTPs';
            setError(message);
            console.error('Error fetching TOTPs:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.sub, getAccessTokenSilently]);

    const createTOTP = useCallback(async (name: string, secret: string) => {
        if (!user?.sub) {
            setError('User not authenticated');
            return false;
        }
        
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                }
            });
            
            const cleanSecret = secret.replace(/\s+/g, '').toUpperCase();
            
            const response = await fetch(`/api/totp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    name: name.trim(),
                    secret: cleanSecret
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create TOTP';
            setError(message);
            console.error('Error creating TOTP:', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user?.sub, getAccessTokenSilently]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTotpAccounts(prev => 
                prev.map(account => ({
                    ...account,
                    time_remaining: account.time_remaining > 0 ? account.time_remaining - 1 : 30,
                }))
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const shouldRefresh = totpAccounts.some(acc => acc.time_remaining <= 1);
        if (shouldRefresh) {
            fetchTOTPs();
        }
    }, [totpAccounts, fetchTOTPs]);

    // Fetch TOTPs on initial load
    useEffect(() => {
        fetchTOTPs();
    }, [fetchTOTPs]);

    return {
        totpAccounts,
        loading,
        error,
        fetchTOTPs,
        createTOTP,
    };
};