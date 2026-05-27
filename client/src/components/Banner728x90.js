import { useEffect, useRef } from 'react';

export default function Banner728x90() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const s1 = document.createElement('script');
    s1.text = `atOptions = ${JSON.stringify({
      key: '20c23d55e0aa2d4c55f69cec04907f2b',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {},
    })};`;
    ref.current.appendChild(s1);

    const s2 = document.createElement('script');
    s2.src = 'https://www.highperformanceformat.com/20c23d55e0aa2d4c55f69cec04907f2b/invoke.js';
    ref.current.appendChild(s2);
  }, []);

  return <div className="flex justify-center bg-gray-100 py-2" ref={ref} />;
}