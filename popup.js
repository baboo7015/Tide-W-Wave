document.addEventListener('DOMContentLoaded', function () {

    // --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ТЕМЫ ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('tide-v-wave-theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    themeToggleBtn.innerText = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('tide-v-wave-theme', newTheme);
        themeToggleBtn.innerText = newTheme === 'dark' ? '☀️' : '🌙';
    });

    // --- ЛОГИКА КАЛЬКУЛЯТОРА ---
    document.getElementById('calc-btn').addEventListener('click', calculate);

    function calculate() {
        const dep = parseFloat(document.getElementById('deposit').value);
        const riskPct = parseFloat(document.getElementById('risk').value);
        const leverage = parseFloat(document.getElementById('leverage').value);
        const feePctInput = parseFloat(document.getElementById('fee_pct').value);
        const slippagePctInput = parseFloat(document.getElementById('slippage_pct').value);
        const entry = parseFloat(document.getElementById('entry').value);

        const isLong = document.querySelector('input[name="direction"]:checked').value === 'long';

        const slMode = document.getElementById('sl_mode').value;
        const slInputValue = parseFloat(document.getElementById('sl_value').value);

        const tpMode = document.getElementById('tp_mode').value;
        const tpInputValue = parseFloat(document.getElementById('tp_value').value);

        // Разрешаем комиссии и проскальзыванию быть равными 0, но запрещаем быть пустыми (NaN)
        if (!dep || !riskPct || !leverage || !entry || !slInputValue || !tpInputValue || isNaN(feePctInput) || isNaN(slippagePctInput)) {
            alert("Пожалуйста, заполните все поля корректно!");
            return;
        }

        const feeDecimal = feePctInput / 100;
        const slippageDecimal = slippagePctInput / 100;

        // Расчет SL
        let slPrice, slDistanceAbs, stopDistancePct;
        if (slMode === 'price') {
            slPrice = slInputValue;
            slDistanceAbs = Math.abs(entry - slPrice);
            stopDistancePct = slDistanceAbs / entry;
        } else if (slMode === 'percent') {
            stopDistancePct = slInputValue / 100;
            slDistanceAbs = entry * stopDistancePct;
            slPrice = isLong ? entry - slDistanceAbs : entry + slDistanceAbs;
        } else if (slMode === 'points') {
            slDistanceAbs = slInputValue;
            stopDistancePct = slDistanceAbs / entry;
            slPrice = isLong ? entry - slDistanceAbs : entry + slDistanceAbs;
        }

        if (isLong && slPrice >= entry) { alert("Ошибка: Для LONG Стоп-лосс должен быть НИЖЕ входа."); return; }
        if (!isLong && slPrice <= entry) { alert("Ошибка: Для SHORT Стоп-лосс должен быть ВЫШЕ входа."); return; }

        // Расчет TP
        let tpPrice, actualRR;
        if (tpMode === 'ratio') {
            actualRR = tpInputValue;
            tpPrice = isLong ? entry + (slDistanceAbs * actualRR) : entry - (slDistanceAbs * actualRR);
        } else if (tpMode === 'price') {
            tpPrice = tpInputValue;
            let tpDistanceAbs = Math.abs(entry - tpPrice);
            actualRR = tpDistanceAbs / slDistanceAbs;
        } else if (tpMode === 'percent') {
            let tpDist = entry * (tpInputValue / 100);
            tpPrice = isLong ? entry + tpDist : entry - tpDist;
            actualRR = tpDist / slDistanceAbs;
        } else if (tpMode === 'points') {
            tpPrice = isLong ? entry + tpInputValue : entry - tpInputValue;
            actualRR = tpInputValue / slDistanceAbs;
        }

        if (isLong && tpPrice <= entry) { alert("Ошибка: Для LONG Тейк-профит должен быть ВЫШЕ входа."); return; }
        if (!isLong && tpPrice >= entry) { alert("Ошибка: Для SHORT Тейк-профит должен быть НИЖЕ входа."); return; }

        // Математика позиции
        const riskInDollars = dep * (riskPct / 100);
        // Теперь издержки считаются динамически на основе ввода пользователя
        const totalFeesAndSlippage = (feeDecimal * 2) + slippageDecimal;

        const positionVolume = riskInDollars / (stopDistancePct + totalFeesAndSlippage);
        const requiredMargin = positionVolume / leverage;
        const estimatedFees = positionVolume * totalFeesAndSlippage;

        if (requiredMargin > dep) {
            alert(`Недостаточно средств! Требуемая маржа (${requiredMargin.toFixed(2)}$) превышает депозит. Увеличьте плечо.`);
            return;
        }

        // РАСЧЕТ ПРИБЫЛИ
        const tpDistancePct = Math.abs(entry - tpPrice) / entry;
        const grossProfit = positionVolume * tpDistancePct;
        const netProfit = grossProfit - (positionVolume * feeDecimal);

        // РАСЧЕТ УБЫТКА
        const grossLoss = positionVolume * stopDistancePct;
        const netLoss = riskInDollars;

        // Вывод
        document.getElementById('out-vol').innerText = positionVolume.toFixed(2) + " USDT";
        document.getElementById('out-margin').innerText = requiredMargin.toFixed(2) + " USDT (x" + leverage + ")";
        document.getElementById('out-sl').innerText = slPrice.toFixed(2);
        document.getElementById('out-tp').innerText = tpPrice.toFixed(2);

        const rrElement = document.getElementById('out-actual-rr');
        rrElement.innerText = "1 : " + parseFloat(actualRR.toFixed(2));
        rrElement.className = actualRR >= 2 ? "green" : (actualRR >= 1.5 ? "neutral" : "red");

        document.getElementById('out-gross-profit').innerText = "+" + grossProfit.toFixed(2) + " $";
        document.getElementById('out-net-profit').innerText = "+" + netProfit.toFixed(2) + " $";

        document.getElementById('out-gross-loss').innerText = "-" + grossLoss.toFixed(2) + " $";
        document.getElementById('out-fee').innerText = "-" + estimatedFees.toFixed(2) + " $";
        document.getElementById('out-net-loss').innerText = "-" + netLoss.toFixed(2) + " $";

        document.getElementById('result').style.display = 'block';
    }
});