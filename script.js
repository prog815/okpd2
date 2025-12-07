document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Добавляем уникальные ID
    const dataWithIds = okpd2Data.map((item, index) => ({
        ...item,
        id: index.toString()
    }));
    
    console.log(`✅ Данные загружены. Записей: ${dataWithIds.length}`);
    
    // Основная функция поиска
    function performSearch(query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || trimmedQuery.length < 2) return [];
        
        // Если запрос содержит цифры И (начинается с цифры ИЛИ содержит точку)
        // Считаем, что это поиск по коду
        const hasDigits = /\d/.test(trimmedQuery);
        const startsWithDigitOrHasDot = /^\d|\./.test(trimmedQuery);
        
        if (hasDigits && startsWithDigitOrHasDot) {
            // ПОИСК ПО КОДУ: оставляем цифры, точки и удаляем все остальное
            const cleanQuery = trimmedQuery.replace(/[^\d\.]/g, '');
            
            // Ищем все записи, чей код НАЧИНАЕТСЯ с cleanQuery
            return dataWithIds.filter(item => {
                return item.code.startsWith(cleanQuery);
            });
        }
        // Иначе - поиск по названию (по подстроке)
        else {
            const searchLower = trimmedQuery.toLowerCase();
            const words = searchLower.split(/\s+/).filter(w => w.length > 0);
            
            if (words.length === 0) return [];
            
            // Ищем ВСЕ записи, где ВСЕ слова есть в названии
            return dataWithIds.filter(item => {
                const nameLower = item.name.toLowerCase();
                
                if (words.length === 1) {
                    return nameLower.includes(words[0]);
                } else if (words.length > 1) {
                    return words.every(word => nameLower.includes(word));
                }
                return false;
            });
        }
    }
    
    // Функция отображения результатов
    function displayResults(results, query) {
        if (!query || query.length < 2) {
            resultsContainer.innerHTML = '<div class="initial-message">Введите 2 или более символов для поиска</div>';
            return;
        }
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    По запросу "<strong>${query}</strong>" ничего не найдено.<br>
                    Попробуйте другие ключевые слова.
                </div>
            `;
            return;
        }
        
        // Сортируем результаты для лучшего отображения
        const sortedResults = sortResults(results, query);
        
        // Показываем первые 50 результатов
        const displayResults = sortedResults.slice(0, 50);
        
        const resultsHtml = displayResults.map(item => `
            <div class="result-item">
                <div class="result-code-container">
                    <span class="result-code">${highlightMatch(item.code, query)}</span>
                    <button class="copy-btn" data-code="${item.code}" title="Копировать код">
                        📋
                    </button>
                </div>
                <div class="result-name">${highlightMatch(item.name, query)}</div>
            </div>
        `).join('');
        
        resultsContainer.innerHTML = `
            <div class="results-count">
                По запросу "<strong>${query}</strong>" найдено: <strong>${results.length}</strong> записей 
                ${results.length > 50 ? `(показано: ${displayResults.length})` : ''}
            </div>
            ${resultsHtml}
            ${results.length > 50 ? 
                `<div class="more-results">И ещё ${results.length - 50} записей... 
                 <button id="showAllBtn" class="show-all-btn">Показать все</button></div>` 
                : ''}
        `;
        
        // Добавляем обработчик кнопки "Показать все"
        if (results.length > 50) {
            document.getElementById('showAllBtn').addEventListener('click', function() {
                const allResultsHtml = sortedResults.map(item => `
                    <div class="result-item">
                        <div class="result-code-container">
                            <span class="result-code">${highlightMatch(item.code, query)}</span>
                            <button class="copy-btn" data-code="${item.code}" title="Копировать код">
                                📋
                            </button>
                        </div>
                        <div class="result-name">${highlightMatch(item.name, query)}</div>
                    </div>
                `).join('');
                
                resultsContainer.innerHTML = `
                    <div class="results-count">
                        По запросу "<strong>${query}</strong>" найдено: <strong>${results.length}</strong> записей
                    </div>
                    ${allResultsHtml}
                `;
            });
        }
    }
    
    // Сортировка результатов (более релевантные выше)
    function sortResults(results, query) {
        const queryLower = query.toLowerCase();
        const hasDigits = /\d/.test(query);
        const startsWithDigitOrHasDot = /^\d|\./.test(query);
        const isCodeSearch = hasDigits && startsWithDigitOrHasDot;
        const cleanQuery = isCodeSearch ? query.replace(/[^\d\.]/g, '') : '';
        
        return [...results].sort((a, b) => {
            // Если поиск по коду
            if (isCodeSearch) {
                // Приоритет 1: точное совпадение кода
                if (a.code === cleanQuery) return -1;
                if (b.code === cleanQuery) return 1;
                
                // Приоритет 2: более короткие коды (более общие) выше
                return a.code.length - b.code.length;
            }
            // Если поиск по названию
            else {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                
                // Приоритет 1: слово начинается с запроса
                const aStartsWith = aName.startsWith(queryLower) ? 1 : 0;
                const bStartsWith = bName.startsWith(queryLower) ? 1 : 0;
                if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith;
                
                // Приоритет 2: более короткие названия (как правило, более общие)
                return aName.length - bName.length;
            }
        });
    }
    
    // Подсветка совпадений
    function highlightMatch(text, query) {
        if (!query || query.length < 2) return text;
        
        // Если это похоже на поиск по коду (цифры и/или точки)
        const hasDigits = /\d/.test(query);
        const startsWithDigitOrHasDot = /^\d|\./.test(query);
        
        if (hasDigits && startsWithDigitOrHasDot) {
            const cleanQuery = query.replace(/[^\d\.]/g, '');
            if (text.startsWith(cleanQuery)) {
                return `<mark class="code-match">${cleanQuery}</mark>${text.substring(cleanQuery.length)}`;
            }
            return text;
        }
        
        // Подсветка для текстового поиска
        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        let highlighted = text;
        
        words.forEach(word => {
            if (word.length < 2) return;
            const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            highlighted = highlighted.replace(regex, '<mark>$1</mark>');
        });
        
        return highlighted;
    }
    
    // Обработчик ввода
    let searchTimeout;
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (!query) {
            resultsContainer.innerHTML = '<div class="initial-message">Введите код или название для поиска</div>';
            return;
        }
        
        // Дебаунсинг: ждём 200мс после последнего ввода
        searchTimeout = setTimeout(() => {
            const results = performSearch(query);
            displayResults(results, query);
        }, 200);
    });
    
    // Обработчик клавиши Enter для мгновенного поиска
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            const results = performSearch(query);
            displayResults(results, query);
        }
    });


    // Функция копирования кода в буфер обмена
    function setupCopyButtons() {
        document.addEventListener('click', function(e) {
            if (e.target.closest('.copy-btn')) {
                const copyBtn = e.target.closest('.copy-btn');
                const codeToCopy = copyBtn.getAttribute('data-code');
                
                copyToClipboard(codeToCopy, copyBtn);
            }
        });
    }
    
    // Основная функция копирования
    function copyToClipboard(text, button) {
        // Сохраняем оригинальный текст кнопки
        const originalHtml = button.innerHTML;
        
        // Пробуем использовать современный Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    showCopyFeedback(button, '✅');
                    setTimeout(() => {
                        button.innerHTML = originalHtml;
                    }, 1500);
                })
                .catch(err => {
                    console.error('Ошибка копирования:', err);
                    fallbackCopy(text, button, originalHtml);
                });
        } else {
            // Fallback для старых браузеров
            fallbackCopy(text, button, originalHtml);
        }
    }
    
    // Fallback метод копирования
    function fallbackCopy(text, button, originalHtml) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopyFeedback(button, '✅');
            } else {
                showCopyFeedback(button, '❌');
            }
        } catch (err) {
            console.error('Ошибка fallback копирования:', err);
            showCopyFeedback(button, '❌');
        } finally {
            document.body.removeChild(textArea);
            setTimeout(() => {
                button.innerHTML = originalHtml;
            }, 1500);
        }
    }
    
    // Показ обратной связи
    function showCopyFeedback(button, icon) {
        button.innerHTML = icon;
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 1500);
    }
    
    // Инициализация кнопок копирования
    setupCopyButtons();
});