import { integrate } from './integrator.js';
import { calculateConvergence } from './convergence.js';

self.onmessage = ({ data }) => {
  try {
    if (data.action === 'convergence') {
      const convergence = calculateConvergence(data.request, data.exact,
        (completed, total) => self.postMessage({ progress: { completed, total } }));
      self.postMessage({ convergence });
    } else self.postMessage({ result: integrate(data) });
  }
  catch (error) { self.postMessage({ error: error.message }); }
};
