export default function BamifyFooterBanner() {
  var html =
    '<!DOCTYPE html><html><head><style>body{margin:0;padding:0;overflow:hidden;}</style></head><body>' +
    '<script>var bamAdspace="6a71f711d54bb";var bamWidth=468;var bamHeight=60;</' + 'script>' +
    '<script src="https://www.bamifyads.com/ads.js"></' + 'script>' +
    '</body></html>';

  return (
    <div className="flex justify-center my-6">
      <iframe
        srcDoc={html}
        width="468"
        height="60"
        style={{ border: 'none', overflow: 'hidden' }}
        title="Advertisement"
      />
    </div>
  );
}
