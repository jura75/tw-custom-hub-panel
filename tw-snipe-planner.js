javascript:(function(){
    if(typeof game_data==='undefined'||(game_data.screen!=='overview_villages')){
        alert("Откройте 'Обзор деревень' (вкладка Войска)");
        return;
    }
    let p=$('#twSnipe');
    if(p.length){p.toggle();return;}
    
    let srvDate='30.08.2026';
    let urlParams = new URLSearchParams(window.location.search);
    let sitterParam = urlParams.get('t') ? 't=' + urlParams.get('t') + '&' : '';
    
    let cachedData = {};
    try {
        cachedData = JSON.parse(localStorage.getItem('twSnipeCache') || '{}');
    } catch(e){}

    window.twSavedRoutes = cachedData.savedRoutes || [];
    window.lastCalculatedRoutes = cachedData.lastCalculatedRoutes || [];
    let isMobileMode = cachedData.mobileMode !== undefined ? cachedData.mobileMode : false;
    let hasArchers = cachedData.hasArchers !== undefined ? cachedData.hasArchers : false;
    let calcWithYards = cachedData.calcWithYards !== undefined ? cachedData.calcWithYards : true;
    let calcWithOffs = cachedData.calcWithOffs !== undefined ? cachedData.calcWithOffs : true;
    
    window.twWorldPlayers = window.twWorldPlayers || null;
    window.twWorldVillages = window.twWorldVillages || null;
    
    function getPanelStyles(mobile) {
        if (mobile) {
            return {
                position:'fixed', top:'10px', left:'50%', transform:'translateX(-50%)', right:'auto', bottom:'auto',
                zIndex:999999, background:'#fcf8f2', border:'1px solid #d4c4a8', borderRadius:'8px',
                boxShadow:'0 5px 15px rgba(0,0,0,0.3)', padding:'8px', width:'95vw', maxWidth:'480px',
                minWidth:'300px', height:'85vh', minHeight:'300px', overflow:'auto',
                fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif', color:'#2c2c2c'
            };
        } else {
            return {
                position:'fixed', top:'40px', right:'20px', left:'auto', bottom:'auto', transform:'none',
                zIndex:999999, background:'#fcf8f2', border:'1px solid #d4c4a8', borderRadius:'10px',
                boxShadow:'0 10px 25px rgba(0,0,0,0.2)', padding:'12px', width:'780px',
                minWidth:'400px', height:'88vh', minHeight:'300px', overflow:'auto',
                fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif', color:'#2c2c2c'
            };
        }
    }

    p=$('<div>').attr('id','twSnipe').css(getPanelStyles(isMobileMode)).html(
        '<div id="twSnipeHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:2px solid #e6d8c3;padding-bottom:4px;cursor:move;user-select:none;">'+
        '<h3 style="margin:0;color:#6b3400;font-size:13px;font-weight:700;">⚔️ Мульти-Планировщик v9.21 (<span id="modeTitleLbl">'+(isMobileMode?'МОБИЛЬНЫЙ':'PRO')+'</span>)</h3>'+
        '<div style="display:flex;align-items:center;gap:8px;">'+
        '<label style="font-size:10px;color:#592c00;font-weight:bold;cursor:pointer;"><input type="checkbox" id="mobileModeToggle" '+(isMobileMode?'checked':'')+'> 📱 Мобил.</label>'+
        '<span onclick="$(\'#twSnipe\').hide()" style="cursor:pointer;color:#8c7355;font-size:16px;font-weight:bold;padding:0 4px;" title="Закрыть">&times;</span>'+
        '</div>'+
        '</div>'+
        
        '<div class="row-speed-attacks" style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;display:flex;justify-content:space-between;align-items:center;background:#f3eadb;padding:5px 6px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<label for="worldSpeed" style="font-size:10px;font-weight:600;color:#592c00;">Скорость:</label>'+
        '<input type="number" id="worldSpeed" value="1.0" min="0.1" max="10" step="0.1" style="width:45px;font-size:10px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '</div>'+
        '<div style="flex:1;display:flex;justify-content:space-between;align-items:center;background:#f3eadb;padding:5px 6px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<label for="snipeAttacksPerTarget" style="font-size:10px;font-weight:600;color:#592c00;">Атак оффа на цель:</label>'+
        '<input type="number" id="snipeAttacksPerTarget" value="3" min="1" max="50" style="width:40px;font-size:10px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '</div>'+
        '</div>'+

        '<div style="margin-bottom:6px;"><b style="font-size:10px;color:#4a3b2c;">🎯 Цели (общий список):</b><br><textarea id="targetsCoord" placeholder="512|505..." style="width:100%;height:38px;box-sizing:border-box;font-size:10px;padding:3px;border:1px solid #c7b299;border-radius:3px;background:#fff;"></textarea></div>'+

        '<div style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;"><b style="font-size:10px;color:#4a3b2c;">🏰 Источники дворов:</b><br><textarea id="yardsSource" placeholder="513|425..." style="width:100%;height:35px;box-sizing:border-box;font-size:10px;padding:3px;border:1px solid #c7b299;border-radius:3px;background:#fff;"></textarea></div>'+
        '<div style="flex:1;"><b style="font-size:10px;color:#4a3b2c;">⚔️ Источники оффа (Свои по никам):</b><br><textarea id="offsSource" placeholder="513|425..." style="width:100%;height:35px;box-sizing:border-box;font-size:10px;padding:3px;border:1px solid #c7b299;border-radius:3px;background:#fff;"></textarea></div>'+
        '</div>'+

        '<div style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'+
        '<b style="font-size:9px;color:#592c00;">🏰 Распределение дворов (для Этапа 2 с дворами):</b>'+
        '<button id="copyYardAllocBtn" style="background:#8a4500;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;">Копировать</button>'+
        '</div>'+
        '<textarea id="yardAllocExport" style="width:100%;height:35px;font-size:8px;box-sizing:border-box;padding:2px;border:1px solid #c7b299;border-radius:2px;background:#fff;" placeholder="[saiz] Двор ➔ Цель 476|534..."></textarea>'+
        '</div>'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'+
        '<b style="font-size:9px;color:#b71c1c;">🚫 Цели вне плана (<span id="unplannedCount">0</span>):</b>'+
        '<button id="copyUnplannedBtn" style="background:#b71c1c;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;">Копировать</button>'+
        '</div>'+
        '<textarea id="unplannedExport" style="width:100%;height:35px;font-size:8px;box-sizing:border-box;padding:2px;border:1px solid #c7b299;border-radius:2px;background:#fff;" placeholder="Цели без дворов..."></textarea>'+
        '</div>'+
        '</div>'+

        '<div style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<b style="font-size:9px;color:#592c00;">👑 Приход дворов:</b><div style="display:flex;gap:4px;margin-top:2px;">'+
        '<input type="text" id="yardsTime" value="15:00:00" placeholder="ЧЧ:ММ:СС" style="flex:2;font-size:9px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '<input type="text" id="yardsDate" value="'+srvDate+'" placeholder="ДД.ММ.ГГ" style="flex:2;font-size:9px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '</div></div>'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<b style="font-size:9px;color:#592c00;">⚔️ Приход оффов:</b><div style="display:flex;gap:4px;margin-top:2px;">'+
        '<input type="text" id="offsTime" value="14:55:00" placeholder="ЧЧ:ММ:СС" style="flex:2;font-size:9px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '<input type="text" id="offsDate" value="'+srvDate+'" placeholder="ДД.ММ.ГГ" style="flex:2;font-size:9px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '</div></div>'+
        '</div>'+

        '<div style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;display:flex;gap:4px;">'+
        '<div style="flex:1;"><b style="font-size:9px;color:#592c00;">Юнит двора:</b><select id="yardsUnit" style="width:100%;font-size:9px;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;"></select></div>'+
        '<div style="flex:1;"><b style="font-size:9px;color:#592c00;">Тип двора:</b><select id="yardsType" style="width:100%;font-size:9px;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;"><option value="2 двора">2 двора</option><option value="4 двора">4 двора</option><option value="Снайп">Снайп</option></select></div>'+
        '</div>'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;display:flex;gap:4px;">'+
        '<div style="flex:1;"><b style="font-size:9px;color:#592c00;">Юнит оффа:</b><select id="offsUnit" style="width:100%;font-size:9px;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;"></select></div>'+
        '<div style="flex:1;"><b style="font-size:9px;color:#592c00;">Тип оффа:</b><select id="offsType" style="width:100%;font-size:9px;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;"><option value="Атака">Атака</option><option value="Раскатка">Раскатка</option><option value="Спам">Спам</option></select></div>'+
        '</div>'+
        '</div>'+

        '<div style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="font-size:9px;font-weight:600;color:#592c00;margin-bottom:2px;text-align:center;">Мин. шаблон дворов:</div>'+
        '<div id="yardsTemplateGrid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;font-size:8px;text-align:center;"></div>'+
        '</div>'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="font-size:9px;font-weight:600;color:#592c00;margin-bottom:2px;text-align:center;">Мин. шаблон оффов:</div>'+
        '<div id="offsTemplateGrid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;font-size:8px;text-align:center;"></div>'+
        '</div>'+
        '</div>'+

        '<div style="margin-bottom:6px;background:#f3eadb;padding:6px 8px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="display:flex;gap:10px;margin-bottom:4px;">'+
        '<div style="flex:1;display:flex;align-items:center;justify-content:space-between;">'+
        '<div><input type="checkbox" id="maxTravelTimeToggle" style="margin-right:3px;cursor:pointer;"><label for="maxTravelTimeToggle" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">Макс. ч. пути (дворы):</label></div>'+
        '<input type="number" id="maxTravelHours" value="34" min="1" max="999" style="width:40px;font-size:9px;text-align:center;padding:1px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '</div>'+
        '<div style="flex:1;display:flex;align-items:center;justify-content:space-between;">'+
        '<div><input type="checkbox" id="maxOffsTravelTimeToggle" style="margin-right:3px;cursor:pointer;"><label for="maxOffsTravelTimeToggle" style="font-size:9px;font-weight:600;color:#2e7d32;cursor:pointer;">Макс. ч. пути (офф):</label></div>'+
        '<input type="number" id="maxOffsTravelHours" value="34" min="1" max="999" style="width:40px;font-size:9px;text-align:center;padding:1px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '</div>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:4px;font-size:9px;">'+
        '<input type="checkbox" id="noNightSend" checked style="cursor:pointer;"><label for="noNightSend" style="font-weight:600;color:#592c00;cursor:pointer;">Без ночи</label>'+
        '<span>с</span> <input type="text" id="nightStart" value="00:00" style="width:34px;text-align:center;font-size:9px;padding:1px;border:1px solid #c7b299;border-radius:2px;background:#fff;">'+
        '<span>до</span> <input type="text" id="nightEnd" value="06:00" style="width:34px;text-align:center;font-size:9px;padding:1px;border:1px solid #c7b299;border-radius:2px;background:#fff;">'+
        '</div>'+
        '</div>'+

        '<div style="margin-bottom:6px;display:flex;flex-wrap:wrap;gap:8px;background:#ede1cc;padding:5px 8px;border-radius:5px;border:1px solid #d9c7ad;align-items:center;">'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="calcWithYardsToggle" '+(calcWithYards?'checked':'')+ ' style="margin-right:4px;cursor:pointer;"><label for="calcWithYardsToggle" style="font-size:9px;font-weight:700;color:#8a4500;cursor:pointer;">👑 С дворами</label></div>'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="calcWithOffsToggle" '+(calcWithOffs?'checked':'')+ ' style="margin-right:4px;cursor:pointer;"><label for="calcWithOffsToggle" style="font-size:9px;font-weight:700;color:#2e7d32;cursor:pointer;">⚔️ С оффом</label></div>'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="skipAlreadySavedSources" checked style="margin-right:4px;cursor:pointer;"><label for="skipAlreadySavedSources" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">🚫 Без дублей источников</label></div>'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="worldArchersToggle" '+(hasArchers?'checked':'')+ ' style="margin-right:4px;cursor:pointer;"><label for="worldArchersToggle" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">🏹 Луки</label></div>'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="snipeCoordMode" style="margin-right:4px;cursor:pointer;"><label for="snipeCoordMode" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">Строго по списку</label></div>'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="uniqueTargetsToggle" checked style="margin-right:4px;cursor:pointer;"><label for="uniqueTargetsToggle" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">Без дублей целей</label></div>'+
        '</div>'+

        '<div style="display:flex;gap:5px;margin-bottom:6px;">'+
        '<button id="calcYardsBtn" style="flex:1;background:linear-gradient(to bottom, #8a4500, #6b3400);color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:9px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">👑 Этап 1: Распределить дворы</button>'+
        '<button id="calcOffsBtn" style="flex:1;background:linear-gradient(to bottom, #2e7d32, #1b5e20);color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:9px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">⚔️ Этап 2: Распределить офф</button>'+
        '<button id="clearCacheBtn" style="background:linear-gradient(to bottom, #c62828, #b71c1c);color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:9px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);" title="Сбросить все">🗑️ Сброс</button>'+
        '</div>'+
        
        '<div id="resultsBlockContainer" style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'+
        '<b style="font-size:10px;color:#592c00;">Найденные:</b>'+
        '<button id="clearCalculatedBtn" style="background:#d32f2f;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;">Очистить</button>'+
        '</div>'+
        '<div id="snipeSt" style="font-size:10px;background:#fff;padding:5px;border:1px solid #d4c4a8;border-radius:4px;height:120px;overflow-y:auto;">Выберите этап расчета.</div>'+
        '</div>'+
        '<div style="flex:1;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'+
        '<b style="font-size:10px;color:#592c00;">Сохран (<span id="savedCount">0</span>):</b>'+
        '<div>'+
        '<button id="saveAllRoutes" style="background:#2e7d32;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;margin-right:2px;">Всё</button>'+
        '<button id="clearAllSaved" style="background:#d32f2f;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;">Очистить</button>'+
        '</div>'+
        '</div>'+
        '<div id="savedListContainer" style="font-size:10px;background:#fff;padding:5px;border:1px solid #d4c4a8;border-radius:4px;height:120px;overflow-y:auto;">Пока пусто.</div>'+
        '</div>'+
        '</div>'+

        '<div style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'+
        '<b style="font-size:9px;color:#2e7d32;">📦 Неиспользованный офф (<span id="reserveCount">0</span>):</b>'+
        '<button id="copyReserveBtn" style="background:#2e7d32;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;">Копировать</button>'+
        '</div>'+
        '<textarea id="reserveOffsExport" style="width:100%;height:32px;font-size:8px;box-sizing:border-box;padding:2px;border:1px solid #c7b299;border-radius:2px;background:#fff;" placeholder="Остаток оффов..."></textarea>'+
        '</div>'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'+
        '<b style="font-size:9px;color:#b71c1c;">🚫 Не подошли по времени (<span id="unfitCount">0</span>):</b>'+
        '<button id="copyUnfitCoordsBtn" style="background:#b71c1c;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;">Копировать</button>'+
        '</div>'+
        '<textarea id="unfitCoordsExport" style="width:100%;height:32px;font-size:8px;box-sizing:border-box;padding:2px;border:1px solid #c7b299;border-radius:2px;background:#fff;" placeholder="Превысившие лимит времени..."></textarea>'+
        '</div>'+
        '</div>'+

        '<div style="display:flex;gap:6px;">'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'+
        '<b style="font-size:9px;color:#592c00;">BB-код:</b>'+
        '<button id="copyExportBtn" style="background:#8a4500;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;">Копировать</button>'+
        '</div>'+
        '<textarea id="snipeExport" style="width:100%;height:32px;font-size:8px;box-sizing:border-box;padding:2px;border:1px solid #c7b299;border-radius:2px;background:#fff;" placeholder="BB-код..."></textarea>'+
        '</div>'+
        '<div style="flex:1;background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'+
        '<b style="font-size:9px;color:#592c00;">JSON / Цели:</b>'+
        '<div>'+
        '<button id="exportJsonBtn" style="background:#8a4500;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;margin-right:2px;">Экспорт</button>'+
        '<button id="copyTargetCoordsBtn" style="background:#2e7d32;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;">Цели</button>'+
        '</div>'+
        '</div>'+
        '<textarea id="jsonBackupArea" style="width:100%;height:32px;font-size:8px;box-sizing:border-box;padding:2px;border:1px solid #c7b299;border-radius:2px;background:#fff;" placeholder="JSON..."></textarea>'+
        '<textarea id="targetCoordsExport" style="display:none;"></textarea>'+
        '</div>'+
        '</div>'
    );
    $('body').append(p);

    let unitsConfigWithoutArchers = [
        {key: 'spear', name: 'Копье (18 мин)', short: 'Коп', speed: 18},
        {key: 'sword', name: 'Меч (22 мин)', short: 'Меч', speed: 22},
        {key: 'axe', name: 'Топор (18 мин)', short: 'Топ', speed: 18},
        {key: 'spy', name: 'Лазутчик (9 мин)', short: 'Разв', speed: 9},
        {key: 'light', name: 'ЛК (10 мин)', short: 'ЛК', speed: 10},
        {key: 'heavy', name: 'ТК (11 мин)', short: 'ТК', speed: 11},
        {key: 'ram', name: 'Таран (30 мин)', short: 'Таран', speed: 30},
        {key: 'catapult', name: 'Катапульта (30 мин)', short: 'Ката', speed: 30},
        {key: 'knight', name: 'Паладин (10 мин)', short: 'Пал', speed: 10},
        {key: 'snob', name: 'Дворянин (35 мин)', short: 'Двор', speed: 35}
    ];

    let unitsConfigWithArchers = [
        {key: 'spear', name: 'Копье (18 мин)', short: 'Коп', speed: 18},
        {key: 'sword', name: 'Меч (22 мин)', short: 'Меч', speed: 22},
        {key: 'axe', name: 'Топор (18 мин)', short: 'Топ', speed: 18},
        {key: 'archer', name: 'Лучник (18 мин)', short: 'Лук', speed: 18},
        {key: 'spy', name: 'Лазутчик (9 мин)', short: 'Разв', speed: 9},
        {key: 'light', name: 'ЛК (10 мин)', short: 'ЛК', speed: 10},
        {key: 'marcher', name: 'Кавалерист лучник (10 мин)', short: 'КЛ', speed: 10},
        {key: 'heavy', name: 'ТК (11 мин)', short: 'ТК', speed: 11},
        {key: 'ram', name: 'Таран (30 мин)', short: 'Таран', speed: 30},
        {key: 'catapult', name: 'Катапульта (30 мин)', short: 'Ката', speed: 30},
        {key: 'knight', name: 'Паладин (10 мин)', short: 'Пал', speed: 10},
        {key: 'snob', name: 'Дворянин (35 мин)', short: 'Двор', speed: 35}
    ];

    function rebuildDynamicUI() {
        let curYardsUnit = $('#yardsUnit').val() || 'snob';
        let curOffsUnit = $('#offsUnit').val() || 'axe';
        let currentArchers = $('#worldArchersToggle').is(':checked');
        let cfg = currentArchers ? unitsConfigWithArchers : unitsConfigWithoutArchers;

        let ySelect = $('#yardsUnit'), oSelect = $('#offsUnit');
        ySelect.empty(); oSelect.empty();
        cfg.forEach(u => {
            ySelect.append('<option value="'+u.key+'">'+u.name+'</option>');
            oSelect.append('<option value="'+u.key+'">'+u.name+'</option>');
        });
        ySelect.val(curYardsUnit);
        oSelect.val(curOffsUnit);

        let yGrid = $('#yardsTemplateGrid'), oGrid = $('#offsTemplateGrid');
        yGrid.empty(); oGrid.empty();

        cfg.forEach(u => {
            let yVal = cachedData.yardsUnits && cachedData.yardsUnits[u.key] !== undefined ? cachedData.yardsUnits[u.key] : (u.key === 'snob' ? 1 : 0);
            let oVal = cachedData.offsUnits && cachedData.offsUnits[u.key] !== undefined ? cachedData.offsUnits[u.key] : (u.key === 'axe' || u.key === 'light' ? 100 : 0);
            
            yGrid.append('<div>'+u.short+'<br><input type="number" id="yU_'+u.key+'" value="'+yVal+'" style="width:100%;text-align:center;padding:1px;border:1px solid #c7b299;border-radius:2px;background:#fff;"></div>');
            oGrid.append('<div>'+u.short+'<br><input type="number" id="oU_'+u.key+'" value="'+oVal+'" style="width:100%;text-align:center;padding:1px;border:1px solid #c7b299;border-radius:2px;background:#fff;"></div>');
        });
    }

    rebuildDynamicUI();

    $('#calcWithYardsToggle').change(function(){ calcWithYards = $(this).is(':checked'); saveStateToCache(); });
    $('#calcWithOffsToggle').change(function(){ calcWithOffs = $(this).is(':checked'); saveStateToCache(); });
    $('#worldArchersToggle').change(function(){ hasArchers = $(this).is(':checked'); rebuildDynamicUI(); saveStateToCache(); });
    $('#mobileModeToggle').change(function(){
        isMobileMode = $(this).is(':checked');
        $('#twSnipe').css(getPanelStyles(isMobileMode));
        $('#modeTitleLbl').text(isMobileMode ? 'МОБИЛЬНЫЙ' : 'PRO');
        saveStateToCache();
    });

    let isDragging = false, startX, startY, initialLeft, initialTop;
    $('#twSnipeHeader').on('mousedown touchstart', function(e) {
        if ($(e.target).is('span, input, label')) return;
        isDragging = true;
        let clientX = e.clientX || (e.originalEvent.touches && e.originalEvent.touches[0].clientX);
        let clientY = e.clientY || (e.originalEvent.touches && e.originalEvent.touches[0].clientY);
        startX = clientX; startY = clientY;
        let el = $('#twSnipe');
        initialLeft = el.offset().left; initialTop = el.offset().top;
        el.css({right: 'auto', bottom: 'auto', transform: 'none'});
        e.preventDefault();
    });

    $(document).on('mousemove touchmove', function(e) {
        let clientX = e.clientX || (e.originalEvent.touches && e.originalEvent.touches[0].clientX);
        let clientY = e.clientY || (e.originalEvent.touches && e.originalEvent.touches[0].clientY);
        if (!clientX || !clientY) return;
        if (isDragging) {
            let dx = clientX - startX, dy = clientY - startY;
            $('#twSnipe').css({ left: (initialLeft + dx) + 'px', top: (initialTop + dy) + 'px' });
        }
    });

    $(document).on('mouseup touchend', function() { isDragging = false; });

    if(cachedData.targetsCoord) $('#targetsCoord').val(cachedData.targetsCoord);
    if(cachedData.yardsSource) $('#yardsSource').val(cachedData.yardsSource);
    if(cachedData.offsSource) $('#offsSource').val(cachedData.offsSource);
    if(cachedData.yardAllocExport) $('#yardAllocExport').val(cachedData.yardAllocExport);
    if(cachedData.yardsTime) $('#yardsTime').val(cachedData.yardsTime);
    if(cachedData.yardsDate) $('#yardsDate').val(cachedData.yardsDate);
    if(cachedData.offsTime) $('#offsTime').val(cachedData.offsTime);
    if(cachedData.offsDate) $('#offsDate').val(cachedData.offsDate);
    if(cachedData.yardsUnit) $('#yardsUnit').val(cachedData.yardsUnit);
    if(cachedData.yardsType) $('#yardsType').val(cachedData.yardsType);
    if(cachedData.offsUnit) $('#offsUnit').val(cachedData.offsUnit);
    if(cachedData.offsType) $('#offsType').val(cachedData.offsType);
    if(cachedData.worldSpeed) $('#worldSpeed').val(cachedData.worldSpeed);
    if(cachedData.attacksPerTarget !== undefined) $('#snipeAttacksPerTarget').val(cachedData.attacksPerTarget);
    if(cachedData.maxTravelTimeToggle !== undefined) $('#maxTravelTimeToggle').prop('checked', cachedData.maxTravelTimeToggle);
    if(cachedData.maxTravelHours) $('#maxTravelHours').val(cachedData.maxTravelHours);
    if(cachedData.maxOffsTravelTimeToggle !== undefined) $('#maxOffsTravelTimeToggle').prop('checked', cachedData.maxOffsTravelTimeToggle);
    if(cachedData.maxOffsTravelHours) $('#maxOffsTravelHours').val(cachedData.maxOffsTravelHours);
    if(cachedData.noNightSend !== undefined) $('#noNightSend').prop('checked', cachedData.noNightSend);
    if(cachedData.nightStart) $('#nightStart').val(cachedData.nightStart);
    if(cachedData.nightEnd) $('#nightEnd').val(cachedData.nightEnd);
    if(cachedData.skipAlreadySavedSources !== undefined) $('#skipAlreadySavedSources').prop('checked', cachedData.skipAlreadySavedSources);
    if(cachedData.coordMode !== undefined) $('#snipeCoordMode').prop('checked', cachedData.coordMode);
    if(cachedData.uniqueTargetsToggle !== undefined) $('#uniqueTargetsToggle').prop('checked', cachedData.uniqueTargetsToggle);

    function saveStateToCache() {
        let collectUnits = prefix => {
            let obj = {};
            let cfg = $('#worldArchersToggle').is(':checked') ? unitsConfigWithArchers : unitsConfigWithoutArchers;
            cfg.forEach(u => {
                let val = $('#'+prefix+'U_'+u.key).val();
                if(val !== undefined) obj[u.key] = val || 0;
            });
            return obj;
        };

        let state = {
            targetsCoord: $('#targetsCoord').val(), yardsSource: $('#yardsSource').val(),
            offsSource: $('#offsSource').val(), yardAllocExport: $('#yardAllocExport').val(),
            yardsTime: $('#yardsTime').val(), yardsDate: $('#yardsDate').val(),
            offsTime: $('#offsTime').val(), offsDate: $('#offsDate').val(),
            yardsUnit: $('#yardsUnit').val(), yardsType: $('#yardsType').val(),
            offsUnit: $('#offsUnit').val(), offsType: $('#offsType').val(),
            worldSpeed: $('#worldSpeed').val(), attacksPerTarget: $('#snipeAttacksPerTarget').val(),
            maxTravelTimeToggle: $('#maxTravelTimeToggle').is(':checked'), maxTravelHours: $('#maxTravelHours').val(),
            maxOffsTravelTimeToggle: $('#maxOffsTravelTimeToggle').is(':checked'), maxOffsTravelHours: $('#maxOffsTravelHours').val(),
            noNightSend: $('#noNightSend').is(':checked'), nightStart: $('#nightStart').val(), nightEnd: $('#nightEnd').val(),
            skipAlreadySavedSources: $('#skipAlreadySavedSources').is(':checked'), coordMode: $('#snipeCoordMode').is(':checked'),
            uniqueTargetsToggle: $('#uniqueTargetsToggle').is(':checked'),
            mobileMode: $('#mobileModeToggle').is(':checked'), hasArchers: $('#worldArchersToggle').is(':checked'),
            calcWithYards: $('#calcWithYardsToggle').is(':checked'), calcWithOffs: $('#calcWithOffsToggle').is(':checked'),
            yardsUnits: collectUnits('y'), offsUnits: collectUnits('o'),
            savedRoutes: window.twSavedRoutes, lastCalculatedRoutes: window.lastCalculatedRoutes
        };
        localStorage.setItem('twSnipeCache', JSON.stringify(state));
    }

    if(window.lastCalculatedRoutes && window.lastCalculatedRoutes.length > 0) {
        renderCalculatedUI(window.lastCalculatedRoutes);
    }

    $('#twSnipe').on('input change', 'input, textarea, select', function(){ saveStateToCache(); });

    $('#clearCacheBtn').click(function(){
        localStorage.removeItem('twSnipeCache');
        $('#targetsCoord, #yardsSource, #offsSource, #targetCoordsExport, #jsonBackupArea, #unfitCoordsExport, #reserveOffsExport, #yardAllocExport, #unplannedExport').val('');
        $('#snipeAttacksPerTarget').val('3'); $('#worldSpeed').val('1.0');
        $('#unfitCount').text('0'); $('#reserveCount').text('0'); $('#unplannedCount').text('0');
        window.twSavedRoutes = []; window.lastCalculatedRoutes = [];
        updateExportAndUI();
        $('#snipeSt').html('Кеш очищен.');
    });

    $('#clearCalculatedBtn').click(function(){
        window.lastCalculatedRoutes = [];
        saveStateToCache();
        $('#snipeSt').html('Выберите этап расчета.');
    });

    $('#exportJsonBtn').click(function(){
        $('#jsonBackupArea').val(JSON.stringify(window.twSavedRoutes));
        let ta = document.getElementById('jsonBackupArea');
        ta.select(); try { document.execCommand('copy'); } catch(e){}
    });

    $('#copyYardAllocBtn').click(function(){
        let textarea = document.getElementById('yardAllocExport');
        if(!textarea.value.trim()){ alert('Нет данных распределения дворов'); return; }
        textarea.select(); try { document.execCommand('copy'); alert('Скопировано!'); } catch(err) {}
    });

    $('#copyUnplannedBtn').click(function(){
        let textarea = document.getElementById('unplannedExport');
        if(!textarea.value.trim()){ alert('Нет целей вне плана'); return; }
        textarea.select(); try { document.execCommand('copy'); alert('Скопировано!'); } catch(err) {}
    });

    let parseUnitVal=s=>{
        if(!s)return 0;
        let clean = s.trim().replace(/\./g,'').replace(/\s/g,'');
        let parts = clean.split('/');
        return parseInt((parts.length > 1 ? parts[1] : parts[0]).replace(/\D/g,''),10)||0;
    };

    let speeds={spear:18,sword:22,axe:18,archer:18,spy:9,light:10,marcher:10,heavy:11,ram:30,catapult:30,knight:10,snob:35};

    function updateExportAndUI(){
        let container=$('#savedListContainer'),countSpan=$('#savedCount');
        countSpan.text(window.twSavedRoutes.length);
        saveStateToCache();
        if(window.twSavedRoutes.length===0){
            container.html('Пока пусто.'); $('#snipeExport').val(''); $('#targetCoordsExport').val('');
            return;
        }
        window.twSavedRoutes.sort((a,b)=>a.sendTimestamp-b.sendTimestamp);
        let html='',bbTable='[table]\n[**]ID[||]Ник[||]Тип атаки[||]вид[||]откуда[||]куда[||]время отправки[||]время прихода[||]ссылка[/**]\n';
        window.twSavedRoutes.forEach((item,index)=>{
            let idx=index+1;
            let sourceOwnerName = item.sourceOwnerName || game_data.player.name;
            html+='<div style="border-bottom:1px solid #eee;padding:2px 0;display:flex;justify-content:space-between;align-items:center;">'+
                  '<span style="font-size:9px;"><b>'+idx+'. ['+sourceOwnerName+'] Двор ➔ Цель '+item.targetCoord+'</b> <span style="color:#b22222;">Отпр: '+item.sendTimeStr+'</span></span>'+
                  '<button class="delSavedBtn" data-id="'+item.uniqueId+'" style="background:#d32f2f;color:#fff;border:none;padding:1px 4px;cursor:pointer;font-size:8px;border-radius:2px;">&times;</button>'+
                  '</div>';
            bbTable+='[*]' + idx + '[|]' + sourceOwnerName + '[|]' + item.attackType + '[|][unit]' + item.unitKey + '[/unit][|][coord]' + item.coord + '[/coord][|][coord]' + item.targetCoord + '[/coord][|][b]' + item.sendTimeStr + '[/b][|]' + item.arrTimeStr + '[|][url=' + item.placeUrl + ']Rally point[/url][/*]\n';
        });
        bbTable+='[/table]';
        container.html(html);
        $('#snipeExport').val(bbTable);
        let uniqueTargets = Array.from(new Set(window.twSavedRoutes.map(item => item.targetCoord)));
        $('#targetCoordsExport').val(uniqueTargets.join('\n'));
    }

    $('#copyTargetCoordsBtn').click(function(){
        let textarea = document.getElementById('targetCoordsExport');
        if(!textarea.value.trim()){ alert('Нет целей'); return; }
        textarea.select(); try { document.execCommand('copy'); alert('Скопировано!'); } catch(err) {}
    });

    $('#copyUnfitCoordsBtn').click(function(){
        let textarea = document.getElementById('unfitCoordsExport');
        if(!textarea.value.trim()){ alert('Нет отсеянных координат'); return; }
        textarea.select(); try { document.execCommand('copy'); alert('Скопировано!'); } catch(err) {}
    });

    $('#copyReserveBtn').click(function(){
        let textarea = document.getElementById('reserveOffsExport');
        if(!textarea.value.trim()){ alert('Нет неиспользованных оффов'); return; }
        textarea.select(); try { document.execCommand('copy'); alert('Скопировано!'); } catch(err) {}
    });

    $(document).on('click','.delSavedBtn',function(){
        let uid=$(this).attr('data-id');
        window.twSavedRoutes=window.twSavedRoutes.filter(item=>item.uniqueId!==uid);
        updateExportAndUI();
    });

    $('#clearAllSaved').click(function(){ window.twSavedRoutes=[]; updateExportAndUI(); });

    $('#saveAllRoutes').click(function(){
        if(!window.lastCalculatedRoutes || window.lastCalculatedRoutes.length === 0){ return; }
        window.lastCalculatedRoutes.forEach(routeObj => {
            let exists = window.twSavedRoutes.some(item => item.coord === routeObj.coord && item.sendTimestamp === routeObj.sendTimestamp && item.targetCoord === routeObj.targetCoord);
            if(!exists){ window.twSavedRoutes.push(routeObj); }
        });
        updateExportAndUI();
    });

    $('#copyExportBtn').click(function(){
        let textarea = document.getElementById('snipeExport');
        if(!textarea.value.trim()){ return; }
        textarea.select(); try { document.execCommand('copy'); alert('Скопировано!'); } catch(err) {}
    });

    function parseCoordsFromText(text) {
        let results = [];
        let cleanText = text.replace(/\[\/?coord\]/g, '').replace(/\[\/?b\]/g, '').replace(/\[\/?table\]/g, '');
        let regex = /(\d{3}\|\d{3})/g;
        let match;
        while ((match = regex.exec(cleanText)) !== null) {
            let coord = match[1];
            let parts = coord.split('|');
            let isUnique = $('#uniqueTargetsToggle').is(':checked');
            if (!isUnique || !results.some(r => r.coord === coord)) {
                results.push({ coord: coord, name: '', x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) });
            }
        }
        return results;
    }

    function parseYardAllocFromText(text) {
        let rows = [];
        let lines = text.split('\n');
        lines.forEach(line => {
            let coordMatch = line.match(/(\d{3}\|\d{3})/g);
            if (coordMatch && coordMatch.length >= 1) {
                let targetCoord = coordMatch[coordMatch.length - 1];
                let nickMatch = line.match(/\[([^\]]+)\]/);
                let nick = nickMatch ? nickMatch[1] : "Неизвестен";
                let tParts = targetCoord.split('|');
                rows.push({
                    nick: nick.trim(),
                    targetCoord: targetCoord,
                    x: parseInt(tParts[0], 10),
                    y: parseInt(tParts[1], 10)
                });
            }
        });
        return rows;
    }

    function timeToSec(tStr) {
        let p = tStr.split(':');
        if (p.length < 2) return 0;
        return parseInt(p[0], 10)*3600 + parseInt(p[1], 10)*60 + (p[2] ? parseInt(p[2], 10) : 0);
    }

    function fetchWorldDataAndRun(callback) {
        if (window.twWorldPlayers && window.twWorldVillages) {
            callback(window.twWorldPlayers, window.twWorldVillages);
            return;
        }
        let mapBaseUrl = window.location.origin + '/map/';
        $.when(
            $.get(mapBaseUrl + 'player.txt').catch(() => ({responseText: ''})),
            $.get(mapBaseUrl + 'village.txt').catch(() => ({responseText: ''}))
        ).done(function(playerRes, villageRes) {
            let playersMap = {};
            (playerRes[0] || '').split('\n').forEach(line => {
                if(!line.trim()) return;
                let parts = line.split(',');
                if(parts.length >= 2) {
                    try { playersMap[parts[0].trim()] = decodeURIComponent(parts[1].replace(/\+/g, ' ')); }
                    catch(e) { playersMap[parts[0].trim()] = parts[1].replace(/\+/g, ' '); }
                }
            });
            let villagesMap = {};
            (villageRes[0] || '').split('\n').forEach(line => {
                if(!line.trim()) return;
                let parts = line.split(',');
                if(parts.length >= 6) {
                    let vX = parseInt(parts[2], 10), vY = parseInt(parts[3], 10);
                    let ownerId = parts[4].trim();
                    let vName = parts[1];
                    try { vName = decodeURIComponent(vName.replace(/\+/g, ' ')); } catch(e){}
                    villagesMap[vX + '|' + vY] = { id: parts[0].trim(), ownerName: playersMap[ownerId] || game_data.player.name, villageName: vName };
                }
            });
            window.twWorldPlayers = playersMap; window.twWorldVillages = villagesMap;
            callback(playersMap, villagesMap);
        });
    }

    // ЭТАП 1: РАСПРЕДЕЛЕНИЕ ДВОРОВ
    $('#calcYardsBtn').click(function(){
        let st=$('#snipeSt'),
            targetsCoordText=$('#targetsCoord').val(),
            yardsSourceText=$('#yardsSource').val(),
            worldSpeed = parseFloat($('#worldSpeed').val()) || 1.0,
            yTimeStr=$('#yardsTime').val().trim(), yDateStr=$('#yardsDate').val().trim(),
            yardsUnitKey=$('#yardsUnit').val(), yardsAttackType=$('#yardsType').val(),
            maxTravelTimeEnabled = $('#maxTravelTimeToggle').is(':checked'),
            maxTravelHours = parseFloat($('#maxTravelHours').val()) || 34,
            isCoordMode = $('#snipeCoordMode').is(':checked'),
            skipSavedSources = $('#skipAlreadySavedSources').is(':checked');

        let targets = parseCoordsFromText(targetsCoordText);
        if(targets.length === 0){
            st.html('<span style="color:red;">Введите цели для расчета дворов!</span>');
            return;
        }

        let [yd, ym, yyy] = yDateStr.split('.').map(Number);
        let [yth, ytm, yts] = yTimeStr.split(':').map(Number);
        let yardsTargetDate = new Date(yyy < 100 ? yyy + 2000 : yyy, ym - 1, yd, yth, ytm, yts).getTime();
        if(isNaN(yardsTargetDate)){ yardsTargetDate = Date.now() + 3600000; }

        let ySpeedMin = (speeds[yardsUnitKey] || 35) / worldSpeed;
        st.html('Загрузка карты и расчет дворов...');

        fetchWorldDataAndRun(function(playersMap, villagesMap) {
            targets.forEach(t => {
                if (villagesMap[t.coord]) {
                    t.name = villagesMap[t.coord].villageName;
                    t.ownerName = villagesMap[t.coord].ownerName;
                } else {
                    t.ownerName = game_data.player.name;
                }
            });

            let allowedYardsCoords = parseCoordsFromText(yardsSourceText);

            function processYardsList(allFetchedSources) {
                let yTemplate = {};
                let archersActive = $('#worldArchersToggle').is(':checked');
                let cfg = archersActive ? unitsConfigWithArchers : unitsConfigWithoutArchers;
                cfg.forEach(u => { yTemplate[u.key] = parseInt($('#yU_'+u.key).val(), 10) || 0; });

                let baseYardsList = isCoordMode ? allowedYardsCoords : allFetchedSources;
                let alreadySavedSourceCoords = new Set();
                if (skipSavedSources && window.twSavedRoutes && window.twSavedRoutes.length > 0) {
                    window.twSavedRoutes.forEach(r => alreadySavedSourceCoords.add(r.coord));
                }

                let validYardsSources = baseYardsList.map(item => {
                    let vData = villagesMap[item.coord];
                    let vName = vData ? vData.villageName : (item.name || 'Деревня');
                    let vId = vData ? vData.id : '';
                    let vOwner = vData ? vData.ownerName : game_data.player.name;
                    let foundSrc = allFetchedSources.find(s => s.coord === item.coord);
                    let uData = foundSrc ? foundSrc.units : {};
                    return { id: vId, name: vName, ownerName: vOwner, x: item.x, y: item.y, coord: item.coord, units: uData };
                }).filter(v => {
                    if (skipSavedSources && alreadySavedSourceCoords.has(v.coord)) return false;
                    if(!isCoordMode) {
                        if((v.units[yardsUnitKey] || 0) < (yTemplate[yardsUnitKey] || 1)) return false;
                        for(let u in yTemplate) { if((v.units[u] || 0) < yTemplate[u]) return false; }
                    }
                    return true;
                });

                let maxTravelMin = maxTravelHours * 60;
                let unfitSources = [], activeYards = [];

                validYardsSources.forEach(v => {
                    let fits = !maxTravelTimeEnabled;
                    if (maxTravelTimeEnabled) {
                        targets.forEach(t => {
                            if (Math.sqrt(Math.pow(v.x-t.x,2)+Math.pow(v.y-t.y,2)) * ySpeedMin <= maxTravelMin) fits = true;
                        });
                    }
                    if (fits) activeYards.push(v); else unfitSources.push(v);
                });

                let unfitCoordsList = Array.from(new Set(unfitSources.map(s => s.coord)));
                $('#unfitCoordsExport').val(unfitCoordsList.join('\n'));
                $('#unfitCount').text(unfitCoordsList.length);

                let yardPool = activeYards.map(y => ({ source: y, nick: (y.ownerName || game_data.player.name).trim().toLowerCase().replace(/\s+/g, ' '), used: false }));

                let finalRoutes = [];
                let yardAllocSummary = [];
                let plannedTargetCoords = new Set();
                let nowTime = Date.now();
                let useNoNight = $('#noNightSend').is(':checked');
                let nStartSec = timeToSec($('#nightStart').val());
                let nEndSec = timeToSec($('#nightEnd').val());

                let isNightTime = (sendDate) => {
                    if (!useNoNight) return false;
                    let sendSec = sendDate.getHours() * 3600 + sendDate.getMinutes() * 60 + sendDate.getSeconds();
                    return (nStartSec < nEndSec) ? (sendSec >= nStartSec && sendSec <= nEndSec) : (sendSec >= nStartSec || sendSec <= nEndSec);
                };

                targets.forEach(target => {
                    let tOwner = (target.ownerName || game_data.player.name).trim().toLowerCase().replace(/\s+/g, ' ');
                    let bestYardIdx = -1, minYardDst = Infinity;
                    
                    yardPool.forEach((y, idx) => {
                        if (!y.used && y.nick === tOwner) {
                            let dist = Math.sqrt(Math.pow(y.source.x - target.x, 2) + Math.pow(y.source.y - target.y, 2));
                            if (dist < minYardDst) { minYardDst = dist; bestYardIdx = idx; }
                        }
                    });

                    if (bestYardIdx === -1) {
                        yardPool.forEach((y, idx) => {
                            if (!y.used) {
                                let dist = Math.sqrt(Math.pow(y.source.x - target.x, 2) + Math.pow(y.source.y - target.y, 2));
                                if (dist < minYardDst) { minYardDst = dist; bestYardIdx = idx; }
                            }
                        });
                    }

                    if (bestYardIdx !== -1) {
                        yardPool[bestYardIdx].used = true;
                        let ySource = yardPool[bestYardIdx].source;

                        plannedTargetCoords.add(target.coord);
                        yardAllocSummary.push(`[${ySource.ownerName}] Двор ➔ Цель ${target.coord}`);

                        let dist = Math.sqrt(Math.pow(ySource.x - target.x, 2) + Math.pow(ySource.y - target.y, 2));
                        let sendDate = new Date(yardsTargetDate - (dist * ySpeedMin * 60 * 1000));
                        if (!isNightTime(sendDate) && sendDate.getTime() >= nowTime) {
                            finalRoutes.push({ source: ySource, targetCoord: target.coord, targetName: target.name, sendDate: sendDate, arrTime: yardsTargetDate, type: yardsAttackType, unit: yardsUnitKey });
                        }
                    }
                });

                let unplannedTargets = targets.filter(t => !plannedTargetCoords.has(t.coord)).map(t => t.coord);
                $('#unplannedExport').val(unplannedTargets.join('\n'));
                $('#unplannedCount').text(unplannedTargets.length);
                $('#yardAllocExport').val(yardAllocSummary.join('\n'));

                finalRoutes.sort((a,b)=>a.sendDate-b.sendDate);
                window.lastCalculatedRoutes = [];

                finalRoutes.forEach(item=>{
                    let v=item.source, tCoord=item.targetCoord;
                    let sd=item.sendDate, ad=new Date(item.arrTime);
                    let sendTimeStr=('0'+sd.getDate()).slice(-2)+'.'+('0'+(sd.getMonth()+1)).slice(-2)+'.'+sd.getFullYear()+' '+('0'+sd.getHours()).slice(-2)+':'+('0'+sd.getMinutes()).slice(-2)+':'+('0'+sd.getSeconds()).slice(-2);
                    let arrTimeStr=('0'+ad.getDate()).slice(-2)+'.'+('0'+(ad.getMonth()+1)).slice(-2)+'.'+ad.getFullYear()+' '+('0'+ad.getHours()).slice(-2)+':'+('0'+ad.getMinutes()).slice(-2)+':'+('0'+ad.getSeconds()).slice(-2);
                    
                    let villageId = v.id || (villagesMap[v.coord] ? villagesMap[v.coord].id : '');
                    let tParts = tCoord.split('|');
                    let placeUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) + 'game.php?' + sitterParam + (villageId ? 'village=' + villageId + '&' : '') + 'screen=place&x=' + tParts[0] + '&y=' + tParts[1];

                    window.lastCalculatedRoutes.push({
                        uniqueId:'r_'+v.coord.replace('|','_')+'_'+tCoord.replace('|','_')+'_'+item.arrTime+'_'+Math.floor(Math.random()*1000),
                        name:v.name, coord:v.coord, targetCoord:tCoord, targetName:item.targetName||'', sourceOwnerName:v.ownerName || game_data.player.name,
                        attackType:item.type, unitKey:item.unit, sendTimestamp:sd.getTime(), sendTimeStr:sendTimeStr, arrTimeStr:arrTimeStr, placeUrl:placeUrl
                    });
                });

                renderCalculatedUI(window.lastCalculatedRoutes);
            }

            if(isCoordMode && allowedYardsCoords.length > 0) {
                processYardsList([]);
            } else {
                let sfx = 'game.php?' + sitterParam;
                $.get(sfx+'screen=overview_villages&mode=units&page=-1&',function(page){
                    let rows=$(page).find('tr').filter(function(){return $(this).find('.quickedit-vn').length>0;});
                    let allFetchedSources=[];
                    let archersActive = $('#worldArchersToggle').is(':checked');

                    rows.each(function(){
                        let vn=$(this).find('.quickedit-vn');
                        if(!vn.length)return;
                        let name=vn.text().replace(/\(\d{3}\|\d{3}\)/g, '').replace(/K\d+/g, '').trim().split('\n')[0].trim()||"Деревня";
                        let vId=(vn.find('a').attr('href').match(/village=(\d+)/)||[])[1],
                            vCoordsMatch=$(this).text().match(/\d{3}\|\d{3}/);
                        if(!vCoordsMatch||!vId)return;
                        let curCoordStr=vCoordsMatch[0];
                        let cParts=curCoordStr.split('|'), vX=parseInt(cParts[0],10), vY=parseInt(cParts[1],10), tds=$(this).find('td');
                        let sOwner = (villagesMap[curCoordStr] ? villagesMap[curCoordStr].ownerName : game_data.player.name);

                        let uData = {
                            spear: parseUnitVal(tds.filter('.unit-item-spear').text() || tds.eq(2).text()),
                            sword: parseUnitVal(tds.filter('.unit-item-sword').text() || tds.eq(3).text()),
                            axe: parseUnitVal(tds.filter('.unit-item-axe').text() || tds.eq(4).text())
                        };

                        if(archersActive) {
                            uData.archer = parseUnitVal(tds.filter('.unit-item-archer').text() || tds.eq(5).text());
                            uData.spy = parseUnitVal(tds.filter('.unit-item-spy').text() || tds.eq(6).text());
                            uData.light = parseUnitVal(tds.filter('.unit-item-light').text() || tds.eq(7).text());
                            uData.marcher = parseUnitVal(tds.filter('.unit-item-marcher').text() || tds.eq(8).text());
                            uData.heavy = parseUnitVal(tds.filter('.unit-item-heavy').text() || tds.eq(9).text());
                            uData.ram = parseUnitVal(tds.filter('.unit-item-ram').text() || tds.eq(10).text());
                            uData.catapult = parseUnitVal(tds.filter('.unit-item-catapult').text() || tds.eq(11).text());
                            uData.knight = parseUnitVal(tds.filter('.unit-item-knight').text() || tds.eq(12).text());
                            uData.snob = parseUnitVal(tds.filter('.unit-item-snob').text() || tds.eq(13).text());
                        } else {
                            uData.spy = parseUnitVal(tds.filter('.unit-item-spy').text() || tds.eq(5).text());
                            uData.light = parseUnitVal(tds.filter('.unit-item-light').text() || tds.eq(6).text());
                            uData.heavy = parseUnitVal(tds.filter('.unit-item-heavy').text() || tds.eq(7).text());
                            uData.ram = parseUnitVal(tds.filter('.unit-item-ram').text() || tds.eq(8).text());
                            uData.catapult = parseUnitVal(tds.filter('.unit-item-catapult').text() || tds.eq(9).text());
                            uData.knight = parseUnitVal(tds.filter('.unit-item-knight').text() || tds.eq(10).text());
                            uData.snob = parseUnitVal(tds.filter('.unit-item-snob').text() || tds.eq(11).text());
                        }

                        allFetchedSources.push({id:vId, name:name, ownerName:sOwner, x:vX, y:vY, coord:curCoordStr, units:uData});
                    });

                    processYardsList(allFetchedSources);
                });
            }
        });
    });

    // ЭТАП 2: РАСПРЕДЕЛЕНИЕ ОФФОВ (ЗАВИСИТ ОТ ЧЕКБОКСА С ДВОРАМИ)
    $('#calcOffsBtn').click(function(){
        let st=$('#snipeSt'),
            withYards = $('#calcWithYardsToggle').is(':checked'),
            offsSourceText=$('#offsSource').val(),
            worldSpeed = parseFloat($('#worldSpeed').val()) || 1.0,
            attacksPerTarget = parseInt($('#snipeAttacksPerTarget').val(), 10) || 3,
            oTimeStr=$('#offsTime').val().trim(), oDateStr=$('#offsDate').val().trim(),
            offsUnitKey=$('#offsUnit').val(), offsType=$('#offsType').val(),
            maxOffsTravelTimeEnabled = $('#maxOffsTravelTimeToggle').is(':checked'),
            maxOffsTravelHours = parseFloat($('#maxOffsTravelHours').val()) || 34,
            isCoordMode = $('#snipeCoordMode').is(':checked'),
            skipSavedSources = $('#skipAlreadySavedSources').is(':checked');

        let targetRows = [];

        if (withYards) {
            // Если галочка «С дворами» стоит -> берем из окна распределения дворов
            let allocText = $('#yardAllocExport').val();
            targetRows = parseYardAllocFromText(allocText);
            if(targetRows.length === 0){
                st.html('<span style="color:red;">В окне "Распределение дворов" нет данных! Выполните Этап 1 или поставьте галочку "С дворами" отдельно.</span>');
                return;
            }
        } else {
            // Если галочка «С дворами» снята -> берем из общего списка целей
            let targetsCoordText = $('#targetsCoord').val();
            let rawTargets = parseCoordsFromText(targetsCoordText);
            if(rawTargets.length === 0){
                st.html('<span style="color:red;">Введите цели в поле "Цели (общий список)"!</span>');
                return;
            }
            // Формируем формат для распределения оффа по никам из источников оффа
            targetRows = rawTargets.map(t => ({ nick: game_data.player.name, targetCoord: t.coord, x: t.x, y: t.y }));
        }

        let [od, om, oyy] = oDateStr.split('.').map(Number);
        let [oth, otm, ots] = oTimeStr.split(':').map(Number);
        let offsTargetDate = new Date(oyy < 100 ? oyy + 2000 : oyy, om - 1, od, oth, oth ? oth : 0, ots).getTime();
        if(isNaN(offsTargetDate)){ offsTargetDate = Date.now() + 3600000; }

        let oSpeedMin = (speeds[offsUnitKey] || 30) / worldSpeed;
        st.html('Загрузка карты и привязка оффов...');

        fetchWorldDataAndRun(function(playersMap, villagesMap) {
            // Если галочка "С дворами" не стоит, подгружаем владельцев целей из мира, если они указаны в деревнях
            if (!withYards) {
                targetRows.forEach(row => {
                    if (villagesMap[row.targetCoord]) {
                        row.nick = villagesMap[row.targetCoord].ownerName;
                    }
                });
            }

            let allowedOffsCoords = parseCoordsFromText(offsSourceText);

            function processOffsList(allFetchedSources) {
                let oTemplate = {};
                let archersActive = $('#worldArchersToggle').is(':checked');
                let cfg = archersActive ? unitsConfigWithArchers : unitsConfigWithoutArchers;
                cfg.forEach(u => { oTemplate[u.key] = parseInt($('#oU_'+u.key).val(), 10) || 0; });

                let baseOffsList = isCoordMode ? allowedOffsCoords : allFetchedSources;
                let alreadySavedSourceCoords = new Set();
                if (skipSavedSources && window.twSavedRoutes && window.twSavedRoutes.length > 0) {
                    window.twSavedRoutes.forEach(r => alreadySavedSourceCoords.add(r.coord));
                }

                let validOffsSources = baseOffsList.map(item => {
                    let vData = villagesMap[item.coord];
                    let vName = vData ? vData.villageName : 'Деревня';
                    let vId = vData ? vData.id : '';
                    let vOwner = vData ? vData.ownerName : game_data.player.name;
                    let foundSrc = allFetchedSources.find(s => s.coord === item.coord);
                    let uData = foundSrc ? foundSrc.units : {};
                    return { id: vId, name: vName, ownerName: vOwner, x: item.x, y: item.y, coord: item.coord, units: uData };
                }).filter(v => {
                    if (skipSavedSources && alreadySavedSourceCoords.has(v.coord)) return false;
                    if(!isCoordMode) {
                        if((v.units[offsUnitKey] || 0) < (oTemplate[offsUnitKey] || 1)) return false;
                        for(let u in oTemplate) { if((v.units[u] || 0) < oTemplate[u]) return false; }
                    }
                    return true;
                });

                let maxOffsTravelMin = maxOffsTravelHours * 60;
                let unfitSources = [], activeOffs = [];

                validOffsSources.forEach(v => {
                    let fits = !maxOffsTravelTimeEnabled;
                    if (maxOffsTravelTimeEnabled) {
                        targetRows.forEach(t => {
                            if (Math.sqrt(Math.pow(v.x-t.x,2)+Math.pow(v.y-t.y,2)) * oSpeedMin <= maxOffsTravelMin) fits = true;
                        });
                    }
                    if (fits) activeOffs.push(v); else unfitSources.push(v);
                });

                let unfitCoordsList = Array.from(new Set(unfitSources.map(s => s.coord)));
                $('#unfitCoordsExport').val(unfitCoordsList.join('\n'));
                $('#unfitCount').text(unfitCoordsList.length);

                let offPool = activeOffs.map(o => ({ source: o, nick: (o.ownerName || game_data.player.name).trim().toLowerCase().replace(/\s+/g, ' '), used: false }));

                let finalRoutes = [];
                let nowTime = Date.now();
                let useNoNight = $('#noNightSend').is(':checked');
                let nStartSec = timeToSec($('#nightStart').val());
                let nEndSec = timeToSec($('#nightEnd').val());

                let isNightTime = (sendDate) => {
                    if (!useNoNight) return false;
                    let sendSec = sendDate.getHours() * 3600 + sendDate.getMinutes() * 60 + sendDate.getSeconds();
                    return (nStartSec < nEndSec) ? (sendSec >= nStartSec && sendSec <= nEndSec) : (sendSec >= nStartSec || sendSec <= nEndSec);
                };

                targetRows.forEach(row => {
                    let targetX = row.x;
                    let targetY = row.y;
                    let rowOwnerClean = row.nick.trim().toLowerCase().replace(/\s+/g, ' ');

                    for (let a = 0; a < attacksPerTarget; a++) {
                        let bestOffIdx = -1, minOffDst = Infinity;

                        offPool.forEach((o, idx) => {
                            if (!o.used && o.nick === rowOwnerClean) {
                                let dist = Math.sqrt(Math.pow(o.source.x - targetX, 2) + Math.pow(o.source.y - targetY, 2));
                                if (dist < minOffDst) { minOffDst = dist; bestOffIdx = idx; }
                            }
                        });

                        if (bestOffIdx === -1) {
                            offPool.forEach((o, idx) => {
                                if (!o.used) {
                                    let dist = Math.sqrt(Math.pow(o.source.x - targetX, 2) + Math.pow(o.source.y - targetY, 2));
                                    if (dist < minOffDst) { minOffDst = dist; bestOffIdx = idx; }
                                }
                            });
                        }

                        if (bestOffIdx !== -1) {
                            offPool[bestOffIdx].used = true;
                            let oSource = offPool[bestOffIdx].source;
                            let dist = Math.sqrt(Math.pow(oSource.x - targetX, 2) + Math.pow(oSource.y - targetY, 2));
                            let sendDate = new Date(offsTargetDate - (dist * oSpeedMin * 60 * 1000));
                            if (!isNightTime(sendDate) && sendDate.getTime() >= nowTime) {
                                finalRoutes.push({ source: oSource, targetCoord: row.targetCoord, targetName: '', sendDate: sendDate, arrTime: offsTargetDate, type: offsType, unit: offsUnitKey });
                            }
                        }
                    }
                });

                let reserves = offPool.filter(o => !o.used).map(o => o.source.coord);
                $('#reserveOffsExport').val(reserves.join('\n'));
                $('#reserveCount').text(reserves.length);

                finalRoutes.sort((a,b)=>a.sendDate-b.sendDate);
                window.lastCalculatedRoutes = [];

                finalRoutes.forEach(item=>{
                    let v=item.source;
                    let sd=item.sendDate, ad=new Date(item.arrTime);
                    let sendTimeStr=('0'+sd.getDate()).slice(-2)+'.'+('0'+(sd.getMonth()+1)).slice(-2)+'.'+sd.getFullYear()+' '+('0'+sd.getHours()).slice(-2)+':'+('0'+sd.getMinutes()).slice(-2)+':'+('0'+sd.getSeconds()).slice(-2);
                    let arrTimeStr=('0'+ad.getDate()).slice(-2)+'.'+('0'+(ad.getMonth()+1)).slice(-2)+'.'+ad.getFullYear()+' '+('0'+ad.getHours()).slice(-2)+':'+('0'+ad.getMinutes()).slice(-2)+':'+('0'+ad.getSeconds()).slice(-2);
                    
                    let villageId = v.id || (villagesMap[v.coord] ? villagesMap[v.coord].id : '');
                    let tParts = item.targetCoord.split('|');
                    let placeUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) + 'game.php?' + sitterParam + (villageId ? 'village=' + villageId + '&' : '') + 'screen=place&x=' + tParts[0] + '&y=' + tParts[1];

                    window.lastCalculatedRoutes.push({
                        uniqueId:'r_'+v.coord.replace('|','_')+'_'+item.targetCoord.replace('|','_')+'_'+item.arrTime+'_'+Math.floor(Math.random()*1000),
                        name:v.name, coord:v.coord, targetCoord:item.targetCoord, targetName:item.targetName||'', sourceOwnerName:v.ownerName || game_data.player.name,
                        attackType:item.type, unitKey:item.unit, sendTimestamp:sd.getTime(), sendTimeStr:sendTimeStr, arrTimeStr:arrTimeStr, placeUrl:placeUrl
                    });
                });

                renderCalculatedUI(window.lastCalculatedRoutes);
            }

            if(isCoordMode && allowedOffsCoords.length > 0) {
                processOffsList([]);
            } else {
                let sfx = 'game.php?' + sitterParam;
                $.get(sfx+'screen=overview_villages&mode=units&page=-1&',function(page){
                    let rows=$(page).find('tr').filter(function(){return $(this).find('.quickedit-vn').length>0;});
                    let allFetchedSources=[];
                    let archersActive = $('#worldArchersToggle').is(':checked');

                    rows.each(function(){
                        let vn=$(this).find('.quickedit-vn');
                        if(!vn.length)return;
                        let name=vn.text().replace(/\(\d{3}\|\d{3}\)/g, '').replace(/K\d+/g, '').trim().split('\n')[0].trim()||"Деревня";
                        let vId=(vn.find('a').attr('href').match(/village=(\d+)/)||[])[1],
                            vCoordsMatch=$(this).text().match(/\d{3}\|\d{3}/);
                        if(!vCoordsMatch||!vId)return;
                        let curCoordStr=vCoordsMatch[0];
                        let cParts=curCoordStr.split('|'), vX=parseInt(cParts[0],10), vY=parseInt(cParts[1],10), tds=$(this).find('td');
                        let sOwner = (villagesMap[curCoordStr] ? villagesMap[curCoordStr].ownerName : game_data.player.name);

                        let uData = {
                            spear: parseUnitVal(tds.filter('.unit-item-spear').text() || tds.eq(2).text()),
                            sword: parseUnitVal(tds.filter('.unit-item-sword').text() || tds.eq(3).text()),
                            axe: parseUnitVal(tds.filter('.unit-item-axe').text() || tds.eq(4).text())
                        };

                        if(archersActive) {
                            uData.archer = parseUnitVal(tds.filter('.unit-item-archer').text() || tds.eq(5).text());
                            uData.spy = parseUnitVal(tds.filter('.unit-item-spy').text() || tds.eq(6).text());
                            uData.light = parseUnitVal(tds.filter('.unit-item-light').text() || tds.eq(7).text());
                            uData.marcher = parseUnitVal(tds.filter('.unit-item-marcher').text() || tds.eq(8).text());
                            uData.heavy = parseUnitVal(tds.filter('.unit-item-heavy').text() || tds.eq(9).text());
                            uData.ram = parseUnitVal(tds.filter('.unit-item-ram').text() || tds.eq(10).text());
                            uData.catapult = parseUnitVal(tds.filter('.unit-item-catapult').text() || tds.eq(11).text());
                            uData.knight = parseUnitVal(tds.filter('.unit-item-knight').text() || tds.eq(12).text());
                            uData.snob = parseUnitVal(tds.filter('.unit-item-snob').text() || tds.eq(13).text());
                        } else {
                            uData.spy = parseUnitVal(tds.filter('.unit-item-spy').text() || tds.eq(5).text());
                            uData.light = parseUnitVal(tds.filter('.unit-item-light').text() || tds.eq(6).text());
                            uData.heavy = parseUnitVal(tds.filter('.unit-item-heavy').text() || tds.eq(7).text());
                            uData.ram = parseUnitVal(tds.filter('.unit-item-ram').text() || tds.eq(8).text());
                            uData.catapult = parseUnitVal(tds.filter('.unit-item-catapult').text() || tds.eq(9).text());
                            uData.knight = parseUnitVal(tds.filter('.unit-item-knight').text() || tds.eq(10).text());
                            uData.snob = parseUnitVal(tds.filter('.unit-item-snob').text() || tds.eq(11).text());
                        }

                        allFetchedSources.push({id:vId, name:name, ownerName:sOwner, x:vX, y:vY, coord:curCoordStr, units:uData});
                    });

                    processOffsList(allFetchedSources);
                });
            }
        });
    });

    function renderCalculatedUI(routesArray) {
        let st=$('#snipeSt');
        let html='', addedCount=0;
        routesArray.forEach(routeObj=>{
            addedCount++;
            if(addedCount<=150){
                let safeRouteData=JSON.stringify(routeObj).replace(/"/g,'&quot;');
                html+='<div style="border-bottom:1px solid #e3d2bd;padding:3px 0;display:flex;justify-content:space-between;align-items:center;">'+
                      '<span style="font-size:9px;"><b>['+routeObj.sourceOwnerName+'] Двор ➔ Цель '+routeObj.targetCoord+'</b><br><span style="color:#b22222;">Отпр: '+routeObj.sendTimeStr+' | Прих: '+routeObj.arrTimeStr+'</span></span>'+
                      '<div style="display:flex;gap:3px;flex-shrink:0;">'+
                      '<button class="saveOneRoute" data-route="'+safeRouteData+'" style="background:#2e7d32;color:#fff;border:none;padding:2px 4px;cursor:pointer;font-size:8px;font-weight:bold;border-radius:2px;">Сохр.</button>'+
                      '<a href="'+routeObj.placeUrl+'" target="_blank" style="background:#8a4500;color:#fff;text-decoration:none;padding:2px 4px;border-radius:2px;font-size:8px;font-weight:bold;display:inline-block;">Перейти</a>'+
                      '</div>'+
                      '</div>';
            }
        });
        st.html('<b>Найдено маршрутов: '+addedCount+'</b>:<br>'+html);
        saveStateToCache();
    }

    $(document).on('click','.saveOneRoute',function(){
        let rawData=$(this).attr('data-route').replace(/&quot;/g,'"'),routeObj=JSON.parse(rawData);
        let exists=window.twSavedRoutes.some(item=>item.coord===routeObj.coord&&item.sendTimestamp===routeObj.sendTimestamp&&item.targetCoord===routeObj.targetCoord);
        if(!exists){ window.twSavedRoutes.push(routeObj); updateExportAndUI(); $(this).css({'background':'#555'}).text('✓').prop('disabled',true); }
    });

    updateExportAndUI();
})();
