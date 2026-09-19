import katex from '../vendor/katex/katex.mjs';
import { expressionToTex } from './expressionValidator.js';

export function formulaTex(result) {
  const { a, b, c, d } = result.region;
  const number = (value) => String(value).replace(/e([+-]?\d+)/i, '\\times 10^{$1}');
  const functionTex = expressionToTex(result.expression, result.coordinates === 'polar' ? ['r', 'theta', 'θ'] : undefined);
  if (result.region.type === 'polar') {
    const { rMin, rMax, thetaMin, thetaMax } = result.region;
    const angleTex = (value) => value === 2 * Math.PI ? '2\\pi' : value === Math.PI ? '\\pi' : value === Math.PI / 2 ? '\\pi/2' : value === -Math.PI / 2 ? '-\\pi/2' : number(value);
    const integrand = result.coordinates === 'polar' ? functionTex : String.raw`f(r\cos\theta,r\sin\theta)`;
    return {
      integral: `${result.coordinates === 'polar' ? '' : `f(x,y)=${functionTex},\\quad `}\\int_{${angleTex(thetaMin)}}^{${angleTex(thetaMax)}}\\int_{${number(rMin)}}^{${number(rMax)}}\\left(${integrand}\\right)\\underbrace{r}_{\\text{jacobiano}}\\,dr\\,d\\theta`,
      sum: String.raw`\begin{aligned}x_{ij}&=r_i\cos\theta_j,\quad y_{ij}=r_i\sin\theta_j\\ \Delta A_{ij}&=\underbrace{r_i}_{J}\,\Delta r\,\Delta\theta\\ I_n&=\sum_{i,j=0}^{n-1}` + (result.coordinates === 'polar' ? String.raw`f(r_i,\theta_j)` : String.raw`f(x_{ij},y_{ij})`) + String.raw`\,r_i\,\Delta r\,\Delta\theta\end{aligned}`,
    };
  }
  if (['typeI', 'typeII'].includes(result.region.type)) {
    const typeI = result.region.type === 'typeI';
    const variable = typeI ? 'x' : 'y';
    const lower = expressionToTex(result.region.lower, [variable]);
    const upper = expressionToTex(result.region.upper, [variable]);
    return {
      integral: `\\int_{${number(typeI ? a : c)}}^{${number(typeI ? b : d)}}\\int_{${lower}}^{${upper}}\\left(${functionTex}\\right)\\,${typeI ? 'dy\\,dx' : 'dx\\,dy'}`,
      sum: typeI
        ? String.raw`\begin{aligned}x_i&=a+(i+\tfrac12)\Delta x,\quad \Delta x=\frac{b-a}{n}\\ \Delta y_i&=\frac{g_2(x_i)-g_1(x_i)}{n}\\ I_n&=\sum_{i,j=0}^{n-1} f\left(x_i,g_1(x_i)+(j+\tfrac12)\Delta y_i\right)\Delta x\Delta y_i\end{aligned}`
        : String.raw`\begin{aligned}y_i&=c+(i+\tfrac12)\Delta y,\quad \Delta y=\frac{d-c}{n}\\ \Delta x_i&=\frac{h_2(y_i)-h_1(y_i)}{n}\\ I_n&=\sum_{i,j=0}^{n-1} f\left(h_1(y_i)+(j+\tfrac12)\Delta x_i,y_i\right)\Delta x_i\Delta y\end{aligned}`,
    };
  }
  return {
    integral: `\\int_{${number(c)}}^{${number(d)}}\\int_{${number(a)}}^{${number(b)}}\\left(${expressionToTex(result.expression)}\\right)\\,dx\\,dy`,
    sum: String.raw`I_n=\sum_{i=0}^{n-1}\sum_{j=0}^{n-1} f\!\left(a+(i+\tfrac12)\Delta x,\ c+(j+\tfrac12)\Delta y\right)\Delta x\Delta y`,
  };
}

export function renderFormulas(result) {
  const formulas = formulaTex(result);
  const options = { displayMode: true, throwOnError: false, trust: false, output: 'htmlAndMathml', maxExpand: 1000 };
  katex.render(formulas.integral, document.querySelector('#integral-description'), options);
  katex.render(formulas.sum, document.querySelector('#sum-formula'), options);
}
