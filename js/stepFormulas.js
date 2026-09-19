import { expressionToTex } from './expressionValidator.js';
import { formulaTex } from './latex.js';

export const texNumber = (value) => String(Number(value.toPrecision(9))).replace(/e([+-]?\d+)/i, '\\times 10^{$1}');
const pair = (a, b) => `\\left(${texNumber(a)},\\,${texNumber(b)}\\right)`;

/** TeX generado sólo con números y AST validados, nunca con entrada TeX libre. */
export function stepFormulas(result, preset) {
  const r = result.region, c = result.cells[0], n = result.resolution, N = result.cells.length;
  const t = texNumber, f = result.model === 'lamina' ? '\\rho' : 'f';
  const symbol = result.model === 'solid' ? 'V' : result.model === 'lamina' ? 'M' : 'I';
  const expr = expressionToTex(result.expression, result.coordinates === 'polar' ? ['r', 'theta', 'θ'] : undefined);
  const formulas = formulaTex(result);
  const density = (tex) => result.model === 'lamina' ? tex.replace(/(^|[^a-zA-Z\\])f(?=\(|\\)/g, '$1\\rho') : tex;
  const steps = [];
  const add = (text, ...math) => steps.push({ text, math });
  add('Definimos la función y la integral sobre la región seleccionada.',
    `${f}(${result.coordinates === 'polar' ? 'r,\\theta' : 'x,y'})=${expr}`,
    `${symbol}=${density(formulas.integral.split('\\quad ').at(-1))}`);
  if (r.type === 'polar') {
    add('Dividimos ambos intervalos en partes iguales.',
      `n=${n},\\qquad N=n^2=${N}`,
      String.raw`\begin{aligned}\Delta r&=\frac{r_{\max}-r_{\min}}{n}=\frac{${t(r.rMax)}-(${t(r.rMin)})}{${n}}\approx ${t(result.dr)}\\\Delta\theta&=\frac{\theta_{\max}-\theta_{\min}}{n}=\frac{${t(r.thetaMax)}-(${t(r.thetaMin)})}{${n}}\approx ${t(result.dTheta)}\end{aligned}`);
    add('Elegimos el centro de la primera celda. El jacobiano se aplica una sola vez.',
      String.raw`\begin{aligned}r_1&=\frac{${t(c.r0)}+${t(c.r1)}}{2}\approx ${t(c.sampleR)}\\\theta_1&=\frac{${t(c.theta0)}+${t(c.theta1)}}{2}\approx ${t(c.sampleTheta)}\\x_1&=r_1\cos\theta_1\approx ${t(c.sampleX)}\\y_1&=r_1\sin\theta_1\approx ${t(c.sampleY)}\end{aligned}`,
      String.raw`\Delta A_1=\underbrace{r_1}_{J}\,\Delta r\,\Delta\theta\approx ${t(c.area)}`);
  } else {
    const dx = r.type === 'typeII' ? '' : String.raw`\Delta x=\frac{b-a}{n}=\frac{${t(r.b)}-(${t(r.a)})}{${n}}\approx ${t(result.dx)}`;
    // Only construct formulas using the limits present in the chosen region.
    const dy = r.type === 'typeI' ? '' : String.raw`\Delta y=\frac{d-c}{n}=\frac{${t(r.d)}-(${t(r.c)})}{${n}}\approx ${t(result.dy)}`;
    const partition = r.type === 'rectangle' ? [dx, dy] : r.type === 'typeI'
      ? [dx, String.raw`\Delta y_i=\frac{g_2(x_i)-g_1(x_i)}{n}`]
      : [dy, String.raw`\Delta x_i=\frac{h_2(y_i)-h_1(y_i)}{n}`];
    add('Construimos la partición. En regiones entre curvas, el paso interior depende de la franja.', `n=${n},\\qquad N=n^2=${N}`, ...partition);
    add('Tomamos el centro de la primera celda y multiplicamos las longitudes de su base.',
      String.raw`\begin{aligned}x_1&=\frac{${t(c.x0)}+(${t(c.x1)})}{2}\approx ${t(c.sampleX)}\\y_1&=\frac{${t(c.y0)}+(${t(c.y1)})}{2}\approx ${t(c.sampleY)}\\\Delta A_1&=(${t(c.x1-c.x0)})(${t(c.y1-c.y0)})\approx ${t(c.area)}\end{aligned}`);
  }
  const coords = result.coordinates === 'polar' ? pair(c.sampleR, c.sampleTheta) : pair(c.sampleX, c.sampleY);
  add('Sustituimos el punto medio en la función y obtenemos su contribución.',
    `${f}${coords}\\approx ${t(c.value)}`,
    `C_1=${f}_1\\,\\Delta A_1\\approx (${t(c.value)})(${t(c.area)})\\approx ${t(c.value*c.area)}`);
  add('Repetimos para todas las celdas y sumamos. Las cifras mostradas están redondeadas; el cálculo conserva la precisión completa.',
    density(formulas.sum).replaceAll('I_n', `${symbol}_n`),
    `${symbol}_n\\approx ${result.cells.slice(0, 3).map(cell => `(${t(cell.value*cell.area)})`).join('+')}${N > 3 ? '+\\cdots' : ''}\\approx \\boxed{${t(result.approximation)}}`);
  const app = result.application;
  if (app) {
    if (!app.centroid) add('El total muestreado es cero. No se puede dividir entre cero: el centroide no está definido.', `${symbol}_n=0`);
    else {
      const sum = (fn) => { let total=0, correction=0; for (const cell of result.cells) { const a=fn(cell)-correction, b=total+a; correction=(b-total)-a; total=b; } return total; };
      const sx = sum(cell => cell.sampleX*(cell.value*cell.area)), sy = sum(cell => cell.sampleY*(cell.value*cell.area));
      add('Ponderamos las coordenadas y dividimos entre el volumen o la masa total.',
        String.raw`\bar x\approx\frac{\sum_{k=1}^{${N}}x_k ${f}_k\Delta A_k}{${symbol}_n}\approx\frac{${t(sx)}}{${t(result.approximation)}}\approx ${t(app.centroid.x)}\,\mathrm{u}`,
        String.raw`\bar y\approx\frac{\sum_{k=1}^{${N}}y_k ${f}_k\Delta A_k}{${symbol}_n}\approx\frac{${t(sy)}}{${t(result.approximation)}}\approx ${t(app.centroid.y)}\,\mathrm{u}`);
      if (result.model === 'solid') {
        const sz = sum(cell => cell.value*(cell.value*cell.area)/2);
        add('Integramos la coordenada vertical entre la base y la superficie. La densidad uniforme se cancela.',
          String.raw`\int_0^{f(x,y)}z\,dz=\left[\frac{z^2}{2}\right]_0^{f(x,y)}=\frac{f(x,y)^2}{2}`,
          String.raw`\bar z\approx\frac{\sum_{k=1}^{${N}}\frac{f_k^2}{2}\Delta A_k}{V_n}\approx\frac{${t(sz)}}{${t(app.volume)}}\approx ${t(app.centroid.z)}\,\mathrm{u}`);
      } else add('La densidad no representa altura: la lámina permanece en XY.', String.raw`\bar z=0\,\mathrm{u}`);
    }
    if (result.model === 'lamina') add('Calculamos las inercias respecto de los ejes que pasan por el origen.',
      String.raw`\begin{aligned}I_x&\approx\sum_{k=1}^{${N}}y_k^2\rho_k\Delta A_k\approx ${t(app.Ix)}\,\mathrm{u_m\,u^2}\\I_y&\approx\sum_{k=1}^{${N}}x_k^2\rho_k\Delta A_k\approx ${t(app.Iy)}\,\mathrm{u_m\,u^2}\\I_O&=I_x+I_y\approx ${t(app.IO)}\,\mathrm{u_m\,u^2}\end{aligned}`);
  }
  if (preset) add(preset.derivation, String.raw`E_n=\left|${symbol}-${symbol}_n\right|\approx\left|${t(preset.exact)}-(${t(result.approximation)})\right|\approx ${t(Math.abs(preset.exact-result.approximation))}`);
  else add('No hay referencia exacta para esta entrada. La diferencia entre refinamientos es un indicador, no una garantía de exactitud.');
  return steps;
}
