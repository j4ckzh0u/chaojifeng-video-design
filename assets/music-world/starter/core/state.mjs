/** Deterministic music state. No playback clock, mutable simulation or random(). */
export const clamp = x => Math.max(0, Math.min(1, x));
export const smooth = x => { const t=clamp(x); return t*t*(3-2*t); };
export const seed = (i, s=2026) => { const v=Math.sin(i*127.1+s*311.7)*43758.5453; return v-Math.floor(v); };
export function worldAt(frame, job) {
  const c=job.config, t=frame/c.fps, n=Math.round(c.duration*c.fps);
  const feature = key => job.analysis.features[key][Math.max(0,Math.min(n-1,Math.floor(frame)))] || 0;
  let impact=0;
  for (const e of job.score.events) {
    if(t>=e.peak && t<e.peak+1) impact=Math.max(impact,e.strength*Math.exp(-(t-e.peak)/.18));
  }
  const reveal=smooth(t/Math.min(2,c.duration/3));
  return {frame,t,impact,reveal,fade:1-smooth((t-c.duration+.7)/.7),
    low:feature('low'),mid:feature('mid'),high:feature('high'),
    camera:[Math.sin(t*.18)*1.7,4+Math.sin(t*.12)*.3,13-.6*impact],
    subjects:Array.from({length:7},(_,i)=>{
      const es=job.score.events.filter(e=>e.object_id===`subject-${i}`);
      const e=es.findLast(e=>t>=e.prepare);
      const growth=e?smooth((t-e.trigger)/Math.max(.01,e.settle-e.trigger)):reveal;
      return {id:`subject-${i}`,x:(i-3)*1.55,y:0,z:(seed(i,c.seed)-.5)*3,
        height:(1+seed(i+20,c.seed)*2)*(.1+.9*growth),rot:t*.12+seed(i+40,c.seed)*3,
        glow:.3+.5*impact,phase:e?(t<e.trigger?'prepare':t<e.settle?'settling':'hold'):'establish'};
    })};
}
