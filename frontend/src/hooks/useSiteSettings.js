import { useEffect, useState } from 'react';
import { getSiteSettings } from '../lib/api.js';

const DEFAULT_SETTINGS = {
  aboutSummary: 'Print-IT is a student-led business offering affordable printing and easy snack ordering for busy school communities.',
  businessName: 'Print-IT',
  contactEmail: 'printitfundit@gmail.com',
  contactFacebook: 'https://facebook.com/PrintIT',
  contactLocation: 'Philippines',
  contactPhone: '+63 977 133 0538',
  heroHeadline: 'Affordable Printing & Student Products',
  heroSubtext: 'From snacks to prints, we got you covered!',
};

export function useSiteSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await getSiteSettings();

        if (!ignore) {
          setSettings(data);
          setError('');
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      ignore = true;
    };
  }, []);

  return {
    error,
    isLoading,
    settings,
  };
}
