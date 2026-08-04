import { useEffect, useRef, useState } from 'react';

export default function BamifyFooterBanner() {
  var ref = useRef(null);
  var [failed, setFailed] = useState(false);

  useEffect(function() {
    if (!ref.current || failed) return;

    window.bamAdspace = '6a71f711d54bb';
    window.bamWidth = 468;
    window.bamHeight = 60;

    var script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.innerHTML = 'var bamAdspace = "6a71f711d54bb"; var bamWidth = 468; var bamHeight = 60;';

    var script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.src = 'https://www.bamifyads.com/ads.js';
    script2.async = true;
    script2.onerror = function() {
      setFailed(true);
    };

    ref.current.appendChild(script1);
    ref.current.appendChild(script2);

    return function() {
      if (ref.current) {
        ref.current.innerHTML = '';
      }
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
