        // Global Application State
        class DataExtractApp {
            constructor() {
                this.uploadedFiles = [];
                this.currentFormat = 'json';
                this.extractedData = null;
                this.history = [];
                this.isAnalyzing = false;
                this.monacoEditor = null;
                this.currentLanguage = 'en';
                this.theme = 'light';
                this.settings = {
                    ocrLanguage: 'eng',
                    ocrAccuracy: 2,
                    defaultFormat: 'json'
                };

                this.init();
            }

            init() {
                this.loadSettings();
                this.setupEventListeners();
                this.initMonacoEditor();
                this.updateLanguage();
                this.loadHistory();
                console.log('DataExtract AI initialized - 100% FREE, NO LIMITS!');
            }

            // Settings Management
            loadSettings() {
                if (!window.dataExtractStorage) {
                    window.dataExtractStorage = {};
                }

                const saved = this.getFromStorage('settings');
                if (saved) {
                    this.settings = { ...this.settings, ...saved };
                    this.currentLanguage = saved.language || 'en';
                    this.theme = saved.theme || 'light';
                }

                document.body.setAttribute('data-theme', this.theme);
                this.updateThemeIcon();
                this.applySettings();
            }

            saveSettings() {
                const settings = {
                    ...this.settings,
                    language: this.currentLanguage,
                    theme: this.theme
                };
                this.saveToStorage('settings', settings);
            }

            applySettings() {
                document.getElementById('languageSelect').value = this.currentLanguage;
                document.getElementById('ocrLanguage').value = this.settings.ocrLanguage;
                document.getElementById('ocrAccuracy').value = this.settings.ocrAccuracy;
                document.getElementById('defaultFormat').value = this.settings.defaultFormat;
                this.updateAccuracyLabel();
            }

            // Storage helpers (using in-memory storage)
            saveToStorage(key, data) {
                if (!window.dataExtractStorage) {
                    window.dataExtractStorage = {};
                }
                window.dataExtractStorage[key] = JSON.stringify(data);
            }

            getFromStorage(key) {
                if (!window.dataExtractStorage || !window.dataExtractStorage[key]) {
                    return null;
                }
                try {
                    return JSON.parse(window.dataExtractStorage[key]);
                } catch (e) {
                    return null;
                }
            }

            // Event Listeners
            setupEventListeners() {
                // Theme toggle
                document.getElementById('themeToggle').addEventListener('click', () => {
                    this.toggleTheme();
                });

                // Language selector
                document.getElementById('languageSelect').addEventListener('change', (e) => {
                    this.setLanguage(e.target.value);
                });

                // Drag & Drop
                const dropzone = document.getElementById('dropzone');
                const fileInput = document.getElementById('fileInput');

                dropzone.addEventListener('click', () => fileInput.click());
                dropzone.addEventListener('dragover', this.handleDragOver.bind(this));
                dropzone.addEventListener('dragleave', this.handleDragLeave.bind(this));
                dropzone.addEventListener('drop', this.handleDrop.bind(this));
                fileInput.addEventListener('change', this.handleFileSelect.bind(this));

                // Analysis
                document.getElementById('analyzeBtn').addEventListener('click', () => {
                    this.analyzeImages();
                });

                // Format toggle
                document.querySelectorAll('.format-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.setFormat(e.target.dataset.format);
                    });
                });

                // Editor controls
                document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
                document.getElementById('validateBtn').addEventListener('click', () => this.validateJSON());
                document.getElementById('downloadBtn').addEventListener('click', () => this.downloadResult());
                document.getElementById('prettifyBtn').addEventListener('click', () => this.prettifyJSON());
                document.getElementById('clearBtn').addEventListener('click', () => this.clearEditor());
                document.getElementById('addToHistoryBtn').addEventListener('click', () => this.addToHistory());

                // Settings
                document.getElementById('ocrLanguage').addEventListener('change', (e) => {
                    this.settings.ocrLanguage = e.target.value;
                    this.saveSettings();
                });

                document.getElementById('ocrAccuracy').addEventListener('input', (e) => {
                    this.settings.ocrAccuracy = parseInt(e.target.value);
                    this.updateAccuracyLabel();
                    this.saveSettings();
                });

                document.getElementById('defaultFormat').addEventListener('change', (e) => {
                    this.settings.defaultFormat = e.target.value;
                    this.saveSettings();
                });

                // Templates
                document.querySelectorAll('[data-template]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.loadTemplate(e.target.dataset.template);
                    });
                });

                // Export all
                document.getElementById('exportAllBtn').addEventListener('click', () => {
                    this.exportAll();
                });

                // History items
                document.addEventListener('click', (e) => {
                    if (e.target.closest('.history-item[data-index]')) {
                        const index = e.target.closest('.history-item').dataset.index;
                        this.loadFromHistory(parseInt(index));
                    }
                });

                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        switch (e.key) {
                            case 's':
                                e.preventDefault();
                                this.addToHistory();
                                break;
                            case 'd':
                                e.preventDefault();
                                this.downloadResult();
                                break;
                            case 'k':
                                e.preventDefault();
                                document.getElementById('fileInput').click();
                                break;
                        }
                    }
                });

                // Paste image support
                document.addEventListener('paste', (e) => {
                    const items = e.clipboardData.items;
                    for (let item of items) {
                        if (item.type.indexOf('image') !== -1) {
                            const file = item.getAsFile();
                            this.addFile(file);
                            break;
                        }
                    }
                });
            }

            // Theme Management
            toggleTheme() {
                this.theme = this.theme === 'light' ? 'dark' : 'light';
                document.body.setAttribute('data-theme', this.theme);
                this.updateThemeIcon();
                this.saveSettings();
            }

            updateThemeIcon() {
                const icon = document.getElementById('themeIcon');
                icon.textContent = this.theme === 'light' ? '🌙' : '☀️';
            }

            // Language Management
            setLanguage(lang) {
                this.currentLanguage = lang;
                this.updateLanguage();
                this.saveSettings();
            }

            updateLanguage() {
                const translations = {
                    'en': {
                        'recent': 'Recent Extractions',
                        'no-recent': 'No recent extractions',
                        'templates': 'Templates',
                        'template-table': 'Table Structure',
                        'template-flowchart': 'Flowchart/Diagram',
                        'template-form': 'Form Fields',
                        'template-chart': 'Chart/Graph',
                        'template-mindmap': 'Mind Map',
                        'settings': 'Settings',
                        'ocr-language': 'OCR Language:',
                        'ocr-accuracy': 'OCR Accuracy:',
                        'output-format': 'Default Output:',
                        'upload-title': 'Upload&Analyze',
                        'upload-subtitle': 'Drop any image with tables, diagrams, or text to extract structured data',
                        'drop-text': 'Drop image here or click to upload',
                        'drop-subtext': 'Supports PNG, JPG, PDF, Excel screenshots, and more',
                        'preview-title': 'Image Preview',
                        'files-title': 'Uploaded Files',
                        'analysis-title': 'Analysis',
                        'analyze-btn': 'Analyze Images',
                        'step-detection': 'Content Detection',
                        'step-ocr': 'OCR Processing',
                        'step-parsing': 'Structure Parsing',
                        'step-json': 'JSON Generation',
                        'output-title': 'Structured Output',
                        'output-subtitle': 'Edit, validate, and export your extracted data',
                        'clear-btn': 'Clear',
                        'save-btn': 'Save to History',
                        'history-title': 'Recent Results (Last 5)',
                        'footer-free': '🆓 No limits • No API keys • Fully free'
                    },
                    'ru': {
                        'recent': 'Последние извлечения',
                        'no-recent': 'Нет последних извлечений',
                        'templates': 'Шаблоны',
                        'template-table': 'Структура таблицы',
                        'template-flowchart': 'Блок-схема/диаграмма',
                        'template-form': 'Поля формы',
                        'template-chart': 'График/диаграмма',
                        'template-mindmap': 'Интеллект-карта',
                        'settings': 'Настройки',
                        'ocr-language': 'Язык OCR:',
                        'ocr-accuracy': 'Точность OCR:',
                        'output-format': 'Формат по умолчанию:',
                        'upload-title': 'Загрузить и анализировать',
                        'upload-subtitle': 'Перетащите любое изображение с таблицами, диаграммами или текстом для извлечения структурированных данных',
                        'drop-text': 'Перетащите изображение сюда или нажмите для загрузки',
                        'drop-subtext': 'Поддерживает PNG, JPG, PDF, скриншоты Excel и многое другое',
                        'preview-title': 'Предварительный просмотр изображения',
                        'files-title': 'Загруженные файлы',
                        'analysis-title': 'Анализ',
                        'analyze-btn': 'Анализировать изображения',
                        'step-detection': 'Определение содержимого',
                        'step-ocr': 'Обработка OCR',
                        'step-parsing': 'Разбор структуры',
                        'step-json': 'Генерация JSON',
                        'output-title': 'Структурированный вывод',
                        'output-subtitle': 'Редактируйте, проверяйте и экспортируйте извлеченные данные',
                        'clear-btn': 'Очистить',
                        'save-btn': 'Сохранить в историю',
                        'history-title': 'Последние результаты (Последние 5)',
                        'footer-free': '🆓 Без лимитов • Без API ключей • Полностью бесплатно'
                    },
                    'pl': {
                        'recent': 'Ostatnie wyodrębnienia',
                        'no-recent': 'Brak ostatnich wyodrębnień',
                        'templates': 'Szablony',
                        'template-table': 'Struktura tabeli',
                        'template-flowchart': 'Schemat blokowy/diagram',
                        'template-form': 'Pola formularza',
                        'template-chart': 'Wykres/diagram',
                        'template-mindmap': 'Mapa myśli',
                        'settings': 'Ustawienia',
                        'ocr-language': 'Język OCR:',
                        'ocr-accuracy': 'Dokładność OCR:',
                        'output-format': 'Domyślny format:',
                        'upload-title': 'Wgraj & Analizuj',
                        'upload-subtitle': 'Upuść dowolny obraz z tabelami, diagramami lub tekstem, aby wyodrębnić dane strukturalne',
                        'drop-text': 'Upuść obraz tutaj lub kliknij, aby wgrać',
                        'drop-subtext': 'Obsługuje PNG, JPG, PDF, zrzuty ekranu Excel i więcej',
                        'preview-title': 'Podgląd obrazu',
                        'files-title': 'Wgrane pliki',
                        'analysis-title': 'Analiza',
                        'analyze-btn': 'Analizuj obrazy',
                        'step-detection': 'Wykrywanie zawartości',
                        'step-ocr': 'Przetwarzanie OCR',
                        'step-parsing': 'Parsowanie struktury',
                        'step-json': 'Generowanie JSON',
                        'output-title': 'Wyjście strukturalne',
                        'output-subtitle': 'Edytuj, waliduj i eksportuj wyodrębnione dane',
                        'clear-btn': 'Wyczyść',
                        'save-btn': 'Zapisz do historii',
                        'history-title': 'Ostatnie wyniki (Ostatnie 5)',
                        'footer-free': '🆓 Bez limitów • Bez kluczy API • Całkowicie darmowe'
                    },
                    'by': {
                        'recent': 'Апошнія выцягванні',
                        'no-recent': 'Няма апошніх выцягванняў',
                        'templates': 'Шаблоны',
                        'template-table': 'Структура табліцы',
                        'template-flowchart': 'Блок-схема/дыяграма',
                        'template-form': 'Палі формы',
                        'template-chart': 'Графік/дыяграма',
                        'template-mindmap': 'Інтэлект-карта',
                        'settings': 'Налады',
                        'ocr-language': 'Мова OCR:',
                        'ocr-accuracy': 'Дакладнасць OCR:',
                        'output-format': 'Фармат па змаўчанні:',
                        'upload-title': 'Загрузіць i аналізаваць',
                        'upload-subtitle': 'Перацягніце любы малюнак з табліцамі, дыяграмамі або тэкстам для выцягвання структураваных даных',
                        'drop-text': 'Перацягніце малюнак сюды або націсніце для загрузкі',
                        'drop-subtext': 'Падтрымлівае PNG, JPG, PDF, скрыншоты Excel і многае іншае',
                        'preview-title': 'Папярэдні прагляд малюнка',
                        'files-title': 'Загружаныя файлы',
                        'analysis-title': 'Аналіз',
                        'analyze-btn': 'Аналізаваць малюнкі',
                        'step-detection': 'Вызначэнне змесціва',
                        'step-ocr': 'Апрацоўка OCR',
                        'step-parsing': 'Разбор структуры',
                        'step-json': 'Генерацыя JSON',
                        'output-title': 'Структураваны вывад',
                        'output-subtitle': 'Рэдагуйце, праверце і экспартуйце выцягнутыя даныя',
                        'clear-btn': 'Ачысціць',
                        'save-btn': 'Захаваць у гісторыю',
                        'history-title': 'Апошнія вынікі (Апошнія 5)',
                        'footer-free': '🆓 Без лімітаў • Без API ключоў • Цалкам бясплатна'
                    }
                };

                const texts = translations[this.currentLanguage] || translations['en'];

                document.querySelectorAll('[data-i18n]').forEach(element => {
                    const key = element.getAttribute('data-i18n');
                    if (texts[key]) {
                        element.textContent = texts[key];
                    }
                });
            }

            updateAccuracyLabel() {
                const accuracy = this.settings.ocrAccuracy;
                const labels = { 1: 'Fast', 2: 'Medium', 3: 'High' };
                document.getElementById('accuracyValue').textContent = labels[accuracy];
            }

            // File Handling
            handleDragOver(e) {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById('dropzone').classList.add('dragover');
            }

            handleDragLeave(e) {
                e.preventDefault();
                e.stopPropagation();
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    document.getElementById('dropzone').classList.remove('dragover');
                }
            }

            handleDrop(e) {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById('dropzone').classList.remove('dragover');

                const files = Array.from(e.dataTransfer.files);
                files.forEach(file => this.addFile(file));
            }

            handleFileSelect(e) {
                const files = Array.from(e.target.files);
                files.forEach(file => this.addFile(file));
            }

            addFile(file) {
                if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                    this.showMessage('Only image files and PDFs are supported', 'error');
                    return;
                }

                const fileData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    type: this.detectContentType(file.name),
                    uploadedAt: new Date()
                };

                this.uploadedFiles.push(fileData);
                this.updateFileList();
                this.updatePreview(fileData);
                this.enableAnalyzeButton();
            }

            detectContentType(filename) {
                const name = filename.toLowerCase();
                if (name.includes('table') || name.includes('excel') || name.includes('spreadsheet')) {
                    return 'table';
                } else if (name.includes('chart') || name.includes('graph') || name.includes('plot')) {
                    return 'chart';
                } else if (name.includes('diagram') || name.includes('flowchart') || name.includes('flow')) {
                    return 'flowchart';
                } else if (name.includes('form') || name.includes('survey')) {
                    return 'form';
                } else if (name.includes('mindmap') || name.includes('mind')) {
                    return 'mindmap';
                }
                return 'text';
            }

            formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            updateFileList() {
                const fileList = document.getElementById('fileList');
                const fileListSection = document.getElementById('fileListSection');

                if (this.uploadedFiles.length === 0) {
                    fileListSection.classList.add('hidden');
                    return;
                }

                fileListSection.classList.remove('hidden');
                fileList.innerHTML = '';

                this.uploadedFiles.forEach((fileData, index) => {
                    const item = document.createElement('div');
                    item.className = 'file-item';
                    item.innerHTML = `
                    <div class="file-info">
                    <div class="file-name">${fileData.name}</div>
                    <div class="file-size">${fileData.size} • ${fileData.type}</div>
                    </div>
                    <button class="btn btn--small btn--danger" onclick="app.removeFile(${index})">✕</button>
                    `;
                    fileList.appendChild(item);
                });
            }

            updatePreview(fileData) {
                const previewSection = document.getElementById('previewSection');
                const previewContainer = document.getElementById('previewContainer');

                previewSection.classList.remove('hidden');

                if (fileData.file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.className = 'preview-image';
                        img.alt = 'Preview of ' + fileData.name;
                        previewContainer.innerHTML = '';
                        previewContainer.appendChild(img);
                    };
                    reader.readAsDataURL(fileData.file);
                } else {
                    previewContainer.innerHTML = `
                    <div class="card text-center">
                    <h4>📄 ${fileData.name}</h4>
                    <p>PDF file ready for analysis</p>
                    </div>
                    `;
                }
            }

            removeFile(index) {
                this.uploadedFiles.splice(index, 1);
                this.updateFileList();

                if (this.uploadedFiles.length === 0) {
                    document.getElementById('previewSection').classList.add('hidden');
                    this.disableAnalyzeButton();
                }
            }

            enableAnalyzeButton() {
                document.getElementById('analyzeBtn').disabled = false;
            }

            disableAnalyzeButton() {
                document.getElementById('analyzeBtn').disabled = true;
            }

            // Beautiful Analysis Engine
            async analyzeImages() {
                if (this.uploadedFiles.length === 0 || this.isAnalyzing) return;

                this.isAnalyzing = true;
                const progressSection = document.getElementById('progressSection');
                const analyzeBtn = document.getElementById('analyzeBtn');

                // Add loading animation
                progressSection.classList.remove('hidden');
                progressSection.classList.add('scale-in');
                analyzeBtn.disabled = true;
                analyzeBtn.innerHTML = '<div class="dots-loading"><span></span><span></span><span></span></div> Анализирую...';
                analyzeBtn.classList.add('loading');

                try {
                    const results = [];

                    for (let i = 0; i < this.uploadedFiles.length; i++) {
                        const fileData = this.uploadedFiles[i];
                        this.updateProgress(((i + 1) / this.uploadedFiles.length) * 100, `Обрабатываю ${fileData.name}...`);

                        const result = await this.processFile(fileData);
                        results.push(result);
                    }

                    // Combine results
                    const combinedResult = this.combineResults(results);
                    this.extractedData = combinedResult;

                    // Show success animation
                    this.updateProgress(100, 'Анализ завершен!');

                    // Update editor with animation
                    setTimeout(() => {
                        this.setEditorContent(JSON.stringify(combinedResult, null, 2));
                        const editorContainer = document.querySelector('.editor-container');
                        editorContainer.style.animation = 'scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    }, 500);

                    this.showMessage('Анализ успешно завершен! ✨', 'success', '🎉');

                } catch (error) {
                    console.error('Analysis error:', error);
                    this.showMessage('Ошибка анализа: ' + error.message, 'error', '💥');
                } finally {
                    this.isAnalyzing = false;
                    analyzeBtn.disabled = false;
                    analyzeBtn.textContent = '🔍 Анализировать изображения';
                    analyzeBtn.classList.remove('loading');

                    // Hide progress after delay
                    setTimeout(() => {
                        progressSection.classList.add('hidden');
                    }, 2000);
                }
            }

            async processFile(fileData) {
                // Step 1: Content Detection
                this.updateStep('stepDetection', 'active');
                const contentType = await this.detectContent(fileData.file);
                this.updateStep('stepDetection', 'completed');

                // Step 2: OCR Processing
                this.updateStep('stepOCR', 'active');
                const ocrResult = await this.performOCR(fileData.file);
                this.updateStep('stepOCR', 'completed');

                // Step 3: Structure Parsing
                this.updateStep('stepParsing', 'active');
                const structuredData = await this.parseStructure(ocrResult, contentType);
                this.updateStep('stepParsing', 'completed');

                // Step 4: JSON Generation
                this.updateStep('stepJSON', 'active');
                const jsonResult = this.generateJSON(structuredData, contentType, fileData);
                this.updateStep('stepJSON', 'completed');

                return jsonResult;
            }

            async detectContent(file) {
                // Simulate content detection using image analysis
                return new Promise((resolve) => {
                    setTimeout(() => {
                        // Simple heuristic based on filename and basic analysis
                        const fileName = file.name.toLowerCase();

                        if (fileName.includes('table') || fileName.includes('excel')) {
                            resolve('table');
                        } else if (fileName.includes('chart') || fileName.includes('graph')) {
                            resolve('chart');
                        } else if (fileName.includes('flowchart') || fileName.includes('diagram')) {
                            resolve('flowchart');
                        } else if (fileName.includes('form')) {
                            resolve('form');
                        } else {
                            // Default to text/table for most images
                            resolve('table');
                        }
                    }, 500);
                });
            }

            async performOCR(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        try {
                            const { data: { text, words, lines } } = await Tesseract.recognize(
                                reader.result,
                                this.settings.ocrLanguage,
                                {
                                    logger: (m) => {
                                        if (m.status === 'recognizing text') {
                                            this.updateProgress(m.progress * 100, `OCR: ${Math.round(m.progress * 100)}%`);
                                        }
                                    }
                                }
                            );
                            resolve({ text, words, lines });
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }

            async parseStructure(ocrResult, contentType) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const { text, words, lines } = ocrResult;

                        switch (contentType) {
                            case 'table':
                                resolve(this.parseTableStructure(text, lines));
                                break;
                            case 'flowchart':
                                resolve(this.parseFlowchartStructure(text, words));
                                break;
                            case 'form':
                                resolve(this.parseFormStructure(text, lines));
                                break;
                            case 'chart':
                                resolve(this.parseChartStructure(text, words));
                                break;
                            default:
                                resolve(this.parseTextStructure(text, lines));
                        }
                    }, 300);
                });
            }

            parseTableStructure(text, lines) {
                const rows = lines.filter(line => line.text.trim().length > 0);

                if (rows.length === 0) {
                    return { headers: [], data: [] };
                }

                // Try to detect headers (usually first row)
                const firstRow = rows[0].text.trim();
                const headers = this.splitTableRow(firstRow);

                const data = [];
                for (let i = 1; i < rows.length; i++) {
                    const rowText = rows[i].text.trim();
                    const cells = this.splitTableRow(rowText);

                    if (cells.length > 0) {
                        const rowData = {};
                        cells.forEach((cell, index) => {
                            const header = headers[index] || `Column${index + 1}`;
                            rowData[header] = cell;
                        });
                        data.push(rowData);
                    }
                }

                return { headers, data };
            }

            splitTableRow(text) {
                // Split by common table separators
                return text.split(/[\|\t\s{2,}]+/)
                .map(cell => cell.trim())
                .filter(cell => cell.length > 0);
            }

            parseFlowchartStructure(text, words) {
                // Extract potential nodes and connections
                const nodes = [];
                const edges = [];

                // Look for arrow patterns and connections
                const lines = text.split('\n').filter(line => line.trim());
                let nodeId = 1;

                lines.forEach((line, index) => {
                    if (line.includes('->') || line.includes('→')) {
                        const parts = line.split(/->|→/);
                        if (parts.length === 2) {
                            const from = parts[0].trim();
                            const to = parts[1].trim();

                            nodes.push({ id: nodeId++, label: from, type: 'process' });
                            nodes.push({ id: nodeId++, label: to, type: 'process' });
                            edges.push({ from: nodeId - 2, to: nodeId - 1, label: '' });
                        }
                    } else {
                        // Regular text node
                        nodes.push({ id: nodeId++, label: line.trim(), type: 'process' });
                    }
                });

                return { nodes, edges };
            }

            parseFormStructure(text, lines) {
                const fields = [];

                lines.forEach(line => {
                    const text = line.text.trim();

                    // Look for common form patterns
                    if (text.includes(':') || text.includes('__') || text.includes('[]')) {
                        let fieldName = text.replace(/[:_\[\]]/g, '').trim();
                        let fieldType = 'text';

                        // Guess field type
                        if (fieldName.toLowerCase().includes('email')) {
                            fieldType = 'email';
                        } else if (fieldName.toLowerCase().includes('password')) {
                            fieldType = 'password';
                        } else if (fieldName.toLowerCase().includes('phone')) {
                            fieldType = 'tel';
                        } else if (fieldName.toLowerCase().includes('date')) {
                            fieldType = 'date';
                        } else if (text.includes('[]')) {
                            fieldType = 'checkbox';
                        }

                        fields.push({
                            name: fieldName.toLowerCase().replace(/\s+/g, '_'),
                                    label: fieldName,
                                    type: fieldType,
                                    required: text.includes('*')
                        });
                    }
                });

                return { fields };
            }

            parseChartStructure(text, words) {
                // Extract numeric data and labels
                const dataPoints = [];
                const labels = [];

                words.forEach(word => {
                    if (/^\d+(\.\d+)?$/.test(word.text)) {
                        dataPoints.push(parseFloat(word.text));
                    } else if (word.text.length > 1 && !(/^\d/.test(word.text))) {
                        labels.push(word.text);
                    }
                });

                return {
                    type: 'chart',
                    data: dataPoints,
                    labels: labels.slice(0, dataPoints.length),
                    chartType: 'bar' // Default assumption
                };
            }

            parseTextStructure(text, lines) {
                return {
                    type: 'text',
                    content: text,
                    lines: lines.map(line => line.text),
                    wordCount: text.split(/\s+/).length
                };
            }

            generateJSON(structuredData, contentType, fileData) {
                const baseResult = {
                    type: contentType,
                    filename: fileData.name,
                    extractedAt: new Date().toISOString(),
                    ...structuredData
                };

                return baseResult;
            }

            combineResults(results) {
                if (results.length === 1) {
                    return results[0];
                }

                return {
                    type: 'multi_file_extraction',
                    extractedAt: new Date().toISOString(),
                    fileCount: results.length,
                    results: results
                };
            }

            updateProgress(percentage, message) {
                document.getElementById('progressFill').style.width = percentage + '%';
                document.getElementById('progressText').textContent = message;
            }

            updateStep(stepId, state) {
                const step = document.getElementById(stepId);
                step.classList.remove('active', 'completed');
                if (state) {
                    step.classList.add(state);
                }
            }

            // Monaco Editor
            async initMonacoEditor() {
                try {
                    require.config({
                        paths: {
                            'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs'
                        }
                    });

                    require(['vs/editor/editor.main'], () => {
                        this.monacoEditor = monaco.editor.create(document.getElementById('monaco-editor'), {
                            value: '// Upload and analyze images to see structured JSON data here\n{\n  "message": "No data extracted yet"\n}',
                            language: 'json',
                            theme: this.theme === 'dark' ? 'vs-dark' : 'vs',
                            automaticLayout: true,
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            rulers: [],
                            wordWrap: 'on',
                            scrollBeyondLastLine: false
                        });

                        // Update stats on content change
                        this.monacoEditor.onDidChangeModelContent(() => {
                            this.updateStats();
                        });
                    });
                } catch (error) {
                    console.error('Failed to initialize Monaco Editor:', error);
                    // Fallback to textarea
                    this.initFallbackEditor();
                }
            }

            initFallbackEditor() {
                const container = document.getElementById('monaco-editor');
                container.innerHTML = `
                <textarea
                id="fallback-editor"
                class="w-full font-mono"
                style="height: 100%; padding: 1rem; background: var(--bg-primary); color: var(--text-primary); border: none; outline: none; resize: none;"
                placeholder="Upload and analyze images to see structured JSON data here..."
                ></textarea>
                `;

                const textarea = document.getElementById('fallback-editor');
                textarea.addEventListener('input', () => this.updateStats());
                this.monacoEditor = {
                    getValue: () => textarea.value,
                    setValue: (value) => { textarea.value = value; },
                    getModel: () => ({ getLineCount: () => textarea.value.split('\n').length })
                };
            }

            setEditorContent(content) {
                if (this.monacoEditor) {
                    this.monacoEditor.setValue(content);
                    this.updateStats();
                }
            }

            getEditorContent() {
                return this.monacoEditor ? this.monacoEditor.getValue() : '';
            }

            updateStats() {
                if (!this.monacoEditor) return;

                const content = this.getEditorContent();
                const lines = this.monacoEditor.getModel ?
                this.monacoEditor.getModel().getLineCount() :
                content.split('\n').length;
                const chars = content.length;

                document.getElementById('statsText').textContent = `Lines: ${lines} | Characters: ${chars}`;
            }

            // Format Management
            setFormat(format) {
                this.currentFormat = format;

                // Update active button
                document.querySelectorAll('.format-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.format === format) {
                        btn.classList.add('active');
                    }
                });

                // Convert current content
                this.convertFormat(format);
            }

            convertFormat(format) {
                if (!this.extractedData) return;

                let converted;

                switch (format) {
                    case 'json':
                        converted = JSON.stringify(this.extractedData, null, 2);
                        break;
                    case 'yaml':
                        converted = this.jsonToYaml(this.extractedData);
                        break;
                    case 'csv':
                        converted = this.jsonToCsv(this.extractedData);
                        break;
                    case 'xml':
                        converted = this.jsonToXml(this.extractedData);
                        break;
                }

                this.setEditorContent(converted);
            }

            jsonToYaml(obj, indent = 0) {
                let yaml = '';
                const spaces = '  '.repeat(indent);

                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        yaml += `${spaces}${key}:\n${this.jsonToYaml(value, indent + 1)}`;
                    } else if (Array.isArray(value)) {
                        yaml += `${spaces}${key}:\n`;
                        value.forEach(item => {
                            if (typeof item === 'object') {
                                yaml += `${spaces}  -\n${this.jsonToYaml(item, indent + 2).replace(/^/gm, '    ')}`;
                            } else {
                                yaml += `${spaces}  - ${item}\n`;
                            }
                        });
                    } else {
                        yaml += `${spaces}${key}: ${value}\n`;
                    }
                }

                return yaml;
            }

            jsonToCsv(data) {
                if (!data) return '';

                if (data.type === 'table' && data.data) {
                    const headers = data.headers || Object.keys(data.data[0] || {});
                    let csv = headers.join(',') + '\n';

                    data.data.forEach(row => {
                        const values = headers.map(header => `"${row[header] || ''}"`).join(',');
                        csv += values + '\n';
                    });

                    return csv;
                } else {
                    return 'CSV format not available for this data type';
                }
            }

            jsonToXml(obj, root = 'data') {
                let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n`;
                xml += this.objectToXml(obj, 1);
                xml += `</${root}>`;
                return xml;
            }

            objectToXml(obj, indent) {
                let xml = '';
                const spaces = '  '.repeat(indent);

                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        xml += `${spaces}<${key}>\n${this.objectToXml(value, indent + 1)}${spaces}</${key}>\n`;
                    } else if (Array.isArray(value)) {
                        value.forEach(item => {
                            if (typeof item === 'object') {
                                xml += `${spaces}<${key}>\n${this.objectToXml(item, indent + 1)}${spaces}</${key}>\n`;
                            } else {
                                xml += `${spaces}<${key}>${item}</${key}>\n`;
                            }
                        });
                    } else {
                        xml += `${spaces}<${key}>${value}</${key}>\n`;
                    }
                }

                return xml;
            }

            // Editor Actions
            copyToClipboard() {
                const content = this.getEditorContent();
                navigator.clipboard.writeText(content).then(() => {
                    this.showMessage('Content copied to clipboard!', 'success');
                }).catch(err => {
                    this.showMessage('Failed to copy to clipboard', 'error');
                });
            }

            validateJSON() {
                if (this.currentFormat !== 'json') {
                    this.showMessage('Validation only available for JSON format', 'warning');
                    return;
                }

                try {
                    JSON.parse(this.getEditorContent());
                    this.showMessage('JSON is valid!', 'success');
                } catch (error) {
                    this.showMessage('JSON is invalid: ' + error.message, 'error');
                }
            }

            downloadResult() {
                const content = this.getEditorContent();
                const extensions = { json: 'json', yaml: 'yaml', csv: 'csv', xml: 'xml' };
                const filename = `extracted_data_${Date.now()}.${extensions[this.currentFormat]}`;

                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.showMessage(`Downloaded ${filename}`, 'success');
            }

            prettifyJSON() {
                if (this.currentFormat !== 'json') {
                    this.showMessage('Prettify only available for JSON format', 'warning');
                    return;
                }

                try {
                    const content = this.getEditorContent();
                    const parsed = JSON.parse(content);
                    const prettified = JSON.stringify(parsed, null, 2);
                    this.setEditorContent(prettified);
                    this.showMessage('JSON prettified!', 'success');
                } catch (error) {
                    this.showMessage('Cannot prettify invalid JSON', 'error');
                }
            }

            clearEditor() {
                this.setEditorContent('');
                this.extractedData = null;
                this.showMessage('Editor cleared', 'info');
            }

            // History Management
            addToHistory() {
                const content = this.getEditorContent();
                if (!content.trim()) {
                    this.showMessage('Nothing to save', 'warning');
                    return;
                }

                const entry = {
                    id: Date.now(),
                    content: content,
                    format: this.currentFormat,
                        timestamp: new Date(),
                        preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
                };

                this.history.unshift(entry);

                // Keep only last 50 entries
                if (this.history.length > 50) {
                    this.history = this.history.slice(0, 50);
                }

                this.saveHistory();
                this.updateHistoryUI();
                this.updateRecentList();
                this.showMessage('Saved to history', 'success');
            }

            loadFromHistory(index) {
                if (index >= 0 && index < this.history.length) {
                    const entry = this.history[index];
                    this.setFormat(entry.format);
                    this.setEditorContent(entry.content);
                    this.showMessage('Loaded from history', 'info');
                }
            }

            saveHistory() {
                this.saveToStorage('history', this.history);
            }

            loadHistory() {
                const saved = this.getFromStorage('history');
                if (saved) {
                    this.history = saved;
                    this.updateHistoryUI();
                    this.updateRecentList();
                }
            }

            updateHistoryUI() {
                const container = document.getElementById('historyContainer');

                if (this.history.length === 0) {
                    container.innerHTML = `
                    <div class="history-item">
                    <div class="history-date">No results yet</div>
                    <div class="history-type">Upload and analyze images to see results</div>
                    </div>
                    `;
                    return;
                }

                container.innerHTML = '';

                this.history.slice(0, 5).forEach((entry, index) => {
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    item.dataset.index = index;
                    item.innerHTML = `
                    <div class="history-date">${entry.timestamp.toLocaleString()}</div>
                    <div class="history-type">${entry.format.toUpperCase()} • ${entry.content.length} chars</div>
                    <div class="history-preview">${entry.preview}</div>
                    `;
                    container.appendChild(item);
                });
            }

            updateRecentList() {
                const recentList = document.getElementById('recentList');

                if (this.history.length === 0) {
                    recentList.innerHTML = '<div class="sidebar-item">No recent extractions</div>';
                    return;
                }

                recentList.innerHTML = '';

                this.history.slice(0, 10).forEach((entry, index) => {
                    const item = document.createElement('button');
                    item.className = 'sidebar-item';
                    item.dataset.index = index;
                    item.textContent = `${entry.format.toUpperCase()} • ${new Date(entry.timestamp).toLocaleDateString()}`;
                    item.onclick = () => this.loadFromHistory(index);
                    recentList.appendChild(item);
                });
            }

            // Templates
            loadTemplate(templateType) {
                const templates = {
                    table: {
                        type: 'table',
                        headers: ['Column1', 'Column2', 'Column3'],
                        data: [
                            { 'Column1': 'Value1', 'Column2': 'Value2', 'Column3': 'Value3' },
                            { 'Column1': 'Value4', 'Column2': 'Value5', 'Column3': 'Value6' }
                        ]
                    },
                    flowchart: {
                        type: 'flowchart',
                        nodes: [
                            { id: 1, label: 'Start', type: 'start', x: 100, y: 50 },
                            { id: 2, label: 'Process', type: 'process', x: 100, y: 150 },
                            { id: 3, label: 'End', type: 'end', x: 100, y: 250 }
                        ],
                        edges: [
                            { from: 1, to: 2, label: '' },
                            { from: 2, to: 3, label: '' }
                        ]
                    },
                    form: {
                        type: 'form',
                        fields: [
                            { name: 'name', label: 'Name', type: 'text', required: true },
                            { name: 'email', label: 'Email', type: 'email', required: true },
                            { name: 'message', label: 'Message', type: 'textarea', required: false }
                        ]
                    },
                    chart: {
                        type: 'chart',
                        chartType: 'bar',
                        data: [10, 20, 30, 40, 50],
                        labels: ['A', 'B', 'C', 'D', 'E']
                    },
                    mindmap: {
                        type: 'mindmap',
                        central_topic: 'Main Idea',
                        branches: [
                            {
                                topic: 'Branch 1',
                                subtopics: ['Subtopic 1.1', 'Subtopic 1.2']
                            },
                            {
                                topic: 'Branch 2',
                                subtopics: ['Subtopic 2.1', 'Subtopic 2.2']
                            }
                        ]
                    }
                };

                const template = templates[templateType];
                if (template) {
                    this.setFormat('json');
                    this.setEditorContent(JSON.stringify(template, null, 2));
                    this.extractedData = template;
                    this.showMessage(`Loaded ${templateType} template`, 'info');
                }
            }

            // Export All
            exportAll() {
                if (this.history.length === 0) {
                    this.showMessage('No data to export', 'warning');
                    return;
                }

                const zip = new JSZip ? new JSZip() : null;

                if (zip) {
                    this.history.forEach((entry, index) => {
                        const extensions = { json: 'json', yaml: 'yaml', csv: 'csv', xml: 'xml' };
                        const filename = `extraction_${index + 1}.${extensions[entry.format]}`;
                        zip.file(filename, entry.content);
                    });

                    zip.generateAsync({ type: 'blob' }).then(content => {
                        const url = URL.createObjectURL(content);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `dataextract_export_${Date.now()}.zip`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        this.showMessage('All data exported as ZIP', 'success');
                    });
                } else {
                    // Fallback: export as single JSON file
                    const exportData = {
                        exportedAt: new Date().toISOString(),
                        totalEntries: this.history.length,
                        entries: this.history
                    };

                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `dataextract_export_${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.showMessage('All data exported as JSON', 'success');
                }
            }

            // Utility Functions
            showMessage(message, type = 'info') {
                // Remove existing messages
                document.querySelectorAll('.error-message, .success-message, .warning-message, .info-message').forEach(el => el.remove());

                const messageEl = document.createElement('div');
                messageEl.className = `${type}-message`;
                messageEl.textContent = message;

                // Add to upload zone
                const uploadZone = document.querySelector('.upload-zone');
                uploadZone.insertBefore(messageEl, uploadZone.firstChild);

                // Auto remove after 5 seconds
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 5000);
            }
        }

        // Initialize the application
        let app;
        document.addEventListener('DOMContentLoaded', () => {
            app = new DataExtractApp();
            window.app = app; // Make available globally for onclick handlers
        });

        // Performance monitoring
        window.addEventListener('load', () => {
            console.log('DataExtract AI loaded - Ready for image analysis!');
            console.log('Features: OCR ✓, Table Detection ✓, Chart Analysis ✓, Free Forever ✓');
        });

        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Application error:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
