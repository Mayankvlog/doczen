import { useEffect, useRef, useState } from 'react';

export default function BamifyFooterBanner() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    var container = ref.current;

    window.bamAdspace = '6a71f711d54bb';
    window.bamWidth = 468;
    window.bamHeight = 60;

    var originalWrite = document.write;
    var captured = '';
    document.write = function(html) {
      captured += html;
    };

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.bamifyads.com/ads.js';
    script.onload = function() {
      document.write = originalWrite;
      if (captured && container) {
        container.innerHTML = captured;
      }
      if (!captured && container) {
        setFailed(true);
      }
    };
    script.onerror = function() {
      document.write = originalWrite;
      setFailed(true);
    };
    document.body.appendChild(script);

    return function() {
      document.write = originalWrite;
    };
  }, [failed]);

  return (
    <div className="flex justify-center my-6">
      {!failed && <div ref={ref} className="w-[468px] h-[60px]"></div>}
      {failed && (
        <div className="w-[468px] h-[60px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">
          Advertisement
        </div>
      )}
    </div>
  );
}
