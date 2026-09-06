// ==UserScript==
// @name         TW Workbench - 1. Таблица войск (Full Google Sheets Filters)
// @version      1.6.0
// @description  Воркбенч аккаунт: полноценное меню фильтрации и сортировки (как в Google Таблицах) для каждого столбца.
// @match        https://*.plemiona.pl/*
// @match        https://*.voyna-plemen.ru/*
// @match        https://*.tribalwars.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'ra_wb_troops_data_v6';
    const SETTINGS_KEY = 'ra_wb_settings_v1';
    let globalTroopsData = [];

    // Хранилище активных фильтров и сортировок для каждого столбца
    // colKey: { type: 'values'/'condition', values: [...], condType: '>', condVal: '100' }
    let columnFilters = {};
    
    // Текущая сортировка: { colIndex: number, asc: boolean }
    let currentSort = { colIndex: null, asc: true };

    const unitKeysConfig = [
        { key: 'spear', name: 'Копейщик', icon: 'spear.png' },
        { key: 'sword', name: 'Мечник', icon: 'sword.png' },
        { key: 'axe', name: 'Топорник', icon: 'axe.png' },
        { key: 'archer', name: 'Лучник', icon: 'archer.png' },
        { key: 'spy', name: 'Разведчик', icon: 'spy.png' },
        { key: 'light', name: 'Лёгкая кавалерия', icon: 'light.png' },
        { key: 'marcher', name: 'Конный лучник', icon: 'marcher.png' },
        { key: 'heavy', name: 'Тяжёлая кавалерия', icon: 'heavy.png' },
        { key: 'ram', name: 'Таран', icon: 'ram.png' },
        { key: 'catapult', name: 'Катапульта', icon: 'catapult.png' },
        { key: 'knight', name: 'Паладин', icon: 'knight.png' },
        { key: 'snob', name: 'Дворянин', icon: 'snob.png' }
    ];

    function init() {
        if ($('#ra_workbench_main').length > 0) {
            $('#ra_workbench_main').toggle();
            return;
        }
        createUI();
        loadData();
    }

    function createUI() {
        let savedArchers = localStorage.getItem(SETTINGS_KEY + '_archers');
        let hasArchersChecked = savedArchers !== null ? JSON.parse(savedArchers) : false;

        const html = `
            <div id="ra_workbench_main" style="position: fixed; top: 60px; left: 50px; width: 1240px; height: 620px; z-index: 99999; background: #fff8eb; border: 2px solid #7d510f; border-radius: 4px; display: flex; flex-direction: column; font-family: Verdana, Arial; font-size: 11px; box-shadow: 0 5px 15px rgba(0,0,0,0.4);">
                
                <div id="ra_wb_header" style="background: #e2c08e; padding: 6px 10px; border-bottom: 2px solid #7d510f; display: flex; align-items: center; justify-content: space-between; cursor: move; user-select: none;">
                    <span style="font-weight: bold; color: #5b3511;">Таблица войск (TW Workbench)</span>
                    <button id="ra_wb_close" style="background: #c5a059; border: 1px solid #7d510f; color: #fff; font-weight: bold; cursor: pointer; padding: 2px 6px; border-radius: 3px;">×</button>
                </div>

                <div style="background: #f4ecd8; padding: 8px; border-bottom: 1px solid #c5a059; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <button id="btn_fetch_troops" style="background: #f4ecd8; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #5b3511;">Снять со страницы</button>
                    <button id="btn_fetch_ally" style="background: #f4ecd8; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #5b3511;">Войска племени</button>
                    <button id="btn_clear_troops" style="background: #d9534f; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #fff;">Очистить</button>
                    
                    <label style="margin-left: 10px; font-weight: bold; color: #5b3511; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="world_has_archers" ${hasArchersChecked ? 'checked' : ''} style="cursor: pointer;"> Мир с луками
                    </label>

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

                    <button id="btn_reset_all_filters" style="background: #e2c08e; border: 1px solid #7d510f; padding: 4px 10px; cursor: pointer; border-radius: 3px; color: #5b3511; font-weight: bold; margin-left: 5px;">Сбросить все фильтры</button>
                    <span id="troops_count_info" style="font-weight: bold; color: #5b3511; margin-left: auto;">Записей: 0 из 0</span>
                </div>

                <!-- Контейнер для всплывающего Google-меню фильтрации -->
                <div id="g_filter_popup" style="display: none; position: absolute; background: #fff8eb; border: 1px solid #7d510f; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 100050; padding: 10px; width: 240px; border-radius: 3px; font-size: 11px;"></div>

                <!-- Таблица -->
                <div id="table_container" style="flex-grow: 1; overflow: auto; background: #fff; position: relative;">
                    <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 11px;" id="troops_table">
                        <thead>
                            <tr id="table_header_row" style="background: #e2c08e; color: #5b3511; position: sticky; top: 0; z-index: 10;"></tr>
                        </thead>
                        <tbody id="troops_table_body">
                            <tr><td colspan="20" style="padding: 25px; color: #777;">Нет данных. Нажмите «Снять со страницы» на обзоре войск или «Войска племени».</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        $('body').append(html);

        updateHeaderColumns();
        bindEvents();
        makeDraggable('#ra_workbench_main', '#ra_wb_header');
    }

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

            let rawUnits = [];
            for (let i = 0; i < available_tds.length; i++) {
                let val = parseInt(available_tds[i].textContent.replace(/\./g, '')) || 0;
                rawUnits.push(val);
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
            renderTable();
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
        $('#troops_table_body').html('<tr><td colspan="20" style="padding: 25px; font-weight: bold; color: #b22222;">Загрузка данных игроков племени, подождите...</td></tr>');

        let allyData = [];
        let keys = Object.keys(unitoption);
        let index = 0;

        function fetchNext() {
            if (index >= keys.length) {
                if (allyData.length > 0) {
                    globalTroopsData = allyData;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalTroopsData));
                    renderTable();
                    alert(`Успешно загружены войска племени: записей (${allyData.length})`);
                } else {
                    alert('Не удалось собрать данные игроков племени.');
                    renderTable();
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
                setTimeout(fetchNext, 200);
            }).fail(function() {
                setTimeout(fetchNext, 200);
            });
        }
        fetchNext();
    }

    function updateHeaderColumns() {
        let hasArchers = $('#world_has_archers').is(':checked');

        let html = `
            <th style="padding: 6px; width: 30px;"><input type="checkbox" id="select_all_troops" style="cursor: pointer;"></th>
            <th style="padding: 6px; text-align: left;">
                Игрок <span class="col-filter-btn" data-col-index="1" style="cursor: pointer; font-weight: bold; color: #7d510f;" title="Меню фильтра">▼</span>
            </th>
            <th style="padding: 6px; text-align: left;">
                Координаты <span class="col-filter-btn" data-col-index="2" style="cursor: pointer; font-weight: bold; color: #7d510f;" title="Меню фильтра">▼</span>
            </th>
        `;

        let unitIdx = 0;
        unitKeysConfig.forEach((u, originalIdx) => {
            if (!hasArchers && (originalIdx === 3 || originalIdx === 6)) return; 
            let targetColIndex = 3 + unitIdx;
            html += `
                <th style="padding: 6px;">
                    <img src="https://dsru.innogamescdn.com/asset/depot/graphic/unit/unit_${u.icon}" title="${u.name}">
                    <span class="col-filter-btn" data-col-index="${targetColIndex}" style="cursor: pointer; font-weight: bold; color: #7d510f; margin-left: 2px;" title="Меню фильтра">▼</span>
                </th>
            `;
            unitIdx++;
        });

        let typeColIdx = 3 + unitIdx;
        html += `
            <th style="padding: 6px;">
                Тип <span class="col-filter-btn" data-col-index="${typeColIdx}" style="cursor: pointer; font-weight: bold; color: #7d510f;" title="Меню фильтра">▼</span>
            </th>
        `;
        $('#table_header_row').html(html);
    }

    function getCellValue(item, colIndex, hasArchers) {
        if (colIndex === 1) return item.player;
        if (colIndex === 2) return item.coords;
        
        let unitRealIndices = [];
        unitKeysConfig.forEach((u, idx) => {
            if (hasArchers || (idx !== 3 && idx !== 6)) unitRealIndices.push(idx);
        });

        let unitColOffset = colIndex - 3;
        if (unitColOffset >= 0 && unitColOffset < unitRealIndices.length) {
            let realUnitIdx = unitRealIndices[unitColOffset];
            return item.units[realUnitIdx] || 0;
        }

        // Последняя колонка — тип
        return item.type;
    }

    function renderTable() {
        let tbody = $('#troops_table_body');
        tbody.html('');
        let hasArchers = $('#world_has_archers').is(':checked');

        let dataToProcess = [...globalTroopsData];

        // 1. Применяем фильтры для всех столбцов
        let filteredData = dataToProcess.filter(item => {
            for (let colIdx in columnFilters) {
                let flt = columnFilters[colIdx];
                if (!flt) continue;
                let val = getCellValue(item, parseInt(colIdx), hasArchers);

                if (flt.type === 'values') {
                    if (flt.values && !flt.values.includes(String(val))) {
                        return false;
                    }
                } else if (flt.type === 'condition') {
                    let numVal = parseFloat(val);
                    let targetNum = parseFloat(flt.condVal);
                    if (isNaN(numVal)) numVal = 0;
                    if (isNaN(targetNum)) targetNum = 0;

                    if (flt.condType === '>' && !(numVal > targetNum)) return false;
                    if (flt.condType === '>=' && !(numVal >= targetNum)) return false;
                    if (flt.condType === '<' && !(numVal < targetNum)) return false;
                    if (flt.condType === '<=' && !(numVal <= targetNum)) return false;
                    if (flt.condType === '=' && !(numVal === targetNum)) return false;
                    if (flt.condType === '!=' && !(numVal !== targetNum)) return false;
                    if (flt.condType === 'contains' && !String(val).toLowerCase().includes(String(flt.condVal).toLowerCase())) return false;
                }
            }
            return true;
        });

        // 2. Применяем сортировку
        if (currentSort.colIndex !== null) {
            let cIdx = currentSort.colIndex;
            let asc = currentSort.asc;
            filteredData.sort((a, b) => {
                let vA = getCellValue(a, cIdx, hasArchers);
                let vB = getCellValue(b, cIdx, hasArchers);

                let nA = parseFloat(vA);
                let nB = parseFloat(vB);

                if (!isNaN(nA) && !isNaN(nB)) {
                    return asc ? nA - nB : nB - nA;
                } else {
                    let sA = String(vA).toLowerCase();
                    let sB = String(vB).toLowerCase();
                    if (sA < sB) return asc ? -1 : 1;
                    if (sA > sB) return asc ? 1 : -1;
                    return 0;
                }
            });
        }

        $('#troops_count_info').text(`Записей: ${filteredData.length} из ${globalTroopsData.length}`);

        if (filteredData.length === 0) {
            tbody.html(`<tr><td colspan="20" style="padding: 25px; color: #777;">Нет записей, удовлетворяющих условиям фильтра.</td></tr>`);
            return;
        }

        let html = '';
        filteredData.forEach(function(item, idx) {
            let unitRealIndices = [];
            unitKeysConfig.forEach((u, uIdx) => {
                if (hasArchers || (uIdx !== 3 && uIdx !== 6)) unitRealIndices.push(uIdx);
            });

            html += `
                <tr style="border-bottom: 1px solid #e3d0b1; background: ${idx % 2 === 0 ? '#fff' : '#fcf8f2'};">
                    <td style="padding: 4px;"><input type="checkbox" class="troop-row-chk" data-coords="${item.coords}" style="cursor: pointer;"></td>
                    <td style="padding: 4px; text-align: left; font-weight: bold;">${item.player}</td>
                    <td style="padding: 4px; text-align: left; font-family: monospace; font-weight: bold;">${item.coords}</td>
            `;

            unitRealIndices.forEach(uIdx => {
                let val = item.units[uIdx] || 0;
                html += `<td style="padding: 4px; color: ${val > 0 ? '#000' : '#aaa'};">${val > 0 ? val.toLocaleString() : '0'}</td>`;
            });

            html += `
                    <td style="padding: 4px; font-weight: bold; color: ${item.type === 'офф' ? '#b22222' : '#00008b'};">${item.type.toUpperCase()}</td>
                </tr>
            `;
        });

        tbody.html(html);
    }

    function loadData() {
        let saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                globalTroopsData = JSON.parse(saved);
                renderTable();
            } catch(e) {
                globalTroopsData = [];
            }
        }
    }

    // Открытие полноценного меню Google Таблицы для выбранного столбца
    function openGoogleFilterMenu(colIndex, btnElement) {
        let $popup = $('#g_filter_popup');
        let offset = $(btnElement).offset();
        let mainOffset = $('#ra_workbench_main').offset();

        $popup.css({
            top: (offset.top - mainOffset.top + 20) + 'px',
            left: Math.min(offset.left - mainOffset.left, 980) + 'px'
        });

        let hasArchers = $('#world_has_archers').is(':checked');
        
        // Собираем все уникальные значения для этого столбца
        let allValues = globalTroopsData.map(item => String(getCellValue(item, colIndex, hasArchers)));
        let uniqueValues = [...new Set(allValues)].sort((a, b) => {
            let na = parseFloat(a), nb = parseFloat(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
        });

        let currentFlt = columnFilters[colIndex] || { type: 'values', values: null };

        let menuHtml = `
            <div class="g-menu-item" id="g_sort_asc" style="padding: 5px 8px; cursor: pointer; border-bottom: 1px solid #f0e2cd; font-weight: bold;">Сортировать по возрастанию (А -> Я)</div>
            <div class="g-menu-item" id="g_sort_desc" style="padding: 5px 8px; cursor: pointer; border-bottom: 1px solid #e3d0b1; font-weight: bold;">Сортировать по убыванию (Я -> А)</div>
            
            <div style="padding: 6px 8px; font-weight: bold; color: #5b3511; border-bottom: 1px solid #e3d0b1; margin-top: 2px;">Фильтровать по условию:</div>
            <div style="padding: 4px 8px; display: flex; gap: 4px; align-items: center;">
                <select id="cond_type_sel" style="font-size: 10px; border: 1px solid #c5a059; padding: 2px;">
                    <option value=">">Больше (&gt;)</option>
                    <option value=">=">Больше или равно (&gt;=)</option>
                    <option value="<">Меньше (&lt;)</option>
                    <option value="<=">Меньше или равно (&lt;=)</option>
                    <option value="=">Равно (=)</option>
                    <option value="!=">Не равно (!=)</option>
                    <option value="contains">Содержит текст</option>
                </select>
                <input type="text" id="cond_val_input" placeholder="Значение" style="width: 70px; padding: 2px; font-size: 10px; border: 1px solid #c5a059;">
            </div>
            <div style="padding: 0 8px 6px 8px; border-bottom: 1px solid #e3d0b1;">
                <button id="apply_cond_btn" style="background: #e2c08e; border: 1px solid #7d510f; padding: 2px 8px; cursor: pointer; font-size: 10px; font-weight: bold; border-radius: 2px;">Применить условие</button>
            </div>

            <div style="padding: 6px 8px 3px 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold; color: #5b3511;">По значению:</span>
                <div>
                    <a href="#" id="sel_all_vals" style="font-size: 10px; color: #00008b; text-decoration: underline; margin-right: 6px;">Все</a>
                    <a href="#" id="clear_all_vals" style="font-size: 10px; color: #b22222; text-decoration: underline;">Очистить</a>
                </div>
            </div>
            <div style="padding: 0 8px 4px 8px;">
                <input type="text" id="popup_search_val" placeholder="Поиск..." style="width: 100%; padding: 3px; box-sizing: border-box; border: 1px solid #c5a059; font-size: 10px;">
            </div>
            <div style="max-height: 130px; overflow-y: auto; border: 1px solid #e3d0b1; background: #fff; padding: 4px; margin: 0 8px;" id="popup_checkboxes_container">
        `;

        uniqueValues.forEach(val => {
            let isChecked = true;
            if (currentFlt.type === 'values' && currentFlt.values !== null) {
                isChecked = currentFlt.values.includes(val);
            }
            menuHtml += `<label style="display: block; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10px;"><input type="checkbox" class="g_val_chk" value="${val}" ${isChecked ? 'checked' : ''}> ${val}</label>`;
        });

        menuHtml += `
            </div>
            <div style="margin: 8px 8px 0 8px; display: flex; justify-content: space-between;">
                <button id="popup_apply_values" style="background: #e2c08e; border: 1px solid #7d510f; padding: 3px 12px; font-weight: bold; cursor: pointer; border-radius: 2px; color: #5b3511;">ОК</button>
                <button id="popup_reset_col" style="background: #fff; border: 1px solid #7d510f; padding: 3px 8px; cursor: pointer; border-radius: 2px; color: #b22222;">Сбросить столбец</button>
            </div>
        `;

        $popup.html(menuHtml).show();

        // Обработчики внутри меню
        $('#g_sort_asc').on('click', function() {
            currentSort = { colIndex: colIndex, asc: true };
            $popup.hide();
            renderTable();
        });

        $('#g_sort_desc').on('click', function() {
            currentSort = { colIndex: colIndex, asc: false };
            $popup.hide();
            renderTable();
        });

        $('#popup_search_val').on('input', function() {
            let text = $(this).val().toLowerCase();
            $('.g_val_chk').each(function() {
                let v = $(this).val().toLowerCase();
                if (v.includes(text)) {
                    $(this).parent().show();
                } else {
                    $(this).parent().hide();
                }
            });
        });

        $('#sel_all_vals').on('click', function(e) {
            e.preventDefault();
            $('.g_val_chk').prop('checked', true);
        });

        $('#clear_all_vals').on('click', function(e) {
            e.preventDefault();
            $('.g_val_chk').prop('checked', false);
        });

        $('#apply_cond_btn').on('click', function() {
            let condType = $('#cond_type_sel').val();
            let condVal = $('#cond_val_input').val();
            columnFilters[colIndex] = {
                type: 'condition',
                condType: condType,
                condVal: condVal
            };
            $popup.hide();
            renderTable();
        });

        $('#popup_apply_values').on('click', function() {
            let selectedVals = [];
            $('.g_val_chk:checked').each(function() {
                selectedVals.push($(this).val());
            });

            if (selectedVals.length === uniqueValues.length) {
                delete columnFilters[colIndex];
            } else {
                columnFilters[colIndex] = {
                    type: 'values',
                    values: selectedVals
                };
            }
            $popup.hide();
            renderTable();
        });

        $('#popup_reset_col').on('click', function() {
            delete columnFilters[colIndex];
            $popup.hide();
            renderTable();
        });
    }

    function bindEvents() {
        $('#ra_wb_close').on('click', function() {
            $('#ra_workbench_main').hide();
            $('#g_filter_popup').hide();
        });

        $('#btn_fetch_troops').on('click', parseTroops);
        $('#btn_fetch_ally').on('click', parseAllyTroops);

        $('#btn_clear_troops').on('click', function() {
            if (confirm('Очистить сохраненную таблицу войск?')) {
                globalTroopsData = [];
                localStorage.removeItem(STORAGE_KEY);
                renderTable();
            }
        });

        $('#world_has_archers').on('change', function() {
            let isChecked = $(this).is(':checked');
            localStorage.setItem(SETTINGS_KEY + '_archers', JSON.stringify(isChecked));
            updateHeaderColumns();
            renderTable();
        });

        // Клик по треугольнику ▼ в любой колонке
        $(document).on('click', '.col-filter-btn', function(e) {
            e.stopPropagation();
            let colIdx = parseInt($(this).attr('data-col-index'));
            openGoogleFilterMenu(colIdx, this);
        });

        // Закрытие меню при клике в сторону
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#g_filter_popup, .col-filter-btn').length) {
                $('#g_filter_popup').hide();
            }
        });

        $('#btn_reset_all_filters').on('click', function() {
            columnFilters = {};
            currentSort = { colIndex: null, asc: true };
            $('#g_filter_popup').hide();
            renderTable();
        });

        $('#select_all_troops').on('change', function() {
            let isChecked = $(this).is(':checked');
            $('.troop-row-chk').prop('checked', isChecked);
        });

        $('#btn_save_dropdown').on('click', function(e) {
            e.stopPropagation();
            $('#save_menu').toggle();
        });

        $(document).on('click', function() {
            $('#save_menu').hide();
        });

        $('.save-option').on('click', function() {
            let cat = $(this).attr('data-cat');
            let checkedBoxes = $('.troop-row-chk:checked');
            if (checkedBoxes.length === 0) {
                alert('Не выбрано ни одной строки в таблице!');
                return;
            }

            let storageKey = `ra_wb_category_${cat}`;
            let existing = localStorage.getItem(storageKey) || '';
            let items = [];
            if (existing.trim().startsWith('[')) {
                try { items = JSON.parse(existing); } catch(e) {}
            } else if (existing.trim() !== '') {
                items = existing.split('\n').filter(Boolean).map(c => ({ coords: c, player: '' }));
            }

            checkedBoxes.each(function() {
                let coords = $(this).attr('data-coords');
                let foundItem = globalTroopsData.find(i => i.coords === coords);
                if (foundItem) {
                    let entryObj = { coords: foundItem.coords, player: foundItem.player || '' };
                    if (!items.some(i => (typeof i === 'object' ? i.coords : i) === coords)) {
                        items.push(entryObj);
                    }
                }
            });

            localStorage.setItem(storageKey, JSON.stringify(items));
            alert(`Успешно сохранено элементов (${checkedBoxes.length}) в категорию: ${cat.toUpperCase()}`);
            $('#save_menu').hide();
        });
    }

    function makeDraggable(selector, handleSelector) {
        let $el = $(selector);
        let $handle = $(handleSelector);
        let startX = 0, startY = 0, initialX = 0, initialY = 0, isDragging = false;

        $handle.on('mousedown', function(e) {
            isDragging, isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = $el.position().left;
            initialY = $el.position().top;

            $(document).on('mousemove.draggable', function(e) {
                if (!isDragging) return;
                let dx = e.clientX - startX;
                let dy = e.clientY - startY;
                $el.css({
                    left: (initialX + dx) + 'px',
                    top: (initialY + dy) + 'px'
                });
            });

            $(document).on('mouseup.draggable', function() {
                isDragging = false;
                $(document).off('.draggable');
            });

            e.preventDefault();
        });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        $(document).ready(init);
    }

})();
