javascript:(function() {
    // Если хаб уже открыт — закрываем его (переключатель)
    let existing = document.getElementById('tw-custom-hub-panel');
    if (existing) {
        existing.remove();
        return;
    }

    // Создаем главное окно хаба
    let panel = document.createElement('div');
    panel.id = 'tw-custom-hub-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        width: 980px;
        height: 620px;
        background: #2b1d0c;
        border: 3px solid #7d510f;
        box-shadow: 0 8px 25px rgba(0,0,0,0.8);
        z-index: 99999;
        font-family: Verdana, Arial, sans-serif;
        color: #f4e4bc;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    panel.innerHTML = `
        <!-- [ШАПКА ХАБА И ВЕРХНИЕ ВКЛАДКИ] -->
        <div style="background: #1a1006; border-bottom: 2px solid #7d510f;">
            <div style="padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #4a3014;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 14px;">🛠️</span>
                    <b style="font-size: 13px; color: #f4e4bc;">Проект Хаб — Война Племен (Единая рабочая среда)</b>
                </div>
                <span id="tw-hub-close" style="cursor: pointer; color: #a63a3a; font-weight: bold; font-size: 15px; padding: 0 6px;">✕</span>
            </div>
            
            <!-- Панель вкладок сверху (горизонтальная лента) -->
            <div style="display: flex; gap: 2px; padding: 6px 8px 0 8px; background: #23170a; overflow-x: auto;">
                <button class="tw-hub-tab-btn active" data-tab="troops" style="background: #5a3b0c; border: 1px solid #7d510f; border-bottom: none; color: #fff; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 4px 4px 0 0; white-space: nowrap;">
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
                <button class="tw-hub-tab-btn" data-tab="timer" style="background: #3b2812; border: 1px solid #7d510f; border-bottom: none; color: #f4e4bc; padding: 6px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 4px 4px 0 0; white-space: nowrap;">
                    ⏱️ Авто-тайм
                </button>
            </div>
        </div>

        <!-- Центральный рабочий контейнер -->
        <div id="tw-hub-content-container" style="flex: 1; background: #f4e4bc; display: flex; flex-direction: column; overflow: hidden; position: relative; padding: 8px; color: #000;">
            <!-- Сюда динамически подгружается разметка выбранной вкладки -->
        </div>

        <!-- [НИЖНЯЯ ПАНЕЛЬ СТАТУСА] -->
        <div style="background: #1a1006; padding: 4px 12px; font-size: 10px; color: #a98a5c; border-top: 1px solid #7d510f; display: flex; justify-content: space-between;">
            <span>Статус: Единая среда с верхними вкладками активна</span>
            <span>Проект Война Племен 2026</span>
        </div>
    `;

    document.body.appendChild(panel);

    // Закрытие по крестику
    document.getElementById('tw-hub-close').onclick = () => panel.remove();

    // Функция переключения вкладок
    function loadTab(tabName) {
        // Меняем стили кнопок вкладок сверху
        panel.querySelectorAll('.tw-hub-tab-btn').forEach(b => {
            if (b.getAttribute('data-tab') === tabName) {
                b.style.background = '#5a3b0c';
                b.style.color = '#fff';
                b.classList.add('active');
            } else {
                b.style.background = '#3b2812';
                b.style.color = '#f4e4bc';
                b.classList.remove('active');
            }
        });

        let $content = $('#tw-hub-content-container');
        $content.empty();

        // Загружаем контент в зависимости от выбранной вкладки
        if (tabName === 'troops') {
            // Подключаем вашу разметку войск со всеми фильтрами
            $content.html(typeof getTroopsTabHTML === 'function' ? getTroopsTabHTML() : '<div style="padding: 20px; text-align:center;">Загрузите модуль войск</div>');
        } else if (tabName === 'balancer') {
            $content.html('<div style="padding: 20px; text-align:center; font-weight:bold;">Здесь будет интерфейс Авто-балансера ресурсов</div>');
        } else if (tabName === 'scanner') {
            $content.html('<div style="padding: 20px; text-align:center; font-weight:bold;">Здесь будет интерфейс Сбора координат</div>');
        } else {
            $content.html(`<div style="padding: 20px; text-align:center; font-weight:bold;">Модуль "${tabName}" в разработке...</div>`);
        }
    }

    // Клик по вкладке сверху
    panel.querySelectorAll('.tw-hub-tab-btn').forEach(btn => {
        btn.onclick = function() {
            let tab = this.getAttribute('data-tab');
            loadTab(tab);
        };
    });

    // Открываем вкладку войск по умолчанию
    loadTab('troops');

})();void(0);
