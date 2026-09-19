import { polarToCartesian } from './polar.js';
import { format } from './calculator.js';

const NS = 'http://www.w3.org/2000/svg';
function shape(svg, tag, attributes, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text) node.textContent = text;
  svg.append(node);
}
const pointList = (points) => points.map((p) => `${p.x},${p.y}`).join(' ');

export function mountPolarMapping() {
  const panel = document.querySelector('#polar-mapping');
  const slider = document.querySelector('#mapping-cell');
  const parameter = document.querySelector('#parameter-map');
  const cartesian = document.querySelector('#cartesian-map');
  let result = null;
  function render() {
    if (!result) return;
    const cell = result.cells[Number(slider.value) - 1];
    document.querySelector('#mapping-index').textContent = `${slider.value} de ${result.cells.length}`;
    const { rMin, rMax, thetaMin, thetaMax } = result.region;
    const p = (r, theta) => ({ x: 40 + (r - rMin) / (rMax - rMin) * 220, y: 180 - (theta - thetaMin) / (thetaMax - thetaMin) * 145 });
    parameter.replaceChildren(); cartesian.replaceChildren();
    shape(parameter, 'rect', { x: 40, y: 35, width: 220, height: 145, fill: '#162b40', stroke: '#7398b5' });
    const corner = p(cell.r0, cell.theta1);
    shape(parameter, 'rect', { x: corner.x, y: corner.y, width: 220 / result.resolution, height: 145 / result.resolution, fill: '#efc46f' });
    shape(parameter, 'circle', { cx: p(cell.sampleR, cell.sampleTheta).x, cy: p(cell.sampleR, cell.sampleTheta).y, r: 3, fill: '#f3f7ff' });
    shape(parameter, 'text', { x: 40, y: 205, fill: '#c3d6e8', 'font-size': 12 }, `r: ${format(rMin)} → ${format(rMax)}`);
    shape(parameter, 'text', { x: 40, y: 20, fill: '#c3d6e8', 'font-size': 12 }, `θ: ${format(thetaMin)} → ${format(thetaMax)} rad`);
    const { a, b, c, d } = result.bounds;
    const scale = 145 / Math.max(b - a, d - c);
    const project = ({ x, y }) => ({ x: 150 + (x - (a + b) / 2) * scale, y: 108 - (y - (c + d) / 2) * scale });
    for (const loop of result.boundaryLoops) shape(cartesian, 'polyline', { points: pointList(loop.map(project)), fill: 'none', stroke: '#ffdc98', 'stroke-width': 1.5 });
    const patch = [];
    const segments = Math.max(4, Math.ceil((cell.theta1 - cell.theta0) * 24));
    for (let i = 0; i <= segments; i++) patch.push(project(polarToCartesian(cell.r1, cell.theta0 + (cell.theta1 - cell.theta0) * i / segments)));
    for (let i = segments; i >= 0; i--) patch.push(project(polarToCartesian(cell.r0, cell.theta0 + (cell.theta1 - cell.theta0) * i / segments)));
    shape(cartesian, 'polygon', { points: pointList(patch), fill: '#55cbb9', stroke: '#a4f8dd', 'stroke-width': 1 });
    const sample = project({ x: cell.sampleX, y: cell.sampleY });
    shape(cartesian, 'circle', { cx: sample.x, cy: sample.y, r: 3, fill: '#fff' });
    shape(cartesian, 'text', { x: 30, y: 205, fill: '#c3d6e8', 'font-size': 12 }, 'XY · sector y punto medio mapeados');
    const values = {
      'mapping-r': cell.sampleR, 'mapping-theta': cell.sampleTheta,
      'mapping-x': cell.sampleX, 'mapping-y': cell.sampleY,
      'mapping-jacobian': cell.jacobian, 'mapping-area': cell.area,
      'mapping-contribution': cell.value * cell.area,
    };
    for (const [id, value] of Object.entries(values)) document.getElementById(id).textContent = format(value);
    document.querySelector('#mapping-area-formula').textContent = `ΔA = ${format(cell.sampleR)} × ${format(cell.r1 - cell.r0)} × ${format(cell.theta1 - cell.theta0)} = ${format(cell.area)}`;
  }
  slider.addEventListener('input', render);
  return { setResult(value) {
    result = value?.region.type === 'polar' ? value : null;
    panel.hidden = !result;
    if (result) {
      slider.max = result.cells.length;
      slider.value = Math.floor(result.resolution / 2) * result.resolution + Math.floor(result.resolution / 4) + 1;
      render();
    }
  } };
}
