// ai-integration.js - Исправленная версия

// Функция для обработки AI-рекомендаций (сохранена из вашего кода)
require('dotenv').config();

async function processAIResponse(response, recommendationElement) {
    const result = await response.json();
    console.log("Serverantwort:", result);
    if (result.success && result.recommendation) {
        recommendationElement.innerText = result.recommendation;
    } else {
        console.error('Fehler bei Empfehlungen:', result.error);
        recommendationElement.innerText = 'Empfehlungen konnten nicht abgerufen werden. Bitte versuchen Sie es später.';
    }
}

// Функция для получения рекомендаций (сохранена из вашего кода)
async function getAIRecommendations(totalCost, materialCost, laborCost, workType, area) {
    // ... существующий код без изменений ...
}

// НОВЫЙ КОД ДЛЯ AI-АССИСТЕНТА
document.addEventListener('DOMContentLoaded', () => {
    // ... существующий код для calculateButton ...

    const aiAssistant = document.getElementById("ai-assistant");
    if (aiAssistant) {
        aiAssistant.addEventListener("click", async () => {
            const apiKey = process.env.GROK_API_KEY;
            if (!apiKey) {
                alert("Ошибка: API ключ для Grok не найден.");
                return;
            }

            // Получаем текущий стиль дизайна из UI
            const currentDesignStyle = document.querySelector(
                '.design-options input[name="style"]:checked'
            )?.value || "modern";

            try {
                const response = await fetch("https://api.grok.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "mixtral-8x7b-32768",
                        messages: [
                            {
                                role: "user",
                                content: `Помоги подобрать материалы для проекта в стиле ${currentDesignStyle}`
                            }
                        ],
                        temperature: 0.9,
                        max_tokens: 1024
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Проверяем структуру ответа
                if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                    const recommendation = data.choices[0].message.content;

                    // Показываем рекомендацию в UI
                    document.getElementById("ai-recommendation").innerHTML = `
                        <div class="ai-response">
                            <h3>AI Recommendation:</h3>
                            <p>${recommendation}</p>
                        </div>
                    `;
                } else {
                    throw new Error("Invalid response format from API");
                }
            } catch (error) {
                console.error('Ошибка при запросе к Grok API:', error);
                document.getElementById("ai-recommendation").innerHTML = `
                    <div class="ai-error">
                        Ошибка: ${error.message}
                    </div>
                `;
            }
        });
    }
});

// В конец обработчика DOMContentLoaded добавьте:
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('close-btn')) {
    document.getElementById('ai-recommendation').style.display = 'none';
  }
});