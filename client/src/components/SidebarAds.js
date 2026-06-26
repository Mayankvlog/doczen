import { useEffect, useRef, useState } from 'react';

const AD_600 = {
  key: 'b11a753fbb1e311a5b2734272ab5edda',
  format: 'iframe',
  height: 600,
  width: 160,
  params: {},
};

const AD_300 = {
  key: '8727e64117c88455f41910d02f27827d',
  format: 'iframe',
  height: 300,
  width: 160,
  params: {},
};

const SRC = (key) => `https://penguinsincequalify.com/${key}/invoke.js`;

export default function SidebarAds() {
  const ref600 = useRef(null);
  const ref300 = useRef(null);
  const [ad1Loaded, setAd1Loaded] = useState(false);
  const [ad1Failed, setAd1Failed] = useState(false);
  const [ad2Failed, setAd2Failed] = useState(false);

  useEffect(() => {
    if (!ref600.current || ad1Failed) return;
    const existing = ref600.current.querySelector('script');
    if (existing) return;

    window.atOptions = AD_600;

    const s = document.createElement('script');
    s.src = SRC(AD_600.key);
    s.async = true;
    s.setAttribute('data-cfasync', 'false');
    s.onerror = () => setAd1Failed(true);
    s.onload = () => setAd1Loaded(true);
    ref600.current.appendChild(s);

    return () => {
      if (ref600.current) {
        const scripts = ref600.current.querySelectorAll('script');
        scripts.forEach(script => script.remove());
      }
    };
  }, [ad1Failed]);

  useEffect(() => {
    if (!ad1Loaded || !ref300.current || ad1Failed || ad2Failed) return;
    const existing = ref300.current.querySelector('script');
    if (existing) return;

    window.atOptions = AD_300;

    const s = document.createElement('script');
    s.src = SRC(AD_300.key);
    s.async = true;
    s.setAttribute('data-cfasync', 'false');
    s.onerror = () => setAd2Failed(true);
    ref300.current.appendChild(s);

    return () => {
      if (ref300.current) {
        const scripts = ref300.current.querySelectorAll('script');
        scripts.forEach(script => script.remove());
      }
    };
  }, [ad1Loaded, ad1Failed, ad2Failed]);

  return (
    <>
      <div
        ref={ref600}
        className="flex justify-center overflow-hidden"
        style={{ minHeight: ad1Failed ? 'auto' : '600px', minWidth: '160px' }}
      >
        {ad1Failed && (
          <div className="w-[160px] h-[600px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            Ad Space
          </div>
        )}
      </div>
      <div
        ref={ref300}
        className="flex justify-center overflow-hidden"
        style={{ minHeight: ad2Failed ? 'auto' : '300px', minWidth: '160px' }}
      >
        {ad2Failed && (
          <div className="w-[160px] h-[300px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            Ad Space
          </div>
        )}
      </div>
    </>
  );
}
