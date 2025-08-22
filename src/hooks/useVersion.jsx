import useSWR from 'swr';

function useVersion() {
  const { data, error, isValidating } = useSWR(
    'https://version.api2d.org/version',
    async (url) => {
      const ret = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await ret.json();
      // console.log(result)
      return result.desktop.version || '0.0.0';
    }
  );

  return {
    version: data,
    isLoading: isValidating,
    error,
  };
}

export default useVersion;