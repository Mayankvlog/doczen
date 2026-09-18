from pathlib import Path

root = Path(r'C:\Users\mayan\Downloads\pdf editor\client\src\pages\tools')
IMPORT = "import { generateGhostKeywords } from '../../data/ghostKeywords';\n"
KEYWORD_SPREAD = "...generateGhostKeywords(120)"

count_files = 0
count_imports = 0
count_spreads = 0

for f in sorted(root.glob('*.js')):
    text = f.read_text(encoding='utf-8')
    original = text

    if 'generateGhostKeywords' not in text:
        text = text.replace(
            "import { generateGeoKeywords } from '../../data/geoKeywords';\n",
            "import { generateGeoKeywords } from '../../data/geoKeywords';\n" + IMPORT,
        )

    text = text.replace('...generateGeoKeywords(120)', f'...generateGeoKeywords(120), {KEYWORD_SPREAD}')

    if text != original:
        f.write_text(text, encoding='utf-8')
        count_files += 1
        count_imports += text.count(IMPORT)
        count_spreads += text.count(KEYWORD_SPREAD)

print(f'Updated {count_files} tool files. Imports: {count_imports}. Keyword spreads: {count_spreads}.')