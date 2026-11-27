/* Runs the model off the page's main thread so the page stays responsive while it writes questions. */
import {WebWorkerMLCEngineHandler} from './vendor/web-llm-0.2.89.js';
const h=new WebWorkerMLCEngineHandler();
self.onmessage=m=>h.onmessage(m);
