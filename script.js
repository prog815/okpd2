document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Простой поиск (замените на MiniSearch для большого объёма данных)
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (!query) {
            resultsContainer.innerHTML = '<div class="initial-message">Введите запрос для поиска</div>';
            return;
        }
        
        const results = okpd2Data.filter(item => 
            item.code.toLowerCase().includes(query) || 
            item.name.toLowerCase().includes(query)
        );
        
        displayResults(results);
    });
    
    function displayResults(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">По вашему запросу ничего не найдено.</div>';
            return;
        }
        
        const resultsHtml = results.map(item => `
            <div class="result-item">
                <div class="result-code">${item.code}</div>
                <div class="result-name">${item.name}</div>
            </div>
        `).join('');
        
        resultsContainer.innerHTML = resultsHtml;
    }
});