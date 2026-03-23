// background.js

// Слушаем клик по иконке расширения в панели браузера
chrome.action.onClicked.addListener((tab) => {
    
    // Проверяем, что мы не пытаемся открыть калькулятор на служебных страницах вроде chrome://extensions/
    if (tab.url && !tab.url.includes("chrome://")) {
        
        // Отправляем секретный сигнал 'toggleCalculator' в активную вкладку
        chrome.tabs.sendMessage(tab.id, { action: "toggleCalculator" }).catch((err) => {
            // Если content.js еще не успел загрузиться на страницу, ничего не делаем
            console.log("Скрипт еще не внедрен на эту страницу.", err);
        });
    }
});