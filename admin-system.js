// ======================
// СИСТЕМА АДМИНИСТРИРОВАНИЯ
// ======================

class ColoringAdminSystem {
    constructor() {
        this.storageKey = 'adultColoringPages';
        this.init();
    }
    
    init() {
        // Проверяем, есть ли данные в localStorage
        if (!this.getColorings()) {
            this.initializeDefaultData();
        }
        
        this.setupEventListeners();
        this.updateCategoryCounts();
    }
    
    // Инициализация начальных данных (если пусто)
    initializeDefaultData() {
        const defaultData = {
            'anti-stress': [],
            'romantic': [],
            'horror': []
        };
        localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
    }
    
    // Получение всех раскрасок
    getColorings() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Ошибка чтения данных:', error);
            return null;
        }
    }
    
    // Сохранение раскрасок
    saveColorings(colorings) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(colorings));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            this.showNotification('Ошибка сохранения данных!', 'error');
            return false;
        }
    }
    
    // Добавление новой раскраски
    async addColoring(coloringData) {
        try {
            const colorings = this.getColorings();
            if (!colorings) return false;
            
            const category = coloringData.category;
            
            // Создаем новый объект раскраски
            const newColoring = {
                id: Date.now(),
                name: coloringData.name,
                description: coloringData.description || '',
                image: coloringData.image, // Base64 изображение
                difficulty: coloringData.difficulty || 'medium',
                dateAdded: new Date().toISOString(),
                downloads: 0
            };
            
            // Добавляем в соответствующую категорию
            colorings[category].push(newColoring);
            
            // Сохраняем
            const success = this.saveColorings(colorings);
            
            if (success) {
                this.showNotification(`Раскраска "${coloringData.name}" добавлена в категорию "${category}"!`, 'success');
                this.updateCategoryCounts();
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Ошибка добавления раскраски:', error);
            this.showNotification('Ошибка при добавлении раскраски!', 'error');
            return false;
        }
    }
    
    // Обновление счетчиков на главной странице
    updateCategoryCounts() {
        const colorings = this.getColorings();
        if (!colorings) return;
        
        const categories = {
            'anti-stress': 'antiStress',
            'romantic': 'romantic',
            'horror': 'horror'
        };
        
        for (const [categoryKey, elementId] of Object.entries(categories)) {
            const count = colorings[categoryKey]?.length || 0;
            const countElement = document.getElementById(`${elementId}Count`);
            const statsElement = document.getElementById(`${elementId}Stats`);
            
            if (countElement) {
                countElement.textContent = `${count} раскрасок доступно`;
            }
            
            if (statsElement) {
                const downloads = colorings[categoryKey]?.reduce((sum, item) => sum + (item.downloads || 0), 0) || 0;
                statsElement.textContent = `${count} раскрасок • ${downloads} скачиваний`;
            }
        }
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Открытие/закрытие админ-панели
        const openBtn = document.getElementById('openAdminBtn');
        const closeBtn = document.getElementById('closeAdminBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const modal = document.getElementById('adminModal');
        
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                modal.classList.add('active');
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                this.resetForm();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                this.resetForm();
            });
        }
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                this.resetForm();
            }
        });
        
        // Обработка выбора файла
        const fileInput = document.getElementById('coloringImage');
        const fileNameDisplay = document.getElementById('selectedFileName');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    fileNameDisplay.textContent = `Выбран файл: ${file.name} (${this.formatFileSize(file.size)})`;
                    fileNameDisplay.style.display = 'block';
                    
                    // Проверка размера файла (макс 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        this.showNotification('Файл слишком большой! Максимальный размер: 10MB', 'error');
                        e.target.value = '';
                        fileNameDisplay.style.display = 'none';
                    }
                }
            });
            
            // Drag and drop
            const dropZone = document.querySelector('.file-input-label');
            if (dropZone) {
                dropZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropZone.style.background = '#edf2f7';
                    dropZone.style.borderColor = '#a0aec0';
                });
                
                dropZone.addEventListener('dragleave', () => {
                    dropZone.style.background = '#f8f9fa';
                    dropZone.style.borderColor = '#cbd5e0';
                });
                
                dropZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropZone.style.background = '#f8f9fa';
                    dropZone.style.borderColor = '#cbd5e0';
                    
                    if (e.dataTransfer.files.length) {
                        fileInput.files = e.dataTransfer.files;
                        fileInput.dispatchEvent(new Event('change'));
                    }
                });
            }
        }
        
        // Обработка формы
        const form = document.getElementById('addColoringForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('coloringName').value.trim();
                const category = document.getElementById('coloringCategory').value;
                const description = document.getElementById('coloringDescription').value.trim();
                const fileInput = document.getElementById('coloringImage');
                const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'medium';
                
                // Валидация
                if (!name) {
                    this.showNotification('Введите название раскраски!', 'error');
                    return;
                }
                
                if (!category) {
                    this.showNotification('Выберите категорию!', 'error');
                    return;
                }
                
                if (!fileInput.files[0]) {
                    this.showNotification('Выберите файл изображения!', 'error');
                    return;
                }
                
                // Конвертация изображения в Base64
                try {
                    const imageBase64 = await this.fileToBase64(fileInput.files[0]);
                    
                    // Создание объекта данных
                    const coloringData = {
                        name,
                        category,
                        description,
                        image: imageBase64,
                        difficulty
                    };
                    
                    // Добавление раскраски
                    const success = await this.addColoring(coloringData);
                    
                    if (success) {
                        this.resetForm();
                        modal.classList.remove('active');
                    }
                    
                } catch (error) {
                    console.error('Ошибка обработки файла:', error);
                    this.showNotification('Ошибка обработки изображения!', 'error');
                }
            });
        }
        
        // Кнопки управления данными
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetAllData());
        }
        
        // Ссылки в футере
        const howToDownload = document.getElementById('howToDownload');
        const howToPrint = document.getElementById('howToPrint');
        
        if (howToDownload) {
            howToDownload.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('active');
            });
        }
        
        if (howToPrint) {
            howToPrint.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPrintGuide();
            });
        }
    }
    
    // Конвертация файла в Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    // Форматирование размера файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Сброс формы
    resetForm() {
        const form = document.getElementById('addColoringForm');
        if (form) form.reset();
        
        const fileNameDisplay = document.getElementById('selectedFileName');
        if (fileNameDisplay) fileNameDisplay.style.display = 'none';
    }
    
    // Экспорт данных
    exportData() {
        try {
            const colorings = this.getColorings();
            if (!colorings) {
                this.showNotification('Нет данных для экспорта!', 'error');
                return;
            }
            
            const dataStr = JSON.stringify(colorings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const dataUrl = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `раскраски-бэкап-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(dataUrl);
            
            this.showNotification('Данные успешно экспортированы!', 'success');
            
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            this.showNotification('Ошибка при экспорте данных!', 'error');
        }
    }
    
    // Импорт данных
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    // Базовая валидация структуры данных
                    const requiredCategories = ['anti-stress', 'romantic', 'horror'];
                    const isValid = requiredCategories.every(cat => 
                        cat in importedData && Array.isArray(importedData[cat])
                    );
                    
                    if (!isValid) {
                        throw new Error('Некорректный формат данных');
                    }
                    
                    // Сохранение данных
                    localStorage.setItem(this.storageKey, JSON.stringify(importedData));
                    
                    this.showNotification('Данные успешно импортированы!', 'success');
                    this.updateCategoryCounts();
                    
                } catch (error) {
                    console.error('Ошибка импорта:', error);
                    this.showNotification('Ошибка при импорте данных! Проверьте файл.', 'error');
                }
            };
            
            reader.onerror = () => {
                this.showNotification('Ошибка чтения файла!', 'error');
            };
            
            reader.readAsText(file);
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
    
    // Сброс всех данных
    resetAllData() {
        if (confirm('ВНИМАНИЕ! Вы уверены, что хотите удалить ВСЕ раскраски?\n\nЭто действие нельзя отменить.')) {
            this.initializeDefaultData();
            this.showNotification('Все данные удалены!', 'success');
            this.updateCategoryCounts();
        }
    }
    
    // Показ уведомлений
    showNotification(message, type = 'success') {
        // Удаляем старые уведомления
        const oldNotifications = document.querySelectorAll('.notification');
        oldNotifications.forEach(n => n.remove());
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление через 4 секунды
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    // Показ инструкции по печати
    showPrintGuide() {
        const guide = `
Рекомендации по печати:
1. Используйте плотную бумагу (от 120 г/м²)
2. Печатайте в масштабе 100%
3. Для цветных карандашей - матовая бумага
4. Для маркеров - специальная бумага для иллюстраций
5. Сохраняйте оригинальные размеры файла
        `;
        alert(guide);
    }
}

// Инициализация системы при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.coloringAdmin = new ColoringAdminSystem();
});
