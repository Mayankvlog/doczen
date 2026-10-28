import { useEffect, useRef } from 'react';

export default function AdRightSidebar() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.querySelector('script[data-ad-right]')) return;

    const script = document.createElement('script');
    script.setAttribute('data-ad-right', 'true');
    script.type = 'text/javascript';
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.text = `(function(ltqmot){
var d = document,
    s = d.createElement('script'),
    l = d.currentScript || d.scripts[d.scripts.length - 1];
s.settings = ltqmot || {};
s.src = "\\/\\/extroverted-election.com\\/bTXTV.sqdJGolX0_Y\\/WacU\\/beJmW9ruEZdUTl\\/kLPzTZcC1ENxj-EbxfNCDMEhtcN\\/zXUC2VMLTuEv0mNOQm";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})`;

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="hidden lg:block fixed right-0 top-1/2 -translate-y-1/2 z-40 w-[160px]">
      <div ref={containerRef} className="w-full" style={{ minHeight: '600px' }} />
    </div>
  );
}
