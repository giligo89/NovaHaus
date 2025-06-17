/* global Chart */
import { show3DModel } from './visualization.js';
import { showChart } from './chart.js';

// Экспортируем modelMap для использования в других модулях
export const modelMap = {
    'apartment': {
        'economy': '/static/models/apartment_economy.glb',
        'standard': '/static/models/apartment_standard.glb',
        'premium': '/static/models/apartment_premium.glb'
    },
    'house': {
        'economy': '/static/models/house_economy.glb',
        'standard': '/static/models/house_standard.glb',
        'premium': '/static/models/house_premium.glb'
    },
    'office': {
        'economy': '/static/models/office_economy.glb',
        'standard': '/static/models/office_standard.glb',
        'premium': '/static/models/office_premium.glb'
    },
    'warehouse': {
        'economy': '/static/models/warehouse_economy.glb',
        'standard': '/static/models/warehouse_standard.glb',
        'premium': '/static/models/warehouse_premium.glb'
    },
    'facade': {
        'economy': '/static/models/facade_economy.glb',
        'standard': '/static/models/facade_standard.glb',
        'premium': '/static/models/facade_premium.glb'
    },
    'bathroom': {
        'economy': '/static/models/bathroom_economy.glb',
        'standard': '/static/models/bathroom_standard.glb',
        'premium': '/static/models/bathroom_premium.glb'
    }
};

const calculationCache = new Map();

function formatCurrency(amount, locale = navigator.language || 'de-DE') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
}

async function fetchData(url, options) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Request error (${url}):`, error);
        return { success: false, error: error.message };
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || null;
}

function getFormValues(form) {
    const formData = new FormData(form);
    return {
        area: parseFloat(formData.get('area') || 0),
        workType: formData.get('work-type') || '',
        materialQuality: formData.get('material-quality') || ''
    };
}

async function calculateCost(event) {
    event.preventDefault();
    const form = document.getElementById('calculator-form');
    const resultElement = document.getElementById('result');
    const recommendationElement = document.getElementById('ai-recommendation-text');
    const loader = document.getElementById('loader');

    if (!form || !resultElement || !recommendationElement || !loader) return;

    try {
        const csrfToken = getCSRFToken();
        if (!csrfToken) {
            resultElement.textContent = 'Ошибка безопасности: отсутствует CSRF токен';
            resultElement.style.color = 'red';
            return;
        }

        const { area, workType, materialQuality } = getFormValues(form);

        if (!workType || !materialQuality || area <= 0 || isNaN(area)) {
            resultElement.textContent = 'Ошибка: Пожалуйста, заполните все поля корректными значениями.';
            resultElement.style.color = 'red';
            return;
        }

        const cacheKey = `${workType}-${area}-${materialQuality}`;
        if (calculationCache.has(cacheKey)) {
            const cached = calculationCache.get(cacheKey);
            updateUI(cached.costData, cached.aiData, workType, materialQuality);
            return;
        }

        loader.style.display = 'block';

        const costResponse = await fetchData('/calculate_cost/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrfToken },
            body: new FormData(form)
        });

        if (!costResponse.success) {
            resultElement.textContent = `Ошибка: ${costResponse.error || 'Неизвестная ошибка'}`;
            resultElement.style.color = 'red';
            loader.style.display = 'none';
            return;
        }

        // Безопасное извлечение стоимости работ из ответа
        const laborCost = costResponse.data?.labor_cost ||
                         costResponse.data?.laborCost ||
                         costResponse.labor_cost ||
                         costResponse.laborCost ||
                         0;

        const aiResponse = await fetchData('/get-ai-recommendations/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                laborCost,
                workType,
                area,
                materialQuality,
                language: navigator.language.split('-')[0] || 'de'
            })
        });

        calculationCache.set(cacheKey, {
            costData: costResponse,
            aiData: aiResponse
        });

        updateUI(costResponse, aiResponse, workType, materialQuality);
    } catch (error) {
        console.error('Calculation error:', error);
        if (resultElement) {
            resultElement.textContent = 'Ошибка: ' + error.message;
            resultElement.style.color = 'red';
        }
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

function updateUI(costData, aiData, workType, materialQuality) {
    const resultElement = document.getElementById('result');
    const recommendationElement = document.getElementById('ai-recommendation-text');

    if (!resultElement || !recommendationElement) return;

    // Безопасное извлечение всех данных
    const laborCost = costData.data?.labor_cost ||
                    costData.data?.laborCost ||
                    costData.labor_cost ||
                    costData.laborCost ||
                    0;

    const materialCost = aiData.data?.material_cost ||
                       aiData.data?.materialCost ||
                       aiData.material_cost ||
                       aiData.materialCost ||
                       0;

    const recommendation = aiData.data?.recommendation ||
                         aiData.recommendation ||
                         aiData.recommendation ||
                         'Нет рекомендаций';

    const totalCost = laborCost + materialCost;

    resultElement.textContent = `Примерная стоимость: ${formatCurrency(totalCost)}`;
    resultElement.style.color = 'black';
    resultElement.dataset.materialCost = materialCost.toString();
    resultElement.dataset.laborCost = laborCost.toString();
    resultElement.dataset.totalCost = totalCost.toString();

    recommendationElement.textContent = recommendation;

    showChart(materialCost, laborCost, 0);
    show3DModel(modelMap[workType]?.[materialQuality] || '/static/models/sample_model.glb');
}

async function saveCalculation() {
    const form = document.getElementById('calculator-form');
    const resultElement = document.getElementById('result');

    if (!form || !resultElement) return;

    try {
        const csrfToken = getCSRFToken();
        if (!csrfToken) {
            alert('Ошибка безопасности: отсутствует CSRF токен');
            return;
        }

        const { workType, area, materialQuality } = getFormValues(form);

        const data = {
            workType,
            area,
            material: materialQuality,
            totalCost: parseFloat(resultElement.dataset.totalCost || '0'),
            materialCost: parseFloat(resultElement.dataset.materialCost || '0'),
            laborCost: parseFloat(resultElement.dataset.laborCost || '0'),
            timestamp: new Date().toISOString()
        };

        const result = await fetchData('/save-calculation/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(data)
        });

        alert(result?.success ? 'Расчет успешно сохранен!' : 'Ошибка при сохранении расчета.');
    } catch (error) {
        console.error('Save error:', error);
        alert('Ошибка: ' + error.message);
    }
}

function initEventListeners() {
    const form = document.getElementById('calculator-form');
    const saveButton = document.getElementById('save-button');

    if (form) {
        form.addEventListener('submit', debounce(calculateCost, 300));
    }

    if (saveButton) {
        saveButton.addEventListener('click', saveCalculation);
    }
}

function initModelViewer() {
    const container = document.getElementById('viewer-container');
    if (!container) return;

    const modelViewer = document.createElement('model-viewer');
    modelViewer.id = 'viewer';
    modelViewer.style.cssText = 'display: none; width: 100%; height: 400px;';
    modelViewer.setAttribute('ar', '');
    modelViewer.setAttribute('shadow-intensity', '1');
    modelViewer.setAttribute('camera-controls', '');
    modelViewer.setAttribute('touch-action', 'pan-y');
    modelViewer.alt = '3D Model Viewer';

    container.appendChild(modelViewer);
}

function initCalculator() {
    initEventListeners();
    initModelViewer();
}

document.addEventListener('DOMContentLoaded', initCalculator);