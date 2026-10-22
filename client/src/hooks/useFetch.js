import { useState, useEffect } from 'react';
import { apiClient, API_URL } from '../utils/api';

function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    const fullUrl = url.startsWith('/') ? `${API_URL}${url}` : url;
    setLoading(true);
    apiClient
      .get(fullUrl, options)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}

export default useFetch;
