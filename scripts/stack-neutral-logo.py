"""Rearrange the existing wordmark paths into two lines, without retracing."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

namespace = 'http://www.w3.org/2000/svg'
ET.register_namespace('', namespace)
source = Path(__file__).resolve().parents[1] / 'public/assets/brand/critical-error-neutral.svg'
root = ET.parse(source).getroot()
words = {'critical': [], 'error': []}
for path in root:
    if not path.get('d'):
        continue
    tx, ty = map(float, re.findall(r'-?\d+(?:\.\d+)?', path.get('transform', 'translate(0,0)')))
    points = list(map(float, re.findall(r'-?\d+(?:\.\d+)?', path.get('d'))))
    # VTracer uses absolute M/C commands. Including control points gives safe bounds.
    xs, ys = points[::2], points[1::2]
    bounds = (min(xs) + tx, min(ys) + ty, max(xs) + tx, max(ys) + ty)
    words['critical' if tx < 1200 else 'error'].append((path, bounds))

bounds = {}
for word, paths in words.items():
    bounds[word] = (min(b[0] for _, b in paths), min(b[1] for _, b in paths),
                    max(b[2] for _, b in paths), max(b[3] for _, b in paths))
padding, gap = 8, 24
width = max(b[2] - b[0] for b in bounds.values())
heights = {word: b[3] - b[1] for word, b in bounds.items()}
svg = ET.Element(f'{{{namespace}}}svg', {'viewBox': f'0 0 {width + 2 * padding:.2f} {sum(heights.values()) + gap + 2 * padding:.2f}'})
ET.SubElement(svg, f'{{{namespace}}}title').text = 'Critical Error'
y = padding
for word, paths in words.items():
    left, top, right, bottom = bounds[word]
    x = padding + (width - (right - left)) / 2 - left
    group = ET.SubElement(svg, f'{{{namespace}}}g', {'id': word, 'transform': f'translate({x:.2f},{y - top:.2f})'})
    for path, _ in paths:
        group.append(path)
    y += heights[word] + gap
output = source.with_name('critical-error-neutral-stacked.svg')
ET.ElementTree(svg).write(output, encoding='utf-8', xml_declaration=True)
print(output, svg.get('viewBox'))
