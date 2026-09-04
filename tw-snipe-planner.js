javascript:(function(){
    if(typeof game_data==='undefined'||(game_data.screen!=='overview_villages')){
        alert("Откройте 'Обзор деревень' (вкладка Войска)");
        return;
    }
    let p=$('#twSnipe');
    if(p.length){p.toggle();return;}
    
    let srvDate='30.08.2026';
    
    let cachedData = {};
    try {
        cachedData = JSON.parse(localStorage.getItem('twSnipeCache') || '{}');
    } catch(e){}

    window.twSavedRoutes = cachedData.savedRoutes || [];
    window.lastCalculatedRoutes = cachedData.lastCalculatedRoutes || [];
    let isMobileMode = cachedData.mobileMode !== undefined ? cachedData.mobileMode : false;
    let hasArchers = cachedData.hasArchers !== undefined ? cachedData.hasArchers : false;
    
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
                boxShadow:'0 10px 25px rgba(0,0,0,0.2)', padding:'12px', width:'720px',
                minWidth:'400px', height:'80vh', minHeight:'300px', overflow:'auto',
                fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif', color:'#2c2c2c'
            };
        }
    }

    p=$('<div>').attr('id','twSnipe').css(getPanelStyles(isMobileMode)).html(
        '<div id="twSnipeHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:2px solid #e6d8c3;padding-bottom:4px;cursor:move;user-select:none;">'+
        '<h3 style="margin:0;color:#6b3400;font-size:13px;font-weight:700;">⚔️ Мульти-Планировщик (<span id="modeTitleLbl">'+(isMobileMode?'МОБИЛЬНЫЙ':'PRO')+'</span>)</h3>'+
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
        '<label for="snipeAttacksPerTarget" style="font-size:10px;font-weight:600;color:#592c00;">На цель:</label>'+
        '<input type="number" id="snipeAttacksPerTarget" value="1" min="1" max="50" style="width:40px;font-size:10px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '</div>'+
        '<div style="flex:1;display:flex;justify-content:space-between;align-items:center;background:#f3eadb;padding:5px 6px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<label for="snipeAttacksPerSource" style="font-size:10px;font-weight:600;color:#592c00;">С источника:</label>'+
        '<input type="number" id="snipeAttacksPerSource" value="1" min="1" max="50" style="width:40px;font-size:10px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;">'+
        '</div>'+
        '</div>'+

        '<div id="coordsBlockContainer" style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;"><b style="font-size:10px;color:#4a3b2c;">Цели (список / BB):</b><br>'+
        '<textarea id="snipeCoord" placeholder="512|505..." style="width:100%;height:40px;box-sizing:border-box;font-size:10px;padding:3px;border:1px solid #c7b299;border-radius:3px;background:#fff;"></textarea></div>'+
        '<div style="flex:1;"><b style="font-size:10px;color:#4a3b2c;">Источники (пусто=все):</b><br>'+
        '<textarea id="snipeSource" placeholder="513|425..." style="width:100%;height:40px;box-sizing:border-box;font-size:10px;padding:3px;border:1px solid #c7b299;border-radius:3px;background:#fff;"></textarea></div>'+
        '</div>'+

        '<div style="margin-bottom:6px;display:flex;flex-wrap:wrap;gap:8px;background:#ede1cc;padding:5px 8px;border-radius:5px;border:1px solid #d9c7ad;align-items:center;">'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="worldArchersToggle" '+(hasArchers?'checked':'')+ ' style="margin-right:4px;cursor:pointer;"><label for="worldArchersToggle" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">🏹 Мир с луками</label></div>'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="snipeAutoMatch" checked style="margin-right:4px;cursor:pointer;"><label for="snipeAutoMatch" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">Автоподбор</label></div>'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="snipeCoordMode" style="margin-right:4px;cursor:pointer;"><label for="snipeCoordMode" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">Строго по списку</label></div>'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="skipAlreadySavedTargets" checked style="margin-right:4px;cursor:pointer;"><label for="skipAlreadySavedTargets" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">Без дублей целей</label></div>'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="skipAlreadySavedSources" style="margin-right:4px;cursor:pointer;"><label for="skipAlreadySavedSources" style="font-size:9px;font-weight:600;color:#592c00;cursor:pointer;">Без дублей источников</label></div>'+
        '</div>'+

        '<div style="margin-bottom:6px;background:#f3eadb;padding:6px 8px;border-radius:5px;border:1px solid #e3d2bd;">'+
        '<div style="display:flex;align-items:center;margin-bottom:4px;justify-content:space-between;flex-wrap:wrap;gap:4px;">'+
        '<div style="display:flex;align-items:center;"><input type="checkbox" id="snipeIntervalMode" style="margin-right:4px;cursor:pointer;"><label for="snipeIntervalMode" style="font-size:10px;font-weight:600;color:#592c00;cursor:pointer;">Интервал прихода</label></div>'+
        '<div style="display:flex;align-items:center;gap:4px;font-size:9px;">'+
        '<input type="checkbox" id="noNightSend" checked style="cursor:pointer;"><label for="noNightSend" style="font-weight:600;color:#592c00;cursor:pointer;">Без ночи</label>'+
        '<span>с</span> <input type="text" id="nightStart" value="00:00" style="width:34px;text-align:center;font-size:9px;padding:1px;border:1px solid #c7b299;border-radius:2px;background:#fff;">'+
        '<span>до</span> <input type="text" id="nightEnd" value="06:00" style="width:34px;text-align:center;font-size:9px;padding:1px;border:1px solid #c7b299;border-radius:2px;background:#fff;">'+
        '</div>'+
        '</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
        '<div style="flex:1;min-width:100px;"><b style="font-size:9px;color:#4a3b2c;" id="lblTimeFrom">Приход (ЧЧ:ММ:СС):</b><input type="text" id="snipeTime" value="15:00:00" style="width:100%;font-size:10px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;"></div>'+
        '<div style="flex:1;min-width:90px;"><b style="font-size:9px;color:#4a3b2c;">Дата (ДД.ММ.ГГГГ):</b><input type="text" id="snipeDate" value="'+srvDate+'" style="width:100%;font-size:10px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;"></div>'+
        '<div id="intervalBlock" style="display:none;flex:2;gap:6px;width:100%;">'+
        '<div style="flex:1;"><b style="font-size:9px;color:#4a3b2c;">Приход ПО:</b><input type="text" id="snipeTimeEnd" value="18:00:00" style="width:100%;font-size:10px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;"></div>'+
        '<div style="flex:1;"><b style="font-size:9px;color:#4a3b2c;">Шаг (мин):</b><input type="number" id="snipeStep" value="5" style="width:100%;font-size:10px;text-align:center;padding:2px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;" min="1"></div>'+
        '</div>'+
        '</div>'+
        '</div>'+

        '<div style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;"><b style="font-size:10px;color:#4a3b2c;">Юнит:</b><select id="snipeUnit" style="width:100%;font-size:10px;padding:3px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;"></select></div>'+
        '<div style="flex:1;"><b style="font-size:10px;color:#4a3b2c;">Тип:</b><select id="snipeType" style="width:100%;font-size:10px;padding:3px;border:1px solid #c7b299;border-radius:3px;background:#fff;margin-top:1px;"><option value="Снайп">Снайп</option><option value="Атака">Атака</option><option value="2 двора">2 двора</option><option value="4 двора">4 двора</option><option value="Раскатка">Раскатка</option><option value="Спам">Спам</option></select></div>'+
        '</div>'+
        
        '<div style="background:#f3eadb;padding:5px;border-radius:5px;border:1px solid #e3d2bd;margin-bottom:6px;">'+
        '<div style="font-size:9px;font-weight:600;color:#592c00;margin-bottom:3px;text-align:center;">Мин. шаблон войск:</div>'+
        '<div id="templateGridContainer" style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px;font-size:8px;text-align:center;">'+
        '</div>'+
        '</div>'+

        '<div style="display:flex;gap:5px;margin-bottom:6px;">'+
        '<button id="snipeCalc" style="flex:3;background:linear-gradient(to bottom, #8a4500, #6b3400);color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:10px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">⚡ Рассчитать варианты</button>'+
        '<button id="clearCacheBtn" style="flex:1;background:linear-gradient(to bottom, #c62828, #b71c1c);color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:10px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);" title="Сбросить все">🗑️ Сброс</button>'+
        '</div>'+
        
        '<div id="resultsBlockContainer" style="display:flex;gap:6px;margin-bottom:6px;">'+
        '<div style="flex:1;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">'+
        '<b style="font-size:10px;color:#592c00;">Найденные:</b>'+
        '<button id="clearCalculatedBtn" style="background:#d32f2f;color:#fff;border:none;padding:1px 4px;font-size:8px;cursor:pointer;border-radius:2px;font-weight:600;">Очистить</button>'+
        '</div>'+
        '<div id="snipeSt" style="font-size:10px;background:#fff;padding:5px;border:1px solid #d4c4a8;border-radius:4px;height:120px;overflow-y:auto;">Укажите параметры и нажмите расчет.</div>'+
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
        let currentUnitVal = $('#snipeUnit').val();
        let currentArchers = $('#worldArchersToggle').is(':checked');
        let cfg = currentArchers ? unitsConfigWithArchers : unitsConfigWithoutArchers;

        let unitSelect = $('#snipeUnit');
        unitSelect.empty();
        cfg.forEach(u => {
            unitSelect.append('<option value="'+u.key+'">'+u.name+'</option>');
        });
        if(currentUnitVal && unitSelect.find('option[value="'+currentUnitVal+'"]').length > 0) {
            unitSelect.val(currentUnitVal);
        }

        let grid = $('#templateGridContainer');
        grid.empty();
        cfg.forEach(u => {
            let existingVal = cachedData.units && cachedData.units[u.key] !== undefined ? cachedData.units[u.key] : 0;
            grid.append('<div>'+u.short+'<br><input type="number" id="u'+u.key.charAt(0).toUpperCase()+u.key.slice(1)+'" value="'+existingVal+'" style="width:100%;text-align:center;padding:1px;border:1px solid #c7b299;border-radius:2px;background:#fff;"></div>');
        });
    }

    rebuildDynamicUI();

    $('#worldArchersToggle').change(function(){
        hasArchers = $(this).is(':checked');
        rebuildDynamicUI();
        saveStateToCache();
    });

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
        startX = clientX;
        startY = clientY;
        let el = $('#twSnipe');
        initialLeft = el.offset().left;
        initialTop = el.offset().top;
        el.css({right: 'auto', bottom: 'auto', transform: 'none'});
        e.preventDefault();
    });

    let isResizing = false, resizeDir = '', rStartX, rStartY, rStartW, rStartH, rStartL, rStartT;
    const borderThreshold = 10;

    $('#twSnipe').on('mousemove', function(e) {
        if (isDragging || isResizing) return;
        if (isMobileMode) { $(this).css('cursor', 'default'); return; }
        
        let el = $(this);
        let offset = el.offset();
        let w = el.outerWidth();
        let h = el.outerHeight();
        let x = e.clientX - offset.left;
        let y = e.clientY - offset.top;
        
        let cursor = 'default';
        let dir = '';
        
        let onRight = x >= w - borderThreshold;
        let onBottom = y >= h - borderThreshold;
        let onLeft = x <= borderThreshold;
        let onTop = y <= borderThreshold;
        
        if (onRight && onBottom) { cursor = 'se-resize'; dir = 'se'; }
        else if (onLeft && onBottom) { cursor = 'sw-resize'; dir = 'sw'; }
        else if (onRight && onTop) { cursor = 'ne-resize'; dir = 'ne'; }
        else if (onLeft && onTop) { cursor = 'nw-resize'; dir = 'nw'; }
        else if (onRight) { cursor = 'e-resize'; dir = 'e'; }
        else if (onBottom) { cursor = 's-resize'; dir = 's'; }
        else if (onLeft) { cursor = 'w-resize'; dir = 'w'; }
        else if (onTop) { cursor = 'n-resize'; dir = 'n'; }
        
        el.css('cursor', cursor);
        resizeDir = dir;
    });

    $('#twSnipe').on('mousedown', function(e) {
        if (isMobileMode || !resizeDir || $(e.target).is('span, input, label, textarea, select, button')) return;
        isResizing = true;
        rStartX = e.clientX;
        rStartY = e.clientY;
        let el = $(this);
        rStartW = el.width();
        rStartH = el.height();
        rStartL = el.offset().left;
        rStartT = el.offset().top;
        el.css({right: 'auto', bottom: 'auto', transform: 'none'});
        e.preventDefault();
    });

    $(document).on('mousemove touchmove', function(e) {
        let clientX = e.clientX || (e.originalEvent.touches && e.originalEvent.touches[0].clientX);
        let clientY = e.clientY || (e.originalEvent.touches && e.originalEvent.touches[0].clientY);
        if (!clientX || !clientY) return;

        if (isDragging) {
            let dx = clientX - startX;
            let dy = clientY - startY;
            $('#twSnipe').css({
                left: (initialLeft + dx) + 'px',
                top: (initialTop + dy) + 'px'
            });
        } else if (isResizing) {
            let dx = clientX - rStartX;
            let dy = clientY - rStartY;
            let el = $('#twSnipe');
            
            if (resizeDir.includes('e')) {
                el.css('width', Math.max(350, rStartW + dx) + 'px');
            }
            if (resizeDir.includes('s')) {
                el.css('height', Math.max(250, rStartH + dy) + 'px');
            }
            if (resizeDir.includes('w')) {
                let newW = rStartW - dx;
                if (newW >= 350) {
                    el.css('width', newW + 'px');
                    el.css('left', (rStartL + dx) + 'px');
                }
            }
            if (resizeDir.includes('n')) {
                let newH = rStartH - dy;
                if (newH >= 250) {
                    el.css('height', newH + 'px');
                    el.css('top', (rStartT + dy) + 'px');
                }
            }
        }
    });

    $(document).on('mouseup touchend', function() {
        isDragging = false;
        isResizing = false;
    });

    if(cachedData.targets) $('#snipeCoord').val(cachedData.targets);
    if(cachedData.worldSpeed) $('#worldSpeed').val(cachedData.worldSpeed);
    if(cachedData.attacksPerTarget !== undefined) $('#snipeAttacksPerTarget').val(cachedData.attacksPerTarget);
    if(cachedData.attacksPerSource !== undefined) $('#snipeAttacksPerSource').val(cachedData.attacksPerSource);
    if(cachedData.sources) $('#snipeSource').val(cachedData.sources);
    if(cachedData.time) $('#snipeTime').val(cachedData.time);
    if(cachedData.timeEnd) $('#snipeTimeEnd').val(cachedData.timeEnd);
    if(cachedData.date) $('#snipeDate').val(cachedData.date);
    if(cachedData.step) $('#snipeStep').val(cachedData.step);
    if(cachedData.unit) $('#snipeUnit').val(cachedData.unit);
    if(cachedData.attackType) $('#snipeType').val(cachedData.attackType);
    if(cachedData.autoMatch !== undefined) $('#snipeAutoMatch').prop('checked', cachedData.autoMatch);
    if(cachedData.coordMode !== undefined) $('#snipeCoordMode').prop('checked', cachedData.coordMode);
    
    if(cachedData.noNightSend !== undefined) $('#noNightSend').prop('checked', cachedData.noNightSend);
    if(cachedData.nightStart) $('#nightStart').val(cachedData.nightStart);
    if(cachedData.nightEnd) $('#nightEnd').val(cachedData.nightEnd);
    if(cachedData.skipAlreadySavedTargets !== undefined) $('#skipAlreadySavedTargets').prop('checked', cachedData.skipAlreadySavedTargets);
    if(cachedData.skipAlreadySavedSources !== undefined) $('#skipAlreadySavedSources').prop('checked', cachedData.skipAlreadySavedSources);

    if(cachedData.intervalMode !== undefined) {
        $('#snipeIntervalMode').prop('checked', cachedData.intervalMode);
        if(cachedData.intervalMode) {
            $('#intervalBlock').css('display','flex');
            $('#lblTimeFrom').text('Приход С:');
        }
    }
    
    if(cachedData.units) {
        for(let u in cachedData.units) {
            let field = $('#u'+u.charAt(0).toUpperCase()+u.slice(1));
            if(field.length) field.val(cachedData.units[u]);
        }
    }

    function saveStateToCache() {
        let unitsObj = {
            spear: $('#uSpear').val() || 0,
            sword: $('#uSword').val() || 0,
            axe: $('#uAxe').val() || 0,
            spy: $('#uSpy').val() || 0,
            light: $('#uLight').val() || 0,
            heavy: $('#uHeavy').val() || 0,
            ram: $('#uRam').val() || 0,
            catapult: $('#uCatapult').val() || 0,
            knight: $('#uKnight').val() || 0,
            snob: $('#uSnob').val() || 0
        };
        if($('#uArcher').length) unitsObj.archer = $('#uArcher').val() || 0;
        if($('#uMarcher').length) unitsObj.marcher = $('#uMarcher').val() || 0;

        let state = {
            targets: $('#snipeCoord').val(),
            worldSpeed: $('#worldSpeed').val(),
            attacksPerTarget: $('#snipeAttacksPerTarget').val(),
            attacksPerSource: $('#snipeAttacksPerSource').val(),
            sources: $('#snipeSource').val(),
            time: $('#snipeTime').val(),
            timeEnd: $('#snipeTimeEnd').val(),
            date: $('#snipeDate').val(),
            step: $('#snipeStep').val(),
            unit: $('#snipeUnit').val(),
            attackType: $('#snipeType').val(),
            autoMatch: $('#snipeAutoMatch').is(':checked'),
            coordMode: $('#snipeCoordMode').is(':checked'),
            intervalMode: $('#snipeIntervalMode').is(':checked'),
            noNightSend: $('#noNightSend').is(':checked'),
            nightStart: $('#nightStart').val(),
            nightEnd: $('#nightEnd').val(),
            skipAlreadySavedTargets: $('#skipAlreadySavedTargets').is(':checked'),
            skipAlreadySavedSources: $('#skipAlreadySavedSources').is(':checked'),
            mobileMode: $('#mobileModeToggle').is(':checked'),
            hasArchers: $('#worldArchersToggle').is(':checked'),
            units: unitsObj,
            savedRoutes: window.twSavedRoutes,
            lastCalculatedRoutes: window.lastCalculatedRoutes
        };
        localStorage.setItem('twSnipeCache', JSON.stringify(state));
    }

    if(window.lastCalculatedRoutes && window.lastCalculatedRoutes.length > 0) {
        renderCalculatedUI(window.lastCalculatedRoutes);
    }

    $('#twSnipe').on('input change', 'input, textarea, select', function(){
        saveStateToCache();
    });

    $('#snipeIntervalMode').change(function(){
        if($(this).is(':checked')) {
            $('#intervalBlock').css('display','flex');
            $('#lblTimeFrom').text('Приход С:');
        } else {
            $('#intervalBlock').css('display','none');
            $('#lblTimeFrom').text('Приход (ЧЧ:ММ:СС):');
        }
    });

    $('#clearCacheBtn').click(function(){
        localStorage.removeItem('twSnipeCache');
        $('#snipeCoord, #snipeSource, #targetCoordsExport, #jsonBackupArea').val('');
        $('#snipeAttacksPerTarget').val('1');
        $('#snipeAttacksPerSource').val('1');
        $('#worldSpeed').val('1.0');
        window.twSavedRoutes = [];
        window.lastCalculatedRoutes = [];
        updateExportAndUI();
        $('#snipeSt').html('Кеш очищен.');
    });

    $('#clearCalculatedBtn').click(function(){
        window.lastCalculatedRoutes = [];
        saveStateToCache();
        $('#snipeSt').html('Укажите параметры и нажмите расчет.');
    });

    $('#exportJsonBtn').click(function(){
        $('#jsonBackupArea').val(JSON.stringify(window.twSavedRoutes));
        let ta = document.getElementById('jsonBackupArea');
        ta.select();
        try { document.execCommand('copy'); } catch(e){}
    });

    let parseUnitVal=s=>{
        if(!s)return 0;
        let clean = s.trim().replace(/\./g,'').replace(/\s/g,'');
        let parts = clean.split('/');
        let targetStr = parts.length > 1 ? parts[1] : parts[0];
        return parseInt(targetStr.replace(/\D/g,''),10)||0;
    };

    let speeds={spear:18,sword:22,axe:18,archer:18,spy:9,light:10,marcher:10,heavy:11,ram:30,catapult:30,knight:10,snob:35};

    function updateExportAndUI(){
        let container=$('#savedListContainer'),countSpan=$('#savedCount');
        countSpan.text(window.twSavedRoutes.length);
        saveStateToCache();
        if(window.twSavedRoutes.length===0){
            container.html('Пока пусто.');
            $('#snipeExport').val('');
            $('#targetCoordsExport').val('');
            return;
        }
        window.twSavedRoutes.sort((a,b)=>a.sendTimestamp-b.sendTimestamp);
        let html='',bbTable='[table]\n[**]ID[||]Ник[||]Тип атаки[||]вид[||]откуда[||]куда[||]время отправки[||]время прихода[||]ссылка[/**]\n';
        window.twSavedRoutes.forEach((item,index)=>{
            let idx=index+1;
            let targetDisplay = item.targetName ? item.targetName + ' (' + item.targetCoord + ')' : item.targetCoord;
            let sourceOwnerName = item.sourceOwnerName || game_data.player.name;
            
            html+='<div style="border-bottom:1px solid #eee;padding:2px 0;display:flex;justify-content:space-between;align-items:center;">'+
                  '<span style="font-size:9px;"><b>'+idx+'. '+item.name+' ('+item.coord+')</b> &rarr; <b>'+targetDisplay+'</b> <span style="color:#b22222;">Отпр: '+item.sendTimeStr+'</span></span>'+
                  '<button class="delSavedBtn" data-id="'+item.uniqueId+'" style="background:#d32f2f;color:#fff;border:none;padding:1px 4px;cursor:pointer;font-size:8px;border-radius:2px;">&times;</button>'+
                  '</div>';
            bbTable+='[*]' + idx + '[|]' + sourceOwnerName + '[|]' + item.attackType + '[|][unit]' + item.unitKey + '[/unit][|][coord]' + item.coord + '[/coord][|][coord]' + item.targetCoord + '[/coord][|][b]' + item.sendTimeStr + '[/b][|]' + item.arrTimeStr + '[|][url=' + item.placeUrl + ']Rally point[/url][/*]\n';
        });
        bbTable+='[/table]';
        container.html(html);
        $('#snipeExport').val(bbTable);
        updateTargetCoordsOutput();
    }

    function updateTargetCoordsOutput() {
        let uniqueTargets = [];
        if (window.twSavedRoutes && window.twSavedRoutes.length > 0) {
            let targetsSet = new Set();
            window.twSavedRoutes.forEach(item => {
                if (item.targetCoord) { targetsSet.add(item.targetCoord); }
            });
            uniqueTargets = Array.from(targetsSet);
        }
        $('#targetCoordsExport').val(uniqueTargets.join('\n'));
    }

    $('#copyTargetCoordsBtn').click(function(){
        updateTargetCoordsOutput();
        let textarea = document.getElementById('targetCoordsExport');
        if(!textarea.value.trim()){ alert('Нет целей'); return; }
        textarea.select();
        try { document.execCommand('copy'); alert('Скопировано!'); } catch(err) {}
    });

    $(document).on('click','.delSavedBtn',function(){
        let uid=$(this).attr('data-id');
        window.twSavedRoutes=window.twSavedRoutes.filter(item=>item.uniqueId!==uid);
        updateExportAndUI();
    });

    $('#clearAllSaved').click(function(){
        window.twSavedRoutes=[];
        updateExportAndUI();
    });

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
        textarea.select();
        try { document.execCommand('copy'); alert('Скопировано!'); } catch(err) {}
    });

    function parseCoordsFromText(text) {
        let results = [];
        let cleanText = text.replace(/\[\/?coord\]/g, '').replace(/\[\/?b\]/g, '').replace(/\[\/?table\]/g, '');
        let regex = /(\d{3}\|\d{3})/g;
        let match, lastIndex = 0;

        while ((match = regex.exec(cleanText)) !== null) {
            let coord = match[1];
            let parts = coord.split('|');
            let chunkBefore = cleanText.substring(lastIndex, match.index);
            let namePart = chunkBefore.replace(/[\(\)]/g, ' ').trim();
            let words = namePart.split(/\s+/);
            let villageName = words.slice(-3).join(' ').replace(/^(K\d+\s*)+/, '').trim();

            if (!results.some(r => r.coord === coord)) {
                results.push({ coord: coord, name: villageName || '', x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) });
            }
            lastIndex = regex.lastIndex;
        }
        return results;
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
            let playerText = playerRes[0] || '';
            let villageText = villageRes[0] || '';

            let playersMap = {};
            if (playerText) {
                let pLines = playerText.split('\n');
                pLines.forEach(line => {
                    if(!line.trim()) return;
                    let parts = line.split(',');
                    if(parts.length >= 2) {
                        let pId = parts[0].trim();
                        let pName = decodeURIComponent(parts[1].replace(/\+/g, ' '));
                        playersMap[pId] = pName;
                    }
                });
            }

            let villagesMap = {};
            if (villageText) {
                let vLines = villageText.split('\n');
                vLines.forEach(line => {
                    if(!line.trim()) return;
                    let parts = line.split(',');
                    if(parts.length >= 6) {
                        let vId = parts[0].trim();
                        let vName = decodeURIComponent(parts[1].replace(/\+/g, ' '));
                        let vX = parseInt(parts[2], 10);
                        let vY = parseInt(parts[3], 10);
                        let ownerId = parts[4].trim();
                        let coordKey = vX + '|' + vY;
                        let ownerName = playersMap[ownerId] || game_data.player.name;
                        villagesMap[coordKey] = { id: vId, ownerName: ownerName, villageName: vName };
                    }
                });
            }

            window.twWorldPlayers = playersMap;
            window.twWorldVillages = villagesMap;
            callback(playersMap, villagesMap);
        });
    }

    $('#snipeCalc').click(function(){
        let st=$('#snipeSt'),
            rawText=$('#snipeCoord').val(),
            worldSpeed = parseFloat($('#worldSpeed').val()) || 1.0,
            attacksPerTarget = parseInt($('#snipeAttacksPerTarget').val(), 10) || 1,
            attacksPerSource = parseInt($('#snipeAttacksPerSource').val(), 10) || 1,
            sourceText=$('#snipeSource').val(),
            tTimeStr=$('#snipeTime').val().trim(),
            tTimeEndStr=$('#snipeTimeEnd').val().trim(),
            tDateStr=$('#snipeDate').val().trim(),
            attackType=$('#snipeType').val(),
            isAutoMatch=$('#snipeAutoMatch').is(':checked'),
            isCoordMode=$('#snipeCoordMode').is(':checked'),
            isInterval=$('#snipeIntervalMode').is(':checked'),
            stepMinutes=parseFloat($('#snipeStep').val())||1,
            unitKey=$('#snipeUnit').val();

        let targets = parseCoordsFromText(rawText);

        if(targets.length === 0){
            st.html('<span style="color:red;">Введите цель!</span>');
            return;
        }

        let skipSaved = $('#skipAlreadySavedTargets').is(':checked');
        if (skipSaved && window.twSavedRoutes && window.twSavedRoutes.length > 0) {
            let savedTargetCoords = new Set(window.twSavedRoutes.map(r => r.targetCoord));
            targets = targets.filter(t => !savedTargetCoords.has(t.coord));
            if(targets.length === 0){
                st.html('<span style="color:red;">Все цели уже сохранены!</span>');
                return;
            }
        }

        let parsedSources = parseCoordsFromText(sourceText);
        let allowedSources = parsedSources.map(s => s.coord);

        let [td,tm,ty]=tDateStr.split('.').map(Number),
            [th,tmin,ts]=tTimeStr.split(':').map(Number),
            targetDate=new Date(ty,tm-1,td,th,tmin,ts).getTime();

        if(isNaN(targetDate)){
            st.html('<span style="color:red;">Ошибка времени!</span>');
            return;
        }

        let arrivalTimes = [targetDate];
        if(isInterval) {
            let [thEnd,tminEnd,tsEnd]=tTimeEndStr.split(':').map(Number);
            let targetDateEnd = new Date(ty,tm-1,td,thEnd,tminEnd,tsEnd).getTime();
            if(isNaN(targetDateEnd) || targetDateEnd <= targetDate) {
                st.html('<span style="color:red;">Неверный интервал!</span>');
                return;
            }
            arrivalTimes = [];
            let currT = targetDate;
            let stepMs = stepMinutes * 60 * 1000;
            while(currT <= targetDateEnd) {
                arrivalTimes.push(currT);
                currT += stepMs;
            }
        }

        let baseSpeedMin = speeds[unitKey] || 30;
        let speedMin = baseSpeedMin / worldSpeed;

        st.html('Загрузка карты и расчет...');

        fetchWorldDataAndRun(function(playersMap, villagesMap) {
            targets.forEach(t => {
                if (villagesMap[t.coord]) {
                    if (!t.name || t.name === '') {
                        t.name = villagesMap[t.coord].villageName;
                    }
                }
            });

            if (isCoordMode) {
                if(allowedSources.length === 0) {
                    st.html('<span style="color:red;">Пустой список источников!</span>');
                    return;
                }
                let sources = allowedSources.map(coord => {
                    let p = coord.split('|');
                    let vData = villagesMap[coord];
                    let sOwner = vData ? vData.ownerName : game_data.player.name;
                    let vName = vData ? vData.villageName : 'Деревня';
                    let vId = vData ? vData.id : '';
                    return { id: vId, name: vName, ownerName: sOwner, x: parseInt(p[0], 10), y: parseInt(p[1], 10), coord: coord };
                });
                
                if ($('#skipAlreadySavedSources').is(':checked') && window.twSavedRoutes && window.twSavedRoutes.length > 0) {
                    let savedSourceCoords = new Set(window.twSavedRoutes.map(r => r.coord));
                    sources = sources.filter(s => !savedSourceCoords.has(s.coord));
                }

                processPairsAndRender(sources, targets, arrivalTimes, speedMin, st, isAutoMatch, attackType, unitKey, attacksPerTarget, attacksPerSource, villagesMap);
                return;
            }

            let urlParams = new URLSearchParams(window.location.search);
            let sitterParam = urlParams.get('t') ? 't=' + urlParams.get('t') + '&' : '';
            let sfx = 'game.php?' + sitterParam;

            $.get(sfx+'screen=overview_villages&mode=units&page=-1&',function(page){
                let rows=$(page).find('tr').filter(function(){return $(this).find('.quickedit-vn').length>0;});
                let sources=[];
                let archersActive = $('#worldArchersToggle').is(':checked');
                rows.each(function(){
                    let vn=$(this).find('.quickedit-vn');
                    if(!vn.length)return;
                    let name=vn.text().replace(/\(\d{3}\|\d{3}\)/g, '').replace(/K\d+/g, '').trim().split('\n')[0].trim()||"Деревня";
                    let vId=(vn.find('a').attr('href').match(/village=(\d+)/)||[])[1],
                        vCoordsMatch=$(this).text().match(/\d{3}\|\d{3}/);
                    if(!vCoordsMatch||!vId)return;
                    let curCoordStr=vCoordsMatch[0];
                    if(allowedSources.length>0&&!allowedSources.includes(curCoordStr))return;
                    let cParts=curCoordStr.split('|'),vX=parseInt(cParts[0],10),vY=parseInt(cParts[1],10),tds=$(this).find('td');
                    
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

                    sources.push({id:vId,name:name,ownerName:sOwner,x:vX,y:vY,coord:curCoordStr,units:uData});
                });

                if(!sources.length){
                    st.html('<span style="color:red;">Источники не найдены!</span>');
                    return;
                }

                if ($('#skipAlreadySavedSources').is(':checked') && window.twSavedRoutes && window.twSavedRoutes.length > 0) {
                    let savedSourceCoords = new Set(window.twSavedRoutes.map(r => r.coord));
                    sources = sources.filter(s => !savedSourceCoords.has(s.coord));
                }

                let template = {
                    spear: parseInt($('#uSpear').val(), 10) || 0,
                    sword: parseInt($('#uSword').val(), 10) || 0,
                    axe: parseInt($('#uAxe').val(), 10) || 0,
                    spy: parseInt($('#uSpy').val(), 10) || 0,
                    light: parseInt($('#uLight').val(), 10) || 0,
                    heavy: parseInt($('#uHeavy').val(), 10) || 0,
                    ram: parseInt($('#uRam').val(), 10) || 0,
                    catapult: parseInt($('#uCatapult').val(), 10) || 0,
                    knight: parseInt($('#uKnight').val(), 10) || 0,
                    snob: parseInt($('#uSnob').val(), 10) || 0
                };
                if(archersActive) {
                    template.archer = parseInt($('#uArcher').val(), 10) || 0;
                    template.marcher = parseInt($('#uMarcher').val(), 10) || 0;
                }

                let validSources = sources.filter(v => {
                    for(let u in template){ if((v.units[u] || 0) < template[u]) return false; }
                    if((v.units[unitKey] || 0) < (template[unitKey] || 0)) return false;
                    return true;
                });

                if(!validSources.length){
                    st.html('<span style="color:red;">Нет деревень под шаблон!</span>');
                    return;
                }

                processPairsAndRender(validSources, targets, arrivalTimes, speedMin, st, isAutoMatch, attackType, unitKey, attacksPerTarget, attacksPerSource, villagesMap);
            });
        });
    });

    function processPairsAndRender(sources, targets, arrivalTimes, speedMin, st, isAutoMatch, attackType, unitKey, attacksPerTarget, attacksPerSource, villagesMap) {
        let finalRoutes = [];
        let nowTime = Date.now();
        let allPairs = [];

        let useNoNight = $('#noNightSend').is(':checked');
        let nStartSec = timeToSec($('#nightStart').val());
        let nEndSec = timeToSec($('#nightEnd').val());

        sources.forEach(v => {
            targets.forEach(t => {
                let dist = Math.sqrt(Math.pow(v.x-t.x,2)+Math.pow(v.y-t.y,2));
                arrivalTimes.forEach(arrTime => {
                    let sendDate = new Date(arrTime-(dist*speedMin*60*1000));
                    
                    if (useNoNight) {
                        let sendSec = sendDate.getHours() * 3600 + sendDate.getMinutes() * 60 + sendDate.getSeconds();
                        let isNight = (nStartSec < nEndSec) ? (sendSec >= nStartSec && sendSec <= nEndSec) : (sendSec >= nStartSec || sendSec <= nEndSec);
                        if (isNight) return;
                    }

                    allPairs.push({source:v, target:t, dist:dist, sendDate:sendDate, arrTime: arrTime});
                });
            });
        });

        allPairs.sort((a,b)=>a.sendDate-b.sendDate);

        let sourceHitCounts = {};
        let targetHitCounts = {};

        if (isAutoMatch) {
            allPairs.forEach(pair => {
                if(pair.sendDate.getTime() < nowTime) return;
                let targetKey = pair.target.coord, sourceKey = pair.source.coord;
                let currentSourceHits = sourceHitCounts[sourceKey] || 0;
                let currentTargetHits = targetHitCounts[targetKey] || 0;

                if(currentSourceHits < attacksPerSource && currentTargetHits < attacksPerTarget){
                    sourceHitCounts[sourceKey] = currentSourceHits + 1;
                    targetHitCounts[targetKey] = currentTargetHits + 1;
                    finalRoutes.push(pair);
                }
            });
        } else {
            allPairs.forEach(pair => {
                if(pair.sendDate.getTime() < nowTime) return;
                let sourceKey = pair.source.coord;
                let currentSourceHits = sourceHitCounts[sourceKey] || 0;
                if(currentSourceHits < attacksPerSource){
                    sourceHitCounts[sourceKey] = currentSourceHits + 1;
                    finalRoutes.push(pair);
                }
            });
        }

        if(!finalRoutes.length){
            st.html('<span style="color:red;">Нет вариантов!</span>');
            return;
        }

        finalRoutes.sort((a,b)=>a.sendDate-b.sendDate);
        window.lastCalculatedRoutes = [];
        
        let urlParams = new URLSearchParams(window.location.search);
        let sitterParam = urlParams.get('t') ? 't=' + urlParams.get('t') + '&' : '';

        finalRoutes.forEach(item=>{
            let v=item.source,t=item.target;
            let sd=item.sendDate, ad=new Date(item.arrTime);
            let sendTimeStr=('0'+sd.getDate()).slice(-2)+'.'+('0'+(sd.getMonth()+1)).slice(-2)+'.'+sd.getFullYear()+' '+('0'+sd.getHours()).slice(-2)+':'+('0'+sd.getMinutes()).slice(-2)+':'+('0'+sd.getSeconds()).slice(-2);
            let arrTimeStr=('0'+ad.getDate()).slice(-2)+'.'+('0'+(ad.getMonth()+1)).slice(-2)+'.'+ad.getFullYear()+' '+('0'+ad.getHours()).slice(-2)+':'+('0'+ad.getMinutes()).slice(-2)+':'+('0'+ad.getSeconds()).slice(-2);
            
            let villageId = v.id;
            if (!villageId && villagesMap && villagesMap[v.coord]) {
                villageId = villagesMap[v.coord].id;
            }
            
            let placeUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) + 'game.php?' + sitterParam + (villageId ? 'village=' + villageId + '&' : '') + 'screen=place&x=' + t.x + '&y=' + t.y;

            let routeObj={
                uniqueId:'r_'+v.coord.replace('|','_')+'_'+t.coord.replace('|','_')+'_'+item.arrTime+'_'+Math.floor(Math.random()*1000),
                name:v.name,coord:v.coord,targetCoord:t.coord,targetName:t.name,sourceOwnerName:v.ownerName || game_data.player.name,attackType:attackType,
                unitKey:unitKey,sendTimestamp:sd.getTime(),sendTimeStr:sendTimeStr,arrTimeStr:arrTimeStr,placeUrl:placeUrl
            };
            window.lastCalculatedRoutes.push(routeObj);
        });

        renderCalculatedUI(window.lastCalculatedRoutes);
    }

    function renderCalculatedUI(routesArray) {
        let st=$('#snipeSt');
        let html='', addedCount=0;

        routesArray.forEach(routeObj=>{
            addedCount++;
            if(addedCount<=50){
                let safeRouteData=JSON.stringify(routeObj).replace(/"/g,'&quot;');
                let targetDisplay = routeObj.targetName ? routeObj.targetName + ' (' + routeObj.targetCoord + ')' : routeObj.targetCoord;
                
                html+='<div style="border-bottom:1px solid #e3d2bd;padding:3px 0;display:flex;justify-content:space-between;align-items:center;">'+
                      '<span style="font-size:9px;"><b>'+routeObj.name+' ('+routeObj.coord+')</b> &rarr; <b>'+targetDisplay+'</b> ('+routeObj.sourceOwnerName+')<br><span style="color:#b22222;">Отпр: '+routeObj.sendTimeStr+'</span></span>'+
                      '<div style="display:flex;gap:3px;flex-shrink:0;">'+
                      '<button class="saveOneRoute" data-route="'+safeRouteData+'" style="background:#2e7d32;color:#fff;border:none;padding:2px 4px;cursor:pointer;font-size:8px;font-weight:bold;border-radius:2px;">Сохр.</button>'+
                      '<a href="'+routeObj.placeUrl+'" target="_blank" style="background:#8a4500;color:#fff;text-decoration:none;padding:2px 4px;border-radius:2px;font-size:8px;font-weight:bold;display:inline-block;">Перейти</a>'+
                      '</div>'+
                      '</div>';
            }
        });

        st.html('<b>Найдено: '+addedCount+'</b>:<br>'+html);
        saveStateToCache();
    }

    $(document).on('click','.saveOneRoute',function(){
        let rawData=$(this).attr('data-route').replace(/&quot;/g,'"'),routeObj=JSON.parse(rawData);
        let exists=window.twSavedRoutes.some(item=>item.coord===routeObj.coord&&item.sendTimestamp===routeObj.sendTimestamp&&item.targetCoord===routeObj.targetCoord);
        if(!exists){
            window.twSavedRoutes.push(routeObj);
            updateExportAndUI();
            $(this).css({'background':'#555'}).text('✓').prop('disabled',true);
        }
    });

    updateExportAndUI();
})();
