from pathlib import Path
import re

root = Path(r'C:\Users\mayan\Downloads\pdf editor\client\src\pages\tools')
pattern = re.compile(r"keywords=\{t\((?P<q1>['\"])(?P<key>[^'\"]+)(?P=q1)\s*,\s*(?P<q2>['\"])(?P<value>(?:\\.|[^\\])*?)(?P=q2)\)\}")
count = 0

for f in sorted(root.glob('*.js')):
    text = f.read_text(encoding='utf-8')
    if 'getLongTailKeywordSample' not in text:
        text = text.replace(
            "import { useLanguage } from '../../index';\n",
            "import { useLanguage } from '../../index';\nimport { getLongTailKeywordSample } from '../../data/seoKeywords';\nimport { getGeoKeywordSample } from '../../data/geoKeywords';\n"
        )

    def repl(m):
        base = "t(%s%s%s, %s%s%s)" % (
            m.group('q1'), m.group('key'), m.group('q1'),
            m.group('q2'), m.group('value'), m.group('q2')
        )
        return "keywords={[ %s, ...getLongTailKeywordSample(15), ...getGeoKeywordSample(15) ].join(', ')}" % base

    new_text, n = pattern.subn(repl, text)
    if n:
        count += 1
    f.write_text(new_text, encoding='utf-8')

print(f'Updated {count} tool files with long-tail and GEO keywords.')
