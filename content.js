// 1. Создаем контейнер-капсулу
const container = document.createElement('div');
container.id = 'tww-extension-root';
container.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    z-index: 99999999; display: none;
`;

// 2. Создаем Shadow DOM
const shadow = container.attachShadow({ mode: 'open' });

// 3. Добавляем стили
const style = document.createElement('style');
style.textContent = `
    :host {
        --bg-main: #121420; --bg-panel: #1e2233; --text-main: #ffffff;
        --text-muted: #8b8fa3; --border-color: #2a2d3a; --btn-blue: #2b6cb0;
        --btn-blue-hover: #2c5282; --color-green: #00b074; --color-red: #ff5e5e;
        --color-neutral: #f6c343;
    }
    :host([data-theme="light"]) {
        --bg-main: #f5f7fa; --bg-panel: #ffffff; --text-main: #111827;
        --text-muted: #6b7280; --border-color: #d1d5db; --btn-blue: #3b82f6;
        --btn-blue-hover: #2563eb; --color-green: #059669; --color-red: #dc2626;
        --color-neutral: #d97706;
    }
    .tww-wrapper {
        width: 320px; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 10px 12px; background-color: var(--bg-main); color: var(--text-main);
        border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .header {
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 8px;
        cursor: grab; user-select: none;
    }
    .header:active { cursor: grabbing; }
    h2 { margin: 0; font-size: 14px; color: var(--text-main); text-align: center; flex-grow: 1; pointer-events: none; }
    .theme-btn { background: none; border: none; font-size: 14px; cursor: pointer; padding: 0; color: var(--text-main); width: auto; margin: 0; }
    .section-title { font-size: 10px; color: var(--text-muted); text-transform: uppercase; margin: 6px 0 2px 0; letter-spacing: 0.5px; }
    label { display: block; margin-bottom: 2px; font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    input, select {
        width: 100%; box-sizing: border-box; padding: 4px 6px; margin-bottom: 4px;
        background-color: var(--bg-panel); border: 1px solid var(--border-color); 
        color: var(--text-main); border-radius: 4px; outline: none; font-size: 12px;
    }
    input:focus, select:focus { border-color: var(--color-green); }
    .flex-row { display: flex; gap: 8px; }
    .flex-row > div { flex: 1; min-width: 0; }
    .direction-toggle { display: flex; margin-bottom: 6px; background: var(--bg-panel); border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color); }
    .direction-toggle label { flex: 1; text-align: center; padding: 4px 0; margin: 0; cursor: pointer; font-size: 11px; font-weight: bold; color: var(--text-muted); transition: 0.2s; }
    .direction-toggle input { display: none; }
    .direction-toggle input[value="long"]:checked + label { background-color: var(--color-green); color: white; }
    .direction-toggle input[value="short"]:checked + label { background-color: var(--color-red); color: white; }
    .calc-btn { width: 100%; padding: 6px; background-color: var(--btn-blue); color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 2px; font-size: 13px; }
    .calc-btn:hover { background-color: var(--btn-blue-hover); }
    #result { margin-top: 6px; padding: 6px 8px; background-color: var(--bg-panel); border-radius: 4px; display: none; border: 1px solid var(--border-color); }
    .result-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 11px; }
    .highlight { font-weight: bold; color: var(--text-main); font-size: 12px; }
    .green { color: var(--color-green); font-weight: bold; }
    .red { color: var(--color-red); font-weight: bold; }
    .neutral { color: var(--color-neutral); font-weight: bold; }
    hr { border: 0; border-top: 1px solid var(--border-color); margin: 4px 0; }
    .small-text { font-size: 10px; color: var(--text-muted); }
`;
shadow.appendChild(style);

// 4. Добавляем HTML
const wrapper = document.createElement('div');
wrapper.className = 'tww-wrapper';
wrapper.innerHTML = `
    <div class="header" id="drag-header">
        <div style="width: 20px;"></div>
        <h2>📊 T-W-W Risk Calculator</h2>
        <button id="theme-toggle" class="theme-btn" title="Сменить тему">☀️</button>
    </div>
    <div class="direction-toggle">
        <input type="radio" id="dir_long" name="direction" value="long" checked>
        <label for="dir_long">🟢 LONG</label>
        <input type="radio" id="dir_short" name="direction" value="short">
        <label for="dir_short">🔴 SHORT</label>
    </div>
    <div class="section-title">Параметры счета</div>
    <div class="flex-row">
        <div><label>Депозит ($)</label><input type="number" id="deposit" value="1000"></div>
        <div><label>Риск (%)</label><input type="number" id="risk" value="1" step="0.1"></div>
    </div>
    <div class="flex-row">
        <div><label>Плечо</label><input type="number" id="leverage" value="10"></div>
        <div><label>Комиссия (%)</label><input type="number" id="fee_pct" value="0.05" step="0.01"></div>
        <div><label>Проскальз. (%)</label><input type="number" id="slippage_pct" value="0.03" step="0.01"></div>
    </div>
    <div class="section-title">Параметры сделки</div>
    <div><label>Цена входа (Entry)</label><input type="number" id="entry" placeholder="Авто-поиск..."></div>
    <div class="flex-row" style="align-items: flex-end;">
        <div style="flex: 1.2;">
            <label>Стоп-лосс (SL)</label>
            <select id="sl_mode">
                <option value="price">Цена ($)</option>
                <option value="percent">Процент (%)</option>
                <option value="points">Пункты</option>
            </select>
        </div>
        <div style="flex: 1;"><input type="number" id="sl_value" placeholder="Значение" step="0.01"></div>
    </div>
    <div class="flex-row" style="align-items: flex-end;">
        <div style="flex: 1.2;">
            <label>Тейк-профит (TP)</label>
            <select id="tp_mode">
                <option value="ratio">Коэфф. (R/R)</option>
                <option value="price">Цена ($)</option>
                <option value="percent">Процент (%)</option>
                <option value="points">Пункты</option>
            </select>
        </div>
        <div style="flex: 1;"><input type="number" id="tp_value" value="2" step="0.1"></div>
    </div>
    <button id="calc-btn" class="calc-btn">Рассчитать позицию</button>
    <div id="result">
        <div class="result-row"><span>Размер позиции:</span> <span id="out-vol" class="highlight"></span></div>
        <div class="result-row"><span>Необходимая маржа:</span> <span id="out-margin"></span></div>
        <hr>
        <div class="result-row"><span>Стоп-лосс:</span> <span id="out-sl" class="red"></span></div>
        <div class="result-row"><span>Тейк-профит:</span> <span id="out-tp" class="green"></span></div>
        <div class="result-row"><span>Фактический R/R:</span> <span id="out-actual-rr" class="neutral"></span></div>
        <hr>
        <div class="result-row small-text"><span>Прибыль по графику:</span> <span id="out-gross-profit" class="green"></span></div>
        <div class="result-row"><span>Чистая прибыль (TP):</span> <span id="out-net-profit" class="highlight green"></span></div>
        <hr>
        <div class="result-row small-text"><span>Убыток по графику:</span> <span id="out-gross-loss" class="red"></span></div>
        <div class="result-row small-text"><span>Издержки (комиссии):</span> <span id="out-fee" class="red"></span></div>
        <div class="result-row"><span>Чистый убыток (SL):</span> <span id="out-net-loss" class="highlight red"></span></div>
    </div>
`;
shadow.appendChild(wrapper);
document.body.appendChild(container);

// 🔥 БЛОКИРУЕМ ПЕРЕХВАТ КЛАВИШ ТРЕЙДИНГВЬЮ
wrapper.addEventListener('keydown', (e) => e.stopPropagation());
wrapper.addEventListener('keyup', (e) => e.stopPropagation());
wrapper.addEventListener('keypress', (e) => e.stopPropagation());

// 5. Темы и перетаскивание
const themeBtn = shadow.getElementById('theme-toggle');
chrome.storage.local.get(['tww_theme'], function(result) {
    const theme = result.tww_theme || 'dark';
    container.setAttribute('data-theme', theme);
    themeBtn.innerText = theme === 'dark' ? '☀️' : '🌙';
});
themeBtn.addEventListener('click', () => {
    const newTheme = container.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    container.setAttribute('data-theme', newTheme);
    themeBtn.innerText = newTheme === 'dark' ? '☀️' : '🌙';
    chrome.storage.local.set({ tww_theme: newTheme });
});

const dragHeader = shadow.getElementById('drag-header');
let isDragging = false, offsetX, offsetY;
dragHeader.addEventListener('mousedown', (e) => { isDragging = true; offsetX = e.clientX - container.getBoundingClientRect().left; offsetY = e.clientY - container.getBoundingClientRect().top; });
document.addEventListener('mousemove', (e) => { if (!isDragging) return; container.style.left = `${e.clientX - offsetX}px`; container.style.top = `${e.clientY - offsetY}px`; container.style.right = 'auto'; });
document.addEventListener('mouseup', () => { isDragging = false; });

// 6. Парсинг цены (Новая версия с поддержкой TradingView QA атрибутов и русских запятых)
function fetchPriceFromDOM() {
    let priceText = null;
    const host = window.location.hostname;

    if (host.includes('tradingview.com')) {
        const priceEl = document.querySelector('[data-qa-id="details-element price"] [data-qa-id="value"]') ||
                        document.querySelector('.js-symbol-last span') || 
                        document.querySelector('.tv-symbol-price-quote__value') ||
                        document.querySelector('.js-symbol-lp span');
        
        if (priceEl) {
            priceText = priceEl.innerText;
        }
        
        if (!priceText && document.title) {
            const match = document.title.match(/[\d]+[.,][\d]+/);
            if (match) priceText = match[0];
        }
    } else if (host.includes('mexc.com')) {
        const priceEl = document.querySelector('.ticker-price') || 
                        document.querySelector('[class*="priceText"]') || 
                        document.querySelector('.current-price');
        if (priceEl) priceText = priceEl.innerText;
    }

    if (priceText) {
        // 🔥 МАГИЯ ЛОКАЛИЗАЦИИ: заменяем русскую запятую на математическую точку
        const normalizedText = priceText.replace(',', '.');
        
        // Очищаем от мусора (пробелов, букв) и превращаем в число
        const cleanPrice = parseFloat(normalizedText.replace(/[^0-9.]/g, ''));
        if (!isNaN(cleanPrice)) return cleanPrice;
    }
    return null;
}

// 7. Открытие/Закрытие + Умный Real-Time трекинг цены
let priceInterval = null;
let userEditedPrice = false;
const entryInput = shadow.getElementById('entry');

// Следим за тем, начал ли пользователь вводить цену руками (для лимиток)
entryInput.addEventListener('input', () => {
    userEditedPrice = true;
});

// Если пользователь стер свою цену, снова включаем авто-трекинг
entryInput.addEventListener('blur', () => {
    if (entryInput.value.trim() === '') {
        userEditedPrice = false;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleCalculator") {
        const isHidden = container.style.display === "none";
        
        if (isHidden) {
            // Окно открывается!
            container.style.display = "block";
            userEditedPrice = false; // Сбрасываем флаг ручного ввода
            
            // Мгновенно подставляем цену при открытии
            const currentPrice = fetchPriceFromDOM();
            if (currentPrice) entryInput.value = currentPrice;

            // Запускаем живое обновление (каждые 500 миллисекунд)
            priceInterval = setInterval(() => {
                // Обновляем, только если юзер не вводит свою цену и курсор не в этом поле
                if (!userEditedPrice && shadow.activeElement !== entryInput) {
                    const livePrice = fetchPriceFromDOM();
                    if (livePrice) {
                        entryInput.value = livePrice;
                    }
                }
            }, 500);

        } else {
            // Окно закрывается! Останавливаем трекинг, чтобы не грузить процессор
            container.style.display = "none";
            if (priceInterval) {
                clearInterval(priceInterval);
                priceInterval = null;
            }
        }
    }
});

// 8. Математика
shadow.getElementById('calc-btn').addEventListener('click', () => {
    const dep = parseFloat(shadow.getElementById('deposit').value);
    const riskPct = parseFloat(shadow.getElementById('risk').value);
    const leverage = parseFloat(shadow.getElementById('leverage').value);
    const feePctInput = parseFloat(shadow.getElementById('fee_pct').value);
    const slippagePctInput = parseFloat(shadow.getElementById('slippage_pct').value);
    const entry = parseFloat(shadow.getElementById('entry').value);
    const isLong = shadow.querySelector('input[name="direction"]:checked').value === 'long';
    const slMode = shadow.getElementById('sl_mode').value;
    const slInputValue = parseFloat(shadow.getElementById('sl_value').value);
    const tpMode = shadow.getElementById('tp_mode').value;
    const tpInputValue = parseFloat(shadow.getElementById('tp_value').value);

    if (!dep || !riskPct || !leverage || !entry || !slInputValue || !tpInputValue || isNaN(feePctInput) || isNaN(slippagePctInput)) {
        alert("Пожалуйста, заполните все поля корректно!"); return;
    }

    const feeDecimal = feePctInput / 100;
    const slippageDecimal = slippagePctInput / 100;

    let slPrice, slDistanceAbs, stopDistancePct;
    if (slMode === 'price') { slPrice = slInputValue; slDistanceAbs = Math.abs(entry - slPrice); stopDistancePct = slDistanceAbs / entry; } 
    else if (slMode === 'percent') { stopDistancePct = slInputValue / 100; slDistanceAbs = entry * stopDistancePct; slPrice = isLong ? entry - slDistanceAbs : entry + slDistanceAbs; } 
    else if (slMode === 'points') { slDistanceAbs = slInputValue; stopDistancePct = slDistanceAbs / entry; slPrice = isLong ? entry - slDistanceAbs : entry + slDistanceAbs; }

    if (isLong && slPrice >= entry) { alert("Ошибка: Для LONG Стоп-лосс должен быть НИЖЕ входа."); return; }
    if (!isLong && slPrice <= entry) { alert("Ошибка: Для SHORT Стоп-лосс должен быть ВЫШЕ входа."); return; }

    let tpPrice, actualRR;
    if (tpMode === 'ratio') { actualRR = tpInputValue; tpPrice = isLong ? entry + (slDistanceAbs * actualRR) : entry - (slDistanceAbs * actualRR); } 
    else if (tpMode === 'price') { tpPrice = tpInputValue; let tpDistanceAbs = Math.abs(entry - tpPrice); actualRR = tpDistanceAbs / slDistanceAbs; } 
    else if (tpMode === 'percent') { let tpDist = entry * (tpInputValue / 100); tpPrice = isLong ? entry + tpDist : entry - tpDist; actualRR = tpDist / slDistanceAbs; } 
    else if (tpMode === 'points') { tpPrice = isLong ? entry + tpInputValue : entry - tpInputValue; actualRR = tpInputValue / slDistanceAbs; }

    if (isLong && tpPrice <= entry) { alert("Ошибка: Для LONG Тейк-профит должен быть ВЫШЕ входа."); return; }
    if (!isLong && tpPrice >= entry) { alert("Ошибка: Для SHORT Тейк-профит должен быть НИЖЕ входа."); return; }

    const riskInDollars = dep * (riskPct / 100);
    const totalFeesAndSlippage = (feeDecimal * 2) + slippageDecimal;
    const positionVolume = riskInDollars / (stopDistancePct + totalFeesAndSlippage);
    const requiredMargin = positionVolume / leverage;
    const estimatedFees = positionVolume * totalFeesAndSlippage;

    if (requiredMargin > dep) { alert(`Недостаточно средств! Требуемая маржа (${requiredMargin.toFixed(2)}$) превышает депозит.`); return; }

    const tpDistancePct = Math.abs(entry - tpPrice) / entry;
    const grossProfit = positionVolume * tpDistancePct;
    const netProfit = grossProfit - (positionVolume * feeDecimal);
    const grossLoss = positionVolume * stopDistancePct;
    const netLoss = riskInDollars;

    shadow.getElementById('out-vol').innerText = positionVolume.toFixed(2) + " USDT";
    shadow.getElementById('out-margin').innerText = requiredMargin.toFixed(2) + " USDT (x" + leverage + ")";
    shadow.getElementById('out-sl').innerText = slPrice.toFixed(2);
    shadow.getElementById('out-tp').innerText = tpPrice.toFixed(2);
    
    const rrElement = shadow.getElementById('out-actual-rr');
    rrElement.innerText = "1 : " + parseFloat(actualRR.toFixed(2));
    rrElement.className = actualRR >= 2 ? "green" : (actualRR >= 1.5 ? "neutral" : "red");

    shadow.getElementById('out-gross-profit').innerText = "+" + grossProfit.toFixed(2) + " $";
    shadow.getElementById('out-net-profit').innerText = "+" + netProfit.toFixed(2) + " $";
    shadow.getElementById('out-gross-loss').innerText = "-" + grossLoss.toFixed(2) + " $";
    shadow.getElementById('out-fee').innerText = "-" + estimatedFees.toFixed(2) + " $";
    shadow.getElementById('out-net-loss').innerText = "-" + netLoss.toFixed(2) + " $";

    shadow.getElementById('result').style.display = 'block';
});