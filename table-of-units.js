// ==UserScript==
// @name         TW Workbench - 1. Таблица войск (Идеальные фильтры)
// @version      1.4.5
// @description  Воркбенч аккаунта: единый точный порядок юнитов, запоминание настроек луков, парсинг «Своих» с первой строчки.
// @match        https://*.plemiona.pl/*
// @match        https://*.voyna-plemen.ru/*
// @match        https://*.tribalwars.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // МОДУЛЬ 1: КОНСТАНТЫ И СОСТОЯНИЕ
    // ==========================================
    const STORAGE_KEY = 'ra_wb_troops_data_v6';
    const SETTINGS_KEY = 'ra_wb_settings_v1';
    let globalTroopsData = [];

    // ==========================================
    // МОДУЛЬ 2: ИНИЦИАЛИЗАЦИЯ И ИНТЕРФЕЙС (UI)
    // ==========================================
    function init() {
        if ($('#ra_workbench_main').length > 0) {
            $('#ra_workbench_main').toggle();
            return;
        }
        createUI();
        loadData();
    }

    function createUI() {
        // Восстанавливаем сохраненное состояние чекбокса луков (по умолчанию false / снят)
        let savedArchers = localStorage.getItem(SETTINGS_KEY + '_archers');
        let hasArchersChecked = savedArchers !== null ? JSON.parse(savedArchers) : false;

        const html = `
            <div id="ra_workbench_main" style="position: fixed; top: 60px; left: 50px; width: 1180px; height: 600px; z-index: 99999; background: #fff8eb; border: 2px solid #7d510f; border-radius: 4px; display: flex; flex-direction: column; font-family: Verdana, Arial; font-size: 11px; box-shadow: 0 5px 15px rgba(0,0,0,0.4);">
                
                <!-- Компактная шапка воркбенча -->
                <div id="ra_wb_header" style="background: #e2c08e; padding: 6px 10px; border-bottom: 2px solid #7d510f; display: flex; align-items: center; justify-content: space-between; cursor: move; user-select: none;">
                    <span style="font-weight: bold; color: #5b3511;">Таблица войск (TW Workbench)</span>
                    <button id="ra_wb_close" style="background: #c5a059; border: 1px solid #7d510f; color: #fff; font-weight: bold; cursor: pointer; padding: 2px 6px; border-radius: 3px;">×</button>
                </div>

                <!-- Панель управления -->
                <div style="background: #f4ecd8; padding: 8px; border-bottom: 1px solid #c5a059; display: flex; align-items: center; gap: 8px;">
                    <button id="btn_fetch_troops" style="background: #f4ecd8; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #5b3511;" title="Снять свои войска со страницы Обзор->Войска">Снять со страницы</button>
                    <button id="btn_fetch_ally" style="background: #f4ecd8; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #5b3511;" title="Собрать войска со страниц обзора племени">Войска племени</button>
                    <button id="btn_clear_troops" style="background: #d9534f; border: 1px solid #7d510f; padding: 4px 10px; font-weight: bold; cursor: pointer; border-radius: 3px; color: #fff;">Очистить</button>
                    
                    <label style="margin-left: 10px; font-weight: bold; color: #5b3511; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="world_has_archers" ${hasArchersChecked ? 'checked' : ''} style="cursor: pointer;"> Мир с луками
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
            </div>
        `;
        $('body').append(html);

        updateHeaderColumns();
        bindEvents();
        makeDraggable('#ra_workbench_main', '#ra_wb_header');
    }

    // ==========================================
    // ЕДИНЫЙ ТОЧНЫЙ МАППИНГ ЮНИТОВ ДЛЯ ВСЕХ ИСТОЧНИКОВ
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

    // ==========================================
    // МОДУЛЬ 3: ПАРСИНГ СВОИХ ВОЙСК (ТОЛЬКО СТРОКА «СВОИ»)
    // ==========================================
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
            // Считываем войска исключительно из первой строчки trs[0] («Свои»)
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
            renderTable(globalTroopsData);
            alert(`Успешно собрано своих деревень: ${data.length}`);
        } else {
            alert('Не удалось извлечь данные войск со страницы.');
        }
    }

    // ==========================================
    // МОДУЛЬ 4: ПАРСИНГ ВОЙСК ПЛЕМЕНИ
    // ==========================================
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

    // ==========================================
    // МОДУЛЬ 5: РЕНДЕРИНГ И ШАПКА
    // ==========================================
    function updateHeaderColumns() {
        let hasArchers = $('#world_has_archers').is(':checked');
        
        let colIdx = {
            player: 0,
            coords: 1,
            spear: 2,
            sword: 3,
            axe: 4,
            archer: 5,
            spy: 6,
            light: 7,
            marcher: 8,
            heavy: 9,
            ram: 10,
            catapult: 11,
            knight: 12,
            snob: 13,
            type: 14
        };

        if (!hasArchers) {
            colIdx.spy = 5;
            colIdx.light = 6;
            colIdx.heavy = 7;
            colIdx.ram = 8;
            colIdx.catapult = 9;
            colIdx.knight = 10;
            colIdx.snob = 11;
            colIdx.type = 12;
        }

        let archerCols = hasArchers ? `
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.archer}" title="Лучник"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_archer.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
        ` : '';

        let marcherCol = hasArchers ? `
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.marcher}" title="Кавалерия лучников (КЛ лучники)"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_marcher.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
        ` : '';

        let html = `
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.player}">Ник игрока <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.coords}">Координаты <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.spear}" title="Копейщик"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_spear.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.sword}" title="Мечник"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_sword.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.axe}" title="Топорник"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_axe.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            ${archerCols}
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.spy}" title="Лазутчик (Разведчик)"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_spy.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.light}" title="Лёгкая кавалерия (ЛК)"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_light.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
            ${marcherCol}
            <th style="border: 1px solid #c5a059; padding: 4px;" data-col="${colIdx.heavy}" title="Тяжёлая кавалерия (ТК)"><img src="https://dsru.innogamescdn.com/asset/105f9922/graphic/unit/unit_heavy.png"/> <span class="filter-ico" style="cursor:pointer;">▼</span></th>
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

    // ==========================================
    // МОДУЛЬ 6: СОБЫТИЯ И ПАМЯТЬ НАСТРОЕК
    // ==========================================
    function bindEvents() {
        $('#ra_wb_close').on('click', () => $('#ra_workbench_main').remove());
        $('#btn_clear_troops').on('click', () => {
            localStorage.removeItem(STORAGE_KEY);
            globalTroopsData = [];
            renderTable([]);
        });
        $('#btn_fetch_troops').on('click', parseTroops);
        $('#btn_fetch_ally').on('click', parseAllyTroops);

        $('#world_has_archers').on('change', function() {
            let isChecked = $(this).is(':checked');
            // Сохраняем выбор в localStorage для памяти настроек
            localStorage.setItem(SETTINGS_KEY + '_archers', JSON.stringify(isChecked));
            
            updateHeaderColumns();
            renderTable(globalTroopsData);
        });

        $(document).on('change', '#select_all_chk', function() {
            let isChecked = $(this).is(':checked');
            $('.row-sel').prop('checked', isChecked);
        });

        $('#btn_save_dropdown').on('click', function(e) {
            e.stopPropagation();
            $('#save_menu').toggle();
        });
        $(document).on('click', function() { $('#save_menu').hide(); });

        $('.save-option').on('click', function() {
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

        $(document).on('click', '.filter-ico', function(e) {
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
                <div class="sheets-filter-popup" style="position: fixed; background: #fff8eb; border: 1px solid #7d510f; padding: 6px; z-index: 100020; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-align: left; font-size: 11px; width: 210px;">
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
            if (popupLeft + 210 > $(window).width()) {
                popupLeft = $(window).width() - 220;
            }

            $('.sheets-filter-popup').css({ 
                top: popupTop + 'px', 
                left: popupLeft + 'px' 
            });

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
                if (act === 'asc') {
                    globalTroopsData.sort((a,b) => {
                        let va = getValForCol(a, colIdx), vb = getValForCol(b, colIdx);
                        return (!isNaN(va) && !isNaN(vb)) ? Number(va) - Number(vb) : String(va).localeCompare(String(vb));
                    });
                } else {
                    globalTroopsData.sort((a,b) => {
                        let va = getValForCol(a, colIdx), vb = getValForCol(b, colIdx);
                        return (!isNaN(va) && !isNaN(vb)) ? Number(vb) - Number(va) : String(vb).localeCompare(String(va));
                    });
                }
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
                        let matchesCondition = false;
                        if (numOp === 'gt' && numItemVal > numVal) matchesCondition = true;
                        if (numOp === 'gte' && numItemVal >= numVal) matchesCondition = true;
                        if (numOp === 'lt' && numItemVal < numVal) matchesCondition = true;
                        if (numOp === 'lte' && numItemVal <= numVal) matchesCondition = true;
                        
                        if (!matchesCondition) return false;
                    }

                    return allowed.includes(strVal);
                });

                renderTable(filtered);
                $('.sheets-filter-popup').remove();
            });
        });

        $(document).on('click', function(e) {
            if (!$(e.target).closest('.sheets-filter-popup, .filter-ico').length) {
                $('.sheets-filter-popup').remove();
            }
        });
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

    // ==========================================
    // МОДУЛЬ 7: СТАБИЛЬНОЕ ПЕРЕТАСКИВАНИЕ ОКНА
    // ==========================================
    function makeDraggable(selector, handleSelector) {
        let $el = $(selector), $handle = $(handleSelector);
        let startX = 0, startY = 0, initialX = 0, initialY = 0;

        $handle.on('mousedown', function(e) {
            if ($(e.target).is('button, input, a')) return;
            e.preventDefault();
            
            startX = e.clientX;
            startY = e.clientY;
            
            let pos = $el.offset();
            initialX = pos.left;
            initialY = pos.top;
            
            $el.css({
                left: initialX + 'px',
                top: initialY + 'px',
                position: 'fixed',
                margin: 0
            });

            $(document).on('mousemove.drag', dragEl);
            $(document).on('mouseup.drag', stopDrag);
        });

        function dragEl(e) {
            e.preventDefault();
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            $el.css({
                left: (initialX + dx) + 'px',
                top: (initialY + dy) + 'px'
            });
        }

        function stopDrag() {
            $(document).off('mousemove.drag');
            $(document).off('mouseup.drag');
        }
    }

    init();
})();
