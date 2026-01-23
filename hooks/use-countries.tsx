import { useState, useEffect } from "react";
import axios from "axios";

export interface Country {
  code: string;
  name: string;
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "https://restcountries.com/v3.1/independent?status=true&fields=cca2,name"
        );

        // Flatten the response to { code, name } array
        const mapped: Country[] = response.data.map((c: any) => ({
          code: c.cca2,
          name: c.name.common,
        }));

        // Optionally sort alphabetically
        mapped.sort((a, b) => a.name.localeCompare(b.name));

        setCountries(mapped);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch countries");
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return { countries, loading, error };
}
