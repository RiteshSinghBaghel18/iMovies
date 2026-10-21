import { useState, useEffect } from 'react';
import axios from 'axios';

function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    const token = localStorage.getItem('imovies-token');
    setLoading(true);
    axios
      .get(url, {
        headers: { 'auth-token': token || '' },
        ...options,
      })
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
