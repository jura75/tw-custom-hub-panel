// ==UserScript==
// @name         TW Off/Def Tribe Stats — auto + Attack by Ram (Balans)
// @namespace    tw.offdef.autorun
// @version      3.7.1
// @description  Автосбор деревень племени (офф/дефф/фулки) + вкладка расчёта атаки по цели (таран): фильтры, календарь, сортировка, BB-код и ссылки на площадь
// @match        *://*.tribalwars*/*game.php*
// @match        *://*.voynaplemyon.com/*game.php*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  var SETTINGS_KEY = 'twp_offdef_settings_v3';
  var POP = { spear:1, sword:1, axe:1, archer:1, spy:2, light:4, marcher:5, heavy:6, ram:5, catapult:8, knight:10, snob:100 };
  var OFF_UNITS_RAW = ['axe','light','marcher','ram','catapult','knight'];
  var DEF_UNITS_RAW = ['spear','sword','archer','heavy','spy'];

  var UNIT_SECS_PER_FIELD = {
    spear: 18*60, sword: 22*60, axe: 18*60, archer:18*60, spy:9*60,
    light: 10*60, marcher:10*60, heavy:11*60, ram:30*60, catapult:30*60,
    knight:10*60, snob:35*60
  };

  var state = {
    players: [], sitterSuffix: '',
    rows: [], headerMap: {}, availableUnits: [], stats: null,
    worldSpeed: 1, unitSpeed: 1,
    villageMap: null, villageMapPromise: null
  };

  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function el(tag, attrs, html){
    var e = document.createElement(tag||'div'); attrs = attrs||{};
    for (var k in attrs){ if (!attrs.hasOwnProperty(k)) continue; if (k in e) e[k]=attrs[k]; else e.setAttribute(k,attrs[k]); }
    if (html!=null) e.innerHTML = html; return e;
  }
  function toInt(x){ if (x==null) return 0; var s=String(x).replace(/[^\d-]/g,''); var n=parseInt(s,10); return isNaN(n)?0:n; }
  function fmt(n){ return (n||0).toLocaleString('ru-RU'); }
  function pct(n){ return (Math.round(n*10)/10).toFixed(1); }
  function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function sleep(ms){ return new Promise(function(res){ setTimeout(res,ms); }); }
  function coordsFromText(t){ var m=String(t||'').match(/(\d{1,3})\|(\d{1,3})/); return m?(m[1]+'|'+m[2]):''; }
  function getCurrentVillageId(){
    try{ var u=new URL(location.href); var v=u.searchParams.get('village'); return v? String(v) : ''; }catch(_){ return ''; }
  }

  function getSettings(){
    var def={ offAdvantagePct:20, defAdvantagePct:20, fullOffPop:20000, fullDefPop:20000, minRamsForOff:300 };
    try{ var v=localStorage.getItem(SETTINGS_KEY); if (!v) return def; v=JSON.parse(v); for (var k in def){ if (!v.hasOwnProperty(k)) v[k]=def[k]; } return v; }
    catch(_){ return def; }
  }
  function saveSettings(s){ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }catch(_){ } }

  function popSum(units, list){ var sum=0; for (var i=0;i<list.length;i++){ var u=list[i]; sum += toInt(units[u])*(POP[u]||0); } return sum; }
  function normalizeUnit(u){ var map={ scout:'spy', spearman:'spear', swordsman:'sword' }; return map[u]||u; }

  function classify(row, sets, st){
    var offPop=popSum(row.units, sets.OFF);
    var defPop=popSum(row.units, sets.DEF);
    var total=offPop+defPop;
    var offPct= total? offPop*100/total : 0;
    var defPct= total? defPop*100/total : 0;
    var type='mixed';
    var offEdge=50+(st.offAdvantagePct||0)/2;
    var defEdge=50+(st.defAdvantagePct||0)/2;
    if (offPct>=offEdge) type='off'; else if (defPct>=defEdge) type='def';
    var isFullOff=(type==='off' && offPop>=(st.fullOffPop||20000) && toInt(row.units.ram)>=toInt(st.minRamsForOff||200));
    var isFullDef=(type==='def' && defPop>=(st.fullDefPop||20000));
    row.offPop=offPop; row.defPop=defPop; row.total=total; row.offPct=offPct; row.defPct=defPct; row.type=type; row.isFullOff=!!isFullOff; row.isFullDef=!!isFullDef;
  }

  function parseSitterSuffix(){
    try{
      if (typeof game_data!=='undefined' && game_data.player && game_data.player.sitter!=0){
        var m=String(game_data.link_base_pure||'').match(/&t=[^&]+/); if (m) return m[0];
      }
    }catch(_){}
    try{ var u=new URL(window.location.href); var t=u.searchParams.get('t'); if (t) return '&t='+encodeURIComponent(t); }catch(_){}
    return '';
  }

  function get(url){
    return new Promise(function(resolve,reject){
      if (window.$ && $.get){
        window.$.get(url).done(function(data){ resolve(String(data)); }).fail(function(){ reject(new Error('GET failed')); });
      } else {
        fetch(url,{credentials:'same-origin'}).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.text(); })
        .then(function(t){ resolve(t); }).catch(reject);
      }
    });
  }

  function parseXMLTag(xml, tag){
    var m = xml.match(new RegExp('<\\s*'+tag+'\\s*>\\s*([\\d.]+)\\s*<\\s*/\\s*'+tag+'\\s*>','i'));
    return m? parseFloat(m[1]) : null;
  }

  function fetchWorldSpeeds(){
    return get('/interface.php?func=get_config').then(function(xml){
      var ws = parseXMLTag(xml, 'speed') || 1;
      var us = parseXMLTag(xml, 'unit_speed') || 1;
      state.worldSpeed = ws;
      state.unitSpeed = us;
    }).catch(function(){
      state.worldSpeed = 1; state.unitSpeed = 1;
    });
  }

  // -------- village map (coords -> id) --------
  function ensureVillageMap(){
    if (state.villageMap) return Promise.resolve(state.villageMap);
    if (state.villageMapPromise) return state.villageMapPromise;
    state.villageMapPromise = get('/map/village.txt').then(function(txt){
      var map = {};
      var lines = txt.split(/\r?\n/);
      for (var i=0;i<lines.length;i++){
        var line = lines[i].trim();
        if (!line) continue;
        // id;name;x;y;player;... — берём первые 4
        var parts = line.split(';');
        if (parts.length>=4){
          var id = parts[0], x = parts[2], y = parts[3];
          map[x+'|'+y] = id;
        }
      }
      state.villageMap = map;
      return map;
    }).catch(function(){ state.villageMap = {}; return state.villageMap; });
    return state.villageMapPromise;
  }
  function villageIdByCoords(coords){
    if (!coords) return '';
    if (state.villageMap && state.villageMap[coords]) return state.villageMap[coords];
    return '';
  }

  function onTargetPage(){ try{ var u=new URL(window.location.href); return u.searchParams.get('screen')==='ally' && u.searchParams.get('mode')==='members_troops'; }catch(e){ return /screen=ally/.test(location.search)&&/mode=members_troops/.test(location.search); } }

  (function ensureMembersPage(){
    if (onTargetPage()) return;
    var sitter = parseSitterSuffix()||'';
    var u;
    try{ u = new URL(location.href); }catch(_){ u = null; }
    var vill = '';
    try{ if (u){ var v = u.searchParams.get('village'); if (v) vill = '&village='+encodeURIComponent(v); } }catch(_){}
    var target = '/game.php?screen=ally&mode=members_troops'+vill+sitter;
    location.replace(target);
  })();
  if (!onTargetPage()) return;

  var progressEl=null;
  function showProgress(current,total,name,err){
    if(!progressEl){
      progressEl=el('div',{id:'twp-progress',style:'position:sticky;top:0;z-index:9999;margin-bottom:10px;padding:10px 12px;background:#fff7e6;border:1px solid #e2c992;border-radius:10px;color:#5a3f00;font:13px/1.4 Arial,Helvetica,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.06);'});
      var container=$('#content_value')||$('#ally_content')||$('#contentContainer')||document.body; container.insertBefore(progressEl,container.firstChild);
    }
    progressEl.textContent='Загрузка данных: '+current+' из '+total+(name?(' — '+name):'')+(err?' (ошибка, пропуск)':'');
  }
  function hideProgress(){ if(progressEl&&progressEl.parentNode) progressEl.parentNode.removeChild(progressEl); progressEl=null; }

  function tableLooksLikeUnits(t){
    return !!(t && (t.querySelector('img[src*="unit_"]') ||
                    t.querySelector('[class*="unit_"],[class*="unit-"],[class*="unit-item"]') ));
  }
  function findUnitsTable(doc){
    var t=doc.querySelector('#units_table'); if (tableLooksLikeUnits(t)) return t;
    var w100 = doc.querySelector('.w100');
    if (w100){
      var node=w100; while(node && node.tagName!=='TABLE'){ node=node.parentNode; }
      if (node && tableLooksLikeUnits(node)) return node;
    }
    var t1=doc.querySelector('table.vis.w100'); if (tableLooksLikeUnits(t1)) return t1;
    var candidates=$all('table',doc);
    for (var i=0;i<candidates.length;i++){
      var tb=candidates[i]; if (!tableLooksLikeUnits(tb)) continue;
      var tr=tb.querySelector('tbody tr'); if (!tr) continue;
      if (/\d{1,3}\|\d{1,3}/.test(tr.textContent||'')) return tb;
    }
    return null;
  }
  function extractUnitFromNode(node){
    var img=node.querySelector && node.querySelector('img[src*="unit_"]');
    if (img){ var m=String(img.getAttribute('src')||'').match(/unit_([a-z]+)/); if (m) return normalizeUnit(m[1]); }
    var du=(node.getAttribute && node.getAttribute('data-unit')) || null; if (du) return normalizeUnit(du);
    var els=node.querySelectorAll ? node.querySelectorAll('[class*="unit_"],[class*="unit-"],[class*="unit-item"]') : [];
    for (var i=0;i<els.length;i++){
      var cls=(els[i].className||'')+'';
      var m = cls.match(/unit[_-](spear|sword|axe|archer|light|marcher|heavy|ram|catapult|knight|snob|spy|scout)/);
      if (m) return normalizeUnit(m[1]);
    }
    return null;
  }
  function buildHeaderMap(table){
    var map={};
    var thead=table.tHead;
    if (thead && thead.rows && thead.rows.length){
      for (var r=thead.rows.length-1; r>=0; r--){
        var ths=thead.rows[r].children||[];
        var found=false;
        for (var i=0;i<ths.length;i++){
          var th=ths[i]; var key=extractUnitFromNode(th);
          if (key){ var idx=(typeof th.cellIndex==='number')?th.cellIndex:i; map[key]=idx; found=true; }
        }
        if (found) return map;
      }
    }
    var allths=table.querySelectorAll('th');
    for (var j=0;j<allths.length;j++){
      var th2=allths[j]; var key2=extractUnitFromNode(th2);
      if (key2){ var idx2=(typeof th2.cellIndex==='number')?th2.cellIndex:j; map[key2]=idx2; }
    }
    return map;
  }

  function isVillageRow(tr){
    var tds=tr.children||[]; if(!tds.length) return false;
    var txt=(tr.textContent||'').toLowerCase();
    if(/итого|всего|сумма/.test(txt)) return false;
    var c0=tds[0]; if(!c0) return false;
    var html=c0.innerHTML||'', text=c0.textContent||'';
    var hasCoords=/\d{1,3}\|\d{1,3}/.test(html)||/\d{1,3}\|\d{1,3}/.test(text);
    var hasLink=(c0.querySelector && (c0.querySelector('a[href*="info_village"]')||c0.querySelector('a[href*="village="]')));
    return !!(hasCoords||hasLink);
  }

  function parseVillageIdFromCell(td){
    try{
      if (!td) return '';
      var a = td.querySelector('a[href*="info_village"]');
      if (a){
        var u = new URL(a.href, location.href);
        var id = u.searchParams.get('id');
        if (id) return String(id);
      }
    }catch(_){}
    return '';
  }

  function parseTable(table, headerMap, playerName){
    var tbody=table.querySelector('tbody')||table;
    var trs=tbody.querySelectorAll('tr');
    for (var i=0;i<trs.length;i++){
      var tr=trs[i]; if (!isVillageRow(tr)) continue;
      var tds=tr.children||[];
      var coords = coordsFromText(tds[0]? (tds[0].innerHTML||tds[0].textContent||'') : ''); if (!coords) continue;
      var units={};
      for (var u in headerMap){
        if (!headerMap.hasOwnProperty(u)) continue;
        var idx=headerMap[u]; var cell=tds[idx]; var v= cell ? (cell.textContent||cell.innerText||'') : '0';
        units[u]=toInt(v);
      }
      var villageId = parseVillageIdFromCell(tds[0]) || '';
      state.rows.push({ player:playerName, coords:coords, units:units, villageId:villageId });
    }
  }

  function filterUnitsByHeader(){
    var avail=[]; for (var u in state.headerMap){ if (state.headerMap.hasOwnProperty(u)) avail.push(u); }
    state.availableUnits=avail;
    var OFF=[], DEF=[];
    for (var i=0;i<OFF_UNITS_RAW.length;i++) if (avail.indexOf(OFF_UNITS_RAW[i])>=0) OFF.push(OFF_UNITS_RAW[i]);
    for (var j=0;j<DEF_UNITS_RAW.length;j++) if (avail.indexOf(DEF_UNITS_RAW[j])>=0) DEF.push(DEF_UNITS_RAW[j]);
    return { OFF:OFF, DEF:DEF };
  }

  function buildPlayers(){
    var sel=document.querySelector('select[name="player_id"]'); var players=[];
    if (!sel) return players;
    var opts=$all('option',sel);
    for (var i=0;i<opts.length;i++){
      var o=opts[i]; if (o.disabled) continue; if (!o.value && o.value!==0) continue;
      var name=String(o.textContent||'').trim(); if (/выберите/i.test(name)) continue;
      players.push({id:o.value,name:name});
    }
    return players;
  }

  function htmlToDoc(html){ var d=document.implementation.createHTMLDocument(''); d.documentElement.innerHTML=html; return d; }

  function collectAllPlayers(){
    var seq=Promise.resolve(); var total=state.players.length; var done=0;
    state.rows=[]; state.headerMap={};
    state.players.forEach(function(p){
      seq=seq.then(function(){
        showProgress(done,total,p.name);
        var url='/game.php?screen=ally&mode=members_troops&player_id='+encodeURIComponent(p.id)+(state.sitterSuffix||'');
        return get(url).then(function(html){
          done++; showProgress(done,total,p.name);
          var doc=htmlToDoc(html);
          var table=findUnitsTable(doc); if (!table){ return; }
          var localMap=buildHeaderMap(table);
          if (Object.keys(localMap).length){ for (var k in localMap){ if (!state.headerMap.hasOwnProperty(k)) state.headerMap[k]=localMap[k]; } }
          parseTable(table, Object.keys(localMap).length?localMap:state.headerMap, p.name);
        }).catch(function(){ done++; showProgress(done,total,p.name,true); })
        .then(function(){ return sleep(rnd(80,150)); });
      });
    });
    return seq.then(function(){ hideProgress(); });
  }

  function computeStats(sets, st){
    var totalVill=0, offCnt=0, defCnt=0, mixCnt=0, fullOff=0, fullDef=0, sumOff=0, sumDef=0;
    for (var i=0;i<state.rows.length;i++){
      var row=state.rows[i]; classify(row, sets, st);
      totalVill++; if (row.type==='off'){ offCnt++; if (row.isFullOff) fullOff++; }
      else if (row.type==='def'){ defCnt++; if (row.isFullDef) fullDef++; }
      else mixCnt++; sumOff+=row.offPop||0; sumDef+=row.defPop||0;
    }
    return { totalVill:totalVill, offCnt:offCnt, defCnt:defCnt, mixCnt:mixCnt, fullOff:fullOff, fullDef:fullDef, sumOff:sumOff, sumDef:sumDef };
  }

  function aggregateByPlayer(){
    var m={}, out=[];
    for (var i=0;i<state.rows.length;i++){
      var r=state.rows[i]; var p=r.player;
      if (!m[p]) m[p]={ player:p, vill:0, offVill:0, defVill:0, mixVill:0, sumOffPop:0, sumDefPop:0, fullOff:0, fullDef:0 };
      var a=m[p]; a.vill++;
      if (r.type==='off') a.offVill++; else if (r.type==='def') a.defVill++; else a.mixVill++;
      a.sumOffPop+=r.offPop||0; a.sumDefPop+=r.defPop||0;
      if (r.isFullOff) a.fullOff++; if (r.isFullDef) a.fullDef++;
    }
    for (var k in m){ if (m.hasOwnProperty(k)) out.push(m[k]); }
    return out;
  }

  function makeTopsVillages(){
    var r1=state.rows.slice().sort(function(a,b){ return (b.offPop||0)-(a.offPop||0); });
    var r2=state.rows.slice().sort(function(a,b){ return (b.defPop||0)-(a.defPop||0); });
    return { topOff: r1.slice(0,20), topDef: r2.slice(0,20), allOff: r1, allDef: r2 };
  }
  function makeTopsPlayers(){
    var agg=aggregateByPlayer();
    var byOff=agg.slice().sort(function(a,b){ return (b.sumOffPop||0)-(a.sumOffPop||0); }).slice(0,20);
    var byDef=agg.slice().sort(function(a,b){ return (b.sumDefPop||0)-(a.sumDefPop||0); }).slice(0,20);
    return { byOff:byOff, byDef:byDef };
  }

  function splitCoords(c){
    var m = String(c||'').match(/^\s*(\d{1,3})\|(\d{1,3})\s*$/);
    return m ? {x:parseInt(m[1],10), y:parseInt(m[2],10)} : null;
  }
  function distFields(a, b){
    if (!a || !b) return NaN;
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx*dx + dy*dy);
  }
  function travelMsByRam(distance){
    var secsPerField = UNIT_SECS_PER_FIELD.ram || (30*60);
    var factor = (state.worldSpeed||1) * (state.unitSpeed||1);
    if (factor <= 0) factor = 1;
    var totalSecs = distance * (secsPerField / factor);
    return Math.round(totalSecs * 1000);
  }
  function pad2(n){ return (n<10?'0':'')+n; }
  function pad3(n){ return n<10?'00'+n : n<100?'0'+n : ''+n; }
  function formatDateTimeRu(d){
    var dd = pad2(d.getDate());
    var mm = pad2(d.getMonth()+1);
    var yyyy = d.getFullYear();
    var HH = pad2(d.getHours());
    var MM = pad2(d.getMinutes());
    var SS = pad2(d.getSeconds());
    var mmm = pad3(d.getMilliseconds());
    return dd+'.'+mm+'.'+yyyy+' '+HH+':'+MM+':'+SS+':'+mmm;
  }
  function parseRuDateTime(s){
    var m = String(s||'').match(/^\s*(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2}):(\d{3})\s*$/);
    if (!m) return null;
    var d = new Date(parseInt(m[3],10), parseInt(m[2],10)-1, parseInt(m[1],10), parseInt(m[4],10), parseInt(m[5],10), parseInt(m[6],10), parseInt(m[7],10));
    return isNaN(d.getTime()) ? null : d;
  }
  function dtLocalToMask(val){
    if (!val) return '';
    var m = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return '';
    var dd = m[3]+'.'+m[2]+'.'+m[1]+' '+m[4]+':'+m[5]+':'+(m[6]||'00')+':000';
    return dd;
  }

  function copyToClipboard(text){
    try{ navigator.clipboard.writeText(text); }
    catch(_){
      var ta = el('textarea',{style:'position:fixed;left:-9999px;top:-9999px;'}, text);
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); }catch(__){}
      ta.remove();
    }
  }

  function ensureStyles(){
    if (document.getElementById('twp-offdef-style')) return;
    var css='' +
    '.twp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:2147483000}' +
    '.twp-modal{background:#fbf6e0;border:1px solid #c9b47a;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.35);width:98vw;max-width:1600px;height:95vh;display:flex;flex-direction:column;font:13px/1.45 Arial,Helvetica,sans-serif;color:#1a1200;overflow:hidden}' + /* larger */
    '.twp-head{padding:12px 16px;background:linear-gradient(#fff7e6,#f3e7c4);border-bottom:1px solid #c9b47a;display:flex;align-items:center;justify-content:space-between;font-weight:700;color:#5a3f00}' +
    '.twp-body{flex:1;display:grid;grid-template-columns:3fr 1fr;gap:16px;padding:16px;overflow:hidden}' + /* wider left */
    '.twp-col{border:1px solid #e3d6b4;border-radius:10px;background:#fff;display:flex;flex-direction:column;min-height:0}' +
    '.twp-title{padding:10px 12px;background:linear-gradient(#fff7e6,#f3e7c4);border-bottom:1px solid #e3d6b4;font-weight:700;color:#5a3f00;display:flex;align-items:center;gap:10px}' +
    '.twp-scroll{padding:12px;overflow-y:auto;overflow-x:hidden}' + /* no horizontal scroll */
    '.twp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}' +
    '.twp-kpi{background:#fffdf6;border:1px solid #f0e2bd;border-radius:10px;padding:12px;box-shadow:0 1px 0 rgba(0,0,0,.04) inset}' +
    '.twp-kpi b{display:block;font-size:18px;margin-bottom:4px;color:#4a2f00}' +
    '.twp-table{width:100%;border-collapse:collapse;table-layout:auto}' +
    '.twp-table th,.twp-table td{padding:8px;border-bottom:1px solid #eee;text-align:center;word-break:break-word;white-space:normal}' + /* allow wrap */
    '.twp-table thead th{position:sticky;top:0;background:#fff7e6;z-index:1}' +
    '.twp-time{font-variant-numeric: tabular-nums;}' +
    '.twp-footer{padding:10px 12px;border-top:1px solid #e3d6b4;background:#fff;display:flex;justify-content:space-between;align-items:center}' +
    '.twp-btn{cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid #c9b47a;border-radius:10px;background:linear-gradient(#fff7e6,#f3e7c4);color:#5a3f00;font-weight:700}' +
    '.twp-chip{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #eadfbe;border-radius:999px;background:#fffbe8;margin:6px 0}' +
    '.twp-chip input{width:100px}' +
    '.twp-tabs{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap}' +
    '.twp-tab{cursor:pointer;padding:8px 12px;border:1px solid #eadfbe;border-radius:10px;background:#fffbe8;color:#5a3f00;font-weight:700}' +
    '.twp-tab.active{background:#ffe5a6;border-color:#d6bd77}' +
    '.twp-help{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#ffe5a6;border:1px solid #c9b47a;color:#5a3f00;font-weight:700;cursor:pointer}' +
    '.twp-helpbox{display:none;margin:12px;border:1px solid #eadfbe;background:#fffef4;border-radius:10px;padding:12px;color:#3b2b00;line-height:1.5}' +
    '.twp-helpbox.show{display:block}' +
    '.twp-form{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:8px 0 12px}' +
    '.twp-input{border:1px solid #d6bd77;border-radius:10px;padding:8px 10px;background:#fff;font:13px Arial,Helvetica,sans-serif;color:#1a1200}' +
    '.twp-input.coords{width:140px}' +
    '.twp-input.masked{width:270px}' +
    '.twp-small{font-size:12px;color:#6a5200;margin-top:6px}' +
    '.twp-badge{display:inline-block;padding:4px 8px;border:1px solid #e3d6b4;border-radius:999px;background:#fffbe8;margin-left:8px}' +
    '.twp-copy{margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}' +
    '.twp-switch{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #eadfbe;border-radius:999px;background:#fffbe8}' +
    '.twp-num{width:90px}' +
    '.twp-pop{position:relative;display:inline-flex;align-items:center;gap:8px}' +
    '.twp-popmenu{position:absolute;z-index:9999;top:120%;left:0;background:#fffef4;border:1px solid #e3d6b4;border-radius:12px;box-shadow:0 12px 28px rgba(0,0,0,.18);padding:12px;display:none;min-width:360px}' +
    '.twp-popmenu.show{display:block}' +
    '.twp-popmenu .row{display:flex;align-items:center;gap:10px}' +
    '.twp-popmenu input[type=datetime-local]{border:1px solid #d6bd77;border-radius:10px;padding:8px 10px;background:#fff;font:13px Arial,Helvetica,sans-serif;flex:1}' +
    '.twp-rowcopy .twp-btn{padding:4px 8px;font-weight:600}' +
    '@media(max-width:980px){.twp-body{grid-template-columns:1fr}.twp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}';
    document.head.appendChild(el('style',{id:'twp-offdef-style'},css));
  }

  function kpiBox(title,value,sub){
    var box=el('div',{className:'twp-kpi'});
    box.appendChild(el('b',{},value));
    box.appendChild(el('div',{},title+(sub?(' — '+sub):'')));
    return box;
  }

  function villageTopTable(title, rows){
    var box=el('div',{style:'margin-top:12px'});
    box.appendChild(el('div',{className:'twp-title'},' '+title));
    var wrap=el('div',{className:'twp-scroll',style:'max-height:300px'});
    var tbl=el('table',{className:'twp-table'});
    var thead='<thead><tr><th>#</th><th>Игрок</th><th>Коорд.</th><th>Офф-население</th><th>Деф-население</th><th>Тип</th></tr></thead>';
    var bodyHtml=''; for (var i=0;i<rows.length;i++){ var tr=rows[i];
      bodyHtml+='<tr><td>'+(i+1)+'</td><td>'+tr.player+'</td><td>'+tr.coords+'</td><td>'+fmt(tr.offPop||0)+'</td><td>'+fmt(tr.defPop||0)+'</td><td>'+tr.type+'</td></tr>';
    }
    tbl.innerHTML=thead+'<tbody>'+bodyHtml+'</tbody>'; wrap.appendChild(tbl); box.appendChild(wrap); return box;
  }

  function playersTopTable(title, rows, key){
    var box=el('div',{style:'margin-top:12px'});
    box.appendChild(el('div',{className:'twp-title'},' '+title));
    var wrap=el('div',{className:'twp-scroll',style:'max-height:300px'});
    var tbl=el('table',{className:'twp-table'});
    var thead='<thead><tr><th>#</th><th>Игрок</th><th>Деревень</th><th>Офф-дер.</th><th>Деф-дер.</th><th>Смеш.</th><th>'+ (key==='off'?'Сумма офф-нас.':'Сумма дефф-нас.') +'</th></tr></thead>';
    var bodyHtml=''; for (var i=0;i<rows.length;i++){ var r=rows[i];
      var val = key==='off'? r.sumOffPop : r.sumDefPop;
      bodyHtml+='<tr><td>'+(i+1)+'</td><td>'+r.player+'</td><td>'+fmt(r.vill)+'</td><td>'+fmt(r.offVill)+'</td><td>'+fmt(r.defVill)+'</td><td>'+fmt(r.mixVill)+'</td><td>'+fmt(val)+'</td></tr>';
    }
    tbl.innerHTML=thead+'<tbody>'+bodyHtml+'</tbody>'; wrap.appendChild(tbl); box.appendChild(wrap); return box;
  }

  function renderModal(sets){
    ensureStyles();

    var overlay=el('div',{className:'twp-overlay'});
    var modal=el('div',{className:'twp-modal'});

    var head=el('div',{className:'twp-head'});
    head.appendChild(el('div',{},'Статистика племени — Офф/Деф/Фулки + Атака по цели (таран)'));
    var closeBtn=el('button',{className:'twp-btn'},'Закрыть'); closeBtn.onclick=function(){ overlay.remove(); };
    head.appendChild(closeBtn);

    var body=el('div',{className:'twp-body'});

    var left=el('div',{className:'twp-col'});
    left.appendChild(el('div',{className:'twp-title'},'Итоги, топы и атака'));

    var leftScroll=el('div',{className:'twp-scroll'});

    var s=state.stats;
    var offPctAll=s.totalVill? s.offCnt*100/s.totalVill : 0;
    var defPctAll=s.totalVill? s.defCnt*100/s.totalVill : 0;
    var mixPctAll=s.totalVill? s.mixCnt*100/s.totalVill : 0;
    var fullOffPct=s.offCnt? s.fullOff*100/s.offCnt : 0;
    var fullDefPct=s.defCnt? s.fullDef*100/s.defCnt : 0;
    var ratioCnt = s.defCnt? (s.offCnt/s.defCnt) : 0;
    var ratioPop = s.sumDef? (s.sumOff/s.sumDef) : 0;

    var kpis=el('div',{className:'twp-grid'});
    kpis.appendChild(kpiBox('Всего деревень',fmt(s.totalVill)));
    kpis.appendChild(kpiBox('Офф-деревни',fmt(s.offCnt),pct(offPctAll)+' %'));
    kpis.appendChild(kpiBox('Дефф-деревни',fmt(s.defCnt),pct(defPctAll)+' %'));
    kpis.appendChild(kpiBox('Смешанные',fmt(s.mixCnt),pct(mixPctAll)+' %'));
    kpis.appendChild(kpiBox('Фул офф',fmt(s.fullOff),pct(fullOffPct)+' % от офф'));
    kpis.appendChild(kpiBox('Фул дефф',fmt(s.fullDef),pct(fullDefPct)+' % от дефф'));
    kpis.appendChild(kpiBox('Суммарное офф-население',fmt(s.sumOff)));
    kpis.appendChild(kpiBox('Суммарное дефф-население',fmt(s.sumDef)));
    kpis.appendChild(kpiBox('Офф/Дефф население', fmt(s.sumOff)+' / '+fmt(s.sumDef), (s.sumDef? (pct(ratioPop*100/100)+'×') : '—')));
    kpis.appendChild(kpiBox('Офф/Дефф деревень', s.offCnt+' / '+s.defCnt, (s.defCnt? (pct(ratioCnt*100/100)+'×') : '—')));
    leftScroll.appendChild(kpis);

    var tabs=el('div',{className:'twp-tabs'});
    var tabVill=el('button',{className:'twp-tab active'},'Деревни');
    var tabPlayers=el('button',{className:'twp-tab'},'Игроки');
    var tabAttack=el('button',{className:'twp-tab'},'Атака (по тарану)');
    tabs.appendChild(tabVill); tabs.appendChild(tabPlayers); tabs.appendChild(tabAttack);
    leftScroll.appendChild(tabs);

    var section=el('div'); leftScroll.appendChild(section);

    var topsVill=makeTopsVillages();
    var topsPl=makeTopsPlayers();
    var showAll=false;

    function renderVillages(){
      section.innerHTML='';
      var ctrl=el('div',{style:'display:flex;justify-content:flex-end;gap:10px;margin:8px 0;'});
      var btnToggle=el('button',{className:'twp-btn'}, (showAll?'Показать ТОП-20':'Показать все деревни'));
      btnToggle.onclick=function(){ showAll=!showAll; renderVillages(); };
      ctrl.appendChild(btnToggle); section.appendChild(ctrl);
      section.appendChild(villageTopTable('ТОП по офф-населению', showAll? topsVill.allOff : topsVill.topOff));
      section.appendChild(villageTopTable('ТОП по дефф-населению', showAll? topsVill.allDef : topsVill.topDef));
    }
    function renderPlayers(){
      section.innerHTML='';
      section.appendChild(playersTopTable('ТОП игроков по сумме офф-населения', topsPl.byOff, 'off'));
      section.appendChild(playersTopTable('ТОП игроков по сумме дефф-населения', topsPl.byDef, 'def'));
    }

    function applyCoordMask(input){
      input.addEventListener('input', function(){
        var val = input.value.replace(/[^\d|]/g,'');
        val = val.replace(/\|+/g,'|');
        val = val.replace(/^(\d{0,3})\|?(\d{0,3}).*$/, function(_,a,b){ return (a||'') + (b!==undefined && b!=='' ? '|'+b : (a.length>3?'|':'')); });
        if (val.length>7) val = val.slice(0,7);
        if (/^\d{6}$/.test(val)) val = val.slice(0,3)+'|'+val.slice(3);
        input.value = val;
      });
    }

    function applyDateMask(input){
      input.placeholder = 'ДД.ММ.ГГГГ ЧЧ:ММ:СС:мс';
      input.addEventListener('input', function(){
        var v = input.value.replace(/[^\d :.]/g,'');
        input.value = v.slice(0, 23);
      });
    }

    function renderAttack(){
      section.innerHTML='';

      var panel = el('div');
      var form = el('div',{className:'twp-form'});
      var coordsInp = el('input',{className:'twp-input coords',placeholder:'Цель: 000|000',title:'Введите координаты цели (например, 500|500)'});

      var dateWrap = el('div',{className:'twp-pop'});
      var arriveInp = el('input',{className:'twp-input masked',placeholder:'Время прихода: 00.00.0000 00:00:00:000',title:'Введите время прихода (dd.MM.yyyy HH:mm:ss:SSS)'});
      var openBtn = el('button',{className:'twp-btn',type:'button',title:'Календарь'},'📅');
      var menu = el('div',{className:'twp-popmenu'});
      var row = el('div',{className:'row'});
      var dt = el('input',{type:'datetime-local',step:'1'});
      var applyBtn = el('button',{className:'twp-btn',type:'button'},'Применить');
      row.appendChild(dt); row.appendChild(applyBtn); menu.appendChild(row);
      dateWrap.appendChild(arriveInp); dateWrap.appendChild(openBtn); dateWrap.appendChild(menu);

      var list = el('datalist',{id:'twp-presets'});
      var presets = [5,10,15,20,30,45,60].map(function(m){ var d=el('option'); d.value='+'+m+' мин'; return d; });
      presets.forEach(function(opt){ list.appendChild(opt); });
      arriveInp.setAttribute('list','twp-presets');

      applyCoordMask(coordsInp);
      applyDateMask(arriveInp);

      var onlyFullWrap = el('label',{className:'twp-switch',title:'Показывать только фул-офф деревни'},'');
      var onlyFull = el('input',{type:'checkbox'});
      onlyFullWrap.appendChild(onlyFull); onlyFullWrap.appendChild(el('span',{},'Только фул-офф'));

      var minRWrap = el('label',{className:'twp-switch',title:'Минимум таранов в деревне'});
      minRWrap.appendChild(el('span',{},'≥ '));
      var minR = el('input',{type:'number',className:'twp-input twp-num',min:'0',step:'1',value:'0'});
      minRWrap.appendChild(minR); minRWrap.appendChild(el('span',{},' таранов'));

      var info = el('div',{className:'twp-small'},'Подсчёт по скорости мира/юнитов берётся из настроек мира автоматически. Рассчитывается ход «тараном». Фильтры применяются ко всем офф-деревням.');
      var resultWrap = el('div',{style:'margin-top:10px'});
      var copyWrap = el('div',{className:'twp-copy'});
      var copyBtn = el('button',{className:'twp-btn',disabled:true},'Скопировать BB-код');
      var countBadge = el('span',{className:'twp-badge'},'0 подходящих');
      copyWrap.appendChild(copyBtn); copyWrap.appendChild(countBadge);

      form.appendChild(coordsInp);
      form.appendChild(dateWrap);
      form.appendChild(onlyFullWrap);
      form.appendChild(minRWrap);

      panel.appendChild(form);
      panel.appendChild(info);
      panel.appendChild(resultWrap);
      panel.appendChild(copyWrap);
      section.appendChild(panel);

      var tbl=null, tbody=null, prepared=[];

      function ensureTable(){
        if (tbl && tbody && document.body.contains(tbl)) return;
        tbl = el('table',{className:'twp-table',style:'margin-top:8px'});
        // define colgroup for widths
        var colgroup = '<colgroup>'+
          '<col style="width:44px">'+ // #
          '<col style="min-width:140px">'+ // Игрок
          '<col style="min-width:110px">'+ // Деревня
          '<col style="width:90px">'+ // Дистанция
          '<col style="width:130px">'+ // Ход
          '<col style="min-width:180px">'+ // Отправить в
          '<col style="min-width:180px">'+ // Прибытие
          '<col style="min-width:90px">'+ // Цель
          '<col style="width:130px">'+ // Действия
        '</colgroup>';
        tbl.innerHTML = colgroup + '<thead><tr>'+
          '<th>#</th><th>Игрок</th><th>Деревня</th><th>Дистанция</th><th>Ход (таран)</th>'+
          '<th>Отправить в</th><th>Прибытие</th><th>Цель</th><th>Действия</th></tr></thead><tbody></tbody>';
        tbody = tbl.querySelector('tbody');
        var sc = el('div',{className:'twp-scroll',style:'max-height:410px;margin-top:6px;'}); sc.appendChild(tbl);
        resultWrap.appendChild(sc);
      }
      function clearResultsDOM(){
        resultWrap.innerHTML='';
        tbl=null; tbody=null; prepared=[];
      }

      function buildPlaceLink(srcVillageId, target){
        var u = new URL('/game.php', location.origin);
        u.searchParams.set('screen','place');
        if (srcVillageId) u.searchParams.set('village', String(srcVillageId));
        u.searchParams.set('x', String(target.x));
        u.searchParams.set('y', String(target.y));
        var tid='';
        if (state.villageMap){ tid = state.villageMap[target.x+'|'+target.y] || ''; }
        if (tid) u.searchParams.set('target', String(tid));
        u.searchParams.set('from','simulator');
        if (state.sitterSuffix){ u.search += state.sitterSuffix; }
        return u.toString();
      }

      function buildBBHeader(){
        return '[table]\n[**]Ник[||]Откуда отправить[||]Цель[||]Время выхода[||]Время прихода[||]Ссылка на площадь[/**]';
      }
      function buildBBRow(it){
        var link = '[url='+it.link+']Отправить[/url]';
        return '\n[*]'+it.r.player+'[|]'+it.r.coords+'[|]'+(it.targetStr)+'[|]'+
               formatDateTimeRu(it.sendTime)+'[|]'+formatDateTimeRu(it.arrival)+'[|]'+link;
      }
      function buildBBTable(rows){
        var out = buildBBHeader();
        for (var i=0;i<rows.length;i++){ out += buildBBRow(rows[i]); }
        out += '\n[/table]';
        return out;
      }

      function recalc(){
        var target = splitCoords(coordsInp.value);
        var arrival;
        if (/^\s*\+\s*(\d+)\s*мин/i.test(arriveInp.value)){
          var mm = /(\d+)/.exec(arriveInp.value); var mins = mm? parseInt(mm[1],10):NaN;
          if (!isNaN(mins)) { arrival = new Date(Date.now() + mins*60000); }
        } else {
          arrival = parseRuDateTime(arriveInp.value);
        }
        if (!target || !arrival){
          clearResultsDOM();
          copyBtn.disabled=true; countBadge.textContent='0 подходящих';
          return;
        }

        ensureVillageMap().then(function(){
          ensureTable();
          tbody.innerHTML='';
          prepared=[];
          var now = Date.now();
          var minRamsValue = toInt(minR.value||'0');
          var onlyFullFlag = !!onlyFull.checked;

          for (var i=0;i<state.rows.length;i++){
            var r = state.rows[i];
            if (r.type!=='off') continue;
            if (onlyFullFlag && !r.isFullOff) continue;
            if (minRamsValue>0 && toInt(r.units.ram)<minRamsValue) continue;

            var vc = splitCoords(r.coords);
            var dFields = distFields(vc, target);
            var tMs = travelMsByRam(dFields);
            var sendTime = new Date(arrival.getTime() - tMs);
            if (sendTime.getTime() < now) continue;

            var srcId = r.villageId || villageIdByCoords(r.coords) || getCurrentVillageId();
            var link = buildPlaceLink(srcId, target);
            prepared.push({r:r, dFields:dFields, tMs:tMs, sendTime:sendTime, link:link, targetStr:target.x+'|'+target.y, arrival:arrival});
          }

          prepared.sort(function(a,b){ return a.tMs - b.tMs; });

          for (var k=0;k<prepared.length;k++){
            var it = prepared[k], r = it.r;
            var tr = el('tr');
            tr.appendChild(el('td',{}, String(k+1)));
            tr.appendChild(el('td',{}, r.player));
            tr.appendChild(el('td',{}, r.coords));
            tr.appendChild(el('td',{}, it.dFields.toFixed(2)));
            var hh = Math.floor(it.tMs/3600000);
            var mm2 = Math.floor((it.tMs%3600000)/60000);
            var ss = Math.floor((it.tMs%60000)/1000);
            var ms = it.tMs%1000;
            var walkStr = pad2(hh)+':'+pad2(mm2)+':'+pad2(ss)+':'+pad3(ms);
            tr.appendChild(el('td',{}, walkStr));
            var tdSend=el('td',{className:'twp-time'}, formatDateTimeRu(it.sendTime));
            var tdArr =el('td',{className:'twp-time'}, formatDateTimeRu(it.arrival));
            tr.appendChild(tdSend);
            tr.appendChild(tdArr);
            tr.appendChild(el('td',{}, it.targetStr));

            var act = el('td',{className:'twp-rowcopy'});
            var btn = el('button',{className:'twp-btn',type:'button',title:'Скопировать для этой строки'},'Скопировать');
            btn.addEventListener('click', function(it2, b){
              return function(){
                var txt = buildBBTable([it2]);
                copyToClipboard(txt);
                var old = b.textContent; b.textContent='✓ Скопировано'; setTimeout(function(){ b.textContent=old; }, 1200);
              };
            }(it, btn));
            act.appendChild(btn);
            tr.appendChild(act);
            tbody.appendChild(tr);
          }

          countBadge.textContent = prepared.length+' подходящих';
          copyBtn.disabled = prepared.length===0;
        });
      }

      coordsInp.addEventListener('input', recalc);
      arriveInp.addEventListener('input', recalc);
      onlyFull.addEventListener('change', recalc);
      minR.addEventListener('input', recalc);

      openBtn.addEventListener('click', function(){
        menu.classList.toggle('show');
        if (menu.classList.contains('show') && !dt.value){
          var d = new Date(Date.now()+15*60000);
          var iso = d.toISOString().slice(0,19);
          dt.value = iso;
        }
      });
      applyBtn.addEventListener('click', function(){
        var masked = dtLocalToMask(dt.value);
        if (masked){
          arriveInp.value = masked;
          menu.classList.remove('show');
          recalc();
        }
      });
      document.addEventListener('click', function(ev){
        if (!dateWrap.contains(ev.target)){
          menu.classList.remove('show');
        }
      });

      copyBtn.onclick=function(){
        if (!prepared.length) return;
        var txt = buildBBTable(prepared);
        copyToClipboard(txt);
        var old = copyBtn.textContent; copyBtn.textContent='✓ Скопировано'; setTimeout(function(){ copyBtn.textContent=old; }, 1200);
      };
    }

    renderVillages();
    left.appendChild(leftScroll);

    var right=el('div',{className:'twp-col twp-right'});
    var titleRight=el('div',{className:'twp-title'},'Настройки');
    var helpBtn=el('span',{className:'twp-help',title:'Подсказка'},'?');
    titleRight.appendChild(helpBtn);
    right.appendChild(titleRight);

    var helpBox=el('div',{className:'twp-helpbox'});
    helpBox.innerHTML =
      '<b>Что значат настройки:</b><br>'+
      '<ul style=\"margin:6px 0 0 16px; padding:0;\">'+
      '<li><b>Преимущество офф, %</b> — порог = <b>50% + значение/2</b>.</li>'+
      '<li><b>Преимущество дефф, %</b> — порог = <b>50% + значение/2</b>.</li>'+
      '<li><b>Фул офф, население</b> — минимум офф-населения для статуса «фул офф» (плюс минимум таранов).</li>'+
      '<li><b>Мин. таранов для фула</b> — минимум таранов для статуса «фул офф».</li>'+
      '<li><b>Фул дефф, население</b> — минимум дефф-населения для статуса «фул дефф».</li>'+
      '</ul>'+
      '<div style=\"margin-top:6px;\">На вкладке «Атака (по тарану)» доступны фильтры и сортировка по времени хода (ближайшие сверху).</div>';
    right.appendChild(helpBox);

    helpBtn.onclick=function(){ if (helpBox.classList.contains('show')) helpBox.classList.remove('show'); else helpBox.classList.add('show'); };

    var rScroll=el('div',{className:'twp-scroll'});
    function chip(label,key,min,max){
      var st=getSettings(); var c=el('div',{className:'twp-chip'}); c.appendChild(el('span',{},label+':'));
      var inp=el('input',{type:'number',value:st[key],min:min,max:max});
      inp.oninput=function(){ var s=getSettings(); s[key]=toInt(inp.value); saveSettings(s); recalcAndRerender(); };
      c.appendChild(inp); return c;
    }
    rScroll.appendChild(chip('Преимущество офф, %','offAdvantagePct',0,100));
    rScroll.appendChild(chip('Преимущество дефф, %','defAdvantagePct',0,100));
    rScroll.appendChild(chip('Фул офф, население','fullOffPop',0,999999));
    rScroll.appendChild(chip('Мин. таранов для фула','minRamsForOff',0,9999));
    rScroll.appendChild(chip('Фул дефф, население','fullDefPop',0,999999));
    right.appendChild(rScroll);

    var foot=el('div',{className:'twp-footer'});
    foot.appendChild(el('div',{},'Данные собраны по ВСЕМ участникам автоматически.'));
    var btns=el('div');
    var btnClose=el('button',{className:'twp-btn'},'Закрыть'); btnClose.onclick=function(){ overlay.remove(); };
    btns.appendChild(btnClose);
    foot.appendChild(btns);

    modal.appendChild(head); modal.appendChild(body); body.appendChild(left); body.appendChild(right); modal.appendChild(foot);
    overlay.appendChild(modal); document.body.appendChild(overlay);

    function recalcAndRerender(){
      var sets2=filterUnitsByHeader(); var st2=getSettings(); state.stats=computeStats(sets2,st2);
      leftScroll.innerHTML='';
      var s2=state.stats;
      var offPctAll2=s2.totalVill? s2.offCnt*100/s2.totalVill : 0;
      var defPctAll2=s2.totalVill? s2.defCnt*100/s2.totalVill : 0;
      var mixPctAll2=s2.totalVill? s2.mixCnt*100/s2.totalVill : 0;
      var fullOffPct2=s2.offCnt? s2.fullOff*100/s2.offCnt : 0;
      var fullDefPct2=s2.defCnt? s2.fullDef*100/s2.defCnt : 0;
      var ratioCnt2 = s2.defCnt? (s2.offCnt/s2.defCnt) : 0;
      var ratioPop2 = s2.sumDef? (s2.sumOff/s2.sumDef) : 0;

      var k2=el('div',{className:'twp-grid'});
      k2.appendChild(kpiBox('Всего деревень',fmt(s2.totalVill)));
      k2.appendChild(kpiBox('Офф-деревни',fmt(s2.offCnt),pct(offPctAll2)+' %'));
      k2.appendChild(kpiBox('Дефф-деревни',fmt(s2.defCnt),pct(defPctAll2)+' %'));
      k2.appendChild(kpiBox('Смешанные',fmt(s2.mixCnt),pct(mixPctAll2)+' %'));
      k2.appendChild(kpiBox('Фул офф',fmt(s2.fullOff),pct(fullOffPct2)+' % от офф'));
      k2.appendChild(kpiBox('Фул дефф',fmt(s2.fullDef),pct(fullDefPct2)+' % от дефф'));
      k2.appendChild(kpiBox('Суммарное офф-население',fmt(s2.sumOff)));
      k2.appendChild(kpiBox('Суммарное дефф-население',fmt(s2.sumDef)));
      k2.appendChild(kpiBox('Офф/Дефф население', fmt(s2.sumOff)+' / '+fmt(s2.sumDef), (s2.sumDef? (pct(ratioPop2*100/100)+'×') : '—')));
      k2.appendChild(kpiBox('Офф/Дефф деревень', s2.offCnt+' / '+s2.defCnt, (s2.defCnt? (pct(ratioCnt2*100/100)+'×') : '—')));
      leftScroll.appendChild(k2);
      leftScroll.appendChild(tabs); leftScroll.appendChild(section);

      if (tabVill.classList.contains('active')) renderVillages();
      else if (tabPlayers.classList.contains('active')) renderPlayers();
      else renderAttack();
    }

    tabVill.onclick=function(){ tabVill.classList.add('active'); tabPlayers.classList.remove('active'); tabAttack.classList.remove('active'); renderVillages(); };
    tabPlayers.onclick=function(){ tabPlayers.classList.add('active'); tabVill.classList.remove('active'); tabAttack.classList.remove('active'); renderPlayers(); };
    tabAttack.onclick=function(){ tabAttack.classList.add('active'); tabVill.classList.remove('active'); tabPlayers.classList.remove('active'); renderAttack(); };
  }

  function dedupeRows(){
    var seen={}, out=[]; for(var i=0;i<state.rows.length;i++){ var r=state.rows[i]; var key=r.player+'|'+r.coords; if(seen[key]) continue; seen[key]=1; out.push(r); }
    state.rows=out;
  }

  function finalize(){
    var sets=filterUnitsByHeader();
    if (!sets.OFF.length && !sets.DEF.length){
      var t=findUnitsTable(document);
      if (t){ var m=buildHeaderMap(t); if (Object.keys(m).length){ state.headerMap=m; sets=filterUnitsByHeader(); } }
    }
    dedupeRows();
    var st=getSettings();
    state.stats=computeStats(sets,st);
    renderModal(sets);
  }

  function autorun(){
    if (!document.querySelector('select[name="player_id"]')) return;
    state.players=buildPlayers();
    state.sitterSuffix=parseSitterSuffix();
    if (!state.players.length){
      alert('Не найден список участников. Убедитесь, что вы на странице: Племя → Участники → Состав войск.');
      return;
    }
    fetchWorldSpeeds().then(function(){ return collectAllPlayers(); }).then(function(){
      if (!state.rows.length){
        hideProgress();
        alert('Данные не получены. Возможные причины:\n• Участники скрыли обзор войск\n• Нет доступа к странице участников\n• Изменилась вёрстка\nПопробуйте обновить страницу позже.');
        return;
      }
      finalize();
    });
  }

  autorun();
})();
