import { useEffect, useRef } from 'react';

export default function BamifyFooterBanner() {
  var ref = useRef(null);

  useEffect(function() {
    if (!ref.current) return;
    var container = ref.current;
    container.innerHTML = '';

    var iframe = document.createElement('iframe');
    iframe.style.width = '468px';
    iframe.style.height = '60px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.title = 'Advertisement';

    var doc =
      '<!DOCTYPE html><html><head><style>body{margin:0;padding:0;overflow:hidden;}</style></head><body>' +
      '<script>var bamAdspace="6a71f711d54bb";var bamWidth=468;var bamHeight=60;</script>' +
      '<script src="https://www.bamifyads.com/ads.js"><\/script>' +
      '</body></html>';

    container.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(doc);
    iframe.contentDocument.close();

    return function() {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="flex justify-center my-6">
      <div ref={ref} className="w-[468px] h-[60px]"></div>
    </div>
  );
}
