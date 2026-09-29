const MU0 = 4 * Math.PI * 1e-7;

function produtoVetorial(a, b){
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ];
}
function leiBiotSavart(I, dEspace, r){
  const r2 = r[0]*r[0] + r[1]*r[1] + r[2]*r[2];
  const rDist = Math.sqrt(r2);
  if (rDist === 0) return [0,0,0];
  const produto = produtoVetorial(dEspace, r);
  const constante = MU0 / (4*Math.PI);
  const fator = (constante * I) / Math.pow(r2, 1.5);
  return [produto[0]*fator, produto[1]*fator, produto[2]*fator];
}
function campoFioRetilineo(I, r){ return (MU0 * I) / (2*Math.PI*r); }
function campoFioSemiInfinito(I, r){ return (MU0 * I) / (4*Math.PI*r); }
function campoCentroArcoCircunferencia(I, angulo, r){return (MU0 * I * angulo)/(4*Math.PI*r)}

// ---- tabs ----
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tabpanel').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('tab-'+t.dataset.tab).classList.add('active');
  });
});

const SVGNS = "http://www.w3.org/2000/svg";
function el(name, attrs){
  const e = document.createElementNS(SVGNS, name);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

// ============ FIO RETILÍNEO (cross-section view) ============
(function(){
  const svg = document.getElementById('svg-reto');
  const cx = 210, cy = 210;
  const pxPerM = 190; // pixels per meter
  const minR = 26, maxR = 190;
  let outOfPage = true;
  let angle = -0.6; // point angle around wire (radians)
  let radiusPx = 90;

  const iSlider = document.getElementById('reto-i');
  const iVal = document.getElementById('reto-i-val');
  const outBtn = document.getElementById('reto-out');
  const inBtn = document.getElementById('reto-in');

  outBtn.addEventListener('click', ()=>{ outOfPage = true; outBtn.classList.add('active'); inBtn.classList.remove('active'); draw(); });
  inBtn.addEventListener('click', ()=>{ outOfPage = false; inBtn.classList.add('active'); outBtn.classList.remove('active'); draw(); });
  iSlider.addEventListener('input', ()=>{ iVal.textContent = parseFloat(iSlider.value).toFixed(1)+' A'; draw(); });

  function draw(){
    svg.innerHTML = '';
    const I = parseFloat(iSlider.value);
    const rMeters = radiusPx / pxPerM;
    const B = campoFioRetilineo(I, rMeters); // Tesla
    const BuT = B * 1e6;

    // grid circles (field lines, decorative)
    [50,90,130,170].forEach(rr=>{
      svg.appendChild(el('circle',{cx,cy,r:rr,fill:'none',stroke:'var(--field)','stroke-opacity':0.18,'stroke-dasharray':'3 5'}));
    });

    // circle through P
    svg.appendChild(el('circle',{cx,cy,r:radiusPx,fill:'none',stroke:'var(--field)','stroke-width':1.4,'stroke-opacity':0.55}));

    // circulation arrows on the P-circle
    const dirSign = outOfPage ? -1 : 1; // CCW if out of page
    for(let k=0;k<8;k++){
      const a = k * Math.PI/4;
      const ax = cx + radiusPx*Math.cos(a);
      const ay = cy + radiusPx*Math.sin(a);
      const ta = a + dirSign*0.18;
      const tx = cx + radiusPx*Math.cos(ta);
      const ty = cy + radiusPx*Math.sin(ta);
      svg.appendChild(el('line',{x1:ax,y1:ay,x2:tx,y2:ty,stroke:'var(--field)','stroke-opacity':0.4,'stroke-width':2}));
    }

    // wire symbol at center
    svg.appendChild(el('circle',{cx,cy,r:16,fill:'var(--blueprint-2)',stroke:'var(--copper)','stroke-width':2}));
    if(outOfPage){
      svg.appendChild(el('circle',{cx,cy,r:4.5,fill:'var(--copper)'}));
    } else {
      svg.appendChild(el('line',{x1:cx-7,y1:cy-7,x2:cx+7,y2:cy+7,stroke:'var(--copper)','stroke-width':2.4}));
      svg.appendChild(el('line',{x1:cx-7,y1:cy+7,x2:cx+7,y2:cy-7,stroke:'var(--copper)','stroke-width':2.4}));
    }
    svg.appendChild(el('text',{x:cx, y:cy-26, 'text-anchor':'middle', class:'drag-hint', fill:'var(--copper-dim)'})).textContent = 'fio (I)';

    // point P
    const px = cx + radiusPx*Math.cos(angle);
    const py = cy + radiusPx*Math.sin(angle);
    svg.appendChild(el('line',{x1:cx,y1:cy,x2:px,y2:py,stroke:'var(--ink-dim)','stroke-width':1,'stroke-dasharray':'2 4'}));

    // tangent B vector at P
    const tanAngle = angle + dirSign*(Math.PI/2);
    const vlen = Math.max(18, Math.min(60, 18 + 10*Math.log10(BuT+1)));
    const vx = px + vlen*Math.cos(tanAngle);
    const vy = py + vlen*Math.sin(tanAngle);
    svg.appendChild(arrow(px,py,vx,vy,'var(--vector)'));

    const pHandle = el('circle',{cx:px,cy:py,r:9,fill:'var(--blueprint-2)',stroke:'var(--vector)','stroke-width':2,cursor:'grab'});
    svg.appendChild(pHandle);
    svg.appendChild(el('text',{x:px+12,y:py-10,class:'drag-hint',fill:'var(--vector)'})).textContent = 'P';

    dragify(pHandle, svg, (mx,my)=>{
      let dx = mx-cx, dy = my-cy;
      let d = Math.hypot(dx,dy);
      d = Math.max(minR, Math.min(maxR, d));
      angle = Math.atan2(dy,dx);
      radiusPx = d;
      draw();
    });

    document.getElementById('reto-r').innerHTML = rMeters.toFixed(3)+' <small>m</small>';
    document.getElementById('reto-b').innerHTML = BuT.toFixed(3)+' <small>μT</small>';
    document.getElementById('reto-dir').textContent = outOfPage ? 'anti-horário' : 'horário';
  }
  draw();
  window.__retoDraw = draw;
})();

// ============ FIO SEMI-INFINITO ============
(function(){
  const svg = document.getElementById('svg-semi');
  const cx = 210, cy = 210;
  const pxPerM = 190;
  const minR = 26, maxR = 190;
  let outOfPage = true;
  let angle = -0.6;
  let radiusPx = 90;

  const iSlider = document.getElementById('semi-i');
  const iVal = document.getElementById('semi-i-val');
  const outBtn = document.getElementById('semi-out');
  const inBtn = document.getElementById('semi-in');

  outBtn.addEventListener('click', ()=>{ outOfPage = true; outBtn.classList.add('active'); inBtn.classList.remove('active'); draw(); });
  inBtn.addEventListener('click', ()=>{ outOfPage = false; inBtn.classList.add('active'); outBtn.classList.remove('active'); draw(); });
  iSlider.addEventListener('input', ()=>{ iVal.textContent = parseFloat(iSlider.value).toFixed(1)+' A'; draw(); });

  function draw(){
    svg.innerHTML = '';
    const I = parseFloat(iSlider.value);
    const rMeters = radiusPx / pxPerM;
    const B = campoFioSemiInfinito(I, rMeters);
    const BuT = B * 1e6;

    // angular sector (the "field of view" of the wire from P)
    const px = cx + radiusPx*Math.cos(angle);
    const py = cy + radiusPx*Math.sin(angle);

    [50,90,130,170].forEach(rr=>{
      svg.appendChild(el('circle',{cx,cy,r:rr,fill:'none',stroke:'var(--field)','stroke-opacity':0.14,'stroke-dasharray':'3 5'}));
    });
    svg.appendChild(el('circle',{cx,cy,r:radiusPx,fill:'none',stroke:'var(--field)','stroke-width':1.4,'stroke-opacity':0.5}));

    // wire symbol
    svg.appendChild(el('circle',{cx,cy,r:16,fill:'var(--blueprint-2)',stroke:'var(--copper)','stroke-width':2}));
    if(outOfPage){
      svg.appendChild(el('circle',{cx,cy,r:4.5,fill:'var(--copper)'}));
    } else {
      svg.appendChild(el('line',{x1:cx-7,y1:cy-7,x2:cx+7,y2:cy+7,stroke:'var(--copper)','stroke-width':2.4}));
      svg.appendChild(el('line',{x1:cx-7,y1:cy+7,x2:cx+7,y2:cy-7,stroke:'var(--copper)','stroke-width':2.4}));
    }
    svg.appendChild(el('text',{x:cx, y:cy-26, 'text-anchor':'middle', class:'drag-hint', fill:'var(--copper-dim)'})).textContent = 'extremidade do fio';

    svg.appendChild(el('line',{x1:cx,y1:cy,x2:px,y2:py,stroke:'var(--ink-dim)','stroke-width':1,'stroke-dasharray':'2 4'}));

    const dirSign = outOfPage ?  -1 : 1;
    const tanAngle = angle + dirSign*(Math.PI/2);
    const vlen = Math.max(18, Math.min(60, 18 + 10*Math.log10(BuT+1)));
    const vx = px + vlen*Math.cos(tanAngle);
    const vy = py + vlen*Math.sin(tanAngle);
    svg.appendChild(arrow(px,py,vx,vy,'var(--vector)'));

    const pHandle = el('circle',{cx:px,cy:py,r:9,fill:'var(--blueprint-2)',stroke:'var(--vector)','stroke-width':2,cursor:'grab'});
    svg.appendChild(pHandle);
    svg.appendChild(el('text',{x:px+12,y:py-10,class:'drag-hint',fill:'var(--vector)'})).textContent = 'P';

    dragify(pHandle, svg, (mx,my)=>{
      let dx = mx-cx, dy = my-cy;
      let d = Math.hypot(dx,dy);
      d = Math.max(minR, Math.min(maxR, d));
      angle = Math.atan2(dy,dx);
      radiusPx = d;
      draw();
    });

    document.getElementById('semi-r').innerHTML = rMeters.toFixed(3)+' <small>m</small>';
    document.getElementById('semi-b').innerHTML = BuT.toFixed(3)+' <small>μT</small>';
    document.getElementById('semi-dir').textContent = outOfPage ? 'anti-horário' : 'horário';
  }
  draw();
})();

// ============ BIOT-SAVART ELEMENTO (isometric) ============
(function(){
  const svg = document.getElementById('svg-biot');
  const originX = 190, originY = 260;
  const scaleR = 12;   // px per cm for r
  const scaleDl = 6;   // px per mm for dl (kept visually distinct)
  const scaleDB = 5.2e8; // px per Tesla-ish, tuned for visibility

  const iSlider = document.getElementById('biot-i');
  const iVal = document.getElementById('biot-i-val');
  const inputs = ['dl-x','dl-y','dl-z','r-x','r-y','r-z'].map(id=>document.getElementById(id));

  iSlider.addEventListener('input', ()=>{ iVal.textContent = parseFloat(iSlider.value).toFixed(1)+' A'; draw(); });
  inputs.forEach(inp=>inp.addEventListener('input', draw));

  // simple isometric projection
  function iso(x,y,z){
    const sx = (x - z) * Math.cos(Math.PI/6);
    const sy = (x + z) * Math.sin(Math.PI/6) - y;
    return [originX + sx, originY + sy];
  }

  function axisLine(dir, len, color, label){
    const [x2,y2] = iso(dir[0]*len, dir[1]*len, dir[2]*len);
    svg.appendChild(el('line',{x1:originX,y1:originY,x2,y2,stroke:color,'stroke-opacity':0.3,'stroke-width':1,'stroke-dasharray':'2 3'}));
  }

  function draw(){
    svg.innerHTML = '';
    const I = parseFloat(iSlider.value);
    const dl = [parseFloat(inputs[0].value)||0, parseFloat(inputs[1].value)||0, parseFloat(inputs[2].value)||0]; // mm
    const r  = [parseFloat(inputs[3].value)||0, parseFloat(inputs[4].value)||0, parseFloat(inputs[5].value)||0]; // cm

    // axes (decorative, faint)
    axisLine([1,0,0], 120, 'var(--ink-dim)');
    axisLine([0,1,0], 120, 'var(--ink-dim)');
    axisLine([0,0,1], 120, 'var(--ink-dim)');
    svg.appendChild(el('text',Object.assign({class:'drag-hint',fill:'var(--ink-dim)'},zip(iso(130,0,0)))) ).textContent='x';
    svg.appendChild(el('text',Object.assign({class:'drag-hint',fill:'var(--ink-dim)'},zip(iso(0,130,0)))) ).textContent='y';
    svg.appendChild(el('text',Object.assign({class:'drag-hint',fill:'var(--ink-dim)'},zip(iso(0,0,130)))) ).textContent='z';

    // dl vector (meters for physics -> convert mm to m)
    const dlM = dl.map(v=>v/1000);
    const [dlx,dly] = iso(dl[0]*scaleDl/6, dl[1]*scaleDl/6, dl[2]*scaleDl/6);
    svg.appendChild(arrow(originX, originY, dlx, dly, 'var(--copper)'));
    svg.appendChild(el('text',Object.assign({class:'drag-hint',fill:'var(--copper)'}, zip([dlx+8,dly-4])))).textContent = 'dl';

    // r vector (cm -> meters)
    const rM = r.map(v=>v/100);
    const [rx,ry] = iso(r[0]*scaleR/12, r[1]*scaleR/12, r[2]*scaleR/12);
    svg.appendChild(arrow(originX, originY, rx, ry, 'var(--field)'));
    svg.appendChild(el('text',Object.assign({class:'drag-hint',fill:'var(--field)'}, zip([rx+8,ry-4])))).textContent = 'r';

    // origin marker (current element)
    svg.appendChild(el('circle',{cx:originX,cy:originY,r:5,fill:'var(--blueprint-2)',stroke:'var(--copper)','stroke-width':2}));

    // physics: dB = leiBiotSavart(I, dl_m, r_m)
    const dB = leiBiotSavart(I, dlM, rM); // Tesla
    const rMag = Math.hypot(...rM);
    const dBmag = Math.hypot(...dB);

    // draw dB vector from the tip of r (visually, showing the field AT point r)
    const tipX = rx, tipY = ry;
    let dbEndX = tipX, dbEndY = tipY;
    if(dBmag > 0){
      const dbUnit = dB.map(v=>v/dBmag);
      const nT = dBmag * 1e9;
      const visLen = Math.max(14, Math.min(90, 14 + 22*Math.log10(nT+1)));
      const [ex,ey] = iso(
        r[0]*scaleR/12 + dbUnit[0]*visLen/scaleDB*1e8*0+dbUnit[0]*0, 0,0
      );
      // simpler: project unit dB direction directly with fixed pixel length
      const [dx0,dy0] = iso(dbUnit[0], dbUnit[1], dbUnit[2]);
      const [ox0,oy0] = iso(0,0,0);
      const ddx = dx0-ox0, ddy = dy0-oy0;
      const dlen = Math.hypot(ddx,ddy) || 1;
      dbEndX = tipX + (ddx/dlen)*visLen;
      dbEndY = tipY + (ddy/dlen)*visLen;
      svg.appendChild(arrow(tipX, tipY, dbEndX, dbEndY, 'var(--vector)'));
      svg.appendChild(el('text',Object.assign({class:'drag-hint',fill:'var(--vector)'}, zip([dbEndX+8,dbEndY-4])))).textContent = 'dB';
    }

    document.getElementById('biot-rmag').innerHTML = (rMag*100).toFixed(2)+' <small>cm</small>';
    document.getElementById('biot-vec').textContent =
      dB.map(v=>(v*1e9).toFixed(3)).join(', ') + ' nT';
    document.getElementById('biot-b').innerHTML = (dBmag*1e9).toFixed(4)+' <small>nT</small>';
  }
  function zip([x,y]){ return {x,y}; }
  draw();
})();

// ============ ARCO DE CIRCUNFERÊNCIA ============
(function(){
  const svg = document.getElementById('svg-arco');
  const cx = 210, cy = 210;
  const pxPerM = 180;
  const minR = 40, maxR = 180;
  let outOfPage = true;
  let radiusPx = 140;

  const iSlider = document.getElementById('arco-i');
  const iVal = document.getElementById('arco-i-val');
  const angSlider = document.getElementById('arco-ang');
  const angVal = document.getElementById('arco-ang-val');
  const outBtn = document.getElementById('arco-out');
  const inBtn = document.getElementById('arco-in');

  outBtn.addEventListener('click', ()=>{ outOfPage = true; outBtn.classList.add('active'); inBtn.classList.remove('active'); draw(); });
  inBtn.addEventListener('click', ()=>{ outOfPage = false; inBtn.classList.add('active'); outBtn.classList.remove('active'); draw(); });
  iSlider.addEventListener('input', ()=>{ iVal.textContent = parseFloat(iSlider.value).toFixed(1)+' A'; draw(); });
  angSlider.addEventListener('input', ()=>{ angVal.textContent = angSlider.value + '°'; draw(); });

 
  function draw(){
    svg.innerHTML = '';
    const I = parseFloat(iSlider.value);
    const graus = parseFloat(angSlider.value);
    const radianos = (graus * Math.PI) / 180;
    const rMeters = radiusPx / pxPerM;
    
    const B = campoCentroArcoCircunferencia(I, radianos, rMeters); 
    const BuT = B * 1e6;

    [50, 90, 130, 170].forEach(rr => {
      svg.appendChild(el('circle', { cx, cy, r: rr, fill: 'none', stroke: 'var(--field)', 'stroke-opacity': 0.1, 'stroke-dasharray': '3 5' }));
    });

    let pathData;
    let hx, hy; // Coordenadas do manípulo de arrastar
    let mx, my, tx, ty; // Coordenadas da seta de sentido

    if (graus >= 360) {
     pathData = `M ${cx} ${cy - radiusPx} A ${radiusPx} ${radiusPx} 0 1 1 ${cx - 0.01} ${cy - radiusPx} Z`;
      
      hx = cx;
      hy = cy + radiusPx;

      const dirSign = outOfPage ? 1 : -1;
      mx = cx;
      my = cy - radiusPx;
      tx = cx + dirSign * 5;
      ty = cy - radiusPx;    } else {
      const startAngle = -Math.PI / 2 - radianos / 2;
      const endAngle = -Math.PI / 2 + radianos / 2;
      
      const x1 = cx + radiusPx * Math.cos(startAngle);
      const y1 = cy + radiusPx * Math.sin(startAngle);
      const x2 = cx + radiusPx * Math.cos(endAngle);
      const y2 = cy + radiusPx * Math.sin(endAngle);
      const largeArcFlag = radianos > Math.PI ? 1 : 0;

      pathData = `M ${x1} ${y1} A ${radiusPx} ${radiusPx} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
      
      hx = x2;
      hy = y2;

      const dirSign = outOfPage ? 1 : -1;
      const midAngle = startAngle + (radianos / 2);
      mx = cx + radiusPx * Math.cos(midAngle);
      my = cy + radiusPx * Math.sin(midAngle);
      tx = cx + radiusPx * Math.cos(midAngle + dirSign * 0.05);
      ty = cy + radiusPx * Math.sin(midAngle + dirSign * 0.05);
    }

    svg.appendChild(el('path', { d: pathData, fill: 'none', stroke: 'var(--copper)', 'stroke-width': 3.5 }));

    svg.appendChild(arrow(mx, my, tx, ty, 'var(--copper)'));

    svg.appendChild(el('line', { x1: cx, y1: cy, x2: mx, y2: my, stroke: 'var(--ink-dim)', 'stroke-width': 1, 'stroke-dasharray': '2 4' }));
    
    svg.appendChild(el('circle', { cx, cy, r: 14, fill: 'var(--blueprint-2)', stroke: 'var(--vector)', 'stroke-width': 2 }));
    if (outOfPage) {
      svg.appendChild(el('circle', { cx, cy, r: 4, fill: 'var(--vector)' }));
    } else {
      svg.appendChild(el('line', { x1: cx - 5, y1: cy - 5, x2: cx + 5, y2: cy + 5, stroke: 'var(--vector)', 'stroke-width': 2 }));
      svg.appendChild(el('line', { x1: cx - 5, y1: cy + 5, x2: cx + 5, y2: cy - 5, stroke: 'var(--vector)', 'stroke-width': 2 }));
    }
    
    svg.appendChild(el('text', { x: cx + 18, y: cy + 5, class: 'drag-hint', fill: 'var(--vector)' })).textContent = 'P (Centro)';

    const rHandle = el('circle', { cx: hx, cy: hy, r: 9, fill: 'var(--blueprint-2)', stroke: 'var(--field)', 'stroke-width': 2, cursor: 'grab' });
    svg.appendChild(rHandle);
    svg.appendChild(el('text', { x: hx + 12, y: hy - 4, class: 'drag-hint', fill: 'var(--field)' })).textContent = 'Arraste p/ Raio';

    dragify(rHandle, svg, (mx, my) => {
      let dx = mx - cx, dy = my - cy;
      let d = Math.hypot(dx, dy);
      radiusPx = Math.max(minR, Math.min(maxR, d));
      draw();
    });

    document.getElementById('arco-r').innerHTML = rMeters.toFixed(3) + ' <small>m</small>';
    document.getElementById('arco-b').innerHTML = BuT.toFixed(3) + ' <small>μT</small>';
    document.getElementById('arco-dir').textContent = outOfPage ? 'saindo (⊙)' : 'entrando (⊗)';
  }
  
  draw();
})();

// ---- shared helpers ----
function arrow(x1,y1,x2,y2,color){
  const g = el('g',{});
  g.appendChild(el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':2.6,'stroke-linecap':'round'}));
  const ang = Math.atan2(y2-y1, x2-x1);
  const ah = 8;
  const p1x = x2 - ah*Math.cos(ang-0.4), p1y = y2 - ah*Math.sin(ang-0.4);
  const p2x = x2 - ah*Math.cos(ang+0.4), p2y = y2 - ah*Math.sin(ang+0.4);
  g.appendChild(el('polygon',{points:`${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`, fill:color}));
  return g;
}

function dragify(handle, svg, onMove){
  function toSvgPoint(evt){
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    const x = (clientX - rect.left) / rect.width * vb.width + vb.x;
    const y = (clientY - rect.top) / rect.height * vb.height + vb.y;
    return [x,y];
  }
  function move(evt){
    evt.preventDefault();
    const [x,y] = toSvgPoint(evt);
    onMove(x,y);
  }
  function up(){
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  }
  handle.addEventListener('pointerdown', (evt)=>{
    evt.preventDefault();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}
