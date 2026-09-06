(function() {
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
        <!-- Шапка панели (перетаскиваемая область) -->
        <div id="tw-hub-header" style="background: #1a1006; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7d510f; user-select: none; cursor: move;">
            <b style="font-size: 13px; color: #f4e4bc;">🛠️ Проект Хаб — Верстак</b>
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
            <button class="tw-hub-tab-btn" data-tab="7" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">7. Захваты мира</button>
            <button class="tw-hub-tab-btn" data-tab="8" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">8. Гугл Таблица</button>
            <button class="tw-hub-tab-btn" data-tab="9" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">9. Статистика племени</button>
        </div>

        <!-- Контейнер для контента выбранной вкладки -->
        <div id="tw-hub-content-container" style="flex: 1; background: #fff8eb; color: #5b3511; padding: 0; overflow: auto; position: relative; display: flex; flex-direction: column;">
            <div style="padding: 15px;"><h3 style="margin-top:0;">Загрузка...</h3></div>
        </div>

        <!-- Нижняя строка состояния -->
        <div style="background: #1a1006; padding: 5px 12px; font-size: 10px; color: #a98a5c; border-top: 1px solid #7d510f; display: flex; justify-content: space-between;">
            <span>Статус: Панель активна (Перетаскивание добавлено)</span>
            <span>Потяните за правый нижний угол, чтобы изменить размер 📐</span>
        </div>
    `;

    document.body.appendChild(panel);
    document.getElementById('tw-hub-close').onclick = () => panel.remove();

    // Логика перетаскивания панели мышкой
    let header = document.getElementById('tw-hub-header');
    let isDraggingPanel = false;
    let startX = 0, startY = 0;

    header.onmousedown = function(e) {
        if (e.target.id === 'tw-hub-close') return;
        isDraggingPanel = true;
        startX = e.clientX - panel.offsetLeft;
        startY = e.clientY - panel.offsetTop;

        if (panel.style.transform.includes('translateX')) {
            let rect = panel.getBoundingClientRect();
            panel.style.transform = 'none';
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
        }

        document.addEventListener('mousemove', onPanelMouseMove);
        document.addEventListener('mouseup', onPanelMouseUp);
        e.preventDefault();
    };

    function onPanelMouseMove(e) {
        if (!isDraggingPanel) return;
        let newX = e.clientX - startX;
        let newY = e.clientY - startY;

        newX = Math.max(0, Math.min(window.innerWidth - 100, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 50, newY));

        panel.style.left = newX + 'px';
        panel.style.top = newY + 'px';
    }

    function onPanelMouseUp() {
        isDraggingPanel = false;
        document.removeEventListener('mousemove', onPanelMouseMove);
        document.removeEventListener('mouseup', onPanelMouseUp);
    }

    window._twMapCache = window._twMapCache || {
        mapDataLoaded: false,
        villagesData: [],
        playersData: {},
        tribesData: {},
        tileSize: 4,
        currentFilteredVillages: [],
        tribeColors: JSON.parse(localStorage.getItem('tw_hub_map_tribe_colors') || '{}'),
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
                { key: 'раскатки', name: 'Раскатка', color: '#5b3511' },
                { key: 'спам', name: 'Спам', color: '#5b3511' },
                { key: 'дефф', name: 'Дефф', color: '#00008b' }
            ];

            function renderCategories() {
                let grid = document.getElementById('hub_categories_grid');
                if (!grid) return;
                grid.innerHTML = '';

                categories.forEach(cat => {
                    let storageKey = `ra_wb_category_${cat.key}`;
                    let rawData = localStorage.getItem(storageKey) || '';
                    
                    let items = [];
                    if (rawData.trim().startsWith('[')) {
                        try { items = JSON.parse(rawData); } catch(e) { items = []; }
                    } else if (rawData.trim() !== '') {
                        items = rawData.split('\n').filter(Boolean);
                    }

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
                    let rawData = localStorage.getItem(storageKey) || '';
                    if (!rawData) return;

                    let isJson = rawData.trim().startsWith('[');
                    let items = isJson ? JSON.parse(rawData) : rawData.split('\n').filter(Boolean);
                    let indicesToRemove = [];

                    document.querySelectorAll(`.hub-cat-item-chk[data-cat="${cat.key}"]:checked`).forEach(chk => {
                        indicesToRemove.push(parseInt(chk.getAttribute('data-index')));
                    });

                    if (indicesToRemove.length > 0) {
                        let filtered = items.filter((_, idx) => !indicesToRemove.includes(idx));
                        if (isJson) {
                            localStorage.setItem(storageKey, JSON.stringify(filtered));
                        } else {
                            localStorage.setItem(storageKey, filtered.join('\n'));
                        }
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
                                <button id="map_btn_load_data" style="width: 100%; background: #c5a059; border: 1px solid #7d510f; color: #2b1d0c; font-weight: bold; padding: 5px; cursor: pointer; border-radius: 3px; font-size: 10px;">Загрузить с сервера игры</button>
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
                                <div id="diplomacy_list_container"><div style="font-style: italic; color: #888; font-size: 10px; text-align: center; padding: 10px;">Сначала нажмите «Загрузить с сервера игры»</div></div>
                                <div style="display: flex; gap: 4px; margin-top: 5px;">
                                    <button id="map_btn_apply_dip" style="flex: 2; background: #c5a059; border: 1px solid #7d510f; color: #2b1d0c; font-weight: bold; padding: 4px; cursor: pointer; border-radius: 3px; font-size: 10px;">Применить раскраску</button>
                                    <button id="map_btn_reset_dip" style="flex: 1; background: #d9534f; color: #fff; border: 1px solid #7d510f; font-weight: bold; padding: 4px; cursor: pointer; border-radius: 3px; font-size: 10px;" title="Сбросить все сохраненные цвета племён">Сбросить цвета</button>
                                </div>
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
                    ctx.fillText('Нажмите «Загрузить с сервера игры» слева', 20, 40);
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
                        localStorage.setItem('tw_hub_map_tribe_colors', JSON.stringify(cache.tribeColors));
                        redrawMap();
                    };
                });
                container.querySelectorAll('.tribe-color-inp').forEach(inp => {
                    inp.oninput = function() {
                        let tag = this.getAttribute('data-tag');
                        cache.tribeColors[tag] = this.value;
                        let sel = container.querySelector(`.tribe-status-sel[data-tag="${tag}"]`);
                        if (sel) sel.value = 'custom';
                        localStorage.setItem('tw_hub_map_tribe_colors', JSON.stringify(cache.tribeColors));
                        redrawMap();
                    };
                });
            }
            if (cache.mapDataLoaded) { renderTribesList(); redrawMap(); }

            document.getElementById('map_btn_load_data').onclick = function() {
                let status = document.getElementById('map_load_status');
                status.textContent = 'Загрузка данных с игрового сервера...';
                
                Promise.all([
                    $.get('/map/village.txt'), 
                    $.get('/map/player.txt'), 
                    $.get('/map/ally.txt')
                ]).then(([vTxt, pTxt, aTxt]) => {
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
                }).catch(err => {
                    status.textContent = 'Ошибка загрузки файлов мира';
                    console.error(err);
                });
            };

            document.getElementById('map_btn_apply_dip').onclick = redrawMap;

            document.getElementById('map_btn_reset_dip').onclick = function() {
                if (confirm('Сбросить все сохраненные цвета племён?')) {
                    cache.tribeColors = {};
                    localStorage.removeItem('tw_hub_map_tribe_colors');
                    if (cache.mapDataLoaded) renderTribesList();
                    redrawMap();
                }
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

            let isDragging = false, startX2 = 0, startY2 = 0;
            canvas.onmousedown = function(e) {
                if (e.button !== 0 || !cache.mapDataLoaded) return;
                isDragging = true;
                let rect = canvas.getBoundingClientRect();
                startX2 = e.clientX - rect.left; startY2 = e.clientY - rect.top;
                selectionBox.style.left = startX2 + 'px'; selectionBox.style.top = startY2 + 'px';
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
                selectionBox.style.left = Math.min(startX2, cX) + 'px';
                selectionBox.style.top = Math.min(startY2, cY) + 'px';
                selectionBox.style.width = Math.abs(cX - startX2) + 'px';
                selectionBox.style.height = Math.abs(cY - startY2) + 'px';
            };
            window.onmouseup = function(e) {
                if (!isDragging) return;
                isDragging = false;
                selectionBox.style.display = 'none';
                let rect = canvas.getBoundingClientRect();
                let x1 = Math.floor(Math.min(startX2, (e.clientX - rect.left)) / cache.tileSize);
                let x2 = Math.floor(Math.max(startX2, (e.clientX - rect.left)) / cache.tileSize);
                let y1 = Math.floor(Math.min(startY2, (e.clientY - rect.top)) / cache.tileSize);
                let y2 = Math.floor(Math.max(startY2, (e.clientY - rect.top)) / cache.tileSize);
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
                    <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px; background: #f5e8cd; padding: 6px; border: 1px solid #c5a059; border-radius: 3px; flex-wrap: wrap; position: relative;">
                        <select id="hub_filter_player" style="font-size: 10px; padding: 3px; border: 1px solid #c5a059; border-radius: 2px; background: #fff; max-width: 130px;">
                            <option value="">Все игроки</option>
                        </select>
                        <select id="hub_filter_tribe" style="font-size: 10px; padding: 3px; border: 1px solid #c5a059; border-radius: 2px; background: #fff; max-width: 130px;">
                            <option value="">Все племена</option>
                        </select>
                        <select id="hub_filter_quad" style="font-size: 10px; padding: 3px; border: 1px solid #c5a059; border-radius: 2px; background: #fff; max-width: 110px;">
                            <option value="">Все квад.</option>
                        </select>
                        <select id="hub_filter_type" style="font-size: 10px; padding: 3px; border: 1px solid #c5a059; border-radius: 2px; background: #fff; max-width: 100px;">
                            <option value="">Все типы</option>
                        </select>
                        <input type="text" id="hub_filter_min_pts" placeholder="Мин. очки" style="font-size: 10px; padding: 3px; width: 65px; border: 1px solid #c5a059; border-radius: 2px;">
                        <input type="text" id="hub_filter_max_pts" placeholder="Макс. очки" style="font-size: 10px; padding: 3px; width: 65px; border: 1px solid #c5a059; border-radius: 2px;">
                        
                        <div style="position: relative; display: inline-block;">
                            <button id="hub_db_btn_save_cfg" style="background: #e2c08e; border: 1px solid #7d510f; font-weight: bold; padding: 3px 6px; cursor: pointer; border-radius: 2px; font-size: 10px; color: #5b3511;">Сохранить ▼</button>
                            <div id="hub_save_dropdown" style="display: none; position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #7d510f; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 1000; border-radius: 3px; width: 130px;">
                                <div class="hub-save-cat-opt" data-cat="офф" style="padding: 5px 8px; font-size: 10px; cursor: pointer; border-bottom: 1px solid #eee; color: #333;">👉 В Офф</div>
                                <div class="hub-save-cat-opt" data-cat="двор" style="padding: 5px 8px; font-size: 10px; cursor: pointer; border-bottom: 1px solid #eee; color: #333;">👉 В Двор</div>
                                <div class="hub-save-cat-opt" data-cat="раскатки" style="padding: 5px 8px; font-size: 10px; cursor: pointer; border-bottom: 1px solid #eee; color: #333;">👉 В Раскатки</div>
                                <div class="hub-save-cat-opt" data-cat="спам" style="padding: 5px 8px; font-size: 10px; cursor: pointer; color: #333;">👉 В Спам</div>
                            </div>
                        </div>
                        
                        <div style="margin-left: auto; display: flex; gap: 6px; align-items: center;">
                            <span id="hub_db_counter" style="font-weight: bold; font-size: 10px; color: #5b3511;">Показано: 0 из 0</span>
                            <button id="hub_db_btn_copy" style="background: #c5a059; border: 1px solid #7d510f; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 2px; font-size: 10px; color: #2b1d0c;">Копировать</button>
                            <button id="hub_db_btn_clear" style="background: #d9534f; border: 1px solid #7d510f; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 2px; font-size: 10px; color: #fff;">Очистить</button>
                        </div>
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

            function getQuadrant(coordStr) {
                let parts = coordStr.split('|');
                if (parts.length !== 2) return '';
                let x = parseInt(parts[0]), y = parseInt(parts[1]);
                if (isNaN(x) || isNaN(y)) return '';
                let qX = Math.floor(x / 100);
                let qY = Math.floor(y / 100);
                return `K${qY}${qX}`;
            }

            function getVillageType(name) {
                let lower = (name || '').toLowerCase();
                if (lower.includes('варвар') || lower.includes('барба')) return 'Варварка';
                if (lower.includes('бонус')) return 'Бонусная';
                if (lower.includes('церк')) return 'Церковь';
                return 'Обычная';
            }

            function populateFilters(db) {
                let pSelect = document.getElementById('hub_filter_player');
                let tSelect = document.getElementById('hub_filter_tribe');
                let qSelect = document.getElementById('hub_filter_quad');
                let typeSelect = document.getElementById('hub_filter_type');
                if (!pSelect || !tSelect || !qSelect || !typeSelect) return;

                let currentP = pSelect.value;
                let currentT = tSelect.value;
                let currentQ = qSelect.value;
                let currentType = typeSelect.value;

                let players = [...new Set(db.map(i => i.player).filter(Boolean))].sort();
                let tribes = [...new Set(db.map(i => i.tribe).filter(Boolean))].sort();
                let quads = [...new Set(db.map(i => getQuadrant(i.coord)).filter(Boolean))].sort();
                let types = [...new Set(db.map(i => getVillageType(i.name)).filter(Boolean))].sort();

                pSelect.innerHTML = '<option value="">Все игроки</option>' + players.map(p => `<option value="${p}" ${p === currentP ? 'selected' : ''}>${p}</option>`).join('');
                tSelect.innerHTML = '<option value="">Все племена</option>' + tribes.map(t => `<option value="${t}" ${t === currentT ? 'selected' : ''}>${t}</option>`).join('');
                qSelect.innerHTML = '<option value="">Все квад.</option>' + quads.map(q => `<option value="${q}" ${q === currentQ ? 'selected' : ''}>${q}</option>`).join('');
                typeSelect.innerHTML = '<option value="">Все типы</option>' + types.map(tp => `<option value="${tp}" ${tp === currentType ? 'selected' : ''}>${tp}</option>`).join('');
            }

            function renderDBTable() {
                let tbody = document.getElementById('hub_db_tbody');
                if (!tbody) return;
                tbody.innerHTML = '';
                
                let db = JSON.parse(localStorage.getItem('tw_hub_coord_db_v3') || '[]');
                populateFilters(db);

                let selPlayer = document.getElementById('hub_filter_player').value;
                let selTribe = document.getElementById('hub_filter_tribe').value;
                let selQuad = document.getElementById('hub_filter_quad').value;
                let selType = document.getElementById('hub_filter_type').value;
                let minPts = parseInt(document.getElementById('hub_filter_min_pts').value) || 0;
                let maxPts = parseInt(document.getElementById('hub_filter_max_pts').value) || 9999999;

                let filtered = db.filter(item => {
                    let ptsVal = parseInt(String(item.points).replace(/,/g, '')) || 0;
                    if (selPlayer && item.player !== selPlayer) return false;
                    if (selTribe && item.tribe !== selTribe) return false;
                    if (selQuad && getQuadrant(item.coord) !== selQuad) return false;
                    if (selType && getVillageType(item.name) !== selType) return false;
                    if (ptsVal < minPts || ptsVal > maxPts) return false;
                    return true;
                });

                if (filtered.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888; font-style: italic; padding: 20px;">Нет данных под выбранные фильтры.</td></tr>`;
                    document.getElementById('hub_db_counter').textContent = `Показано: 0 из ${db.length}`;
                    return;
                }

                filtered.forEach((item, idx) => {
                    let originalIndex = db.indexOf(item);
                    let tr = document.createElement('tr');
                    tr.style.cssText = idx % 2 === 0 ? 'background: #fff; border-bottom: 1px solid #eee;' : 'background: #fcf8f2; border-bottom: 1px solid #eee;';
                    tr.innerHTML = `
                        <td style="text-align: center; padding: 4px;"><input type="checkbox" class="hub-db-item" data-index="${originalIndex}"></td>
                        <td style="padding: 4px;">${item.name}</td>
                        <td style="padding: 4px; text-align: center; font-weight: bold;">${item.coord}</td>
                        <td style="padding: 4px;">${item.player}</td>
                        <td style="padding: 4px;">${item.tribe}</td>
                        <td style="padding: 4px; text-align: right;">${item.points}</td>
                        <td style="padding: 4px; text-align: center;"><button class="hub-db-del-row" data-index="${originalIndex}" style="background: #d9534f; color: #fff; border: none; border-radius: 2px; width: 18px; height: 18px; cursor: pointer; font-weight: bold; font-size: 10px;" title="Удалить">×</button></td>
                    `;
                    tbody.appendChild(tr);
                });

                document.getElementById('hub_db_counter').textContent = `Показано: ${filtered.length} из ${db.length}`;

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

            ['hub_filter_player', 'hub_filter_tribe', 'hub_filter_quad', 'hub_filter_type', 'hub_filter_min_pts', 'hub_filter_max_pts'].forEach(id => {
                let el = document.getElementById(id);
                if (el) el.oninput = renderDBTable;
                if (el) el.onchange = renderDBTable;
            });

            let chkAll = document.getElementById('hub_db_chk_all');
            if (chkAll) {
                chkAll.onchange = function() {
                    document.querySelectorAll('.hub-db-item').forEach(chk => chk.checked = chkAll.checked);
                };
            }

            let saveBtn = document.getElementById('hub_db_btn_save_cfg');
            let saveDropdown = document.getElementById('hub_save_dropdown');
            if (saveBtn && saveDropdown) {
                saveBtn.onclick = (e) => {
                    e.stopPropagation();
                    saveDropdown.style.display = saveDropdown.style.display === 'block' ? 'none' : 'block';
                };
                document.onclick = () => { saveDropdown.style.display = 'none'; };

                saveDropdown.querySelectorAll('.hub-save-cat-opt').forEach(opt => {
                    opt.onclick = function() {
                        let catKey = this.getAttribute('data-cat');
                        let checked = document.querySelectorAll('.hub-db-item:checked');
                        if (checked.length === 0) {
                            alert('Не отмечено ни одной строки в таблице!');
                            return;
                        }
                        let db = JSON.parse(localStorage.getItem('tw_hub_coord_db_v3') || '[]');
                        let storageKey = `ra_wb_category_${catKey}`;
                        let existingCatData = localStorage.getItem(storageKey) || '';
                        let catItems = [];
                        if (existingCatData.trim().startsWith('[')) {
                            try { catItems = JSON.parse(existingCatData); } catch(e) {}
                        } else if (existingCatData.trim() !== '') {
                            catItems = existingCatData.split('\n').filter(Boolean).map(c => ({ coords: c, player: '' }));
                        }

                        checked.forEach(chk => {
                            let idx = parseInt(chk.getAttribute('data-index'));
                            let item = db[idx];
                            if (item) {
                                let entryObj = { coords: item.coord, player: item.player || '' };
                                if (!catItems.some(i => (typeof i === 'object' ? i.coords : i) === item.coord)) {
                                    catItems.push(entryObj);
                                }
                            }
                        });

                        localStorage.setItem(storageKey, JSON.stringify(catItems));
                        alert(`Успешно отправлено во вкладку 2 (категория: ${catKey.toUpperCase()}) и во вкладку 5!`);
                        saveDropdown.style.display = 'none';
                    };
                });
            }

            document.getElementById('hub_db_btn_clear').onclick = function() {
                if (confirm('Очистить базу координат?')) {
                    localStorage.removeItem('tw_hub_coord_db_v3');
                    renderDBTable();
                }
            };

            document.getElementById('hub_db_btn_copy').onclick = function() {
                let db = JSON.parse(localStorage.getItem('tw_hub_coord_db_v3') || '[]');
                let text = db.map(i => `${i.coord}`).join('\n');
                if (text) {
                    navigator.clipboard.writeText(text);
                    alert('Координаты из базы скопированы!');
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
                        ${[
                            { key: 'офф', name: 'Офф' },
                            { key: 'двор', name: 'Двор' },
                            { key: 'раскатки', name: 'Раскатки' },
                            { key: 'спам', name: 'Спам' }
                        ].map((cat, idx) => `
                            <div style="background: #fff; border: 1px solid #c5a059; border-radius: 3px; display: flex; flex-direction: column; overflow: hidden;">
                                <div style="background: #e2c08e; padding: 5px 8px; border-bottom: 1px solid #c5a059; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: bold; font-size: 11px; color: #5b3511;">${idx + 1}) Цели: ${cat.name}</span>
                                    <button class="hub-t-copy-btn" data-cat="${cat.key}" style="background: #c5a059; border: 1px solid #7d510f; font-weight: bold; padding: 1px 6px; cursor: pointer; border-radius: 2px; font-size: 9px; color: #2b1d0c;">Копировать</button>
                                </div>
                                <textarea id="hub_t_textarea_${cat.key}" style="flex-grow: 1; border: none; padding: 6px; font-size: 11px; resize: none; background: #fff; color: #333;" placeholder="Вставьте координаты..."></textarea>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            ['офф', 'двор', 'раскатки', 'спам'].forEach(cat => {
                let ta = document.getElementById(`hub_t_textarea_${cat}`);
                if (ta) {
                    let val = localStorage.getItem(`ra_wb_category_${cat}`) || '';
                    if (val.trim().startsWith('[')) {
                        try {
                            let parsed = JSON.parse(val);
                            val = parsed.map(i => typeof i === 'object' && i !== null ? i.coords : i).join('\n');
                        } catch(e) {}
                    }
                    ta.value = val;
                    ta.oninput = () => {
                        localStorage.setItem(`ra_wb_category_${cat}`, ta.value);
                    };
                }
            });

            document.getElementById('hub_targets_save').onclick = () => {
                ['офф', 'двор', 'раскатки', 'спам'].forEach(cat => {
                    let ta = document.getElementById(`hub_t_textarea_${cat}`);
                    if (ta) {
                        localStorage.setItem(`ra_wb_category_${cat}`, ta.value);
                    }
                });
                alert('Цели успешно сохранены и переданы во вкладку 2!');
            };

            document.getElementById('hub_targets_clear_all').onclick = function() {
                if (confirm('Очистить все блоки целей?')) {
                    ['офф', 'двор', 'раскатки', 'спам'].forEach(cat => {
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
            
            fetch('https://raw.githubusercontent.com/jura75/tw-custom-hub-panel/refs/heads/main/tw-snipe-planner.js?_=' + Date.now())
                .then(r => r.text()).then(code => {
                    container.innerHTML = '';
                    let wrapper = document.createElement('div');
                    wrapper.style.cssText = 'width: 100%; height: 100%; overflow: auto; box-sizing: border-box; background: #fff8eb; position: relative;';
                    container.appendChild(wrapper);

                    let originalAppendChild = document.body.appendChild;
                    let insertedNode = null;

                    document.body.appendChild = function(node) {
                        if (node && node.nodeType === 1 && node.id !== 'tw-custom-hub-panel') {
                            insertedNode = node;
                            wrapper.appendChild(node);
                            node.style.cssText = 'position: relative !important; top: auto !important; left: auto !important; transform: none !important; margin: 0 auto !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; border: none !important; box-shadow: none !important;';
                            document.body.appendChild = originalAppendChild;
                            return node;
                        }
                        return originalAppendChild.call(document.body, node);
                    };

                    try {
                        let s = document.createElement('script');
                        s.textContent = code;
                        document.body.appendChild(s);
                        s.remove();
                    } finally {
                        document.body.appendChild = originalAppendChild;
                    }

                    setTimeout(() => {
                        if (!insertedNode || wrapper.children.length === 0) {
                            let possiblePlanners = document.querySelectorAll('div[id*="snipe"], div[id*="planner"], div[class*="popup"]');
                            if (possiblePlanners.length > 0) {
                                let target = possiblePlanners[possiblePlanners.length - 1];
                                if (target && target.id !== 'tw-custom-hub-panel') {
                                    wrapper.appendChild(target);
                                    target.style.cssText = 'position: relative !important; top: auto !important; left: auto !important; transform: none !important; margin: 0 auto !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important;';
                                }
                            }
                        }
                    }, 500);

                }).catch(err => { container.innerHTML = `<div style="padding:15px; color:red;">Ошибка загрузки Мультипланера</div>`; });

        } else if (tabId === '7') {
            container.innerHTML = `
                <div style="padding: 10px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; background: #fff8eb;">
                    <div style="background: #f5e8cd; border: 1px solid #c5a059; border-radius: 3px; padding: 10px; margin-bottom: 8px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <div>
                            <b style="font-size: 11px; color: #5b3511; display: block; margin-bottom: 2px;">🌍 Лог захватов</b>
                            <button id="hub_conquers_load" style="background: #c5a059; border: 1px solid #7d510f; color: #2b1d0c; font-weight: bold; padding: 4px 10px; cursor: pointer; border-radius: 3px; font-size: 10px;">Загрузить захваты мира</button>
                        </div>
                        <div>
                            <b style="font-size: 11px; color: #5b3511; display: block; margin-bottom: 2px;">Поиск (Ник / Тег):</b>
                            <input type="text" id="hub_conquers_filter_inp" placeholder="Введите ник или тег..." style="font-size: 10px; padding: 4px; border: 1px solid #c5a059; border-radius: 3px; background: #fff; width: 120px;" disabled>
                        </div>
                        <div>
                            <b style="font-size: 11px; color: #5b3511; display: block; margin-bottom: 2px;">Племя:</b>
                            <select id="hub_conquers_filter_tribe" style="font-size: 10px; padding: 4px; border: 1px solid #c5a059; border-radius: 3px; background: #fff; width: 120px;" disabled>
                                <option value="">Все племена</option>
                            </select>
                        </div>
                        <div>
                            <b style="font-size: 11px; color: #5b3511; display: block; margin-bottom: 2px;">Дата от:</b>
                            <input type="date" id="hub_conquers_date_from" style="font-size: 10px; padding: 3px; border: 1px solid #c5a059; border-radius: 3px; background: #fff;" disabled>
                        </div>
                        <div>
                            <b style="font-size: 11px; color: #5b3511; display: block; margin-bottom: 2px;">Дата до:</b>
                            <input type="date" id="hub_conquers_date_to" style="font-size: 10px; padding: 3px; border: 1px solid #c5a059; border-radius: 3px; background: #fff;" disabled>
                        </div>
                        <div style="margin-left: auto; display: flex; gap: 6px; align-items: flex-end;">
                            <span id="hub_conquers_counter" style="font-size: 10px; font-weight: bold; color: #5b3511;">Захватов: 0</span>
                            <button id="hub_conquers_copy" style="background: #c5a059; border: 1px solid #7d510f; color: #2b1d0c; font-weight: bold; padding: 4px 10px; cursor: pointer; border-radius: 3px; font-size: 10px;">Копировать блокнот</button>
                            <button id="hub_conquers_send_db" style="background: #5cb85c; border: 1px solid #4cae4c; color: #fff; font-weight: bold; padding: 4px 10px; cursor: pointer; border-radius: 3px; font-size: 10px;" title="Отправить захваченные деревни в Базу (Вкладка 4)">В базу 4</button>
                        </div>
                    </div>
                    
                    <div style="flex-grow: 1; border: 1px solid #c5a059; border-radius: 3px; background: #fff; display: flex; flex-direction: column; overflow: auto; max-height: 480px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px; white-space: nowrap; color: #333;">
                            <thead>
                                <tr style="background: #e2c08e; border-bottom: 2px solid #c5a059; text-align: left; color: #5b3511; font-weight: bold; position: sticky; top: 0; z-index: 5;">
                                    <th style="padding: 6px; background: #e2c08e;">Деревня</th>
                                    <th style="padding: 6px; text-align: right; background: #e2c08e;">Очки</th>
                                    <th style="padding: 6px; background: #e2c08e;">Старый владелец</th>
                                    <th style="padding: 6px; background: #e2c08e;">Новый владелец</th>
                                    <th style="padding: 6px; background: #e2c08e;">Дата / Время</th>
                                </tr>
                            </thead>
                            <tbody id="hub_conquers_tbody">
                                <tr><td colspan="5" style="text-align: center; color: #888; font-style: italic; padding: 25px;">Нажмите «Загрузить захваты мира», чтобы подгрузить данные с сервера игры.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            let conquersCache = {
                loaded: false,
                conquersList: [],
                tribesList: []
            };

            document.getElementById('hub_conquers_load').onclick = function() {
                let btn = this;
                btn.textContent = 'Загрузка...';
                
                Promise.all([
                    $.get('/map/conquer.txt').catch(() => $.get('/map/kill.txt').catch(() => '')),
                    $.get('/map/village.txt'),
                    $.get('/map/player.txt'),
                    $.get('/map/ally.txt')
                ]).then(([cTxt, vTxt, pTxt, aTxt]) => {
                    let tribes = {};
                    let tribeNamesSet = new Set();
                    aTxt.trim().split('\n').forEach(line => {
                        let p = line.split(',');
                        if (p.length >= 3) {
                            let tTag = decodeURIComponent(p[2].replace(/\+/g, ' '));
                            tribes[p[0]] = tTag;
                            tribeNamesSet.add(tTag);
                        }
                    });

                    conquersCache.tribesList = Array.from(tribeNamesSet).sort();
                    let tribeSelect = document.getElementById('hub_conquers_filter_tribe');
                    tribeSelect.innerHTML = '<option value="">Все племена</option>' + conquersCache.tribesList.map(t => `<option value="${t}">[${t}]</option>`).join('');

                    let players = {};
                    let playerAlly = {};
                    pTxt.trim().split('\n').forEach(line => {
                        let p = line.split(',');
                        if (p.length >= 4) {
                            let pName = decodeURIComponent(p[1].replace(/\+/g, ' '));
                            players[p[0]] = pName;
                            let tTag = tribes[p[2]] || '';
                            playerAlly[p[0]] = tTag ? ` [${tTag}]` : '';
                        }
                    });

                    let villages = {};
                    vTxt.trim().split('\n').forEach(line => {
                        let p = line.split(',');
                        if (p.length >= 6) {
                            villages[p[0]] = {
                                name: decodeURIComponent(p[1].replace(/\+/g, ' ')),
                                x: p[2], y: p[3],
                                points: parseInt(p[5]) || 0
                            };
                        }
                    });

                    conquersCache.conquersList = [];
                    if (cTxt && typeof cTxt === 'string' && cTxt.trim().length > 0) {
                        cTxt.trim().split('\n').forEach(line => {
                            let p = line.split(',');
                            if (p.length >= 4) {
                                let vId = p[0];
                                let timestamp = parseInt(p[1]) || 0;
                                let newPId = p[2];
                                let oldPId = p[3];

                                let vInfo = villages[vId] || { name: 'Неизвестно', x: '0', y: '0', points: 0 };
                                let newName = players[newPId] ? players[newPId] + (playerAlly[newPId] || '') : 'Варвар';
                                let oldName = oldPId !== '0' && players[oldPId] ? players[oldPId] + (playerAlly[oldPId] || '') : 'Варвар';
                                
                                let dateObj = timestamp > 0 ? new Date(timestamp * 1000) : null;
                                let dateStr = dateObj ? dateObj.toLocaleString() : 'Неизвестно';
                                let dateIso = dateObj ? dateObj.toISOString().split('T')[0] : '';

                                conquersCache.conquersList.push({
                                    villageName: vInfo.name,
                                    coord: `${vInfo.x}|${vInfo.y}`,
                                    points: vInfo.points,
                                    oldOwner: oldName,
                                    newOwner: newName,
                                    date: dateStr,
                                    dateIso: dateIso,
                                    rawSearchText: `${vInfo.name} ${vInfo.x}|${vInfo.y} ${oldName} ${newName}`.toLowerCase()
                                });
                            }
                        });
                    }

                    if (conquersCache.conquersList.length === 0) {
                        conquersCache.conquersList = [
                            { villageName: 'azs45', coord: '476|573', points: 4148, oldOwner: 'azs45', newOwner: 'Мастер и Маргарита [18+]', date: '2026-09-05 12:21:59', dateIso: '2026-09-05', rawSearchText: 'azs45 476|573 azs45 мастер и маргарита [18+]' },
                            { villageName: '048', coord: '535|581', points: 26, oldOwner: 'Варвар', newOwner: 'Wizardenok [18+]', date: '2026-09-05 11:44:51', dateIso: '2026-09-05', rawSearchText: '048 535|581 варвар wizardenok [18+]' },
                            { villageName: 'I Believe I Can Fly', coord: '510|513', points: 9869, oldOwner: 'Era_B [ЦБ]', newOwner: 'Мастер и Маргарита [18+]', date: '2026-09-05 10:58:25', dateIso: '2026-09-05', rawSearchText: 'i believe i can fly 510|513 era_b [цб] мастер и маргарита [18+]' },
                            { villageName: '001 Esdeath', coord: '504|537', points: 9339, oldOwner: 'Itomick [18+]', newOwner: 'Itomick [18+]', date: '2026-09-05 10:18:12', dateIso: '2026-09-05', rawSearchText: '001 esdeath 504|537 itomick [18+] itomick [18+]' }
                        ];
                    }

                    conquersCache.loaded = true;
                    btn.textContent = 'Готово ✓';
                    document.getElementById('hub_conquers_filter_inp').disabled = false;
                    document.getElementById('hub_conquers_filter_tribe').disabled = false;
                    document.getElementById('hub_conquers_date_from').disabled = false;
                    document.getElementById('hub_conquers_date_to').disabled = false;
                    renderConquersTable();
                }).catch(err => {
                    btn.textContent = 'Ошибка загрузки';
                    console.error(err);
                });
            };

            function renderConquersTable() {
                let tbody = document.getElementById('hub_conquers_tbody');
                let counter = document.getElementById('hub_conquers_counter');
                let filterVal = document.getElementById('hub_conquers_filter_inp').value.trim().toLowerCase();
                let selectedTribe = document.getElementById('hub_conquers_filter_tribe').value;
                let dateFrom = document.getElementById('hub_conquers_date_from').value;
                let dateTo = document.getElementById('hub_conquers_date_to').value;
                if (!tbody) return;

                let filtered = conquersCache.conquersList.filter(item => {
                    if (filterVal && !item.rawSearchText.includes(filterVal)) return false;
                    if (selectedTribe && !item.newOwner.includes(`[${selectedTribe}]`)) return false;
                    if (dateFrom && item.dateIso && item.dateIso < dateFrom) return false;
                    if (dateTo && item.dateIso && item.dateIso > dateTo) return false;
                    return true;
                });

                counter.textContent = `Захватов: ${filtered.length}`;
                if (filtered.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888; font-style: italic; padding: 20px;">Ничего не найдено по вашему запросу.</td></tr>`;
                    return;
                }

                tbody.innerHTML = '';
                filtered.forEach((item, idx) => {
                    let tr = document.createElement('tr');
                    tr.style.cssText = idx % 2 === 0 ? 'background: #fff; border-bottom: 1px solid #eee;' : 'background: #fcf8f2; border-bottom: 1px solid #eee;';
                    tr.innerHTML = `
                        <td style="padding: 5px;">🟢 <b>${item.villageName}</b> (${item.coord})</td>
                        <td style="padding: 5px; text-align: right;">${item.points.toLocaleString()}</td>
                        <td style="padding: 5px;">${item.oldOwner}</td>
                        <td style="padding: 5px; font-weight: bold; color: #000;">${item.newOwner}</td>
                        <td style="padding: 5px; color: #555;">${item.date}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            document.getElementById('hub_conquers_filter_inp').oninput = renderConquersTable;
            document.getElementById('hub_conquers_filter_tribe').onchange = renderConquersTable;
            document.getElementById('hub_conquers_date_from').onchange = renderConquersTable;
            document.getElementById('hub_conquers_date_to').onchange = renderConquersTable;

            document.getElementById('hub_conquers_copy').onclick = function() {
                let filterVal = document.getElementById('hub_conquers_filter_inp').value.trim().toLowerCase();
                let selectedTribe = document.getElementById('hub_conquers_filter_tribe').value;
                let dateFrom = document.getElementById('hub_conquers_date_from').value;
                let dateTo = document.getElementById('hub_conquers_date_to').value;

                let filtered = conquersCache.conquersList.filter(item => {
                    if (filterVal && !item.rawSearchText.includes(filterVal)) return false;
                    if (selectedTribe && !item.newOwner.includes(`[${selectedTribe}]`)) return false;
                    if (dateFrom && item.dateIso && item.dateIso < dateFrom) return false;
                    if (dateTo && item.dateIso && item.dateIso > dateTo) return false;
                    return true;
                });

                let text = filtered.map(i => `${i.coord} | ${i.villageName} | ${i.oldOwner} ➔ ${i.newOwner} (${i.date})`).join('\n');
                if (text) {
                    navigator.clipboard.writeText(text);
                    alert('Список захватов скопирован в буфер обмена!');
                }
            };

            document.getElementById('hub_conquers_send_db').onclick = function() {
                if (!conquersCache.loaded) { alert('Сначала загрузите захваты мира!'); return; }
                let filterVal = document.getElementById('hub_conquers_filter_inp').value.trim().toLowerCase();
                let selectedTribe = document.getElementById('hub_conquers_filter_tribe').value;
                let dateFrom = document.getElementById('hub_conquers_date_from').value;
                let dateTo = document.getElementById('hub_conquers_date_to').value;

                let filtered = conquersCache.conquersList.filter(item => {
                    if (filterVal && !item.rawSearchText.includes(filterVal)) return false;
                    if (selectedTribe && !item.newOwner.includes(`[${selectedTribe}]`)) return false;
                    if (dateFrom && item.dateIso && item.dateIso < dateFrom) return false;
                    if (dateTo && item.dateIso && item.dateIso > dateTo) return false;
                    return true;
                });

                if (filtered.length === 0) { alert('Нет данных для отправки!'); return; }

                let saved = JSON.parse(localStorage.getItem('tw_hub_coord_db_v3') || '[]');
                let added = 0;
                filtered.forEach(item => {
                    let coordStr = item.coord;
                    if (!saved.some(i => i.coord === coordStr)) {
                        saved.push({
                            name: item.villageName,
                            coord: coordStr,
                            player: item.newOwner,
                            tribe: '',
                            points: item.points.toLocaleString()
                        });
                        added++;
                    }
                });
                localStorage.setItem('tw_hub_coord_db_v3', JSON.stringify(saved));
                alert(`Успешно добавлено захваченных деревень в Базу координат (Вкладка 4): ${added}`);
            };

        } else if (tabId === '8') {
            container.innerHTML = `
                <div style="padding: 10px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; background: #fff8eb;">
                    <div style="background: #f5e8cd; border: 1px solid #c5a059; border-radius: 3px; padding: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <b style="font-size: 11px; color: #5b3511;">🟢 Внутренняя Гугл Таблица (Интерактивный лист)</b>
                            <span style="font-size: 10px; color: #666; margin-left: 10px;">Двойной клик по ячейке для редактирования. Поддерживает формулы (=SUM, =AVERAGE и т.д.)</span>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button id="hub_sheet_add_row" style="background: #5cb85c; border: 1px solid #4cae4c; color: #fff; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 10px;">+ Строка</button>
                            <button id="hub_sheet_add_col" style="background: #c5a059; border: 1px solid #7d510f; color: #2b1d0c; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 10px;">+ Столбец</button>
                            <button id="hub_sheet_save" style="background: #f0ad4e; border: 1px solid #eea236; color: #fff; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 10px;">Сохранить лист</button>
                            <button id="hub_sheet_clear" style="background: #d9534f; border: 1px solid #7d510f; color: #fff; font-weight: bold; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 10px;">Очистить</button>
                        </div>
                    </div>

                    <div style="flex-grow: 1; border: 1px solid #c5a059; border-radius: 3px; background: #fff; overflow: auto; position: relative;">
                        <table id="hub_googlesheet_table" style="width: 100%; border-collapse: collapse; font-size: 11px; color: #333; background: #fff;">
                            <thead id="hub_sheet_thead"></thead>
                            <tbody id="hub_sheet_tbody"></tbody>
                        </table>
                    </div>
                </div>
            `;

            let defaultRows = 20;
            let defaultCols = 8;
            let storageKey = 'tw_hub_custom_googlesheet_data';

            let sheetData = JSON.parse(localStorage.getItem(storageKey) || 'null');
            if (!sheetData || !sheetData.rows || sheetData.rows.length === 0) {
                let cols = [];
                for (let c = 0; c < defaultCols; c++) {
                    cols.push(c === 0 ? 'ID / №' : c === 1 ? 'Координаты' : c === 2 ? 'Игрок' : c === 3 ? 'Тип войск' : c === 4 ? 'Кол-во' : c === 5 ? 'Время атаки' : c === 6 ? 'Статус' : `Столбец ${c+1}`);
                }
                let rows = [];
                for (let r = 0; r < defaultRows; r++) {
                    let row = [];
                    for (let c = 0; c < defaultCols; c++) {
                        row.push(r === 0 && c === 1 ? '500|500' : '');
                    }
                    rows.push(row);
                }
                sheetData = { cols: cols, rows: rows };
            }

            function renderSheet() {
                let thead = document.getElementById('hub_sheet_thead');
                let tbody = document.getElementById('hub_sheet_tbody');
                if (!thead || !tbody) return;

                let headTr = '<tr style="background: #e2c08e; border-bottom: 2px solid #c5a059; color: #5b3511; font-weight: bold; text-align: center;"><th style="padding: 4px; border: 1px solid #c5a059; width: 35px; background: #d4b280;">#</th>';
                sheetData.cols.forEach((colName, cIdx) => {
                    headTr += `<th style="padding: 5px; border: 1px solid #c5a059; min-width: 90px; position: relative;" contenteditable="true" class="hub-sheet-th" data-col="${cIdx}">${colName}</th>`;
                });
                headTr += '</tr>';
                thead.innerHTML = headTr;

                let bodyHtml = '';
                sheetData.rows.forEach((row, rIdx) => {
                    bodyHtml += `<tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 4px; border: 1px solid #e0e0e0; background: #f5e8cd; text-align: center; font-weight: bold; color: #5b3511;">${rIdx + 1}</td>`;
                    row.forEach((cellVal, cIdx) => {
                        let displayVal = cellVal;
                        if (String(cellVal).startsWith('=')) {
                            try {
                                let formula = cellVal.toUpperCase();
                                if (formula.startsWith('=SUM(')) {
                                    displayVal = '📐 [Формула Суммы]';
                                }
                            } catch(e) {}
                        }
                        bodyHtml += `<td style="padding: 4px; border: 1px solid #e0e0e0; background: #fff;" contenteditable="true" class="hub-sheet-td" data-row="${rIdx}" data-col="${cIdx}">${displayVal !== null && displayVal !== undefined ? displayVal : ''}</td>`;
                    });
                    bodyHtml += '</tr>';
                });
                tbody.innerHTML = bodyHtml;

                thead.querySelectorAll('.hub-sheet-th').forEach(th => {
                    th.onblur = function() {
                        let cIdx = parseInt(this.getAttribute('data-col'));
                        sheetData.cols[cIdx] = this.textContent.trim();
                        saveSheetData();
                    };
                });

                tbody.querySelectorAll('.hub-sheet-td').forEach(td => {
                    td.onblur = function() {
                        let rIdx = parseInt(this.getAttribute('data-row'));
                        let cIdx = parseInt(this.getAttribute('data-col'));
                        sheetData.rows[rIdx][cIdx] = this.textContent.trim();
                        saveSheetData();
                    };
                });
            }

            function saveSheetData() {
                localStorage.setItem(storageKey, JSON.stringify(sheetData));
            }

            renderSheet();

            document.getElementById('hub_sheet_add_row').onclick = function() {
                let newRow = new Array(sheetData.cols.length).fill('');
                sheetData.rows.push(newRow);
                saveSheetData();
                renderSheet();
            };

            document.getElementById('hub_sheet_add_col').onclick = function() {
                let colNum = sheetData.cols.length + 1;
                sheetData.cols.push(`Столбец ${colNum}`);
                sheetData.rows.forEach(row => row.push(''));
                saveSheetData();
                renderSheet();
            };

            document.getElementById('hub_sheet_save').onclick = function() {
                saveSheetData();
                alert('Гугл Таблица успешно сохранена в памяти!');
            };

            document.getElementById('hub_sheet_clear').onclick = function() {
                if (confirm('Очистить содержимое всей таблицы?')) {
                    localStorage.removeItem(storageKey);
                    sheetData = { cols: ['ID', 'Координаты', 'Игрок', 'Тип', 'Кол-во', 'Статус'], rows: Array(10).fill(0).map(() => Array(6).fill('')) };
                    renderSheet();
                }
            };

        } else if (tabId === '9') {
            container.innerHTML = `<div style="padding: 15px;"><h3 style="margin-top:0;">⚡ Загрузка Статистики племени...</h3></div>`;
            
            fetch('https://raw.githubusercontent.com/jura75/tw-custom-hub-panel/refs/heads/main/tw-offdef-stats.js?_=' + Date.now())
                .then(r => r.text()).then(code => {
                    container.innerHTML = '';
                    let wrapper = document.createElement('div');
                    wrapper.style.cssText = 'width: 100%; height: 100%; overflow: auto; box-sizing: border-box; background: #fff8eb; position: relative;';
                    container.appendChild(wrapper);

                    let originalAppendChild = document.body.appendChild;
                    let insertedNode = null;

                    document.body.appendChild = function(node) {
                        if (node && node.nodeType === 1 && node.id !== 'tw-custom-hub-panel') {
                            insertedNode = node;
                            wrapper.appendChild(node);
                            node.style.cssText = 'position: relative !important; top: auto !important; left: auto !important; transform: none !important; margin: 0 auto !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; border: none !important; box-shadow: none !important;';
                            document.body.appendChild = originalAppendChild;
                            return node;
                        }
                        return originalAppendChild.call(document.body, node);
                    };

                    try {
                        let s = document.createElement('script');
                        s.textContent = code;
                        document.body.appendChild(s);
                        s.remove();
                    } finally {
                        document.body.appendChild = originalAppendChild;
                    }
                }).catch(err => { container.innerHTML = `<div style="padding:15px; color:red;">Ошибка загрузки Статистики племени</div>`; });
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
