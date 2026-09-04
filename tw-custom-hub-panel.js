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
        height: 650px;
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
            <button class="tw-hub-tab-btn active" data-tab="1" style="background: #5a3b0c; border: 1px solid #7d510f; color: #fff; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">Таблица войск</button>
            <button class="tw-hub-tab-btn" data-tab="2" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">Выбранные войска</button>
            <button class="tw-hub-tab-btn" data-tab="3" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">Вкладка 3</button>
            <button class="tw-hub-tab-btn" data-tab="4" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">Вкладка 4</button>
            <button class="tw-hub-tab-btn" data-tab="5" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; white-space: nowrap;">Вкладка 5</button>
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

    // Закрытие по крестику
    document.getElementById('tw-hub-close').onclick = () => panel.remove();

    // Логика переключения вкладок
    function loadTabContent(tabId) {
        let container = document.getElementById('tw-hub-content-container');
        container.innerHTML = ''; // Очищаем контейнер

        if (tabId === '1') {
            container.innerHTML = `<div style="padding: 15px;"><h3 style="margin-top:0;">⚡ Загрузка Таблицы войск...</h3><p>Получаем скрипт с GitHub...</p></div>`;
            
            let observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.id === 'ra_workbench_main') {
                            node.style.position = 'relative';
                            node.style.top = '0';
                            node.style.left = '0';
                            node.style.transform = 'none';
                            node.style.margin = '0';
                            node.style.width = '100%';
                            node.style.height = '100%';
                            node.style.border = 'none';
                            node.style.boxShadow = 'none';
                            node.style.borderRadius = '0';
                            node.style.boxSizing = 'border-box';
                            
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
                .then(response => {
                    if (!response.ok) throw new Error('Не удалось загрузить файл table-of-units.js с GitHub');
                    return response.text();
                })
                .then(scriptCode => {
                    let s = document.createElement('script');
                    s.textContent = scriptCode;
                    document.body.appendChild(s);
                    s.remove();
                })
                .catch(err => {
                    observer.disconnect();
                    container.innerHTML = `<div style="padding: 15px;"><h3 style="color: #b22222; margin-top:0;">❌ Ошибка загрузки</h3><p>${err.message}</p></div>`;
                });

        } else if (tabId === '2') {
            container.innerHTML = `
                <div style="padding: 10px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #c5a059; padding-bottom: 6px;">
                        <span style="font-weight: bold; font-size: 13px; color: #5b3511;">Распределение сохраненных целей по категориям:</span>
                        <div style="display: flex; gap: 6px;">
                            <button id="hub_btn_del_selected" style="background: #d9534f; border: 1px solid #7d510f; color: #fff; padding: 3px 8px; font-weight: bold; cursor: pointer; border-radius: 3px; font-size: 10px;">Удалить отмеченные</button>
                            <button id="hub_btn_clear_all_cats" style="background: #a94442; border: 1px solid #7d510f; color: #fff; padding: 3px 8px; font-weight: bold; cursor: pointer; border-radius: 3px; font-size: 10px;">Очистить всё</button>
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
                            itemsHtml += `
                                <div style="display: flex; align-items: center; gap: 4px; padding: 2px 0; border-bottom: 1px dotted #e3d0b1;">
                                    <input type="checkbox" class="hub-cat-item-chk" data-cat="${cat.key}" data-index="${index}" style="cursor: pointer;">
                                    <span style="font-size: 10px; color: #333;">${item.player} — <b>${item.coords}</b></span>
                                </div>
                            `;
                        });
                    }

                    let colHtml = `
                        <div style="flex: 1; min-width: 175px; background: #fff; border: 1px solid #c5a059; border-radius: 3px; display: flex; flex-direction: column; overflow: hidden;">
                            <div style="background: #e2c08e; padding: 5px 8px; border-bottom: 1px solid #c5a059; display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: bold; color: ${cat.color};">${cat.name}</span>
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

            document.querySelectorAll('.hub-clear-cat').forEach(btn => {
                btn.onclick = function() {
                    let catKey = this.getAttribute('data-cat');
                    localStorage.removeItem(`ra_wb_category_${catKey}`);
                    renderCategories();
                };
            });

        } else if (tabId === '3') {
            container.innerHTML = `<div style="padding: 15px;"><h3 style="margin-top:0;">⚖️ Вкладка №3</h3><p>Здесь будет интерфейс третьего скрипта.</p></div>`;
        } else if (tabId === '4') {
            container.innerHTML = `<div style="padding: 15px;"><h3 style="margin-top:0;">🎯 Вкладка №4</h3><p>Здесь будет интерфейс четвертого скрипта.</p></div>`;
        } else if (tabId === '5') {
            container.innerHTML = `<div style="padding: 15px;"><h3 style="margin-top:0;">⏱️ Вкладка №5</h3><p>Здесь будет интерфейс пятого скрипта.</p></div>`;
        } else if (tabId === '6') {
            container.innerHTML = `<div style="padding: 15px;"><h3 style="margin-top:0;">⚡ Загрузка Мультипланера...</h3><p>Получаем данные с GitHub...</p></div>`;
            
            let observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.id !== 'tw-custom-hub-panel') {
                            let style = window.getComputedStyle(node);
                            if (style.position === 'fixed' || style.position === 'absolute') {
                                node.style.position = 'relative';
                                node.style.top = '0';
                                node.style.left = '0';
                                node.style.transform = 'none';
                                node.style.margin = '0';
                                node.style.width = '100%';
                                node.style.height = '100%';
                                node.style.boxSizing = 'border-box';
                                
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
                .then(response => {
                    if (!response.ok) throw new Error('Не удалось загрузить файл с GitHub');
                    return response.text();
                })
                .then(scriptCode => {
                    let s = document.createElement('script');
                    s.textContent = scriptCode;
                    document.body.appendChild(s);
                    s.remove();
                })
                .catch(err => {
                    observer.disconnect();
                    container.innerHTML = `<div style="padding: 15px;"><h3 style="color: #b22222; margin-top:0;">❌ Ошибка загрузки</h3><p>${err.message}</p></div>`;
                });
        }
    }

    // Обработчики кликов по кнопкам вкладок
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

            let tabId = this.getAttribute('data-tab');
            loadTabContent(tabId);
        };
    });

    // Загружаем первую вкладку («Таблица войск») по умолчанию при открытии панели
    loadTabContent('1');
})();
void(0);
