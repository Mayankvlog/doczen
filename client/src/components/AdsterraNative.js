import { useEffect, useRef } from 'react';

export default function AdsterraNative() {
  const ref = useRef(null);

  useEffect(() => {
    // Ads disabled - ad networks were loading excessive tracking scripts
    // Comment out the old ad code below
    return; // Early return to prevent any ad loading
    
    /*
    if (!ref.current) return;
    const s1 = document.createElement('script');
    s1.text = `atOptions = ${JSON.stringify({
      key: 'c53e6e4677b82c7e335cf46167b6321f',
      format: 'iframe',
      height: 250,
      width: 300,
      params: {},
    })};`;
    ref.current.appendChild(s1);

    const s2 = document.createElement('script');
    s2.src = 'https://www.highperformanceformat.com/c53e6e4677b82c7e335cf46167b6321f/invoke.js';
    ref.current.appendChild(s2);
    */
  }, []);

  return <div className="flex justify-center my-6" ref={ref} />;
}
