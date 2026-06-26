import { useEffect, useRef } from 'react';

export default function AdsterraNative() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.querySelector('script')) return;

    const s = document.createElement('script');
    s.src = 'https://penguinsincequalify.com/466be459b6a86595592eb7b4c62c5b3c/invoke.js';
    s.async = true;
    s.setAttribute('data-cfasync', 'false');
    ref.current.appendChild(s);

    return () => {
      if (ref.current) {
        const scripts = ref.current.querySelectorAll('script');
        scripts.forEach(script => script.remove());
      }
    };
  }, []);

  return (
    <div ref={ref} className="flex justify-center my-6">
      <div id="container-466be459b6a86595592eb7b4c62c5b3c"></div>
    </div>
  );
}