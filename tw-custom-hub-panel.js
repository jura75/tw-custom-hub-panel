// ==UserScript==
// @name         TW Custom Hub Panel (Manager & Workbench)
// @namespace    https://github.com/jura75/tw-custom-hub-panel
// @version      2.0.0
// @description  Единая рабочая панель Войны Племен с вкладками. Первая вкладка — Менеджер войск с полными фильтрами.
// @match        https://*.plemiona.pl/*
// @match        https://*.voyna-plemen.ru/*
// @match        https://*.tribalwars.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Если хаб уже открыт — закрываем его при повторном вызове
    let existing = document.getElementById('tw-custom-hub-panel');
    if (existing) {
        existing.remove();
        return;
    }

    // ==========================================
    // КОНСТАНТЫ И СОСТОЯНИЕ МЕНЕДЖЕРА ВОЙСК
    // ==========================================
    const STORAGE_KEY = 'ra_wb_troops_data_v6';
    let globalTroopsData = [];

    // Создаем главное окно хаба
    let panel = document.createElement('div');
    panel.id = 'tw-custom-hub-panel';
    panel.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 1180px;
        height: 650px;
        min-width: 500px;
        min-height: 350px;
        background: #fff8eb;
        border: 3px solid #7d510f;
        box-shadow: 0 8px 25px rgba(0,0,0,0.8);
        z-index: 99999;
        font-family: Verdana, Arial, sans-serif;
        color: #5b3511;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        resize: both;
    `;

    panel.innerHTML = `
        <!-- ШАПКА ХАБА С ВКЛАДКАМИ -->
        <div style="background: #1a1006; border-bottom: 2px solid #7d510f; user-select: none;">
            <div style="padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #4a3014; cursor: move;" id="tw-hub-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 14px;">🛠️</span>
                    <b style="font-size: 13px; color: #f4e4bc;">Проект Хаб — Война Племен (Единая рабочая среда)</b>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <a href="https://github.com/jura75/tw-custom-hub-panel" target="_blank" style="background: #f4ecd8; border: 1px solid #7d510f; color: #5b3511; font-weight: bold; text-decoration: none; padding: 2px 8px; border-radius: 3px; font-size: 10px;" title="Открыть репозиторий GitHub">GitHub ↗</a>
                    <span id="tw-hub-close" style="cursor: pointer; color: #a63a3a; font-weight: bold; font-size: 15px; padding: 0 6px;">✕</span>
                </div>
            </div>
            
            <!-- Панель вкладок сверху -->
            <div style="display: flex; gap: 2px; padding: 6px 8px 0 8px; background: #23170a; overflow-x: auto;">
                <button class="tw-hub-tab-btn active" data-tab="troops" style="background: #fff8eb; border: 1px solid #7d510f; border-bottom: none; color: #5b3511; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 4px 4px 0 0; white-space: nowrap;">
                    📋 Менеджер войск
                </button>
                <button class="tw-hub-tab-btn" data-tab="snipe" style="background: #3b2812; border: 1px solid #7d510f; border-bottom: none; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 4px 4px 0 0; white-space: nowrap;">
                    ⚡ Мульти-Планировщик
                </button>
                <button class="tw-hub-tab-btn" data-tab="tactical" style="background: #3b2812; border: 1px solid #7d510f; border-bottom: none; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 4px 4px 0 0; white-space: nowrap;">
                    🛡️ Тактический Хаб
                </button>
                <button class="tw-hub-tab-btn" data-tab="balancer" style="background: #3b2812; border: 1px solid #7d510f; border-bottom: none; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 4px 4px 0 0; white-space: nowrap;">
                    ⚖️ Авто-балансер
                </button>
                <button class="tw-hub-tab-btn" data-tab="scanner" style="background: #3b2812; border: 1px solid #7d510f; border-bottom: none; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 4px 4px 0 0; white-space: nowrap;">
                    🎯 Сбор координат
                </button>
            </div>
        </div>

        <!-- Центральный рабочий контейнер -->
        <div id="tw-hub-content-container" style="flex: 1; background: #fff8eb; display: flex; flex-direction: column; overflow: hidden; position: relative;">
            <!-- Сюда подгружается контент активной вкладки -->
        </div>

        <!-- НИЖНЯЯ ПАНЕЛЬ СТАТУСА -->
        <div style="background: #1a1006; padding: 4px 12px; font-size: 10px; color: #a98a5c; border-top: 1px solid #7d510f; display: flex; justify-content: space-between; align-items: center;">
            <span>Статус: Хаб активен (потяните за правый нижний угол для изменения размера 📐)</span>
            <span style="font-size: 12px; font-weight: bold; color: #f4e4bc;">⤡</span>
        </div>
    `;

    document.body.appendChild(panel);

    // ==========================================
    // ЛОГИКА ПЕРЕМЕЩЕНИЯ ОКНА (DRAG AND DROP)
    // ==========================================
    let header = document.getElementById('tw-hub-header');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.onmousedown = function(e) {
        if (e.target.id === 'tw-hub-close' || e.target.tagName === 'A') return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        let rect = panel.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        
        panel.style.transform = 'none';
        panel.style.left = initialLeft + 'px';
        panel.style.top = initialTop + 'px';

        document.onmousemove = function(e) {
            if (!isDragging) return;
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            panel.style.left = (initialLeft + dx) + 'px';
            panel.style.top = (initialTop + dy) + 'px';
        };

        document.onmouseup = function() {
            isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };

    document.getElementById('tw-hub-close').onclick = () => panel.remove();

    // ==========================================
    // РАЗМЕТКА И ЛОГИКА ВКЛАДКИ "МЕНЕДЖЕР ВОЙСК"
    // ==========================================
    function getTroopsTabHTML() {
        return `
            <!-- Панель управления войсками -->
            <div style="background: #f4ecd8; padding: 8px; border-bottom: 1px solid #c5a059; display: flex; align-items: center; gap: 8px;">
                <button id="btn_fetch_troops" style="background: #f4ecd8; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #5b3511;" title="Суммарно свои войска со страницы Обзор->Войска">Снять со страницы</button>
                <button id="btn_fetch_ally" style="background: #f4ecd8; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #5b3511;" title="Собрать войска со страниц обзора племени">Войска племени</button>
                <button id="btn_clear_troops" style="background: #d9534f; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #fff;">Очистить</button>
                
                <label style="margin-left: 10px; font-weight: bold; color: #5b3511; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                    <input type="checkbox" id="world_has_archers" checked style="cursor: pointer;"> Мир с луками
                </label>

                <!-- Меню сохранения -->
                <div style="position: relative; display: inline-block; margin-left: 10px;">
                    <button id="btn_save_dropdown" style="background: #e2c08e; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #5b3511;">Сохранить выбранное ▼</button>
                    <div id="save_menu" style="display: none; position: absolute; top: 100%; left: 0; background: #fff8eb; border: 1px solid #7d510f; z-index: 100005; box-shadow: 0 4px 8px rgba(0,0,0,0.2); width: 130px;">
                        <div class="save-option" data-cat="офф" style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #e3d0b1; font-weight: bold; color: #b22222;">Офф</div>
                        <div class="save-option" data-cat="двор" style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #e3d0b1; font-weight: bold;">Двор</div>
                        <div class="save-option" data-cat="раскатка" style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #e3d0b1; font-weight: bold;">Раскатка</div>
                        <div class="save-option" data-cat="спам" style="padding: 6px 10px; cursor: pointer; border-bottom: 1px solid #e3d0b1; font-weight: bold;">Спам</div>
                        <div class="save-option" data-cat="дефф" style="padding: 6px 10px; cursor: pointer; font-weight: bold; color: #00008b;">Дефф</div>
                    </div>
                </div>

                <span id="troops_count_info" style="font-weight: bold; color: #5b3511; margin-left: auto;">Записей: 0 из 0</span>
            </div>

            <!-- Таблица -->
            <div id="table_container" style="flex-grow: 1; overflow: auto; background: #fff; position: relative;">
                <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 11px;" id="troops_table">
                    <thead>
                        <tr id="table_header_row" style="background: #e2c08e; color: #5b3511; position: sticky; top: 0; z-index: 10;"></tr>
                    </thead>
                    <tbody id="troops_table_body">
                        <tr><td colspan="15" style="padding: 25px; color: #777;">Нет данных. Нажмите «Снять со страницы» на обзоре войск или «Войска племени».</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // ==========================================
    // МАППИНГ И ФУНКЦИИ ПАРСИНГА ВОЙСК
    // ==========================================
    function mapUnitsCorrectly(raw, hasArchers) {
        let mapped = new Array(12).fill(0);
        if (hasArchers) {
            for (let i = 0; i < Math.min(raw.length, 12); i++) {
                mapped[i] = raw[i] || 0;
            }
        } else {
            mapped[0] = raw[0] || 0; 
            mapped[1] = raw[1] || 0; 
            mapped[2] = raw[2] || 0; 
            mapped[3] = 0;           
            mapped[4] = raw[3] || 0; 
            mapped[5] = raw[4] || 0; 
            mapped[6] = 0;           
            mapped[7] = raw[5] || 0; 
            mapped[8] = raw[6] || 0; 
            mapped[9] = raw[7] || 0; 
            mapped[10] = raw[8] || 0; 
            mapped[11] = raw[9] || 0; 
        }
        return mapped;
    }

    function parseTroops() {
        let container = document.querySelector('table#units_table');
        if (!container) {
            alert('Перейдите на страницу Обзора войск (screen=overview_villages&mode=units), чтобы собрать данные!');
            return;
        }

        let playerName = (typeof window.game_data !== 'undefined' && window.game_data.player && window.game_data.player.name) 
            ? window.game_data.player.name 
            : 'Игрок';

        let rows = container.querySelectorAll('tbody');
        let data = [];
        let hasArchers = $('#world_has_archers').is(':checked');

        rows.forEach(function(row) {
            let spanNode = row.querySelector('a span[data-text]');
            if (!spanNode) return;
            let matchCoord = spanNode.textContent.match(/\(([0-9]{3}\|[0-9]{3})\)/);
            if (!matchCoord) return;
            let coords = matchCoord[1];

            let trs = row.querySelectorAll('tr');
            let available_tds = trs[0] ? trs[0].querySelectorAll('td.unit-item') : [];
            let outward_tds = trs[2] ? trs[2].querySelectorAll('td.unit-item') : [];
            let transit_tds = trs[3] ? trs[3].querySelectorAll('td.unit-item') : [];

            let rawUnits = [];
            for (let i = 0; i < available_tds.length; i++) {
                let av = parseInt(available_tds[i].textContent.replace(/\./g, '')) || 0;
                let ow = outward_tds[i] ? (parseInt(outward_tds[i].textContent.replace(/\./g, '')) || 0) : 0;
                let tr = transit_tds[i] ? (parseInt(transit_tds[i].textContent.replace(/\./g, '')) || 0) : 0;
                rawUnits.push(av + ow + tr);
            }

            let units = mapUnitsCorrectly(rawUnits, hasArchers);
            let axeCount = units[2] || 0;
            let lightCount = units[5] || 0;
            let isOff = (axeCount > 1500 || lightCount > 500);

            data.push({
                player: playerName,
                coords: coords,
                units: units,
                type: isOff ? 'офф' : 'дефф'
            });
        });

        if (data.length > 0) {
            globalTroopsData = data;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            renderTable(globalTroopsData);
            alert(`Успешно собрано своих деревень: ${data.length}`);
        } else {
            alert('Не удалось извлечь данные войск со страницы.');
        }
    }

    function parseAllyTroops() {
        var urlObj = new URL(window.location.href);
        var params = urlObj.searchParams;
        var server = window.location.protocol + "//" + window.location.host + "/";
        var sitter = params.get("t") ? "t="+params.get("t")+"&" : "";
        var mode = params.get("mode") || "units";

        if (params.get("screen") !== "ally") {
            alert("Перейдите в раздел Племя -> Обзор (войска/защитники)");
            return;
        }

        if (!$("[name='player_id']").length) {
            alert("Нет списка игроков в текущем разделе племени");
            return;
        }

        let unitoption = {};
        $("[name='player_id'] option:enabled").each(function(){ 
            unitoption[$(this).text().trim()] = $(this).val(); 
        });

        if (Object.keys(unitoption).length === 0) {
            alert("Не найдены доступные игроки в списке.");
            return;
        }

        let hasArchers = $('#world_has_archers').is(':checked');
        $('#troops_table_body').html('<tr><td colspan="15" style="padding: 25px; font-weight: bold; color: #b22222;">Загрузка данных игроков племени, подождите...</td></tr>');

        let allyData = [];
        let keys = Object.keys(unitoption);
        let index = 0;

        function fetchNext() {
            if (index >= keys.length) {
                if (allyData.length > 0) {
                    globalTroopsData = allyData;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalTroopsData));
                    renderTable(globalTroopsData);
                    alert(`Успешно загружены войска племени: записей (${allyData.length})`);
                } else {
                    alert('Не удалось собрать данные игроков племени.');
                    renderTable([]);
                }
                return;
            }

            let playerName = keys[index];
            let playerId = unitoption[playerName];
            index++;

            $.get(server + "game.php?" + sitter + "screen=ally&mode=" + mode + "&player_id=" + playerId, function(htmlData) {
                try {
                    let el = document.createElement('html');
                    el.innerHTML = htmlData;
                    let table = el.querySelector(".w100") ? el.querySelector(".w100").parentNode.querySelector("table") : el.querySelector("table#units_table");
                    
                    if (table) {
                        let trows = table.rows;
                        for (let j = 1; j < trows.length; ++j) {
                            let cells = trows[j].cells;
                            if (!cells || cells.length < 13) continue;
                            
                            let coordMatch = cells[0].innerText.match(/\d+\|\d+/);
                            if (!coordMatch) continue;
                            let coords = coordMatch[0];

                            let rawUnits = [];
                            for(let k = 2; k < cells.length; k++) {
                                let val = parseInt(cells[k].innerText.replace(/\./g, '').replace(/,/g, '')) || 0;
                                rawUnits.push(val);
                            }

                            let units = mapUnitsCorrectly(rawUnits, hasArchers);
                            let spear = units[0] || 0;
                            let axe = units[2] || 0;
                            let type = (spear > axe) ? "дефф" : "офф";

                            allyData.push({
                                player: playerName,
                                coords: coords,
                                units: units,
                                type: type
                            });
                        }
                    }
                } catch(err) {
                    console.error("Ошибка парсинга игрока " + playerName, err);
                }

                setTimeout(fetchNext, 250);
            }).fail(function() {
                setTimeout(fetchNext, 250);
            });
        }

        fetchNext();
    }

    function updateHeaderColumns() {
        let hasArchers = $('#world_has_archers').is(':checked');
        let colIdx = { player: 0, coords: 1, spear: 2, sword: 3, axe: 4, archer: 5, spy: 6, light: 7, marcher: 8, heavy: 9, ram: 10, catapult: 11, knight: 12, snob: 13, type: 14 };

        if (!hasArchers) {
            colIdx.spy = 5; colIdx.light = 6; colIdx.heavy = 7; colIdx.ram = 8; colIdx.catapult = 9; colIdx.knight = 10; colIdx.snob = 11; colIdx.type = 12;
        }

        let archerCols = hasArchers ? `<th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.archer}" title="Лучник"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_archer.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>` : '';
        let marcherCol = hasArchers ? `<th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.marcher}" title="Кавалерия лучников"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_marcher.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>` : '';

        let html = `
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.player}">Ник игрока <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.coords}">Координаты <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.spear}" title="Копейщик"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_spear.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.sword}" title="Мечник"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_sword.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.axe}" title="Топорник"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_axe.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            ${archerCols}
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.spy}" title="Лазутчик"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_spy.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.light}" title="Лёгкая кавалерия"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_light.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            ${marcherCol}
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.heavy}" title="Тяжёлая кавалерия"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_heavy.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.ram}" title="Таран"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_ram.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.catapult}" title="Катапульта"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_catapult.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.knight}" title="Паладин"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_knight.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.snob}" title="Дворянин"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_snob.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.type}">Тип <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;"><input type="checkbox" id="select_all_chk" style="cursor:pointer;"></th>
        `;
        $('#table_header_row').html(html);
    }

    function renderTable(data) {
        let tbody = $('#troops_table_body');
        tbody.empty();
        $('#troops_count_info').text(`Записей: ${data.length} из ${globalTroopsData.length}`);
        $('#select_all_chk').prop('checked', false);

        if (data.length === 0) {
            tbody.html('<tr><td colspan="15" style="padding: 25px; color: #777;">Нет данных</td></tr>');
            return;
        }

        let hasArchers = $('#world_has_archers').is(':checked');

        data.forEach((item, idx) => {
            let unitsToDisplay = [...item.units];
            while(unitsToDisplay.length < 12) unitsToDisplay.push(0);

            let displaySlice = [...unitsToDisplay];
            if (!hasArchers) {
                displaySlice = displaySlice.filter((_, i) => i !== 3 && i !== 6);
            }

            let uTds = displaySlice.map(u => `<td style="border: 1px solid #e3d0b1; padding: 3px;">${u}</td>`).join('');
            let tr = `
                <tr style="background: #fff;">
                    <td style="border: 1px solid #e3d0b1; padding: 3px; font-weight: bold; text-align: left; padding-left: 6px;">${item.player}</td>
                    <td style="border: 1px solid #e3d0b1; padding: 3px; color: #000; font-weight: bold;">${item.coords}</td>
                    ${uTds}
                    <td style="border: 1px solid #e3d0b1; padding: 3px; font-weight: bold; color: ${item.type==='офф'?'#b22222':'#00008b'};">${item.type}</td>
                    <td style="border: 1px solid #e3d0b1; padding: 3px;"><input type="checkbox" class="row-sel" data-index="${idx}" style="cursor:pointer;"></td>
                </tr>
            `;
            tbody.append(tr);
        });
    }

    function loadData() {
        let saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { 
                globalTroopsData = JSON.parse(saved);
                renderTable(globalTroopsData); 
            } catch(e){}
        }
    }

    function getValForCol(item, colIdx) {
        let hasArchers = $('#world_has_archers').is(':checked');
        if (colIdx === 0) return item.player;
        if (colIdx === 1) return item.coords;

        if (hasArchers) {
            if (colIdx >= 2 && colIdx <= 13) return item.units[colIdx - 2];
            if (colIdx === 14) return item.type;
        } else {
            let unitMapWithoutArchers = { 2: 0, 3: 1, 4: 2, 5: 4, 6: 5, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11 };
            if (colIdx >= 2 && colIdx <= 11) {
                let realUnitIdx = unitMapWithoutArchers[colIdx];
                return item.units[realUnitIdx] || 0;
            }
            if (colIdx === 12) return item.type;
        }
        return '';
    }

    // Привязка событий внутри вкладки менеджера войск
    function bindTroopsEvents() {
        updateHeaderColumns();
        loadData();

        $('#btn_clear_troops').off('click').on('click', () => {
            localStorage.removeItem(STORAGE_KEY);
            globalTroopsData = [];
            renderTable([]);
        });
        $('#btn_fetch_troops').off('click').on('click', parseTroops);
        $('#btn_fetch_ally').off('click').on('click', parseAllyTroops);

        $('#world_has_archers').off('change').on('change', function() {
            updateHeaderColumns();
            renderTable(globalTroopsData);
        });

        $(document).off('change', '#select_all_chk').on('change', '#select_all_chk', function() {
            let isChecked = $(this).is(':checked');
            $('.row-sel').prop('checked', isChecked);
        });

        $('#btn_save_dropdown').off('click').on('click', function(e) {
            e.stopPropagation();
            $('#save_menu').toggle();
        });
        $(document).off('click.savemenu').on('click.savemenu', function() { $('#save_menu').hide(); });

        $('.save-option').off('click').on('click', function() {
            let category = $(this).data('cat');
            let selectedItems = [];
            $('.row-sel:checked').each(function() {
                let idx = $(this).data('index');
                if (globalTroopsData[idx]) {
                    selectedItems.push(globalTroopsData[idx]);
                }
            });

            if (selectedItems.length === 0) {
                alert('Не выбрано ни одной строки!');
                return;
            }

            let storageKeyCat = `ra_wb_category_${category}`;
            let existing = JSON.parse(localStorage.getItem(storageKeyCat) || '[]');
            localStorage.setItem(storageKeyCat, JSON.stringify(existing.concat(selectedItems)));
            alert(`Успешно сохранено элементов (${selectedItems.length}) в категорию: ${category.toUpperCase()}`);
        });

        // Фильтры таблицы
        $(document).off('click', '.filter-ico').on('click', '.filter-ico', function(e) {
            e.stopPropagation();
            $('.sheets-filter-popup').remove();
            
            let th = $(this).closest('th');
            let colIdx = parseInt(th.attr('data-col'));
            if (isNaN(colIdx)) return;

            let isNumericCol = (colIdx >= 2 && colIdx <= 13);

            let numericControlsHtml = isNumericCol ? `
                <div style="margin: 4px 0 6px 0; padding-top: 4px; border-top: 1px solid #e3d0b1;">
                    <div style="font-weight: bold; color: #5b3511; margin-bottom: 2px;">Фильтровать по условию:</div>
                    <select class="f-num-op" style="width: 100%; box-sizing: border-box; padding: 2px; border: 1px solid #c5a059; margin-bottom: 3px; background: #fff; font-size: 10px;">
                        <option value="all">Все</option>
                        <option value="gt">&gt; Больше</option>
                        <option value="gte">&ge; Больше или равно</option>
                        <option value="lt">&lt; Меньше</option>
                        <option value="lte">&le; Меньше или равно</option>
                    </select>
                    <input type="number" class="f-num-val" placeholder="Число..." style="width: 100%; box-sizing: border-box; padding: 2px; border: 1px solid #c5a059; font-size: 10px;">
                </div>
            ` : '';

            let popup = `
                <div class="sheets-filter-popup" style="position: fixed; background: #fff8eb; border: 1px solid #7d510f; padding: 6px; z-index: 100020; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-align: left; font-size: 11px; width: 210px; color: #5b3511;">
                    <div class="f-action" data-act="asc" style="padding: 3px 4px; cursor:pointer; border-bottom: 1px solid #e3d0b1;">Сортировать А &gt; Я</div>
                    <div class="f-action" data-act="desc" style="padding: 3px 4px; cursor:pointer; border-bottom: 1px solid #e3d0b1;">Сортировать Я &gt; А</div>
                    ${numericControlsHtml}
                    <div style="padding: 4px 0 2px 0; font-weight: bold; color: #5b3511;">Фильтровать по значению:</div>
                    <input type="text" class="f-search" placeholder="Поиск..." style="width: 100%; box-sizing: border-box; padding: 2px; border: 1px solid #c5a059; margin-bottom: 3px; font-size: 10px;">
                    <div style="display: flex; gap: 6px; font-size: 10px; margin-bottom: 3px; color: #333;">
                        <span class="f-select-all" style="cursor:pointer; text-decoration: underline;">Выбрать все</span> / 
                        <span class="f-clear-all" style="cursor:pointer; text-decoration: underline;">Сбросить</span>
                    </div>
                    <div class="f-values-list" style="max-height: 95px; overflow-y: auto; background: #fff; border: 1px solid #c5a059; padding: 3px; font-size: 10px;"></div>
                    <div style="display: flex; justify-content: space-between; margin-top: 8px; border-top: 1px solid #e3d0b1; padding-top: 6px;">
                        <button class="f-cancel" style="cursor:pointer; padding: 2px 10px; background: #f4ecd8; border: 1px solid #7d510f; border-radius: 2px; font-size: 10px;">Отмена</button>
                        <button class="f-ok" style="cursor:pointer; padding: 2px 14px; background: #2e6b30; color: #fff; border: 1px solid #1e4620; border-radius: 2px; font-weight: bold; font-size: 10px;">OK</button>
                    </div>
                </div>
            `;
            
            $('body').append(popup);
            
            let thOffset = th.offset();
            let popupTop = thOffset.top + th.outerHeight();
            let popupLeft = thOffset.left;
            if (popupLeft + 210 > $(window).width()) popupLeft = $(window).width() - 220;

            $('.sheets-filter-popup').css({ top: popupTop + 'px', left: popupLeft + 'px' });

            let uniqueVals = [...new Set(globalTroopsData.map(item => getValForCol(item, colIdx)))].sort((a,b) => {
                if (!isNaN(a) && !isNaN(b)) return Number(a) - Number(b);
                return String(a).localeCompare(String(b));
            });

            let valListDiv = $('.sheets-filter-popup .f-values-list');
            uniqueVals.forEach(val => {
                valListDiv.append(`<label style="display:block; cursor:pointer; line-height: 1.4;"><input type="checkbox" class="f-val-chk" value="${val}" checked> ${val}</label>`);
            });

            $('.sheets-filter-popup .f-search').on('input', function() {
                let term = $(this).val().toLowerCase();
                valListDiv.find('label').each(function() {
                    let txt = $(this).text().toLowerCase();
                    $(this).toggle(txt.includes(term));
                });
            });

            $('.f-select-all').on('click', () => valListDiv.find('.f-val-chk').prop('checked', true));
            $('.f-clear-all').on('click', () => valListDiv.find('.f-val-chk').prop('checked', false));

            $('.f-action').on('click', function() {
                let act = $(this).data('act');
                globalTroopsData.sort((a,b) => {
                    let va = getValForCol(a, colIdx), vb = getValForCol(b, colIdx);
                    if (act === 'asc') return (!isNaN(va) && !isNaN(vb)) ? Number(va) - Number(vb) : String(va).localeCompare(String(vb));
                    return (!isNaN(va) && !isNaN(vb)) ? Number(vb) - Number(va) : String(vb).localeCompare(String(va));
                });
                renderTable(globalTroopsData);
                $('.sheets-filter-popup').remove();
            });

            $('.f-cancel').on('click', () => $('.sheets-filter-popup').remove());
            
            $('.f-ok').on('click', function() {
                let allowed = [];
                $('.sheets-filter-popup .f-val-chk:checked').each(function() { allowed.push($(this).val()); });
                
                let numOp = $('.sheets-filter-popup .f-num-op').val();
                let numVal = parseFloat($('.sheets-filter-popup .f-num-val').val());
                let useNumericCondition = isNumericCol && numOp && numOp !== 'all' && !isNaN(numVal);

                let filtered = globalTroopsData.filter(item => {
                    let rawVal = getValForCol(item, colIdx);
                    let strVal = String(rawVal);

                    if (useNumericCondition) {
                        let numItemVal = parseFloat(rawVal) || 0;
                        let matches = false;
                        if (numOp === 'gt' && numItemVal > numVal) matches = true;
                        if (numOp === 'gte' && numItemVal >= numVal) matches = true;
                        if (numOp === 'lt' && numItemVal < numVal) matches = true;
                        if (numOp === 'lte' && numItemVal <= numVal) matches = true;
                        if (!matches) return false;
                    }
                    return allowed.includes(strVal);
                });

                renderTable(filtered);
                $('.sheets-filter-popup').remove();
            });
        });
    }

    // ==========================================
    // ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК ХАБА
    // ==========================================
    function loadTab(tabName) {
        panel.querySelectorAll('.tw-hub-tab-btn').forEach(b => {
            if (b.getAttribute('data-tab') === tabName) {
                b.style.background = '#fff8eb';
                b.style.color = '#5b3511';
                b.classList.add('active');
            } else {
                b.style.background = '#3b2812';
                b.style.color = '#f4e4bc';
                b.classList.remove('active');
            }
        });

        let $content = $('#tw-hub-content-container');
        $content.empty();

        if (tabName === 'troops') {
            $content.html(getTroopsTabHTML());
            bindTroopsEvents();
            renderTable(globalTroopsData);
        } else if (tabName === 'balancer') {
            $content.html('<div style="padding: 20px; text-align:center; font-weight:bold;">Здесь будет интерфейс Авто-балансера ресурсов</div>');
        } else if (tabName === 'scanner') {
            $content.html('<div style="padding: 20px; text-align:center; font-weight:bold;">Здесь будет интерфейс Сбора координат</div>');
        } else {
            $content.html(`<div style="padding: 20px; text-align:center; font-weight:bold;">Модуль "${tabName}" в разработке...</div>`);
        }
    }

    panel.querySelectorAll('.tw-hub-tab-btn').forEach(btn => {
        btn.onclick = function() {
            let tab = this.getAttribute('data-tab');
            loadTab(tab);
        };
    });

    // Открываем вкладку войск по умолчанию при старте
    loadTab('troops');

})();
