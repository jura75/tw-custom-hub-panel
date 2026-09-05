javascript:(function() {
    let existing = document.getElementById('tw-custom-hub-panel');
    if (existing) {
        existing.remove();
        return;
    }

    let panel = document.createElement('div');
    panel.id = 'tw-custom-hub-panel';
    panel.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 1180px;
        height: 680px;
        background: #2b1d0c;
        border: 3px solid #7d510f;
        box-shadow: 0 6px 20px rgba(0,0,0,0.8);
        z-index: 99999;
        font-family: Verdana, Arial, sans-serif;
        color: #f4e4bc;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        resize: both;
    `;

    panel.innerHTML = `
        <!-- Шапка панели -->
        <div style="background: #1a1006; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7d510f; user-select: none;">
            <b style="font-size: 13px; color: #f4e4bc;">🛠️ Проект Хаб — Внутренняя рабочая среда</b>
            <span id="tw-hub-close" style="cursor: pointer; color: #a63a3a; font-weight: bold; font-size: 16px; padding: 0 4px;">✕</span>
        </div>
        
        <!-- Верхняя панель с кнопками-вкладками -->
        <div style="display: flex; gap: 2px; padding: 6px 8px; background: #1f1307; border-bottom: 2px solid #7d510f; overflow-x: auto;">
            <button class="tw-hub-tab-btn active" data-tab="1" style="background: #5a3b0c; border: 1px solid #7d510f; color: #fff; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">1. Таблица войск</button>
            <button class="tw-hub-tab-btn" data-tab="2" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">2. Выбранные войска</button>
            <button class="tw-hub-tab-btn" data-tab="3" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">3. Сбор координат (Карта)</button>
            <button class="tw-hub-tab-btn" data-tab="4" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">4. База координат</button>
            <button class="tw-hub-tab-btn" data-tab="5" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">5. Координаты цели</button>
            <button class="tw-hub-tab-btn" data-tab="6" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">Мультипланер</button>
        </div>

        <!-- Контейнер для контента выбранной вкладки -->
        <div id="tw-hub-content-container" style="flex: 1; background: #fff8eb; color: #5b3511; padding: 0; overflow: auto; position: relative; display: flex; flex-direction: column;">
            <div style="padding: 15px;"><h3 style="margin-top:0;">Загрузка...</h3></div>
        </div>

        <!-- Нижняя строка состояния -->
        <div style="background: #1a1006; padding: 5px 12px; font-size: 10px; color: #a98a5c; border-top: 1px solid #7d510f; display: flex; justify-content: space-between;">
            <span>Статус: Панель активна</span>
            <span>Потяните за правый нижний угол, чтобы изменить размер 📐</span>
        </div>
    `;

    document.body.appendChild(panel);
    document.getElementById('tw-hub-close').onclick = () => panel.remove();

    window._twMapCache = window._twMapCache || {
        mapDataLoaded: false,
        villagesData: [],
        playersData: {},
        tribesData: {},
        tileSize: 4,
        currentFilteredVillages: [],
        tribeColors: {},
        scrollLeft: 0,
        scrollTop: 0,
        selectedText: '',
        selectedCountText: 'Выбрано: 0',
        loadStatusText: 'Данные не загружены',
        rangeX1: 400, rangeY1: 400, rangeX2: 600, rangeY2: 600
    };

    function loadTabContent(tabId) {
        let container = document.getElementById('tw-hub-content-container');
        container.innerHTML = '';
        container.setAttribute('data-active-tab', tabId);

        if (tabId === '1') {
            container.innerHTML = `<div style="padding: 15px;"><h3 style="margin-top:0;">⚡ Загрузка Таблицы войск...</h3></div>`;
            let observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.id === 'ra_workbench_main') {
                            node.style.cssText = 'position:relative; top:0; left:0; transform:none; margin:0; width:100%; height:100%; border:none; box-shadow:none; border-radius:0; box-sizing:border-box;';
                            let innerHeader = node.querySelector('#ra_wb_header');
                            if (innerHeader) innerHeader.style.display = 'none';
                            container.innerHTML = '';
                            container.appendChild(node);
                            observer.disconnect();
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: false });

            fetch('https://raw.githubusercontent.com/jura75/tw-custom-hub-panel/refs/heads/main/table-of-units.js?_=' + Date.now())
                .then(r => r.text()).then(code => {
                    let s = document.createElement('script');
                    s.textContent = code;
                    document.body.appendChild(s);
                    s.remove();
                }).catch(err => { observer.disconnect(); container.innerHTML = `<div style="padding:15px; color:red;">Ошибка загрузки</div>`; });

        } else if (tabId === '2') {
            // Восстановленная логика хранения данных первой версии с 5 колонками категорий
            container.innerHTML = `
                <div style="padding: 10px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; background: #fff8eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: #f5e8cd; padding: 6px; border: 1px solid #c5a059; border-radius: 3px;">
                        <span style="font-weight: bold; font-size: 11px; color: #5b3511;">Распределение сохраненных целей по категориям:</span>
                        <div style="display: flex; gap: 6px;">
                            <button id="hub_btn_del_selected" style="background: #d9534f; color: #fff; border: 1px solid #7d510f; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 10px;">Удалить отмеченные</button>
                            <button id="hub_btn_clear_all_cats" style="background: #a94442; color: #fff; border: 1px solid #7d510f; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 10px;">Очистить всё</button>
                        </div>
                    </div>
                    
                    <div id="hub_categories_grid" style="display: flex; gap: 8px; flex-grow: 1; overflow-x: auto; padding-bottom: 5px;"></div>
                </div>
            `;

            const categories = [
                { key: 'офф', name: 'Офф', color: '#b22222' },
                { key: 'двор', name: 'Двор', color: '#5b3511' },
                { key: 'раскатка', name: 'Раскатка', color: '#5b3511' },
                { key: 'спам', name: 'Спам', color: '#5b3511' },
                { key: 'дефф', name: 'Дефф', color: '#00008b' }
            ];

            function renderCategories() {
                let grid = document.getElementById('hub_categories_grid');
                if (!grid) return;
                grid.innerHTML = '';

                categories.forEach(cat => {
                    let storageKey = `ra_wb_category_${cat.key}`;
                    let items = JSON.parse(localStorage.getItem(storageKey) || '[]');

                    let itemsHtml = '';
                    if (items.length === 0) {
                        itemsHtml = `<div style="color: #777; font-style: italic; padding: 4px; font-size: 10px;">Пусто</div>`;
                    } else {
                        items.forEach((item, index) => {
                            let displayText = typeof item === 'object' && item !== null ? `${item.player || ''} — <b>${item.coords || ''}</b>` : item;
                            itemsHtml += `
                                <div style="display: flex; align-items: center; gap: 4px; padding: 2px 0; border-bottom: 1px dotted #e3d0b1;">
                                    <input type="checkbox" class="hub-cat-item-chk" data-cat="${cat.key}" data-index="${index}" style="cursor: pointer;">
                                    <span style="font-size: 10px; color: #333;">${displayText}</span>
                                </div>
                            `;
                        });
                    }

                    let colHtml = `
                        <div style="flex: 1; min-width: 175px; background: #fff; border: 1px solid #c5a059; border-radius: 3px; display: flex; flex-direction: column; overflow: hidden;">
                            <div style="background: #e2c08e; padding: 5px 8px; border-bottom: 1px solid #c5a059; display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: bold; color: ${cat.color}; font-size: 11px;">${cat.name}</span>
                                <span class="hub-clear-cat" data-cat="${cat.key}" style="cursor: pointer; color: #b22222; font-weight: bold; font-size: 12px;" title="Очистить категорию">×</span>
                            </div>
                            <div style="padding: 6px; overflow-y: auto; max-height: 420px; flex-grow: 1;">
                                ${itemsHtml}
                            </div>
                        </div>
                    `;
                    grid.insertAdjacentHTML('beforeend', colHtml);
                });
            }

            renderCategories();

            document.getElementById('hub_btn_del_selected').onclick = function() {
                categories.forEach(cat => {
                    let storageKey = `ra_wb_category_${cat.key}`;
                    let items = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    let indicesToRemove = [];

                    document.querySelectorAll(`.hub-cat-item-chk[data-cat="${cat.key}"]:checked`).forEach(chk => {
                        indicesToRemove.push(parseInt(chk.getAttribute('data-index')));
                    });

                    if (indicesToRemove.length > 0) {
                        let filtered = items.filter((_, idx) => !indicesToRemove.includes(idx));
                        localStorage.setItem(storageKey, JSON.stringify(filtered));
                    }
                });
                renderCategories();
            };

            document.getElementById('hub_btn_clear_all_cats').onclick = function() {
                if (confirm('Точно очистить все сохраненные категории?')) {
                    categories.forEach(cat => localStorage.removeItem(`ra_wb_category_${cat.key}`));
                    renderCategories();
                }
            };

            container.querySelectorAll('.hub-clear-cat').forEach(btn => {
                btn.onclick = function() {
                    let catKey = this.getAttribute('data-cat');
                    localStorage.removeItem(`ra_wb_category_${catKey}`);
                    renderCategories();
                };
            });

        } else if (tabId === '3') {
            container.innerHTML = `
                <style>
                    .map-collector-layout { display: flex; gap: 10px; height: 100%; overflow: hidden; box-sizing: border-box; }
                    .map-sidebar { width: 310px; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; overflow-y: auto; padding-right: 4px; }
                    .map-viewer-box { flex-grow: 1; border: 1px solid #c5a059; background: #faf4e8; border-radius: 3px; display: flex; flex-direction: column; overflow: hidden; position: relative; }
                    .map-canvas-container { flex-grow: 1; overflow: auto; position: relative; background: #5e8238; cursor: crosshair; }
                    .map-view-wrapper { position: relative; display: inline-block; min-width: 100%; min-height: 100%; }
                    #map_grid_canvas { display: block; background: #5e8238; }
                    #map_selection_box { position: absolute; border: 2px dashed #ffff00; background: rgba(255, 255, 0, 0.2); pointer-events: none; display: none; z-index: 50; }
                    #map_tooltip { position: absolute; display: none; background: rgba(0, 0, 0, 0.85); color: #fff; padding: 6px 10px; border-radius: 4px; font-size: 11px; z-index: 10000; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.4); line-height: 1.4; white-space: nowrap; }
                    .diplomacy-row { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; background: #faf4e8; padding: 3px; border-radius: 3px; border: 1px solid #e0d0b0; }
                    .diplomacy-row span.d-tag { font-weight: bold; color: #5b3511; width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; }
                    .diplomacy-row select { flex-grow: 1; font-size: 10px; height: 22px; border: 1px solid #c5a059; border-radius: 2px; background: #fff; }
                    .diplomacy-row input[type="color"] { width: 28px; height: 22px; padding: 0; border: none; cursor: pointer; background: none; }
                    #diplomacy_list_container { max-height: 130px; overflow-y: auto; overflow-x: hidden; border: 1px solid #c5a059; background: #fff; padding: 4px; border-radius: 3px; margin-top: 4px; }
                    .player-custom-row { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; background: #fff; padding: 2px 4px; border: 1px solid #e0d0b0; border-radius: 2px; font-size: 10px; }
                    .player-custom-row span { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #333; }
                </style>
                <div style="padding: 10px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column;">
                    <div class="map-collector-layout" style="flex-grow: 1;">
                        <div class="map-sidebar">
                            <div style="background: #f5e8cd; border: 1px solid #c5a059; border-radius: 3px; padding: 8px;">
                                <b style="font-size: 11px; color: #5b3511; display: block; margin-bottom: 5px;">🌍 Загрузка карты мира</b>
                                <button id="map_btn_load_data" style="width: 100%; background: #c5a059; border: 1px solid #7d510f; color: #2b1d0c; font-weight: bold; padding: 5px; cursor: pointer; border-radius: 3px; font-size: 10px;">Загрузить с сервера</button>
                                <div id="map_load_status" style="font-size: 10px; color: #666; margin-top: 4px;">${window._twMapCache.loadStatusText}</div>
                            </div>
                            <div style="background: #f5e8cd; border: 1px solid #c5a059; border-radius: 3px; padding: 8px;">
                                <b style="font-size: 11px; color: #5b3511; display: block; margin-bottom: 5px;">🎨 Дипломатия по игроку</b>
                                <div style="display: flex; gap: 4px; margin-bottom: 5px;">
                                    <input type="text" id="map_custom_player_inp" placeholder="Точный ник игрока" style="flex-grow: 1; font-size: 10px; height: 22px; border: 1px solid #c5a059; padding: 2px 4px; border-radius: 2px;">
                                    <input type="color" id="map_custom_player_color" value="#ff00ff" style="width: 28px; height: 22px; padding: 0; border: none; cursor: pointer; background: none;">
                                    <button id="map_btn_add_player_color" style="background: #c5a059; border: 1px solid #7d510f; font-weight: bold; padding: 2px 6px; cursor: pointer; border-radius: 2px; font-size: 10px;">+</button>
                                </div>
                                <div id="map_custom_players_list" style="max-height: 80px; overflow-y: auto; border: 1px solid #c5a059; background: #fff; padding: 3px; border-radius: 2px; margin-bottom: 5px;"></div>
                                <b style="font-size: 10px; color: #5b3511; display: block; margin-bottom: 2px;">Список племён:</b>
                                <div id="diplomacy_list_container"><div style="font-style: italic; color: #888; font-size: 10px; text-align: center; padding: 10px;">Сначала нажмите «Загрузить с сервера»</div></div>
                                <button id="map_btn_apply_dip" style="width: 100%; margin-top: 5px; background: #c5a059; border: 1px solid #7d510f; color: #2b1d0c; font-weight: bold; padding: 4px; cursor: pointer; border-radius: 3px; font-size: 10px;">Применить раскраску</button>
                            </div>
                            <div style="background: #f5e8cd; border: 1px solid #c5a059; border-radius: 3px; padding: 8px;">
                                <b style="font-size: 11px; color: #5b3511; display: block; margin-bottom: 5px;">📍 Диапазон выделения (X / Y)</b>
                                <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 5px;">
                                    <input type="number" id="map_range_x1" value="${window._twMapCache.rangeX1}" style="width: 50px; font-size: 10px; padding: 2px;">
                                    <input type="number" id="map_range_y1" value="${window._twMapCache.rangeY1}" style="width: 50px; font-size: 10px; padding: 2px;">
                                    <span style="font-size: 10px;">до</span>
                                    <input type="number" id="map_range_x2" value="${window._twMapCache.rangeX2}" style="width: 50px; font-size: 10px; padding: 2px;">
                                    <input type="number" id="map_range_y2" value="${window._twMapCache.rangeY2}" style="width: 50px; font-size: 10px; padding: 2px;">
                                </div>
                                <div style="display: flex; gap: 4px;">
                                    <button id="map_btn_select_range" style="flex: 2; background: #c5a059; border: 1px solid #7d510f; font-weight: bold; padding: 4px; cursor: pointer; border-radius: 3px; font-size: 10px;">Выделить диапазон</button>
                                    <button id="map_btn_reset_range" style="flex: 1; background: #d9534f; color: #fff; border: 1px solid #7d510f; font-weight: bold; padding: 4px; cursor: pointer; border-radius: 3px; font-size: 10px;">Сбросить</button>
                                </div>
                            </div>
                            <div style="background: #f5e8cd; border: 1px solid #c5a059; border-radius: 3px; padding: 8px; display: flex; flex-direction: column; flex-grow: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <span style="font-size: 11px; font-weight: bold; color: #5b3511;" id="map_selected_count_lbl">${window._twMapCache.selectedCountText}</span>
                                    <div style="display: flex; gap: 4px;">
                                        <button id="map_btn_save_to_base" style="background: #5cb85c; color: #fff; border: 1px solid #4cae4c; font-weight: bold; padding: 2px 6px; cursor: pointer; border-radius: 3px; font-size: 10px;" title="Сохранить в Базу координат (Вкладка 4)">В базу 4</button>
                                        <button id="map_btn_copy_coords" style="background: #c5a059; border: 1px solid #7d510f; font-weight: bold; padding: 2px 6px; cursor: pointer; border-radius: 3px; font-size: 10px;">Копировать</button>
                                    </div>
                                </div>
                                <textarea id="map_selected_textarea" style="width: 100%; height: 55px; background: #fff; border: 1px solid #c5a059; font-size: 10px; padding: 3px; box-sizing: border-box; resize: none;" readonly placeholder="Выбранные координаты появятся здесь...">${window._twMapCache.selectedText}</textarea>
                            </div>
                        </div>
                        <div class="map-viewer-box">
                            <div style="background: #e2c08e; padding: 5px 8px; border-bottom: 1px solid #c5a059; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                                <span style="font-weight: bold; font-size: 11px;" id="map_coords_status_bar">Карта (Колесико — зум, ЛКМ для выделения)</span>
                                <div style="display: flex; gap: 6px; align-items: center;">
                                    <button id="map_btn_reset_zoom" style="background: #c5a059; border: 1px solid #7d510f; cursor: pointer; font-weight: bold; padding: 1px 6px; border-radius: 2px; font-size: 10px;">Сбросить зум</button>
                                    <span id="map_zoom_lbl" style="font-size: 10px; width: 35px; text-align: center;">${window._twMapCache.tileSize}px</span>
                                </div>
                            </div>
                            <div class="map-canvas-container" id="map_canvas_scroll_area">
                                <div class="map-view-wrapper" id="map_view_wrapper">
                                    <canvas id="map_grid_canvas"></canvas>
                                    <div id="map_selection_box"></div>
                                </div>
                            </div>
                            <div id="map_tooltip"></div>
                        </div>
                    </div>
                </div>
            `;

            let cache = window._twMapCache;
            let customPlayerColors = JSON.parse(localStorage.getItem('tw_hub_custom_players') || '{}');
            const canvas = document.getElementById('map_grid_canvas');
            const ctx = canvas.getContext('2d');
            const scrollArea = document.getElementById('map_canvas_scroll_area');
            const selectionBox = document.getElementById('map_selection_box');
            const tooltip = document.getElementById('map_tooltip');

            function initCanvasSize() {
                canvas.width = 1000 * cache.tileSize;
                canvas.height = 1000 * cache.tileSize;
                redrawMap();
            }
            initCanvasSize();
            scrollArea.scrollLeft = cache.scrollLeft;
            scrollArea.scrollTop = cache.scrollTop;
            scrollArea.onscroll = () => { cache.scrollLeft = scrollArea.scrollLeft; cache.scrollTop = scrollArea.scrollTop; };

            function getVillageColor(v) {
                if (v.playerName) {
                    let pLower = v.playerName.toLowerCase();
                    for (let pName in customPlayerColors) {
                        if (pLower === pName.toLowerCase()) return customPlayerColors[pName];
                    }
                }
                if (v.tribeTag && cache.tribeColors[v.tribeTag]) return cache.tribeColors[v.tribeTag];
                return '#888888';
            }

            function redrawMap() {
                ctx.fillStyle = '#5e8238';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.lineWidth = cache.tileSize > 4 ? 2 : 1;
                ctx.font = `${Math.max(10, cache.tileSize * 2.5)}px Verdana`;

                for (let i = 0; i <= 1000; i += 100) {
                    let pos = i * cache.tileSize;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
                    ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, canvas.height); ctx.moveTo(0, pos); ctx.lineTo(canvas.width, pos); ctx.stroke();
                    if (i === 500) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, canvas.height); ctx.moveTo(0, pos); ctx.lineTo(canvas.width, pos); ctx.stroke();
                        ctx.lineWidth = cache.tileSize > 4 ? 2 : 1;
                    }
                }
                for (let cx = 0; cx < 10; cx++) {
                    for (let cy = 0; cy < 10; cy++) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText(`K${cy * 10 + cx}`, (cx * 100 + 50) * cache.tileSize, (cy * 100 + 50) * cache.tileSize);
                    }
                }
                if (!cache.mapDataLoaded || cache.villagesData.length === 0) {
                    ctx.fillStyle = '#fff'; ctx.font = '14px Verdana'; ctx.textAlign = 'left';
                    ctx.fillText('Нажмите «Загрузить с сервера» слева', 20, 40);
                    return;
                }
                cache.villagesData.forEach(v => {
                    ctx.fillStyle = getVillageColor(v);
                    if (cache.tileSize <= 2) ctx.fillRect(v.x * cache.tileSize, v.y * cache.tileSize, Math.max(1, cache.tileSize), Math.max(1, cache.tileSize));
                    else ctx.fillRect(v.x * cache.tileSize, v.y * cache.tileSize, cache.tileSize - 0.5, cache.tileSize - 0.5);
                });
            }

            function renderCustomPlayersList() {
                let listContainer = document.getElementById('map_custom_players_list');
                if (!listContainer) return;
                listContainer.innerHTML = '';
                let keys = Object.keys(customPlayerColors);
                if (keys.length === 0) {
                    listContainer.innerHTML = `<div style="font-style: italic; color: #888; font-size: 9px; text-align: center; padding: 4px;">Нет игроков</div>`;
                    return;
                }
                keys.forEach(pName => {
                    let row = document.createElement('div');
                    row.className = 'player-custom-row';
                    row.innerHTML = `
                        <div style="width: 10px; height: 10px; background: ${customPlayerColors[pName]}; border-radius: 50%; border: 1px solid #333; flex-shrink: 0;"></div>
                        <span title="${pName}">${pName}</span>
                        <span class="del-custom-player" data-name="${pName}" style="cursor: pointer; color: #b22222; font-weight: bold; font-size: 13px; padding: 0 3px;">×</span>
                    `;
                    listContainer.appendChild(row);
                });
                listContainer.querySelectorAll('.del-custom-player').forEach(btn => {
                    btn.onclick = function() {
                        delete customPlayerColors[this.getAttribute('data-name')];
                        localStorage.setItem('tw_hub_custom_players', JSON.stringify(customPlayerColors));
                        renderCustomPlayersList(); redrawMap();
                    };
                });
            }
            renderCustomPlayersList();

            document.getElementById('map_btn_add_player_color').onclick = function() {
                let inp = document.getElementById('map_custom_player_inp');
                let name = inp.value.trim();
                if (!name) return;
                customPlayerColors[name] = document.getElementById('map_custom_player_color').value;
                localStorage.setItem('tw_hub_custom_players', JSON.stringify(customPlayerColors));
                inp.value = ''; renderCustomPlayersList(); redrawMap();
            };

            function renderTribesList() {
                let container = document.getElementById('diplomacy_list_container');
                if (!container) return;
                container.innerHTML = '';
                Object.values(cache.tribesData).filter(t => t.tag).sort((a, b) => a.tag.localeCompare(b.tag)).forEach(t => {
                    let row = document.createElement('div');
                    row.className = 'diplomacy-row';
                    let currentColor = cache.tribeColors[t.tag] || '#888888';
                    row.innerHTML = `
                        <span class="d-tag" title="${t.name} [${t.tag}]">[${t.tag}] ${t.name}</span>
                        <select class="tribe-status-sel" data-tag="${t.tag}">
                            <option value="default" ${!cache.tribeColors[t.tag] || cache.tribeColors[t.tag] === '#888888' ? 'selected' : ''}>Обычный</option>
                            <option value="ally" ${cache.tribeColors[t.tag] === '#0000ff' ? 'selected' : ''}>Союзник</option>
                            <option value="enemy" ${cache.tribeColors[t.tag] === '#ff0000' ? 'selected' : ''}>Враг</option>
                            <option value="custom" ${cache.tribeColors[t.tag] && cache.tribeColors[t.tag] !== '#888888' && cache.tribeColors[t.tag] !== '#0000ff' && cache.tribeColors[t.tag] !== '#ff0000' ? 'selected' : ''}>Свой цвет</option>
                        </select>
                        <input type="color" class="tribe-color-inp" data-tag="${t.tag}" value="${currentColor}">
                    `;
                    container.appendChild(row);
                });
                container.querySelectorAll('.tribe-status-sel').forEach(sel => {
                    sel.onchange = function() {
                        let tag = this.getAttribute('data-tag');
                        let colorInp = container.querySelector(`.tribe-color-inp[data-tag="${tag}"]`);
                        if (this.value === 'default') { colorInp.value = '#888888'; delete cache.tribeColors[tag]; }
                        else if (this.value === 'ally') { colorInp.value = '#0000ff'; cache.tribeColors[tag] = '#0000ff'; }
                        else if (this.value === 'enemy') { colorInp.value = '#ff0000'; cache.tribeColors[tag] = '#ff0000'; }
                        redrawMap();
                    };
                });
                container.querySelectorAll('.tribe-color-inp').forEach(inp => {
                    inp.oninput = function() {
                        let tag = this.getAttribute('data-tag');
                        cache.tribeColors[tag] = this.value;
                        let sel = container.querySelector(`.tribe-status-sel[data-tag="${tag}"]`);
                        if (sel) sel.value = 'custom';
                        redrawMap();
                    };
                });
            }
            if (cache.mapDataLoaded) { renderTribesList(); redrawMap(); }

            document.getElementById('map_btn_load_data').onclick = function() {
                let status = document.getElementById('map_load_status');
                status.textContent = 'Загрузка...';
                Promise.all([$.get('map/village.txt'), $.get('map/player.txt'), $.get('map/ally.txt')]).then(([vTxt, pTxt, aTxt]) => {
                    cache.tribesData = {};
                    aTxt.trim().split('\n').forEach(line => {
                        let p = line.split(',');
                        if (p.length >= 3) cache.tribesData[p[0]] = { id: p[0], name: decodeURIComponent(p[1].replace(/\+/g, ' ')), tag: decodeURIComponent(p[2].replace(/\+/g, ' ')) };
                    });
                    cache.playersData = {};
                    pTxt.trim().split('\n').forEach(line => {
                        let p = line.split(',');
                        if (p.length >= 4) cache.playersData[p[0]] = { name: decodeURIComponent(p[1].replace(/\+/g, ' ')), allyId: p[2] };
                    });
                    cache.villagesData = vTxt.trim().split('\n').map(line => {
                        let p = line.split(',');
                        if (p.length < 6) return null;
                        let pInfo = cache.playersData[p[4]] || { name: 'Нейтральный', allyId: '0' };
                        let tObj = cache.tribesData[pInfo.allyId];
                        return { id: p[0], name: decodeURIComponent(p[1].replace(/\+/g, ' ')), x: parseInt(p[2]), y: parseInt(p[3]), playerId: p[4], playerName: pInfo.name, tribeTag: tObj ? tObj.tag : '', points: parseInt(p[5]) };
                    }).filter(v => v !== null);
                    cache.mapDataLoaded = true;
                    status.textContent = `Загружено деревень: ${cache.villagesData.length}`;
                    cache.loadStatusText = status.textContent;
                    renderTribesList(); redrawMap();
                });
            };

            scrollArea.onwheel = function(e) {
                e.preventDefault();
                let oldSize = cache.tileSize;
                if (e.deltaY < 0) { if (cache.tileSize < 14) cache.tileSize += 2; }
                else { if (cache.tileSize > 2) cache.tileSize -= 2; }
                if (oldSize !== cache.tileSize) {
                    document.getElementById('map_zoom_lbl').textContent = cache.tileSize + 'px';
                    let rect = scrollArea.getBoundingClientRect();
                    let cX = e.clientX - rect.left + scrollArea.scrollLeft, cY = e.clientY - rect.top + scrollArea.scrollTop;
                    let ratio = cache.tileSize / oldSize;
                    initCanvasSize();
                    scrollArea.scrollLeft = cX * ratio - (e.clientX - rect.left);
                    scrollArea.scrollTop = cY * ratio - (e.clientY - rect.top);
                    cache.scrollLeft = scrollArea.scrollLeft; cache.scrollTop = scrollArea.scrollTop;
                }
            };

            document.getElementById('map_btn_reset_zoom').onclick = () => { cache.tileSize = 4; document.getElementById('map_zoom_lbl').textContent = '4px'; initCanvasSize(); };
            document.getElementById('map_btn_apply_dip').onclick = redrawMap;

            document.getElementById('map_btn_select_range').onclick = function() {
                if (!cache.mapDataLoaded) { alert('Сначала загрузите карту!'); return; }
                cache.rangeX1 = parseInt(document.getElementById('map_range_x1').value) || 0;
                cache.rangeY1 = parseInt(document.getElementById('map_range_y1').value) || 0;
                cache.rangeX2 = parseInt(document.getElementById('map_range_x2').value) || 1000;
                cache.rangeY2 = parseInt(document.getElementById('map_range_y2').value) || 1000;
                cache.currentFilteredVillages = cache.villagesData.filter(v => v.x >= cache.rangeX1 && v.x <= cache.rangeX2 && v.y >= cache.rangeY1 && v.y <= cache.rangeY2);
                cache.selectedText = cache.currentFilteredVillages.map(v => `${v.x}|${v.y} ${v.playerName} [${v.tribeTag}]`).join('\n');
                cache.selectedCountText = `Выбрано: ${cache.currentFilteredVillages.length}`;
                document.getElementById('map_selected_textarea').value = cache.selectedText;
                document.getElementById('map_selected_count_lbl').textContent = cache.selectedCountText;
            };

            document.getElementById('map_btn_reset_range').onclick = () => {
                cache.currentFilteredVillages = []; cache.selectedText = ''; cache.selectedCountText = 'Выбрано: 0';
                document.getElementById('map_selected_textarea').value = '';
                document.getElementById('map_selected_count_lbl').textContent = 'Выбрано: 0';
            };

            document.getElementById('map_btn_copy_coords').onclick = () => {
                let text = document.getElementById('map_selected_textarea').value;
                if (text) { navigator.clipboard.writeText(text); alert('Скопировано!'); }
            };

            document.getElementById('map_btn_save_to_base').onclick = function() {
                if (cache.currentFilteredVillages.length === 0) { alert('Нет выбранных деревень!'); return; }
                let saved = JSON.parse(localStorage.getItem('tw_hub_coord_db_v3') || '[]');
                let added = 0;
                cache.currentFilteredVillages.forEach(v => {
                    let coordStr = `${v.x}|${v.y}`;
                    if (!saved.some(i => i.coord === coordStr)) {
                        saved.push({
                            name: v.name,
                            coord: coordStr,
                            player: v.playerName,
                            tribe: v.tribeTag ? `[${v.tribeTag}]` : '',
                            points: v.points.toLocaleString()
                        });
                        added++;
                    }
                });
                localStorage.setItem('tw_hub_coord_db_v3', JSON.stringify(saved));
                alert(`Добавлено в Базу координат (Вкладка 4): ${added}`);
            };

            let isDragging = false, startX = 0, startY = 0;
            canvas.onmousedown = function(e) {
                if (e.button !== 0 || !cache.mapDataLoaded) return;
                isDragging = true;
                let rect = canvas.getBoundingClientRect();
                startX = e.clientX - rect.left; startY = e.clientY - rect.top;
                selectionBox.style.left = startX + 'px'; selectionBox.style.top = startY + 'px';
                selectionBox.style.width = '0px'; selectionBox.style.height = '0px';
                selectionBox.style.display = 'block';
            };
            canvas.onmousemove = function(e) {
                let rect = canvas.getBoundingClientRect();
                let cX = e.clientX - rect.left, cY = e.clientY - rect.top;
                let xCoord = Math.floor(cX / cache.tileSize), yCoord = Math.floor(cY / cache.tileSize);
                document.getElementById('map_coords_status_bar').textContent = `Координаты: X(${xCoord}) Y(${yCoord}) | Зум: ${cache.tileSize}px`;
                let found = cache.villagesData.find(v => v.x === xCoord && v.y === yCoord);
                if (found) {
                    tooltip.style.display = 'block';
                    tooltip.style.left = (e.pageX - panel.getBoundingClientRect().left + 15) + 'px';
                    tooltip.style.top = (e.pageY - panel.getBoundingClientRect().top + 15) + 'px';
                    tooltip.innerHTML = `<b>${found.name}</b> (${found.x}|${found.y})<br>Игрок: ${found.playerName} [${found.tribeTag}]`;
                } else { tooltip.style.display = 'none'; }
                if (!isDragging) return;
                selectionBox.style.left = Math.min(startX, cX) + 'px';
                selectionBox.style.top = Math.min(startY, cY) + 'px';
                selectionBox.style.width = Math.abs(cX - startX) + 'px';
                selectionBox.style.height = Math.abs(cY - startY) + 'px';
            };
            window.onmouseup = function(e) {
                if (!isDragging) return;
                isDragging = false;
                selectionBox.style.display = 'none';
                let rect = canvas.getBoundingClientRect();
                let x1 = Math.floor(Math.min(startX, (e.clientX - rect.left)) / cache.tileSize);
                let x2 = Math.floor(Math.max(startX, (e.clientX - rect.left)) / cache.tileSize);
                let y1 = Math.floor(Math.min(startY, (e.clientY - rect.top)) / cache.tileSize);
                let y2 = Math.floor(Math.max(startY, (e.clientY - rect.top)) / cache.tileSize);
                if (Math.abs(x2 - x1) < 1 && Math.abs(y2 - y1) < 1) return;
                cache.currentFilteredVillages = cache.villagesData.filter(v => v.x >= x1 && v.x <= x2 && v.y >= y1 && v.y <= y2);
                if (cache.currentFilteredVillages.length === 0) return;
                cache.selectedText = cache.currentFilteredVillages.map(v => `${v.x}|${v.y} ${v.playerName} [${v.tribeTag}]`).join('\n');
                cache.selectedCountText = `Выбрано: ${cache.currentFilteredVillages.length}`;
                document.getElementById('map_selected_textarea').value = cache.selectedText;
                document.getElementById('map_selected_count_lbl').textContent = cache.selectedCountText;
            };

        } else if (tabId === '4') {
            container.innerHTML = `
                <div style="padding: 10px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; background: #fff8eb;">
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; background: #f5e8cd; padding: 6px; border: 1px solid #c5a059; border-radius: 3px; flex-wrap: wrap;">
                        <span id="hub_db_counter" style="font-weight: bold; font-size: 11px; color: #5b3511;">Показано: 0 из 0</span>
                        <button id="hub_db_btn_copy" style="margin-left: auto; background: #c5a059; border: 1px solid #7d510f; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 11px; color: #2b1d0c;">Копировать</button>
                        <button id="hub_db_btn_clear" style="background: #d9534f; border: 1px solid #7d510f; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 11px; color: #fff;">Очистить</button>
                    </div>

                    <div style="flex-grow: 1; border: 1px solid #c5a059; background: #fff; overflow: auto; border-radius: 3px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px; white-space: nowrap; color: #333;">
                            <thead>
                                <tr style="background: #e2c08e; border-bottom: 2px solid #c5a059; text-align: left; color: #5b3511; font-weight: bold;">
                                    <th style="padding: 5px; width: 25px; text-align: center;"><input type="checkbox" id="hub_db_chk_all"></th>
                                    <th style="padding: 5px;">Деревня</th>
                                    <th style="padding: 5px; text-align: center;">Коры</th>
                                    <th style="padding: 5px;">Игрок</th>
                                    <th style="padding: 5px;">Племя</th>
                                    <th style="padding: 5px; text-align: right;">Очки</th>
                                    <th style="padding: 5px; text-align: center; width: 40px;">Действие</th>
                                </tr>
                            </thead>
                            <tbody id="hub_db_tbody"></tbody>
                        </table>
                    </div>
                </div>
            `;

            function renderDBTable() {
                let tbody = document.getElementById('hub_db_tbody');
                if (!tbody) return;
                tbody.innerHTML = '';
                let db = JSON.parse(localStorage.getItem('tw_hub_coord_db_v3') || '[]');
                if (db.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888; font-style: italic; padding: 20px;">База пуста. Выделите область на вкладке 3 и нажмите «В базу 4».</td></tr>`;
                    document.getElementById('hub_db_counter').textContent = `Показано: 0 из 0`;
                    return;
                }
                db.forEach((item, idx) => {
                    let tr = document.createElement('tr');
                    tr.style.cssText = idx % 2 === 0 ? 'background: #fff; border-bottom: 1px solid #eee;' : 'background: #fcf8f2; border-bottom: 1px solid #eee;';
                    tr.innerHTML = `
                        <td style="text-align: center; padding: 4px;"><input type="checkbox" class="hub-db-item" data-index="${idx}"></td>
                        <td style="padding: 4px;">${item.name}</td>
                        <td style="padding: 4px; text-align: center; font-weight: bold;">${item.coord}</td>
                        <td style="padding: 4px;">${item.player}</td>
                        <td style="padding: 4px;">${item.tribe}</td>
                        <td style="padding: 4px; text-align: right;">${item.points}</td>
                        <td style="padding: 4px; text-align: center;"><button class="hub-db-del-row" data-index="${idx}" style="background: #d9534f; color: #fff; border: none; border-radius: 2px; width: 18px; height: 18px; cursor: pointer; font-weight: bold; font-size: 10px;" title="Удалить">×</button></td>
                    `;
                    tbody.appendChild(tr);
                });
                document.getElementById('hub_db_counter').textContent = `Показано: ${db.length} из ${db.length}`;
                tbody.querySelectorAll('.hub-db-del-row').forEach(btn => {
                    btn.onclick = function() {
                        let i = parseInt(this.getAttribute('data-index'));
                        db.splice(i, 1);
                        localStorage.setItem('tw_hub_coord_db_v3', JSON.stringify(db));
                        renderDBTable();
                    };
                });
            }
            renderDBTable();

            document.getElementById('hub_db_btn_clear').onclick = function() {
                if (confirm('Очистить базу координат?')) {
                    localStorage.removeItem('tw_hub_coord_db_v3');
                    renderDBTable();
                }
            };

        } else if (tabId === '5') {
            container.innerHTML = `
                <div style="padding: 10px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; background: #fff8eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 2px solid #c5a059; padding-bottom: 5px;">
                        <span style="font-weight: bold; font-size: 12px; color: #5b3511;">Распределение и планирование целей по категориям атаки</span>
                        <div style="display: flex; gap: 6px;">
                            <button id="hub_targets_save" style="background: #f0ad4e; border: 1px solid #eea236; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 10px; color: #fff;">Сохранить целей</button>
                            <button id="hub_targets_clear_all" style="background: #d9534f; border: 1px solid #7d510f; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 10px; color: #fff;">Очистить всё</button>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex-grow: 1;">
                        ${['офф', 'двор', 'раскатка', 'спам'].map((cat, idx) => `
                            <div style="background: #fff; border: 1px solid #c5a059; border-radius: 3px; display: flex; flex-direction: column; overflow: hidden;">
                                <div style="background: #e2c08e; padding: 5px 8px; border-bottom: 1px solid #c5a059; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: bold; font-size: 11px; color: #5b3511;">${idx + 1}) Цели: ${cat}</span>
                                    <button class="hub-t-copy-btn" data-cat="${cat}" style="background: #c5a059; border: 1px solid #7d510f; font-weight: bold; padding: 1px 6px; cursor: pointer; border-radius: 2px; font-size: 9px; color: #2b1d0c;">Копировать</button>
                                </div>
                                <textarea id="hub_t_textarea_${cat}" style="flex-grow: 1; border: none; padding: 6px; font-size: 11px; resize: none; background: #fff; color: #333;" placeholder="Вставьте координаты..."></textarea>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            ['офф', 'двор', 'раскатка', 'спам'].forEach(cat => {
                let ta = document.getElementById(`hub_t_textarea_${cat}`);
                if (ta) {
                    ta.value = localStorage.getItem(`ra_wb_category_${cat}`) || '';
                    ta.oninput = () => {
                        localStorage.setItem(`ra_wb_category_${cat}`, ta.value);
                    };
                }
            });

            document.getElementById('hub_targets_save').onclick = () => {
                ['офф', 'двор', 'раскатка', 'спам'].forEach(cat => {
                    let ta = document.getElementById(`hub_t_textarea_${cat}`);
                    if (ta) {
                        localStorage.setItem(`ra_wb_category_${cat}`, ta.value);
                    }
                });
                alert('Цели успешно сохранены и переданы во вкладку 2!');
            };

            document.getElementById('hub_targets_clear_all').onclick = function() {
                if (confirm('Очистить все блоки целей?')) {
                    ['офф', 'двор', 'раскатка', 'спам'].forEach(cat => {
                        localStorage.removeItem(`ra_wb_category_${cat}`);
                        let ta = document.getElementById(`hub_t_textarea_${cat}`);
                        if (ta) ta.value = '';
                    });
                }
            };

            document.querySelectorAll('.hub-t-copy-btn').forEach(btn => {
                btn.onclick = function() {
                    let cat = this.getAttribute('data-cat');
                    let ta = document.getElementById(`hub_t_textarea_${cat}`);
                    if (ta && ta.value) {
                        navigator.clipboard.writeText(ta.value);
                        alert('Скопировано в буфер обмена!');
                    }
                };
            });

        } else if (tabId === '6') {
            container.innerHTML = `<div style="padding: 15px;"><h3 style="margin-top:0;">⚡ Загрузка Мультипланера...</h3></div>`;
            let observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.id !== 'tw-custom-hub-panel') {
                            let style = window.getComputedStyle(node);
                            if (style.position === 'fixed' || style.position === 'absolute') {
                                node.style.cssText = 'position:relative; top:0; left:0; transform:none; margin:0; width:100%; height:100%; box-sizing:border-box;';
                                container.innerHTML = '';
                                container.appendChild(node);
                                observer.disconnect();
                            }
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: false });

            fetch('https://raw.githubusercontent.com/jura75/tw-custom-hub-panel/refs/heads/main/tw-snipe-planner.js?_=' + Date.now())
                .then(r => r.text()).then(code => {
                    let s = document.createElement('script');
                    s.textContent = code;
                    document.body.appendChild(s);
                    s.remove();
                }).catch(err => { observer.disconnect(); container.innerHTML = `<div style="padding:15px; color:red;">Ошибка загрузки</div>`; });
        }
    }

    panel.querySelectorAll('.tw-hub-tab-btn').forEach(btn => {
        btn.onclick = function() {
            panel.querySelectorAll('.tw-hub-tab-btn').forEach(b => {
                b.style.background = '#3b2812';
                b.style.color = '#f4e4bc';
                b.classList.remove('active');
            });
            this.style.background = '#5a3b0c';
            this.style.color = '#fff';
            this.classList.add('active');
            loadTabContent(this.getAttribute('data-tab'));
        };
    });

    loadTabContent('1');
})();
void(0);
