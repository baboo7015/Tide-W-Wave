// 1. Создаем контейнер-капсулу
const container = document.createElement('div');
container.id = 'tww-extension-root';
container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 99999999; display: none;`;
const shadow = container.attachShadow({ mode: 'open' });

// 2. Добавляем стили (UI и оформление ошибок)
const style = document.createElement('style');
style.textContent = `
    :host { --bg-main: #121420; --bg-panel: #1e2233; --text-main: #ffffff; --text-muted: #8b8fa3; --border-color: #2a2d3a; --color-green: #00b074; --color-red: #ff5e5e; --color-neutral: #f6c343; }
    :host([data-theme="light"]) { --bg-main: #f5f7fa; --bg-panel: #ffffff; --text-main: #111827; --text-muted: #6b7280; --border-color: #d1d5db; }
    .tww-wrapper { width: 310px; padding: 10px; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 8px; font-family: sans-serif; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; margin-bottom: 10px; cursor: grab; }
    h2 { margin: 0; font-size: 13px; flex-grow: 1; text-align: center; }
    .section-title { font-size: 10px; color: var(--text-muted); text-transform: uppercase; margin: 8px 0 4px 0; }
    label { display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 2px; }
    input, select { width: 100%; box-sizing: border-box; padding: 5px; margin-bottom: 5px; background: var(--bg-panel); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px; font-size: 12px; outline: none; }
    input:focus { border-color: var(--color-green); }
    .flex-row { display: flex; gap: 6px; } .flex-row > div { flex: 1; }
    .direction-toggle { display: flex; margin-bottom: 8px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color); }
    .direction-toggle input { display: none; }
    .direction-toggle label { flex: 1; text-align: center; padding: 5px; font-size: 11px; cursor: pointer; background: var(--bg-panel); color: var(--text-muted); font-weight: bold; }
    .direction-toggle input[value="long"]:checked + label { background: var(--color-green); color: white; }
    .direction-toggle input[value="short"]:checked + label { background: var(--color-red); color: white; }
    #result { background: var(--bg-panel); padding: 8px; border-radius: 4px; border: 1px solid var(--border-color); }
    .result-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
    .highlight { font-weight: bold; font-size: 12px; }
    .green { color: var(--color-green); } .red { color: var(--color-red); }
    #error-msg { color: var(--color-red); font-size: 10px; text-align: center; display: none; margin-bottom: 5px; }
    hr { border: 0; border-top: 1px solid var(--border-color); margin: 5px 0; }
    .theme-btn { background: none; border: none; cursor: pointer; color: var(--text-main); padding: 0; }
`;
shadow.appendChild(style);

// 3. Создаем HTML структуру (Добавлен id="tww-symbol" и блок ошибок)
const wrapper = document.createElement('div');
wrapper.className = 'tww-wrapper';
wrapper.innerHTML = `
    <div class="header" id="drag-header">
        <div style="width: 15px;"></div>
        <h2 id="tww-title">📊 <span id="tww-symbol">...</span> Calc</h2>
        <button id="theme-toggle" class="theme-btn">☀️</button>
    </div>
    <div id="calc-form">
        <div class="direction-toggle">
            <input type="radio" id="dir_long" name="direction" value="long" checked><label for="dir_long">LONG</label>
            <input type="radio" id="dir_short" name="direction" value="short"><label for="dir_short">SHORT</label>
        </div>
        <div class="flex-row">
            <div><label>Депозит</label><input type="number" id="deposit" value="1000"></div>
            <div><label>Риск %</label><input type="number" id="risk" value="1" step="0.1"></div>
        </div>
        <div class="flex-row">
            <div><label>Плечо</label><input type="number" id="leverage" value="10"></div>
            <div><label>Ком-ия %</label><input type="number" id="fee_pct" value="0.05" step="0.01"></div>
        </div>
        <div class="section-title">Параметры сделки</div>
        <div><label>Вход (Entry)</label><input type="number" id="entry" placeholder="Цена..."></div>
        <div class="flex-row">
            <div style="flex: 1.2;"><select id="sl_mode"><option value="price">SL Цена</option><option value="percent">SL %</option></select></div>
            <div><input type="number" id="sl_value" placeholder="Знач."></div>
        </div>
        <div class="flex-row">
            <div style="flex: 1.2;"><select id="tp_mode"><option value="ratio">TP R/R</option><option value="price">TP Цена</option></select></div>
            <div><input type="number" id="tp_value" value="2"></div>
        </div>
    </div>
    <div id="result">
        <div id="error-msg"></div>
        <div class="result-row"><span>Объем:</span> <span id="out-vol" class="highlight"></span></div>
        <div class="result-row"><span>Маржа:</span> <span id="out-margin"></span></div>
        <hr>
        <div class="result-row"><span>SL:</span> <span id="out-sl" class="red"></span></div>
        <div class="result-row"><span>TP:</span> <span id="out-tp" class="green"></span></div>
        <div class="result-row"><span>R/R:</span> <span id="out-rr" style="color:var(--color-neutral)"></span></div>
        <hr>
        <div class="result-row"><span>Чистый Profit:</span> <span id="out-profit" class="green highlight"></span></div>
        <div class="result-row"><span>Чистый Loss:</span> <span id="out-loss" class="red"></span></div>
    </div>
`;
shadow.appendChild(wrapper);
document.body.appendChild(container);

// 4. Поиск данных в DOM (Раздельная логика для TV и MEXC - Без дублей Calc)
function getMarketData() {
    const host = window.location.hostname;
    let price = null;
    let symbol = "T-W-W";

    // --- 1. ПОИСК ЦЕНЫ (Универсальный) ---
    let priceEl = document.querySelector('.ticker-price') || 
                  document.querySelector('[data-qa-id="details-element price"] [data-qa-id="value"]') ||
                  document.querySelector('.js-symbol-last span') ||
                  document.querySelector('[class*="currentPrice"]');
    
    if (priceEl && priceEl.innerText.trim().length > 0) {
        // Убираем всё, кроме цифр и точек, запятую меняем на точку
        const cleanPrice = priceEl.innerText.replace(',', '.').replace(/[^0-9.]/g, '');
        price = parseFloat(cleanPrice);
    } 

    // Запасной вариант цены из заголовка вкладки
    if (!price || isNaN(price)) {
        const titleMatch = document.title.match(/[\d]+[.,][\d]+/);
        if (titleMatch) price = parseFloat(titleMatch[0].replace(',', '.'));
    }

    // --- 2. РАЗДЕЛЬНЫЙ ПОИСК ТИКЕРА ---
    try {
        if (host.includes('tradingview.com')) {
            // Для TV берем из элемента над графиком
            const tvSymbolEl = document.querySelector('.js-button-text.text-3Z_PzYpS') || 
                               document.querySelector('[data-name="legend-source-title"]');
            
            if (tvSymbolEl) {
                symbol = tvSymbolEl.innerText;
            } else {
                symbol = document.title.split(' ')[0];
            }

        } else if (host.includes('mexc.com')) {
            // Для MEXC берем из URL (самое стабильное решение)
            const urlParts = window.location.pathname.split(/[/_]/).filter(s => s.length > 2);
            let mexcSymbol = urlParts[urlParts.length - 1] || "";
            if (mexcSymbol.toUpperCase() === "USDT") {
                mexcSymbol = urlParts[urlParts.length - 2] || "";
            }
            symbol = mexcSymbol;
        }
    } catch (e) {
        symbol = "T-W-W";
    }

    // --- 3. ФИНАЛЬНАЯ ОЧИСТКА ---
    // Убираем цифры, мусор, но оставляем точки (для ADA.P)
    let cleanSymbol = symbol
        .replace(/[0-9]/g, '') 
        .replace(/USDT|PERP|MUSD|Фьючерсы|Контракт|Бессрочный/gi, '')
        .trim()
        .toUpperCase();

    // Возвращаем только чистый тикер (Calc добавится автоматически из HTML)
    return { 
        price: (price && !isNaN(price)) ? price : null, 
        symbol: (cleanSymbol || "T-W-W") 
    };
}

// 5. Работа с памятью (Автосохранение настроек)
function syncSettings(action = 'save') {
    const fields = ['deposit', 'risk', 'leverage', 'fee_pct'];
    if (action === 'save') {
        const data = {}; fields.forEach(f => data[f] = shadow.getElementById(f).value);
        chrome.storage.local.set({ tww_prefs: data });
    } else {
        chrome.storage.local.get(['tww_prefs'], (res) => {
            if (res.tww_prefs) fields.forEach(f => shadow.getElementById(f).value = res.tww_prefs[f]);
        });
    }
}
syncSettings('load');

// 6. Математическое ядро (Реактивный расчет)
function calculate() {
    const err = shadow.getElementById('error-msg');
    err.style.display = 'none';
    
    const dep = parseFloat(shadow.getElementById('deposit').value);
    const ent = parseFloat(shadow.getElementById('entry').value);
    const slV = parseFloat(shadow.getElementById('sl_value').value);
    const isL = shadow.querySelector('input[name="direction"]:checked').value === 'long';

    if (!dep || !ent || !slV) return;
    syncSettings('save');

    let slP = shadow.getElementById('sl_mode').value === 'price' ? slV : (isL ? ent*(1-slV/100) : ent*(1+slV/100));
    let stopPct = Math.abs(ent - slP) / ent;

    if ((isL && slP >= ent) || (!isL && slP <= ent)) {
        err.innerText = "Ошибка: SL не в ту сторону"; err.style.display = 'block'; return;
    }

    const tpM = shadow.getElementById('tp_mode').value;
    const tpV = parseFloat(shadow.getElementById('tp_value').value);
    let tpP = tpM === 'ratio' ? (isL ? ent + (Math.abs(ent-slP)*tpV) : ent - (Math.abs(ent-slP)*tpV)) : tpV;

    const risk$ = dep * (parseFloat(shadow.getElementById('risk').value)/100);
    const fees = (parseFloat(shadow.getElementById('fee_pct').value)/100 * 2);
    const vol = risk$ / (stopPct + fees);

    shadow.getElementById('out-vol').innerText = vol.toFixed(2) + " $";
    shadow.getElementById('out-margin').innerText = (vol / parseFloat(shadow.getElementById('leverage').value)).toFixed(2) + " $";
    shadow.getElementById('out-sl').innerText = slP.toFixed(4);
    shadow.getElementById('out-tp').innerText = tpP.toFixed(4);
    shadow.getElementById('out-rr').innerText = "1 : " + (Math.abs(ent-tpP)/Math.abs(ent-slP)).toFixed(2);
    shadow.getElementById('out-loss').innerText = "-" + risk$.toFixed(2) + " $";
    shadow.getElementById('out-profit').innerText = "+" + (vol * (Math.abs(ent-tpP)/ent) - (vol*fees/2)).toFixed(2) + " $";
}

// 7. Обработка событий (Обновленная версия для мгновенного тикера)
chrome.runtime.onMessage.addListener(req => {
    if (req.action === "toggleCalculator") {
        const vis = container.style.display === "none";
        container.style.display = vis ? "block" : "none";
        
        if (vis) {
            // МГНОВЕННОЕ ОБНОВЛЕНИЕ при открытии (до начала интервала)
            const initialData = getMarketData();
            shadow.getElementById('tww-symbol').innerText = initialData.symbol;
            if (initialData.price) {
                shadow.getElementById('entry').value = initialData.price;
                calculate();
            }

            // Запуск регулярного обновления
            liveIdx = setInterval(() => {
                const data = getMarketData();
                shadow.getElementById('tww-symbol').innerText = data.symbol;
                if (shadow.activeElement !== shadow.getElementById('entry') && data.price) {
                    shadow.getElementById('entry').value = data.price; 
                    calculate();
                }
            }, 1000);
        } else {
            clearInterval(liveIdx);
        }
    }
});

// 8. Темы и перетаскивание
shadow.getElementById('theme-toggle').onclick = () => {
    const t = container.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    container.setAttribute('data-theme', t);
};
let isD = false, ox, oy;
shadow.getElementById('drag-header').onmousedown = e => { isD = true; ox = e.clientX - container.offsetLeft; oy = e.clientY - container.offsetTop; };
document.onmousemove = e => { if(isD) { container.style.left = (e.clientX-ox)+'px'; container.style.top = (e.clientY-oy)+'px'; container.style.right='auto'; } };
document.onmouseup = () => isD = false;