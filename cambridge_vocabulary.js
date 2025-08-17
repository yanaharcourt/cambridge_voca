// ===================================================================
// CAMBRIDGE VOCABULARY - ЧАСТЬ 1: ИНИЦИАЛИЗАЦИЯ И УПРАВЛЕНИЕ ДАННЫМИ
// ===================================================================

class CambridgeVocabulary {
    constructor() {
        this.words = [];
        this.wordStats = {};
        this.currentFilter = 'studying';
        this.selectedWords = new Set();
        
        console.log('🚀 Initializing Cambridge Vocabulary...');
        this.init();
    }

    // Инициализация приложения
    init() {
        this.loadWordStats();
        this.initializeWordsFromHTML();
        this.setupEventListeners();
        this.updateStatistics();
        this.filterWordsByStatus();
        
        // Запуск обновлений с интервалами
        setTimeout(() => this.updateStatistics(), 500);
        setTimeout(() => this.filterWordsByStatus(), 1000);
        
        this.initializeFavoriteButtons();

        console.log('✅ Cambridge Vocabulary initialized');
    }

    // Загрузка статистики из localStorage
    loadWordStats() {
        try {
            this.wordStats = JSON.parse(localStorage.getItem('wordStats') || '{}');
            console.log('📊 Loaded word stats:', Object.keys(this.wordStats).length, 'entries');
        } catch (error) {
            console.error('❌ Error loading word stats:', error);
            this.wordStats = {};
        }
    }

    // Сохранение статистики в localStorage
    saveWordStats() {
        try {
            localStorage.setItem('wordStats', JSON.stringify(this.wordStats));
            console.log('💾 Word stats saved');
        } catch (error) {
            console.error('❌ Error saving word stats:', error);
        }
    }

    // Инициализация слов из HTML структуры
    initializeWordsFromHTML() {
        console.log('📖 Initializing words from HTML...');
        
        this.words = [];
        const wordCards = document.querySelectorAll('.word-card[data-word]');
        
        console.log(`Found ${wordCards.length} word cards in HTML`);
        
        wordCards.forEach(card => {
            const wordData = this.extractWordFromCard(card);
            if (wordData) {
                this.words.push(wordData);
            }
        });

        console.log(`✅ Initialized ${this.words.length} words from HTML`);
        
        // Сохраняем в localStorage для совместимости
        localStorage.setItem('cambridge_dictionary', JSON.stringify(this.words));
    }

    // Извлечение данных о слове из HTML карточки
    extractWordFromCard(card) {
        try {
            const wordText = card.dataset.word;
            const category = card.dataset.category || 'nouns';
            const level = card.dataset.level || 'pre-a1';
            
            const translationElement = card.querySelector('.word-translation');
            const phoneticElement = card.querySelector('.word-phonetics');
            const typeElement = card.querySelector('.word-type');
            
            if (!wordText || !translationElement) {
                console.warn('⚠️ Incomplete word data for:', wordText);
                return null;
            }

            return {
                text: wordText,
                translation: translationElement.textContent.trim(),
                phonetics: phoneticElement ? phoneticElement.textContent.trim() : '',
                type: typeElement ? typeElement.textContent.trim() : 'noun',
                category: category,
                level: level,
                dateAdded: Date.now(),
                favorite: false,
                synonyms: [],
                antonyms: [],
                example: '',
                definition: ''
            };
        } catch (error) {
            console.error('❌ Error extracting word from card:', error);
            return null;
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');

        // Переключатели вкладок (На изучении/Изучено)
        this.setupTabSwitchers();
        
        // Чекбоксы для выбора слов
        this.setupWordCheckboxes();
        
        // Кнопка "Учить слова"
        this.setupStudyButton();
        
        // Кнопки массовых действий
        this.setupBatchActions();
        
        // Кнопки действий со словами
        this.setupWordActions();
        
        // Фильтры и поиск
        this.setupFilters();
        
        // Слушатель изменений localStorage
        window.addEventListener('storage', () => {
            this.loadWordStats();
            this.updateStatistics();
            this.filterWordsByStatus();
        });

        console.log('✅ Event listeners set up');
    }

    // Настройка переключателей вкладок
    setupTabSwitchers() {
        const switcherBtns = document.querySelectorAll('.switcher-btn');
        
        switcherBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Убираем active со всех кнопок
                switcherBtns.forEach(b => b.classList.remove('active'));
                
                // Добавляем active к нажатой кнопке
                btn.classList.add('active');
                
                // Обновляем текущий фильтр
                this.currentFilter = btn.dataset.filter;
                
                console.log('🔄 Switched to tab:', this.currentFilter);
                
                // Очищаем выбранные слова при смене вкладки
                this.clearSelection();
                
                // Фильтруем слова
                this.filterWordsByStatus();

                // Пересчитываем числа в категориях под текущую вкладку
                this.updateCategoryVisibility();

                // Обновляем статистику
                this.updateStatistics();

            });
        });
    }

    // Настройка чекбоксов для слов
    setupWordCheckboxes() {
        // Добавляем чекбоксы к словам если их нет
        this.addCheckboxesToWords();
        
        // Обработчик для "Выбрать все"
        const selectAllCheckbox = document.querySelector('.select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                const wordCheckboxes = document.querySelectorAll('.word-checkbox:not(.select-all-checkbox)');
                const visibleCheckboxes = Array.from(wordCheckboxes).filter(cb => {
                    const card = cb.closest('.word-card');
                    return card && card.style.display !== 'none';
                });
                
                visibleCheckboxes.forEach(checkbox => {
                    checkbox.checked = selectAllCheckbox.checked;
                    this.updateWordSelection(checkbox);
                });
                
                this.updateStudyButton();
                this.updateBatchActions();
            });
        }
    }

    // Добавление чекбоксов к словам
    addCheckboxesToWords() {
        document.querySelectorAll('.word-card .word-header .word-actions').forEach(actionsDiv => {
            if (!actionsDiv.querySelector('.word-checkbox')) {
                const wordCard = actionsDiv.closest('.word-card');
                const wordText = wordCard.dataset.word;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'word-checkbox';
                checkbox.dataset.word = wordText;
                
                checkbox.addEventListener('change', () => {
                    this.updateWordSelection(checkbox);
                    this.updateStudyButton();
                    this.updateBatchActions();
                });
                
                actionsDiv.insertBefore(checkbox, actionsDiv.firstChild);
            }
        });
    }

    // Обновление выбора слова
    updateWordSelection(checkbox) {
        const word = checkbox.dataset.word;
        
        if (checkbox.checked) {
            this.selectedWords.add(word);
        } else {
            this.selectedWords.delete(word);
        }
    }

    // Настройка кнопки "Учить слова"
    setupStudyButton() {
        const studyButton = document.querySelector('.study-button');
        if (studyButton) {
            studyButton.addEventListener('click', () => {
                const selectedCount = this.selectedWords.size;
                
                if (selectedCount === 0) {
                    alert('Пожалуйста, сначала выберите слова для обучения');
                    return;
                }
                
                console.log('🎓 Starting training with', selectedCount, 'words');
                
                // Получаем выбранные слова
                const selectedWordsArray = Array.from(this.selectedWords);
                const wordsForTraining = this.words.filter(word => 
                    selectedWordsArray.includes(word.text)
                );
                
                // Запускаем тренировку
                window.wordTraining.selectedWords = wordsForTraining;
                window.wordTraining.count = selectedCount;
                window.wordTraining.initialize(selectedCount);
            });
        }
    }

    // Обновление кнопки "Учить слова"
    updateStudyButton() {
        const studyButton = document.querySelector('.study-button');
        if (!studyButton) return;
        
        const selectedCount = this.selectedWords.size;
        
        if (selectedCount > 0) {
            studyButton.classList.add('active');
            studyButton.textContent = `Учить слова (${selectedCount})`;
        } else {
            studyButton.classList.remove('active');
            studyButton.textContent = 'Учить слова';
        }
    }

    // Настройка массовых действий
    setupBatchActions() {
        const backBtn = document.getElementById('batchActionBack');
        const markLearnedBtn = document.getElementById('batchActionMarkLearned');
        const deleteBtn = document.getElementById('batchActionDelete');

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.clearSelection();
            });
        }

        if (markLearnedBtn) {
            markLearnedBtn.addEventListener('click', () => {
                this.batchMarkLearned();
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите удалить выбранные слова?')) {
                    this.batchDeleteWords();
                }
            });
        }
    }

    // Массовое отмечание слов как изученных/неизученных
    batchMarkLearned() {
        const selectedArray = Array.from(this.selectedWords);
        const isStudyingTab = this.currentFilter === 'studying';
        
        selectedArray.forEach(wordText => {
            if (!this.wordStats[wordText]) {
                this.wordStats[wordText] = { successfulAttempts: 0, lastAttemptDate: null };
            }
            
            if (isStudyingTab) {
                // Переводим в изученные
                this.wordStats[wordText].successfulAttempts = 1;
                this.wordStats[wordText].lastAttemptDate = new Date().toDateString();
            } else {
                // Возвращаем на изучение
                this.wordStats[wordText].successfulAttempts = 0;
                this.wordStats[wordText].lastAttemptDate = null;
            }
        });

        this.saveWordStats();
        this.clearSelection();
        this.filterWordsByStatus();
        this.updateStatistics();
        
        console.log(`✅ Batch ${isStudyingTab ? 'marked as learned' : 'returned to studying'}:`, selectedArray.length, 'words');
    }

    // Массовое удаление слов
    batchDeleteWords() {
        const selectedArray = Array.from(this.selectedWords);
        
        // Удаляем из статистики
        selectedArray.forEach(wordText => {
            delete this.wordStats[wordText];
        });
        
        // Удаляем карточки из DOM
        selectedArray.forEach(wordText => {
            const card = document.querySelector(`.word-card[data-word="${wordText}"]`);
            if (card) {
                card.remove();
            }
        });
        
        // Обновляем массив слов
        this.words = this.words.filter(word => !selectedArray.includes(word.text));
        
        this.saveWordStats();
        localStorage.setItem('cambridge_dictionary', JSON.stringify(this.words));
        
        this.clearSelection();
        this.updateStatistics();
        
        console.log('🗑️ Batch deleted:', selectedArray.length, 'words');
    }

    // Обновление видимости массовых действий
    updateBatchActions() {
        const batchActions = document.getElementById('batch-actions');
        const markLearnedBtn = document.getElementById('batchActionMarkLearned');
        
        if (!batchActions || !markLearnedBtn) return;
        
        const selectedCount = this.selectedWords.size;
        
        if (selectedCount > 0) {
            batchActions.style.display = 'block';
            
            // Меняем текст кнопки в зависимости от вкладки
            if (this.currentFilter === 'studying') {
                markLearnedBtn.textContent = 'Отметить как изученное';
            } else {
                markLearnedBtn.textContent = 'Вернуть на изучение';
            }
        } else {
            batchActions.style.display = 'none';
        }
    }

    // Очистка выбора
    clearSelection() {
        this.selectedWords.clear();
        
        // Снимаем все галочки
        document.querySelectorAll('.word-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.updateStudyButton();
        this.updateBatchActions();
    }

    // Настройка действий со словами (произношение, избранное, удаление)
    setupWordActions() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.classList.contains('pronounce')) {
                const wordCard = target.closest('.word-card');
                const wordText = wordCard.dataset.word;
                this.pronounceWord(wordText);
            }
            
            if (target.classList.contains('favorite')) {
                const wordCard = target.closest('.word-card');
                const wordText = wordCard.dataset.word;
                this.toggleFavorite(wordText, target);
            }
            
            if (target.classList.contains('delete')) {
                const wordCard = target.closest('.word-card');
                const wordText = wordCard.dataset.word;
                if (confirm(`Удалить слово "${wordText}"?`)) {
                    this.deleteWord(wordText);
                }
            }
        });
    }

    // Произношение слова
    pronounceWord(wordText) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(wordText);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    }

    // Переключение избранного
    toggleFavorite(wordText, button) {
        console.log('🌟 toggleFavorite called for:', wordText);
        
        const word = this.words.find(w => w.text === wordText);
        if (word) {
            word.favorite = !word.favorite;
            button.classList.toggle('active', word.favorite);
            
            // Обновляем в localStorage
            localStorage.setItem('cambridge_dictionary', JSON.stringify(this.words));
            
            console.log('✅ Word favorite status updated:', wordText, 'favorite:', word.favorite);
        } else {
            console.error('❌ Word not found in words array:', wordText);
        }
    }

    // Инициализация состояния кнопок избранного
    initializeFavoriteButtons() {
        console.log('⭐ Initializing favorite buttons...');
        
        document.querySelectorAll('.action-button.favorite').forEach(button => {
            const wordCard = button.closest('.word-card');
            if (wordCard) {
                const wordText = wordCard.dataset.word;
                const word = this.words.find(w => w.text === wordText);
                
                if (word && word.favorite) {
                    button.classList.add('active');
                }
            }
        });
        
        console.log('✅ Favorite buttons initialized');
    }

    // Удаление слова
    deleteWord(wordText) {
        // Удаляем из статистики
        delete this.wordStats[wordText];
        
        // Удаляем из массива слов
        this.words = this.words.filter(w => w.text !== wordText);
        
        // Удаляем из выбранных
        this.selectedWords.delete(wordText);
        
        // Удаляем карточку из DOM
        const card = document.querySelector(`.word-card[data-word="${wordText}"]`);
        if (card) {
            card.remove();
        }
        
        this.saveWordStats();
        localStorage.setItem('cambridge_dictionary', JSON.stringify(this.words));
        this.updateStatistics();
        this.updateStudyButton();
        this.updateBatchActions();
        
        console.log('🗑️ Deleted word:', wordText);
    }

    // Настройка фильтров
    setupFilters() {
        // Фильтр по избранным
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.filterByFavorites();
            });
        }

        // Поиск
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.searchWords(searchInput.value);
            });
        }

        // Фильтр по уровням
        const levelSelect = document.getElementById('levelSelect');
        if (levelSelect) {
            levelSelect.addEventListener('change', () => {
                this.filterByLevel(levelSelect.value);
            });
        }

        // Сортировка
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortWords(sortSelect.value);
            });
        }

        // Скрытие элементов
        const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.toggleElementVisibility(checkbox.dataset.target, checkbox.checked);
            });
        });
    }

    // Получение слова по тексту
    getWord(wordText) {
        return this.words.find(w => w.text === wordText);
    }

    // Проверка, изучено ли слово
    isWordLearned(wordText) {
        const stats = this.wordStats[wordText];
        return stats && stats.successfulAttempts >= 1;
    }
}

// Глобальная переменная для доступа к приложению
window.cambridgeApp = null;

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM Content Loaded - Starting Cambridge Vocabulary');
    window.cambridgeApp = new CambridgeVocabulary();
});

// ===================================================================
// CAMBRIDGE VOCABULARY - ЧАСТЬ 2: СТАТИСТИКА И ФИЛЬТРАЦИЯ
// ===================================================================

Object.assign(CambridgeVocabulary.prototype, {

    // Обновление статистики на странице
    updateStatistics() {
        console.log('📊 Updating statistics...');
        
        try {
            // Получаем элементы статистики
            const studyingEl = document.getElementById('words-studying');
            const learnedEl = document.getElementById('words-learned');
            const averageEl = document.getElementById('average-pace');
            const streakEl = document.getElementById('daily-record');
            
            if (!studyingEl || !learnedEl || !averageEl || !streakEl) {
                console.warn('⚠️ Statistics elements not found');
                return;
            }

            // Подсчитываем статистику
            let learnedCount = 0;
            let studyingCount = 0;
            
            this.words.forEach(word => {
                if (this.isWordLearned(word.text)) {
                    learnedCount++;
                } else {
                    studyingCount++;
                }
            });

            // Средний темп изучения
            const startDate = this.getStudyStartDate();
            const daysStudying = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
            const averagePace = learnedCount > 0 ? Math.round(learnedCount / daysStudying) : 0;

            // Дни подряд
            const streak = parseInt(localStorage.getItem('dailyStreak') || '0');

            // Обновляем отображение
            studyingEl.textContent = studyingCount;
            learnedEl.textContent = learnedCount;
            averageEl.textContent = averagePace;
            streakEl.textContent = streak;

            console.log('📈 Statistics updated:', {
                studying: studyingCount,
                learned: learnedCount,
                average: averagePace,
                streak: streak
            });

            this.updateSwitcherBadges();

        } catch (error) {
            console.error('❌ Error updating statistics:', error);
        }
    },

    // Получение даты начала изучения
    getStudyStartDate() {
        const stored = localStorage.getItem('studyStartDate');
        if (stored) {
            return new Date(stored);
        }
        
        const startDate = new Date();
        localStorage.setItem('studyStartDate', startDate.toISOString());
        return startDate;
    },

    // Фильтрация слов по статусу (на изучении/изучено)
    filterWordsByStatus() {
        console.log('🔍 Filtering words by status:', this.currentFilter);
        
        try {
            const allWordCards = document.querySelectorAll('.word-card[data-word]');
            let visibleCount = 0;
            let hiddenCount = 0;
            
            allWordCards.forEach(card => {
                const wordText = card.dataset.word;
                if (!wordText) return;
                
                const isLearned = this.isWordLearned(wordText);
                let shouldShow = false;
                
                if (this.currentFilter === 'studying') {
                    shouldShow = !isLearned;
                } else if (this.currentFilter === 'learned') {
                    shouldShow = isLearned;
                }
                
                if (shouldShow) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                    card.style.opacity = '0';
                    hiddenCount++;
                }
            });
            
            console.log(`👁️ Visible: ${visibleCount}, Hidden: ${hiddenCount}`);
            
            // Обновляем счетчики
            const wordCountElement = document.querySelector('.word-count');
            if (wordCountElement) {
                wordCountElement.textContent = `${visibleCount} words`;
            }
            this.updateSwitcherBadges();
            
            // Очищаем выбор при смене фильтра
            this.clearSelection();
            
        } catch (error) {
            console.error('❌ Error filtering words:', error);
        }
    },

    updateWordCounts(visibleCount) {
    const wordCountElement = document.querySelector('.word-count');
    if (wordCountElement) {
        wordCountElement.textContent = `${visibleCount} words`;
    }
    
    this.updateSwitcherBadges();
},

// Новая функция для обновления бейджей
updateSwitcherBadges() {
    let studyingCount = 0;
    let learnedCount = 0;
    
    // Подсчитываем слова по статусу
    this.words.forEach(word => {
        if (this.isWordLearned(word.text)) {
            learnedCount++;
        } else {
            studyingCount++;
        }
    });
    
    // Обновляем бейджи
    const studyingBadge = document.getElementById('studying-count');
    const learnedBadge = document.getElementById('learned-count');
    
        if (studyingBadge) {
            studyingBadge.textContent = studyingCount;
        }
        
        if (learnedBadge) {
            learnedBadge.textContent = learnedCount;
        }
        
        console.log('📊 Switcher badges updated:', { studying: studyingCount, learned: learnedCount });
    },

    // Фильтрация по избранным
    filterByFavorites() {
        const filterSelect = document.getElementById('filterSelect');
        if (!filterSelect) return;
        
        const showOnlyFavorites = filterSelect.value === 'favorites';
        
        document.querySelectorAll('.word-card').forEach(card => {
            const wordText = card.dataset.word;
            const word = this.getWord(wordText);
            
            if (!word) return;
            
            // Применяем основной фильтр статуса
            const isLearned = this.isWordLearned(wordText);
            const matchesStatus = this.currentFilter === 'studying' ? !isLearned : isLearned;
            
            // Применяем фильтр избранного
            const matchesFavorites = !showOnlyFavorites || word.favorite;
            
            if (matchesStatus && matchesFavorites) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        this.updateVisibleWordsCount();
        console.log('⭐ Filtered by favorites:', showOnlyFavorites);
    },

    // Поиск по словам
    searchWords(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        document.querySelectorAll('.word-card').forEach(card => {
            const wordText = card.dataset.word ? card.dataset.word.toLowerCase() : '';
            const translationElement = card.querySelector('.word-translation');
            const translation = translationElement ? translationElement.textContent.toLowerCase() : '';
            
            const matchesSearch = !term || wordText.includes(term) || translation.includes(term);
            
            // Также проверяем статус и избранное
            const isLearned = this.isWordLearned(card.dataset.word);
            const matchesStatus = this.currentFilter === 'studying' ? !isLearned : isLearned;
            
            const filterSelect = document.getElementById('filterSelect');
            const showOnlyFavorites = filterSelect && filterSelect.value === 'favorites';
            const word = this.getWord(card.dataset.word);
            const matchesFavorites = !showOnlyFavorites || (word && word.favorite);
            
            if (matchesSearch && matchesStatus && matchesFavorites) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        this.updateVisibleWordsCount();
        console.log('🔎 Search applied:', term);
    },

    // Фильтрация по уровням
    filterByLevel(level) {
        document.querySelectorAll('.word-card').forEach(card => {
            const cardLevel = card.dataset.level;
            const matchesLevel = level === 'all' || cardLevel === level;
            
            // Также проверяем статус, избранное и поиск
            const isLearned = this.isWordLearned(card.dataset.word);
            const matchesStatus = this.currentFilter === 'studying' ? !isLearned : isLearned;
            
            const filterSelect = document.getElementById('filterSelect');
            const showOnlyFavorites = filterSelect && filterSelect.value === 'favorites';
            const word = this.getWord(card.dataset.word);
            const matchesFavorites = !showOnlyFavorites || (word && word.favorite);
            
            const searchInput = document.getElementById('searchInput');
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const wordText = card.dataset.word ? card.dataset.word.toLowerCase() : '';
            const translationElement = card.querySelector('.word-translation');
            const translation = translationElement ? translationElement.textContent.toLowerCase() : '';
            const matchesSearch = !searchTerm || wordText.includes(searchTerm) || translation.includes(searchTerm);
            
            if (matchesLevel && matchesStatus && matchesFavorites && matchesSearch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        this.updateVisibleWordsCount();
        this.updateCategoryVisibility();
        console.log('📊 Filtered by level:', level);
    },

    // Обновление видимости категорий
    updateCategoryVisibility() {
    const categoryHeaders = document.querySelectorAll('.category-header');

    categoryHeaders.forEach(header => {
        const categorySection = header.parentElement;
        const countElement = header.querySelector('.category-count');

        // Берём все карточки внутри конкретной категории
        const cards = categorySection.querySelectorAll('.word-card[data-word]');

        // Счёт по активной вкладке
        let count = 0;
        cards.forEach(card => {
            const isLearned = this.isWordLearned(card.dataset.word);

            if (this.currentFilter === 'learned') {
                if (isLearned) count++;
            } else if (this.currentFilter === 'studying') {
                if (!isLearned) count++;
            } else {
                // Fallback: если по какой-то причине фильтр не задан — считаем реально отображаемые
                if (card.style.display !== 'none') count++;
            }
        });

        if (countElement) {
            countElement.textContent = count;
        }

        // Показываем/скрываем целиком секцию категории, исходя из количества
        categorySection.style.display = count === 0 ? 'none' : 'block';
    });
}
,

    // Подсчет видимых слов
    updateVisibleWordsCount() {
        const visibleCards = document.querySelectorAll('.word-card:not([style*="none"])');
        const count = visibleCards.length;
        
        this.updateWordCounts(count);
        return count;
    },

    // Сортировка слов
    sortWords(sortBy) {
        const categoryContent = document.querySelector('.category-content .words-grid');
        if (!categoryContent) return;
        
        const wordCards = Array.from(categoryContent.querySelectorAll('.word-card'));
        
        wordCards.sort((a, b) => {
            const wordA = this.getWord(a.dataset.word);
            const wordB = this.getWord(b.dataset.word);
            
            if (!wordA || !wordB) return 0;
            
            switch (sortBy) {
                case 'alphabetical':
                    return wordA.text.localeCompare(wordB.text);
                case 'date':
                default:
                    return (wordB.dateAdded || 0) - (wordA.dateAdded || 0);
            }
        });
        
        // Переставляем карточки в DOM
        wordCards.forEach(card => {
            categoryContent.appendChild(card);
        });
        
        console.log('🔄 Words sorted by:', sortBy);
    },

    // Переключение видимости элементов
    toggleElementVisibility(targetSelector, isVisible) {
        const elements = document.querySelectorAll(targetSelector);
        
        elements.forEach(element => {
            if (element) {
                element.style.display = isVisible ? '' : 'none';
            }
        });
        
        console.log('👁️ Toggle visibility for', targetSelector, ':', isVisible);
    },

    // Обновление статистики после тренировки
    updateTrainingStats(correctAnswers, totalQuestions, selectedWords) {
        try {
            console.log('🏋️ Updating training stats...');
            console.log(`📊 Results: ${correctAnswers}/${totalQuestions} correct`);
            
            const successRate = correctAnswers / totalQuestions;
            const successPercentage = Math.round(successRate * 100);
            
            console.log(`📈 Success rate: ${successPercentage}%`);
            
            const today = new Date().toDateString();

            // Обновляем статистику только если результат 90% и выше
            if (successRate >= 0.9) {
                console.log('🎉 Great result! Marking words as learned...');
                
                selectedWords.forEach(word => {
                    const wordText = word.text;
                    console.log(`✅ Marking "${wordText}" as learned`);
                    
                    if (!this.wordStats[wordText]) {
                        this.wordStats[wordText] = {
                            successfulAttempts: 0,
                            learnedDate: null,
                            lastAttemptDate: null
                        };
                    }
                    
                    const stats = this.wordStats[wordText];
                    
                    // Отмечаем как изученное
                    if (stats.lastAttemptDate !== today || stats.successfulAttempts === 0) {
                        stats.successfulAttempts = Math.max(1, stats.successfulAttempts);
                        stats.lastAttemptDate = today;
                        
                        if (!stats.learnedDate) {
                            stats.learnedDate = today;
                        }
                    }
                });

                // Обновляем streak (дни подряд)
                this.updateStreakAfterTraining(today);
                
                this.saveWordStats();
                console.log('💾 Word stats saved to localStorage');
                
            } else {
                console.log('📚 Result below 90%, words remain in studying');
            }

            // Обновляем интерфейс
            setTimeout(() => {
                this.updateStatistics();
                this.filterWordsByStatus();
            }, 500);
            
            console.log('🎯 Training stats update completed');
            
        } catch (error) {
            console.error('❌ Error updating training stats:', error);
        }
    },

    // Обновление streak после тренировки
    updateStreakAfterTraining(today) {
        try {
            let streak = parseInt(localStorage.getItem('dailyStreak') || '0');
            const lastActiveDate = localStorage.getItem('lastActiveDate');

            if (!lastActiveDate) {
                streak = 1;
            } else {
                const lastDate = new Date(lastActiveDate);
                const currentDate = new Date(today);
                const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    // Уже занимались сегодня
                } else if (diffDays === 1) {
                    streak += 1;
                } else {
                    streak = 1;
                }
            }

            localStorage.setItem('dailyStreak', streak.toString());
            localStorage.setItem('lastActiveDate', today);
            
            console.log(`🔥 Streak updated: ${streak}`);
            
        } catch (error) {
            console.error('❌ Error updating streak:', error);
        }
    }
});

// Дополнительные утилиты для второй части
console.log('✅ Statistics and filtering system loaded');

// ===================================================================
// CAMBRIDGE VOCABULARY - ЧАСТЬ 3: СИСТЕМА ТРЕНИРОВОК - ОСНОВА
// ===================================================================

class WordTraining {
    constructor() {
        this.selectedWords = [];
        this.currentCardIndex = 0;
        this.isFlipped = false;
        this.count = 0;
        this.activeModesSequence = [];
        this.currentModeIndex = 0;
        this.trainingModes = {
            flashcards: true,
            memory: true,
            fillblanks: true,
            translation: true,
            matching: true,
            spelling: true
        };
        this.totalCorrectAnswers = 0;
        
        console.log('🎓 WordTraining initialized');
    }

    // Инициализация тренировки
    initialize(selectedWordsCount) {
        this.count = selectedWordsCount;
        this.createTrainingModal(selectedWordsCount);
        console.log('🎯 Training initialized with', selectedWordsCount, 'words');
    }

    // Создание главного модального окна тренировки
    createTrainingModal(selectedWordsCount) {
        const modal = document.createElement('div');
        modal.id = 'wordTrainingModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
    
        const modesCount = Object.values(this.trainingModes).filter(Boolean).length;
        let modeWord;
        if (modesCount === 1) {
            modeWord = 'режим';
        } else if (modesCount > 1 && modesCount < 5) {
            modeWord = 'режима';
        } else {
            modeWord = 'режимов';
        }

        modal.innerHTML = `
            <style>
                .mode-checkbox {
                    appearance: none !important;
                    width: 20px !important;
                    height: 20px !important;
                    border-radius: 4px;
                    background-color: var(--card-bg) !important;
                    cursor: pointer;
                    position: relative;
                    border: 2px solid var(--card-stroke) !important;
                    transition: all 0.3s ease !important;
                }

                .mode-checkbox:checked {
                    background-color: var(--accent-color) !important;
                    border-color: var(--accent-color) !important;
                }

                .mode-checkbox:checked::after {
                    content: '✓';
                    position: absolute;
                    color: white !important;
                    font-size: 14px;
                    left: 50%;
                    top: 45%;
                    transform: translate(-50%, -50%);
                }

                .mode-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: var(--card-bg-tertiary) !important;
                    padding: 16px;
                    border-radius: 8px;
                    opacity: 0.7;
                    transition: all 0.3s ease;
                    border: 1px solid transparent;
                    cursor: pointer;
                }

                .mode-item:hover {
                    opacity: 0.9;
                    background: var(--card-bg-secondary) !important;
                    border-color: var(--card-stroke-secondary) !important;
                }

                .mode-item.active {
                    opacity: 1 !important;
                    border-color: var(--accent-color) !important;
                    background: var(--card-hover-secondary) !important;
                }
                
                .settings-btn:hover {
                    color: var(--accent-color) !important;
                }
                .settings-btn:hover svg {
                    stroke: var(--accent-color) !important;
                }
            </style>
            <div style="background: #f8f9ff; width: 95vw; max-width: 600px; border-radius: 12px; padding: 24px; margin: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <button class="close-modal" style="position: absolute; top: 20px; right: 20px; color: var(--card-text-tertiary); background: none; border: none; font-size: 32px; cursor: pointer; padding: 8px;">×</button>
                
                <div style="text-align: center; max-width: 400px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <div style="position: relative; text-align: center;">
                            <span style="position: absolute; top: -60px; left: 50%; transform: translateX(-50%); font-size: 70px;">📓</span>
                            <h2 style="font-size: 30px; font-weight: 700; color: var(--card-text-primary); margin-top: 45px;">Word Training</h2>
                        </div>
                        <p style="color: var(--card-text-tertiary); margin-top: 8px; font-size: 16px;">Слов на изучении: ${selectedWordsCount}</p>
                    </div>
                    
                    <div style="margin-top: 64px;">
                        <p style="color: var(--card-text-tertiary); margin-bottom: 24px; font-size: 16px;">Выберите количество слов</p>
                        
                        <div class="word-count-controls" style="display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 64px;">
                            <button class="minus-btn control-btn">-</button>
                            
                            <span class="word-count" style="font-size: 24px; color: var(--card-text-primary);">${selectedWordsCount}</span>
                            
                            <button class="plus-btn control-btn">+</button>
                        </div>

                        <button class="settings-btn" style="background: none; border: none; cursor: pointer; color: var(--card-text-tertiary); font-size: 18px; display: flex; align-items: center; gap: 8px; margin: 0 auto 64px; transition: all 0.3s ease;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            ${Object.values(this.trainingModes).filter(Boolean).length} ${modeWord}
                        </button>

                        <button class="start-training-btn" style="background: var(--accent-color) !important; color: white !important; padding: 12px 32px; border-radius: 8px; border: none; cursor: pointer; font-size: 16px; width: 100%; transition: all 0.3s ease;">
                            Начать тренировку
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.addModalEventListeners(modal);
    }

    // Обработчики событий главного модального окна
    addModalEventListeners(modal) {
        const self = this;
        
        // Кнопка закрытия
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Контроль количества слов
        const minusBtn = modal.querySelector('.minus-btn');
        const plusBtn = modal.querySelector('.plus-btn');
        const wordCountSpan = modal.querySelector('.word-count');

        minusBtn.addEventListener('click', () => {
            if (self.count > 1) {
                self.count--;
                wordCountSpan.textContent = self.count;
            }
        });

        plusBtn.addEventListener('click', () => {
            if (self.count < parseInt(wordCountSpan.textContent)) {
                self.count++;
                wordCountSpan.textContent = self.count;
            }
        });

        // Кнопка настроек режимов
        modal.querySelector('.settings-btn').addEventListener('click', () => {
            self.createModesModal();
        });

        // Кнопка начала тренировки
        modal.querySelector('.start-training-btn').addEventListener('click', () => {
            console.log('🚀 Start training button clicked');
            
            // Получаем выбранные слова
            self.selectedWords = self.getSelectedWords();
            console.log('📚 Selected words for training:', self.selectedWords);
            
            if (!self.selectedWords || self.selectedWords.length === 0) {
                alert('Не удалось найти слова для тренировки. Проверьте, что слова выбраны.');
                return;
            }
            
            modal.remove();
            self.startTraining();
        });
    }

    // Модальное окно выбора режимов тренировки
    createModesModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1001;
        `;

        modal.innerHTML = `
            <div style="background: var(--card-bg); width: 600px; max-width: 90vw; border-radius: 12px; padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="color: var(--card-text-primary); font-size: 24px;">Выбор режимов</h2>
                    <button class="close-modes" style="color: var(--card-text-tertiary); background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="mode-item" data-mode="flashcards">
                        <input type="checkbox" ${this.trainingModes.flashcards ? 'checked' : ''} class="mode-checkbox">
                        <div>
                            <h3 style="color: var(--card-text-primary); margin: 0 0 4px 0;">Флешкарточки</h3>
                            <p style="color: var(--card-text-tertiary); margin: 0; font-size: 14px;">Ознакомление с новой лексикой</p>
                        </div>
                    </div>

                    <div class="mode-item" data-mode="memory">
                        <input type="checkbox" ${this.trainingModes.memory ? 'checked' : ''} class="mode-checkbox">
                        <div>
                            <h3 style="color: var(--card-text-primary); margin: 0 0 4px 0;">Memory Game</h3>
                            <p style="color: var(--card-text-tertiary); margin: 0; font-size: 14px;">Найди пары слово-перевод</p>
                        </div>
                    </div>

                    <div class="mode-item" data-mode="translation">
                        <input type="checkbox" ${this.trainingModes.translation ? 'checked' : ''} class="mode-checkbox">
                        <div>
                            <h3 style="color: var(--card-text-primary); margin: 0 0 4px 0;">Проверка перевода</h3>
                            <p style="color: var(--card-text-tertiary); margin: 0; font-size: 14px;">Определение значения слова</p>
                        </div>
                    </div>

                    <div class="mode-item" data-mode="fillblanks">
                        <input type="checkbox" ${this.trainingModes.fillblanks ? 'checked' : ''} class="mode-checkbox">
                        <div>
                            <h3 style="color: var(--card-text-primary); margin: 0 0 4px 0;">Fill in the Blanks</h3>
                            <p style="color: var(--card-text-tertiary); margin: 0; font-size: 14px;">Заполни пропуски в предложениях</p>
                        </div>
                    </div>

                    <div class="mode-item" data-mode="matching">
                        <input type="checkbox" ${this.trainingModes.matching ? 'checked' : ''} class="mode-checkbox">
                        <div>
                            <h3 style="color: var(--card-text-primary); margin: 0 0 4px 0;">Словесные пары</h3>
                            <p style="color: var(--card-text-tertiary); margin: 0; font-size: 14px;">Соединение слов с их значениями</p>
                        </div>
                    </div>

                    <div class="mode-item" data-mode="spelling">
                        <input type="checkbox" ${this.trainingModes.spelling ? 'checked' : ''} class="mode-checkbox">
                        <div>
                            <h3 style="color: var(--card-text-primary); margin: 0 0 4px 0;">Собери слово</h3>
                            <p style="color: var(--card-text-tertiary); margin: 0; font-size: 14px;">Создание слов из предложенных букв</p>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 24px; display: flex; justify-content: center; gap: 16px;">
                    <button class="cancel-modes" style="padding: 12px 32px; border-radius: 8px; border: 1px solid var(--card-stroke); cursor: pointer; font-size: 16px; background: var(--card-bg-secondary); color: var(--card-text-primary); transition: all 0.3s ease;">
                        Отмена
                    </button>
                    <button class="save-modes" style="padding: 12px 32px; border-radius: 8px; border: none; cursor: pointer; font-size: 16px; background: var(--accent-color); color: white; transition: all 0.3s ease;">
                        Сохранить
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.addModesModalEventListeners(modal);
    }

    // Обработчики событий модального окна режимов
    addModesModalEventListeners(modal) {
        const self = this;
        
        // Функция обновления счетчика режимов
        const updateModeCount = () => {
            const selectedModes = Object.values(self.trainingModes).filter(Boolean).length;
            const settingsBtn = document.querySelector('.settings-btn');
            if (settingsBtn) {
                const modeWord = selectedModes === 1 ? 'режим' : (selectedModes >= 2 && selectedModes <= 4 ? 'режима' : 'режимов');
                settingsBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    ${selectedModes} ${modeWord}
                `;
            }
        };

        // Кнопки закрытия
        modal.querySelectorAll('.close-modes, .cancel-modes').forEach(button => {
            button.addEventListener('click', () => modal.remove());
        });

        // Режимы тренировки
        const modeItems = modal.querySelectorAll('.mode-item[data-mode]');
        modeItems.forEach(item => {
            const checkbox = item.querySelector('.mode-checkbox');
            const mode = item.dataset.mode;

            // Инициализация состояния
            checkbox.checked = self.trainingModes[mode];
            if (checkbox.checked) item.classList.add('active');

            const toggleMode = () => {
                if (checkbox.checked) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
                self.trainingModes[mode] = checkbox.checked;
                updateModeCount();
            };

            checkbox.addEventListener('change', toggleMode);
            
            // Клик по всему элементу
            item.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    toggleMode();
                }
            });
        });

        // Кнопка сохранения
        modal.querySelector('.save-modes').addEventListener('click', () => {
            let hasSelectedMode = false;
            
            modeItems.forEach(item => {
                const mode = item.dataset.mode;
                const checkbox = item.querySelector('.mode-checkbox');
                self.trainingModes[mode] = checkbox.checked;
                if (checkbox.checked) hasSelectedMode = true;
            });

            if (!hasSelectedMode) {
                // Если нет выбранных режимов, включаем флешкарточки по умолчанию
                self.trainingModes.flashcards = true;
            }

            updateModeCount();
            modal.remove();
        });
    }
    
    // Получение выбранных слов для тренировки
    getSelectedWords() {
        console.log('📚 Getting selected words...');
        
        if (!window.cambridgeApp) {
            console.error('❌ CambridgeApp not found');
            return [];
        }
        
        const selectedWordsArray = Array.from(window.cambridgeApp.selectedWords);
        const wordsForTraining = window.cambridgeApp.words.filter(word => 
            selectedWordsArray.includes(word.text)
        ).slice(0, this.count).map(word => ({
            text: word.text,
            translation: word.translation,
            phonetics: word.phonetics,
            type: word.type,
            category: word.category,
            level: word.level,
            // ДОБАВЛЯЕМ ИЗОБРАЖЕНИЕ ИЗ data-image-url
            imageUrl: this.getWordImageUrl(word.text)
        }));
        
        console.log('✅ Words selected for training:', wordsForTraining.length);
        return wordsForTraining;
    }

    // Получение URL изображения для слова
    getWordImageUrl(wordText) {
        const wordCard = document.querySelector(`.word-card[data-word="${wordText}"]`);
        return wordCard ? wordCard.dataset.imageUrl : null;
    }

    // Создание индикатора прогресса
    createProgressIndicator(currentMode, currentStep, totalSteps) {
        const totalModes = this.activeModesSequence.length;
        const currentModeIndex = this.activeModesSequence.indexOf(currentMode) + 1;
        
        return `
            <div style="width: 100%; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--card-text-tertiary); font-size: 14px;">Режим ${currentModeIndex} из ${totalModes}</span>
                    <span style="color: var(--card-text-tertiary); font-size: 14px;">${currentStep}/${totalSteps}</span>
                </div>
                <div style="width: 100%; height: 4px; background: #e8ecff; border-radius: 2px;">
                    <div style="width: ${(currentStep / totalSteps) * 100}%; height: 100%; background: var(--accent-color); border-radius: 2px; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    }

    // Получение случайных переводов для создания вариантов ответов
    getRandomTranslations(currentWord) {
        const otherWords = this.selectedWords.filter(word => word.text !== currentWord.text);
        const shuffled = otherWords.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2).map(word => word.translation);
    }
}

// Инициализация тренировки
window.wordTraining = new WordTraining();

console.log('✅ WordTraining system loaded');

// ===================================================================
// CAMBRIDGE VOCABULARY - ЧАСТЬ 4: СИСТЕМА ТРЕНИРОВОК - РЕЖИМЫ
// ===================================================================

// Расширение класса WordTraining режимами тренировки
Object.assign(WordTraining.prototype, {

    // Запуск тренировки
    startTraining() {
        console.log('🚀 Starting training with words:', this.selectedWords);
        
        if (!this.selectedWords || this.selectedWords.length === 0) {
            console.error('❌ No words available for training');
            alert('Нет слов для тренировки. Пожалуйста, выберите слова и попробуйте снова.');
            return;
        }
        
        // Формируем последовательность активных режимов
        this.activeModesSequence = [];
        if (this.trainingModes.flashcards) this.activeModesSequence.push('flashcards');
        if (this.trainingModes.memory) this.activeModesSequence.push('memory');
        if (this.trainingModes.translation) this.activeModesSequence.push('translation');
        if (this.trainingModes.fillblanks) this.activeModesSequence.push('fillblanks');
        if (this.trainingModes.matching) this.activeModesSequence.push('matching');
        if (this.trainingModes.spelling) this.activeModesSequence.push('spelling');

        console.log('📋 Active modes:', this.activeModesSequence);
        
        if (this.activeModesSequence.length === 0) {
            console.log('⚠️ No training modes selected, defaulting to flashcards');
            this.activeModesSequence = ['flashcards'];
            this.trainingModes.flashcards = true;
        }
        
        this.currentModeIndex = 0;
        this.totalCorrectAnswers = 0;
        this.startNextMode();
    },

    // Переход к следующему режиму
    startNextMode() {
        this.currentCardIndex = 0;
        this.isFlipped = false;

        const nextMode = this.activeModesSequence[this.currentModeIndex];
        console.log('🎯 Starting mode:', nextMode, `(${this.currentModeIndex + 1}/${this.activeModesSequence.length})`);

        if (!nextMode) {
            console.log('🏁 All modes completed, showing completion modal');
            this.showCompletionModal();
            return;
        }

        switch (nextMode) {
            case 'flashcards':
                this.createFlashcardsModal();
                break;
            case 'memory':
                this.createMemoryGameModal();
                break;
            case 'translation':
                this.createTranslationQuizModal();
                break;
            case 'fillblanks': 
                this.createFillBlanksModal();
                break;
            case 'matching':
                this.createMatchingModal();
                break;
            case 'spelling': 
                this.createSpellingModal();
                break;
            default:
                this.currentModeIndex++;
                this.startNextMode();
        }
    },

    // РЕЖИМ: Флешкарточки
    createFlashcardsModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
        `;

        const updateCardContent = () => {
            modal.innerHTML = this.createFlashcardHTML(
                this.selectedWords[this.currentCardIndex],
                this.currentCardIndex,
                this.selectedWords.length
            );
            this.addFlashcardEventListeners(modal);
        };

        updateCardContent();
        document.body.appendChild(modal);

        // Глобальная функция для обновления карточки
        window.updateCard = (newIndex) => {
            if (newIndex >= 0 && newIndex < this.selectedWords.length) {
                this.currentCardIndex = newIndex;
                this.isFlipped = false;
                updateCardContent();
            }
        };
    },

    // HTML для флешкарточки
    createFlashcardHTML(word, index, total) {
        return `
            <div style="background: #f8f9ff; width: 95vw; height: 90vh; border-radius: 12px; padding: 24px; margin: 16px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="color: var(--card-text-primary); font-size: 24px;">Флешкарточки (${index + 1}/${total})</h2>
                    <button class="close-flashcards" style="color: var(--card-text-tertiary); background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                
                ${this.createProgressIndicator('flashcards', index + 1, total)}
    
                <div class="flashcard-container" style="flex: 1; display: flex; align-items: center; justify-content: center; perspective: 1000px;">
                    <div style="position: relative; width: 100%; height: 400px;">
                        <div style="position: absolute; top: 8px; left: 4px; right: -4px; height: 400px; background: var(--card-bg-tertiary); border-radius: 12px; transform: scale(0.98);"></div>
                        <div style="position: absolute; top: 4px; left: 2px; right: -2px; height: 400px; background: var(--card-bg-secondary); border-radius: 12px; transform: scale(0.99);"></div>

                        <div class="flashcard" style="position: relative; width: 100%; height: 400px; background: var(--card-bg-secondary); border-radius: 12px; cursor: pointer; transition: transform 0.6s; transform-style: preserve-3d; border: 2px solid var(--card-stroke-secondary);">
            
                            <div class="card-front" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                                <h3 style="color: var(--card-text-primary); font-size: 32px; margin-bottom: 16px;">${word.text}</h3>
                                <p style="color: var(--card-text-tertiary); font-size: 20px;">${word.phonetics || ''}</p>
                                <button class="pronounce-btn" style="background: none; border: 1px solid var(--accent-color); color: var(--accent-color); padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-top: 16px; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease;">
                                    🔊 Прослушать
                                </button>
                                <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; color: var(--card-text-tertiary); font-size: 14px;">
                                    <span style="margin-right: 8px;">↻</span>
                                    Нажмите чтобы перевернуть
                                </div>
                            </div>
                            <div class="card-back" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg); display: flex; align-items: center; justify-content: center; padding: 20px;">
                                <h3 style="color: var(--card-text-primary); font-size: 32px; text-align: center;">${word.translation}</h3>
                            </div>
                        </div>
                    </div>
                </div>
    
                <div style="display: flex; justify-content: center; gap: 16px; margin-top: 24px;">
                    <button class="nav-btn prev-btn" ${index === 0 ? 'disabled' : ''} style="padding: 12px 24px; border-radius: 8px; border: 1px solid var(--card-stroke); cursor: pointer; transition: all 0.3s ease; background: var(--card-bg-secondary); color: var(--card-text-primary); ${index === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                        Назад
                    </button>
                    ${index === total - 1 ? `
                        <button class="nav-btn next-btn" style="display: flex; align-items: center; gap: 8px; justify-content: center; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; background: var(--accent-color); color: white; transition: all 0.3s ease;">
                            Завершить
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </button>
                    ` : `
                        <button class="nav-btn next-btn" style="display: flex; align-items: center; gap: 8px; justify-content: center; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; background: var(--accent-color); color: white; transition: all 0.3s ease;">
                            Вперед
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </button>
                    `}
                </div>
            </div>
        `;
    },

    // Обработчики событий для флешкарточек
    addFlashcardEventListeners(modal) {
        // Кнопка закрытия
        modal.querySelector('.close-flashcards').addEventListener('click', () => {
            modal.remove();
            this.currentModeIndex++;
            this.startNextMode();
        });

        // Переворот карточки
        const flashcard = modal.querySelector('.flashcard');
        if (flashcard) {
            flashcard.addEventListener('click', () => {
                this.isFlipped = !this.isFlipped;
                flashcard.style.transform = this.isFlipped ? 'rotateY(180deg)' : '';
            });
        }

        // Произношение
        const pronounceBtn = modal.querySelector('.pronounce-btn');
        if (pronounceBtn) {
            pronounceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const utterance = new SpeechSynthesisUtterance(this.selectedWords[this.currentCardIndex].text);
                utterance.lang = 'en-US';
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
            });
        }

        // Навигация
        const prevBtn = modal.querySelector('.prev-btn');
        const nextBtn = modal.querySelector('.next-btn');

        if (prevBtn && !prevBtn.disabled) {
            prevBtn.addEventListener('click', () => {
                if (this.currentCardIndex > 0) {
                    window.updateCard(this.currentCardIndex - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentCardIndex < this.selectedWords.length - 1) {
                    window.updateCard(this.currentCardIndex + 1);
                } else {
                    modal.remove();
                    this.currentModeIndex++;
                    this.startNextMode();
                }
            });
        }
    },

    //// РЕЖИМ: Memory Game 
    createMemoryGameModal() {
        let flippedCards = [];
        let matchedCards = new Set();
        let correctMatches = 0;
        let moves = 0;
        
        // Создаем пары карточек
        const cards = [];
        this.selectedWords.forEach((word, index) => {
            // Карточка с переводом
            cards.push({
                id: `translation-${index}`,
                type: 'translation',
                content: word.translation,
                matchId: index
            });
            
            // Карточка с изображением и английским словом
            cards.push({
                id: `word-${index}`,
                type: 'word',
                content: word.text,
                image: word.imageUrl || word.image || `https://via.placeholder.com/100x80?text=${word.text}`,
                matchId: index
            });
        });
        
        // Перемешиваем карточки
        const shuffledCards = cards.sort(() => Math.random() - 0.5);
        
        const modal = document.createElement('div');
        modal.className = 'memory-game-modal';

        modal.innerHTML = `
            <div class="memory-game-content">
                <div class="memory-game-header">
                    <h2 class="memory-game-title">Memory Game</h2>
                    <button class="memory-game-close close-memory">×</button>
                </div>
                
                ${this.createProgressIndicator('memory', 0, this.selectedWords.length)}

                <div class="memory-grid">
                    ${shuffledCards.map(card => `
                        <div class="memory-card" data-id="${card.id}" data-match-id="${card.matchId}">
                            <div class="memory-card-inner">
                                <div class="memory-card-back">
                                    🧠
                                </div>
                                <div class="memory-card-front">
                                    ${card.type === 'word' ? `
                                        <img src="${card.image}" alt="${card.content}" class="memory-card-image">
                                        <span class="memory-card-text-word">${card.content}</span>
                                    ` : `
                                        <span class="memory-card-text-translation">${card.content}</span>
                                    `}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="memory-game-footer">
                    <button class="memory-next-btn" disabled>
                        Продолжить
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Обработчики событий
        modal.querySelector('.close-memory').addEventListener('click', () => {
            modal.remove();
            this.currentModeIndex++;
            this.startNextMode();
        });

        // Игровая логика
        const memoryCards = modal.querySelectorAll('.memory-card');
        const nextBtn = modal.querySelector('.memory-next-btn');
        const progressBar = modal.querySelector('[style*="background: var(--accent-color)"]');

        memoryCards.forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('flipped') || card.classList.contains('matched') || flippedCards.length >= 2) {
                    return;
                }

                // Переворачиваем карточку
                card.classList.add('flipped');
                flippedCards.push(card);

                if (flippedCards.length === 2) {
                    moves++;

                    const card1 = flippedCards[0];
                    const card2 = flippedCards[1];
                    const match1 = card1.dataset.matchId;
                    const match2 = card2.dataset.matchId;

                    if (match1 === match2) {
                        // Совпадение найдено
                        setTimeout(() => {
                            card1.classList.add('matched');
                            card2.classList.add('matched');
                            
                            // Добавляем класс matched к front элементам
                            card1.querySelector('.memory-card-front').classList.add('matched');
                            card2.querySelector('.memory-card-front').classList.add('matched');
                            
                            matchedCards.add(match1);
                            correctMatches++;
                            
                            if (progressBar) {
                                progressBar.style.width = `${(correctMatches / this.selectedWords.length) * 100}%`;
                            }

                            if (correctMatches === this.selectedWords.length) {
                                nextBtn.disabled = false;
                                this.totalCorrectAnswers += correctMatches;
                            }

                            flippedCards = [];
                        }, 500);
                    } else {
                        // Нет совпадения
                        setTimeout(() => {
                            card1.classList.remove('flipped');
                            card2.classList.remove('flipped');
                            flippedCards = [];
                        }, 1000);
                    }
                }
            });
        });

        nextBtn.addEventListener('click', () => {
            modal.remove();
            this.currentModeIndex++;
            this.startNextMode();
        });
    },

    // РЕЖИМ: Проверка перевода
    createTranslationQuizModal() {
        let currentIndex = 0;
        let correctAnswers = 0;
    
        const createQuizHTML = (word, index, total) => {
            const randomTranslations = this.getRandomTranslations(word);
            const allTranslations = [...randomTranslations, word.translation]
                .sort(() => 0.5 - Math.random());
    
            return `
                <div style="background: #f8f9ff; width: 95vw; height: 90vh; border-radius: 12px; padding: 24px; margin: 16px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="color: var(--card-text-primary); font-size: 24px;">Выберите правильный перевод (${index + 1}/${total})</h2>
                        <button class="close-quiz" style="color: var(--card-text-tertiary); background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>

                    ${this.createProgressIndicator('translation', index + 1, total)}
    
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 32px;">
                        <div style="text-align: center;">
                            <h3 style="color: var(--card-text-primary); font-size: 36px; margin-bottom: 16px;">${word.text}</h3>
                            <p style="color: var(--card-text-tertiary); font-size: 20px;">${word.phonetics || ''}</p>
                        </div>
    
                        <div style="display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 400px;">
                            ${allTranslations.map(translation => `
                                <button class="translation-option" data-translation="${translation}" 
                                    style="padding: 20px; background: var(--card-bg); border: 2px solid var(--card-stroke-secondary); border-radius: 12px; color: var(--card-text-primary); font-size: 18px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                                    ${translation}
                                </button>
                            `).join('')}
                        </div>
                    </div>
    
                    <div style="margin-top: 32px; margin-bottom: 24px; text-align: center; padding: 0 24px;">
                        <p style="color: var(--card-text-tertiary); font-size: 16px; margin: 0;">Правильных ответов: ${correctAnswers} из ${index}</p>
                    </div>
                </div>
            `;
        };
    
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
        `;
    
        const updateQuiz = () => {
            modal.innerHTML = createQuizHTML(
                this.selectedWords[currentIndex],
                currentIndex,
                this.selectedWords.length
            );
    
            // Обработчики событий
            modal.querySelector('.close-quiz').addEventListener('click', () => {
                this.totalCorrectAnswers += correctAnswers;
                modal.remove();
                this.currentModeIndex++;
                this.startNextMode();
            });
    
            const options = modal.querySelectorAll('.translation-option');
            options.forEach(option => {
                option.addEventListener('mouseover', () => {
                    if (!option.disabled) {
                        option.style.borderColor = 'var(--accent-color)';
                        option.style.transform = 'translateY(-2px)';
                        option.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
                    }
                });
                
                option.addEventListener('mouseout', () => {
                    if (!option.disabled) {
                        option.style.borderColor = 'var(--card-stroke-secondary)';
                        option.style.transform = 'translateY(0)';
                        option.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }
                });
                
                option.addEventListener('click', () => {
                    if (option.disabled) return;
                    
                    const isCorrect = option.dataset.translation === this.selectedWords[currentIndex].translation;
                    
                    // Отключаем все кнопки
                    options.forEach(btn => {
                        btn.disabled = true;
                        btn.style.cursor = 'default';
                        btn.style.pointerEvents = 'none';
                        
                        if (btn.dataset.translation === this.selectedWords[currentIndex].translation) {
                            btn.style.background = 'var(--correct-border)';
                            btn.style.borderColor = 'var(--correct-border)';
                            btn.style.color = 'white';
                        } else if (btn === option && !isCorrect) {
                            btn.style.background = 'var(--danger)';
                            btn.style.borderColor = 'var(--danger)';
                            btn.style.color = 'white';
                        }
                    });
    
                    if (isCorrect) correctAnswers++;
    
                    // Ждем 1.5 секунды перед переходом
                    setTimeout(() => {
                        if (currentIndex < this.selectedWords.length - 1) {
                            currentIndex++;
                            updateQuiz();
                        } else {
                            this.totalCorrectAnswers += correctAnswers;
                            modal.remove();
                            this.currentModeIndex++;
                            this.startNextMode();
                        }
                    }, 1500);
                });
            });
        };
    
        updateQuiz();
        document.body.appendChild(modal);
    },

    // РЕЖИМ: Fill in the Blanks
    createFillBlanksModal() {
        let currentIndex = 0;
        let correctAnswers = 0;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
        `;

        const getWordExamples = (word) => {
            // Находим HTML элемент для этого слова
            const wordCard = document.querySelector(`[data-word="${word.text}"]`);
            if (!wordCard) {
                return [];
            }

            const examples = [];
            
            // Получаем основной пример из .word-example
            const exampleElement = wordCard.querySelector('.word-example');
            if (exampleElement && exampleElement.textContent.trim()) {
                examples.push(exampleElement.textContent.trim());
            }
            
            // Получаем дополнительные примеры из data-extra-examples
            const extraExamples = wordCard.getAttribute('data-extra-examples');
            if (extraExamples) {
                const additionalExamples = extraExamples.split('|').map(ex => ex.trim()).filter(ex => ex.length > 0);
                examples.push(...additionalExamples);
            }
            
            return examples;
        };

        const findBestExample = (word) => {
            const examples = getWordExamples(word);
            
            // Ищем пример, который содержит наше слово
            for (let example of examples) {
                const wordRegex = new RegExp(`\\b${word.text}\\b`, 'i');
                if (wordRegex.test(example)) {
                    return example;
                }
            }
            
            // Если не нашли, создаем простой пример
            return `The ${word.text} is very important.`;
        };

        const updateFillBlanks = () => {
            const word = this.selectedWords[currentIndex];
            const example = findBestExample(word);
            
            // Заменяем слово на пропуск (только первое вхождение)
            const wordRegex = new RegExp(`\\b${word.text}\\b`, 'i');
            const blankSentence = example.replace(wordRegex, '_____');
            
            modal.innerHTML = `
                <div style="background: #f8f9ff; width: 95vw; height: 90vh; border-radius: 12px; padding: 24px; margin: 16px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="color: var(--card-text-primary); font-size: 24px; margin: 0;">Fill in the Blanks</h2>
                        <button class="close-fillblanks" style="color: var(--card-text-tertiary); background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>

                    ${this.createProgressIndicator('fillblanks', currentIndex + 1, this.selectedWords.length)}

                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <div style="background: white; padding: 32px 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); max-width: 600px; width: 100%;">
                            <p style="color: #2c3e50; font-size: 24px; margin: 0; line-height: 1.5; font-weight: 500;">
                                ${blankSentence}
                            </p>
                        </div>
                        
                        <div style="color: var(--card-text-secondary); font-size: 16px; margin-bottom: 24px;">
                            <strong>Перевод:</strong> ${word.translation}
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <input type="text" id="answer-input" placeholder="Введите пропущенное слово..." 
                                style="width: 350px; padding: 12px; border: 2px solid var(--card-stroke); 
                                border-radius: 8px; font-size: 16px; text-align: center; background: white; 
                                color: var(--card-text-primary); outline: none; transition: all 0.3s ease;">
                        </div>
                        
                        <button class="check-answer" style="background: var(--accent-color); color: white; 
                            padding: 12px 32px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; 
                            transition: all 0.3s ease;">
                            Проверить
                        </button>
                    </div>
                </div>
            `;

            // Добавляем стили
            const style = document.createElement('style');
            style.textContent = `
                #answer-input:focus {
                    border-color: var(--accent-color) !important;
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
                }
                .check-answer:hover {
                    background: var(--text-hover) !important;
                    transform: translateY(-2px) !important;
                }
                .close-fillblanks:hover {
                    color: #e74c3c !important;
                }
            `;
            document.head.appendChild(style);

            // Фокус на поле ввода
            setTimeout(() => {
                const input = modal.querySelector('#answer-input');
                if (input) input.focus();
            }, 100);

            // Обработчики событий
            const input = modal.querySelector('#answer-input');
            const checkBtn = modal.querySelector('.check-answer');

            const checkAnswer = () => {
                const userAnswer = input.value.trim().toLowerCase();
                const correctAnswer = word.text.toLowerCase();
                const isCorrect = userAnswer === correctAnswer;

                if (isCorrect) {
                    correctAnswers++;
                    input.style.borderColor = '#00b894';
                    input.style.backgroundColor = '#d1f2eb';
                    input.style.color = '#00b894';
                    checkBtn.textContent = 'Правильно! ✓';
                    checkBtn.style.background = 'linear-gradient(135deg, #00b894 0%, #00a085 100%)';
                } else {
                    input.style.borderColor = '#e74c3c';
                    input.style.backgroundColor = '#fadbd8';
                    input.style.color = '#e74c3c';
                    input.value = word.text;
                    checkBtn.textContent = `Неправильно. Ответ: ${word.text}`;
                    checkBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                }

                checkBtn.disabled = true;
                input.disabled = true;

                setTimeout(() => {
                    if (currentIndex < this.selectedWords.length - 1) {
                        currentIndex++;
                        updateFillBlanks();
                    } else {
                        this.totalCorrectAnswers += correctAnswers;
                        modal.remove();
                        this.currentModeIndex++;
                        this.startNextMode();
                    }
                }, 2000);
            };

            checkBtn.addEventListener('click', checkAnswer);
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    checkAnswer();
                }
            });

            modal.querySelector('.close-fillblanks').addEventListener('click', () => {
                // НЕ добавляем correctAnswers при закрытии
                modal.remove();
                this.currentModeIndex++;
                this.startNextMode();
            });
        };

        updateFillBlanks();
        document.body.appendChild(modal);
    },

    // РЕЖИМ: Сопоставление пар
    createMatchingModal() {
        let matchedPairs = new Set();
        let selectedCard = null;
        let canClick = true;
        let correctMatches = 0;
        
        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const createCardHTML = (text, index, isWord = true) => {
            return `
                <div class="matching-card ${isWord ? 'word' : 'translation'}" data-index="${index}"
                    style="background: var(--card-bg); padding: 16px; border: 2px solid var(--card-stroke-secondary); border-radius: 12px; cursor: pointer; 
                    height: 80px; display: flex; align-items: center; justify-content: center; 
                    color: var(--card-text-primary); font-size: 18px; text-align: center; transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    ${matchedPairs.has(index) ? 'background: var(--correct-border) !important; color: white !important; cursor: default; border-color: var(--correct-border) !important;' : ''}">
                    ${text}
                </div>
            `;
        };

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
        `;

        // Создаем пары слов и переводов
        const pairs = this.selectedWords.map((word, index) => ({
            word: word.text,
            translation: word.translation,
            index
        }));

        const words = shuffleArray([...pairs]);
        const translations = shuffleArray([...pairs]);

        modal.innerHTML = `
            <div style="background: #f8f9ff; width: 95vw; height: 90vh; border-radius: 12px; padding: 24px; margin: 16px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="color: var(--card-text-primary); font-size: 24px;">Сопоставьте пары</h2>
                    <button class="close-matching" style="color: var(--card-text-tertiary); background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>

                ${this.createProgressIndicator('matching', 0, pairs.length)}

                <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px;">
                    <div class="words-column" style="display: grid; gap: 16px; align-content: start;">
                        ${words.map((pair) => createCardHTML(pair.word, pair.index, true)).join('')}
                    </div>
                    <div class="translations-column" style="display: grid; gap: 16px; align-content: start;">
                        ${translations.map((pair) => createCardHTML(pair.translation, pair.index, false)).join('')}
                    </div>
                </div>

                <div style="text-align: center; margin-top: 16px;">
                    <p style="color: var(--card-text-tertiary); font-size: 16px;">Правильных пар: <span id="matches-count">0</span> из ${pairs.length}</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Обработчики событий
        modal.querySelector('.close-matching').addEventListener('click', () => {
            this.totalCorrectAnswers += correctMatches;
            modal.remove();
            this.currentModeIndex++;
            this.startNextMode();
        });

        const handleCardClick = (card) => {
            if (!canClick || matchedPairs.has(parseInt(card.dataset.index))) return;
            if (card === selectedCard) return;

            if (!selectedCard) {
                selectedCard = card;
                card.style.background = 'var(--accent-color)';
                card.style.borderColor = 'var(--accent-color)';
                card.style.color = 'white';
                return;
            }

            canClick = false;
            const firstIndex = parseInt(selectedCard.dataset.index);
            const secondIndex = parseInt(card.dataset.index);

            if (firstIndex === secondIndex) {
                // Правильная пара
                correctMatches++;
                card.style.background = 'var(--correct-border)';
                card.style.borderColor = 'var(--correct-border)';
                card.style.color = 'white';
                selectedCard.style.background = 'var(--correct-border)';
                selectedCard.style.borderColor = 'var(--correct-border)';
                selectedCard.style.color = 'white';
                matchedPairs.add(firstIndex);

                // Обновляем счетчик
                const matchesCount = modal.querySelector('#matches-count');
                if (matchesCount) {
                    matchesCount.textContent = correctMatches;
                }

                // Обновляем прогресс
                const progressBar = modal.querySelector('[style*="background: var(--accent-color)"]');
                if (progressBar) {
                    progressBar.style.width = `${(correctMatches / pairs.length) * 100}%`;
                }

                if (correctMatches === pairs.length) {
                    setTimeout(() => {
                        this.totalCorrectAnswers += correctMatches;
                        modal.remove();
                        this.currentModeIndex++;
                        this.startNextMode();
                    }, 1000);
                }
            } else {
                // Неправильная пара
                card.style.background = 'var(--danger)';
                card.style.borderColor = 'var(--danger)';
                card.style.color = 'white';
                selectedCard.style.background = 'var(--danger)';
                selectedCard.style.borderColor = 'var(--danger)';
                selectedCard.style.color = 'white';
            }

            setTimeout(() => {
                if (!matchedPairs.has(firstIndex)) {
                    selectedCard.style.background = 'var(--card-bg)';
                    selectedCard.style.borderColor = 'var(--card-stroke-secondary)';
                    selectedCard.style.color = 'var(--card-text-primary)';
                }
                if (!matchedPairs.has(secondIndex)) {
                    card.style.background = 'var(--card-bg)';
                    card.style.borderColor = 'var(--card-stroke-secondary)';
                    card.style.color = 'var(--card-text-primary)';
                }
                selectedCard = null;
                canClick = true;
            }, 1000);
        };

        // Добавляем обработчики кликов
        modal.querySelectorAll('.matching-card').forEach(card => {
            card.addEventListener('click', () => {
                handleCardClick(card);
            });
        });
    },

    // РЕЖИМ: Составление слов
    createSpellingModal() {
        let currentIndex = 0;
        let correctAnswers = 0;
        
        const shuffleWord = (word) => {
            return word.split('')
                .sort(() => Math.random() - 0.5)
                .map((letter, index) => ({
                    letter,
                    id: index,
                    isSelected: false
                }));
        };

        const createSpellingHTML = (word, index, total) => {
            const shuffledLetters = shuffleWord(word.text);
            return `
                <div style="background: #f8f9ff; width: 95vw; height: 90vh; border-radius: 12px; padding: 24px; margin: 16px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="color: var(--card-text-primary); font-size: 24px;">Составьте слово (${index + 1}/${total})</h2>
                        <button class="close-spelling" style="color: var(--card-text-tertiary); background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>

                    ${this.createProgressIndicator('spelling', index + 1, total)}

                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 32px;">
                        <div style="text-align: center;">
                            <p style="color: var(--card-text-tertiary); font-size: 24px; margin-bottom: 8px;">Перевод:</p>
                            <h3 style="color: var(--card-text-primary); font-size: 32px;">${word.translation}</h3>
                        </div>

                        <div class="answer-container" style="min-height: 60px; padding: 16px; background: var(--card-bg-tertiary); border: 2px dashed var(--card-stroke-secondary); border-radius: 8px; width: 100%; max-width: 800px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 16px; transition: all 0.3s ease;">
                        </div>

                        <div class="letters-container" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; width: 100%; max-width: 800px;">
                            ${shuffledLetters.map(({letter, id}) => `
                                <div class="letter" data-id="${id}" style="width: 50px; height: 50px; background: var(--card-bg-secondary); border: 1px solid var(--card-stroke); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--card-text-primary); font-size: 24px; cursor: pointer; transition: all 0.2s ease;">
                                    ${letter}
                                </div>
                            `).join('')}
                        </div>

                        <div style="display: flex; gap: 16px;">
                            <button class="check-btn" disabled style="padding: 12px 32px; background: var(--card-bg-secondary); color: var(--card-text-primary); border: 1px solid var(--card-stroke); border-radius: 8px; font-size: 16px; cursor: pointer; transition: all 0.3s ease; opacity: 0.5;">
                                Проверить
                            </button>
                            <button class="reset-btn" style="padding: 12px 32px; background: var(--card-bg-secondary); color: var(--card-text-primary); border: 1px solid var(--card-stroke); border-radius: 8px; font-size: 16px; cursor: pointer; transition: all 0.3s ease;">
                                Сбросить
                            </button>
                        </div>
                    </div>

                    <div style="margin-top: 32px; margin-bottom: 24px; text-align: center; padding: 0 24px;">
                        <p style="color: var(--card-text-tertiary); font-size: 16px; margin: 0;">Правильных ответов: ${correctAnswers} из ${index}</p>
                    </div>
                </div>
            `;
        };

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
        `;

        const checkAnswer = () => {
            const answerContainer = modal.querySelector('.answer-container');
            const selectedLetters = answerContainer.querySelectorAll('.letter');
            const userAnswer = Array.from(selectedLetters).map(letter => letter.textContent.trim()).join('');
            
            if (userAnswer.toLowerCase() === this.selectedWords[currentIndex].text.toLowerCase()) {
                correctAnswers++;
                answerContainer.style.background = 'var(--correct-border)';
                answerContainer.style.borderColor = 'var(--correct-border)';
                
                setTimeout(() => {
                    if (currentIndex < this.selectedWords.length - 1) {
                        currentIndex++;
                        updateSpelling();
                    } else {
                        this.totalCorrectAnswers += correctAnswers;
                        modal.remove();
                        this.currentModeIndex++;
                        this.startNextMode();
                    }
                }, 1500);
            } else {
                answerContainer.style.background = 'var(--danger)';
                answerContainer.style.borderColor = 'var(--danger)';
                
                setTimeout(() => {
                    answerContainer.style.background = 'var(--card-bg-tertiary)';
                    answerContainer.style.borderColor = 'var(--card-stroke-secondary)';
                    // Возвращаем все буквы обратно
                    const lettersContainer = modal.querySelector('.letters-container');
                    Array.from(answerContainer.querySelectorAll('.letter')).forEach(letter => {
                        lettersContainer.appendChild(letter);
                    });
                    updateCheckButton();
                }, 1500);
            }
        };

        const updateCheckButton = () => {
            const answerContainer = modal.querySelector('.answer-container');
            const checkBtn = modal.querySelector('.check-btn');
            const selectedLetters = answerContainer.querySelectorAll('.letter');
            
            if (selectedLetters.length === this.selectedWords[currentIndex].text.length) {
                checkBtn.style.opacity = '1';
                checkBtn.disabled = false;
                checkBtn.style.background = 'var(--accent-color)';
                checkBtn.style.color = 'white';
                checkBtn.style.borderColor = 'var(--accent-color)';
            } else {
                checkBtn.style.opacity = '0.5';
                checkBtn.disabled = true;
                checkBtn.style.background = 'var(--card-bg-secondary)';
                checkBtn.style.color = 'var(--card-text-primary)';
                checkBtn.style.borderColor = 'var(--card-stroke)';
            }
        };

        const updateSpelling = () => {
            modal.innerHTML = createSpellingHTML(
                this.selectedWords[currentIndex],
                currentIndex,
                this.selectedWords.length
            );

            // Обработчики событий
            modal.querySelector('.close-spelling').addEventListener('click', () => {
                this.totalCorrectAnswers += correctAnswers;
                modal.remove();
                this.currentModeIndex++;
                this.startNextMode();
            });

            // Кнопка сброса
            modal.querySelector('.reset-btn').addEventListener('click', () => {
                const lettersContainer = modal.querySelector('.letters-container');
                const answerContainer = modal.querySelector('.answer-container');
                
                Array.from(answerContainer.querySelectorAll('.letter')).forEach(letter => {
                    lettersContainer.appendChild(letter);
                });
                
                updateCheckButton();
            });

            // Кнопка проверки
            modal.querySelector('.check-btn').addEventListener('click', checkAnswer);

            // Перемещение букв
            const letters = modal.querySelectorAll('.letter');
            letters.forEach(letter => {
                letter.addEventListener('click', () => {
                    const answerContainer = modal.querySelector('.answer-container');
                    const lettersContainer = modal.querySelector('.letters-container');
                    
                    if (letter.parentElement === answerContainer) {
                        lettersContainer.appendChild(letter);
                    } else {
                        answerContainer.appendChild(letter);
                    }
                    
                    updateCheckButton();
                });

                // Hover эффекты
                letter.addEventListener('mouseenter', () => {
                    letter.style.background = 'var(--card-hover-secondary)';
                    letter.style.borderColor = 'var(--accent-color)';
                    letter.style.color = 'var(--accent-color)';
                });

                letter.addEventListener('mouseleave', () => {
                    letter.style.background = 'var(--card-bg-secondary)';
                    letter.style.borderColor = 'var(--card-stroke)';
                    letter.style.color = 'var(--card-text-primary)';
                });
            });
        };
        
        updateSpelling();
        document.body.appendChild(modal);
    },

    // Модальное окно завершения тренировки
    showCompletionModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1002;
    `;
    
    // ИСПРАВЛЕННЫЙ подсчет - добавлены недостающие режимы
    const totalPossibleAnswers = this.activeModesSequence.reduce((total, mode) => {
        if (mode === 'translation' || mode === 'matching' || mode === 'spelling' || mode === 'memory' || mode === 'fillblanks') {
            return total + this.selectedWords.length;
        }
        return total;
    }, 0);

    // ИСПРАВЛЕНИЕ: ограничиваем правильные ответы максимальным возможным количеством
    const actualCorrectAnswers = Math.min(this.totalCorrectAnswers, totalPossibleAnswers);
    
    const successRate = totalPossibleAnswers > 0 ? (actualCorrectAnswers / totalPossibleAnswers) : 0;
    const successPercentage = Math.min(100, Math.round(successRate * 100));

    console.log('🔢 Debug calculation:');
    console.log('Active modes:', this.activeModesSequence);
    console.log('Raw total correct answers:', this.totalCorrectAnswers);
    console.log('Actual correct answers (limited):', actualCorrectAnswers);
    console.log('Total possible answers:', totalPossibleAnswers);
    console.log('Success percentage:', successPercentage);

    modal.innerHTML = `
        <div style="background: var(--card-bg); width: 95vw; max-width: 500px; border-radius: 12px; padding: 32px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 16px;">${successPercentage >= 90 ? '🎉' : '📚'}</div>
            <h2 style="color: var(--card-text-primary); font-size: 24px; margin-bottom: 16px;">Тренировка завершена!</h2>
            <p style="color: var(--card-text-tertiary); font-size: 18px; margin-bottom: 16px;">
                Результат: <strong style="color: var(--card-text-primary);">${successPercentage}%</strong>
            </p>
            <p style="color: var(--card-text-tertiary); font-size: 16px; margin-bottom: 16px;">
                Правильных ответов: <strong style="color: var(--card-text-primary);">${actualCorrectAnswers}</strong> из <strong>${totalPossibleAnswers}</strong>
            </p>
            ${successPercentage >= 90 ? `
                <p style="color: var(--correct-text); font-size: 18px; margin-bottom: 32px; font-weight: 600; background: var(--correct-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--correct-border);">
                    🎉 Отлично! Слова переведены в "Изучено"
                </p>
            ` : `
                <p style="color: var(--card-text-tertiary); font-size: 16px; margin-bottom: 32px; background: var(--neutral-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--neutral-border);">
                    📚 Нужно 90%+ для перевода слов в "Изучено"
                </p>
            `}
            <button class="close-completion" style="padding: 12px 32px; background: var(--accent-color); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.3s ease; width: 100%;">
                Закрыть
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Обновляем статистику в приложении с исправленными данными
    if (window.cambridgeApp) {
        window.cambridgeApp.updateTrainingStats(actualCorrectAnswers, totalPossibleAnswers, this.selectedWords);
    }

    modal.querySelector('.close-completion').addEventListener('click', () => {
        modal.remove();
        this.totalCorrectAnswers = 0;
        this.currentModeIndex = 0;
        this.currentCardIndex = 0;
        
        // Очищаем выбранные слова в основном приложении
        if (window.cambridgeApp) {
            window.cambridgeApp.clearSelection();
        }
    });

    // Hover эффект для кнопки
    const closeBtn = modal.querySelector('.close-completion');
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'var(--text-hover)';
        closeBtn.style.transform = 'translateY(-2px)';
        closeBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
    });

    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'var(--accent-color)';
        closeBtn.style.transform = 'translateY(0)';
        closeBtn.style.boxShadow = 'none';
    });
}
});

// Дополнительные утилиты и инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Training modes system loaded');
    
    // Функция сворачивания/разворачивания категорий
    window.toggleCategory = function(header) {
        const section = header.parentElement;
        section.classList.toggle('collapsed');
    };
    
    // Глобальные функции для совместимости
    window.pronounceWord = function(word) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
        }
    };

    window.toggleFavorite = function(word, category) {
        if (window.cambridgeApp) {
            const button = event.target;
            window.cambridgeApp.toggleFavorite(word, button);
        }
    };

    window.deleteWord = function(word, category) {
        if (window.cambridgeApp && confirm(`Удалить слово "${word}"?`)) {
            window.cambridgeApp.deleteWord(word);
        }
    };

    console.log('✅ Training system fully initialized');
});

console.log('🏆 All training modes loaded successfully');