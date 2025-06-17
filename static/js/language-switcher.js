document.querySelectorAll(".language-switcher button").forEach(btn => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-lang");
    document.documentElement.lang = lang;
    console.log(`Язык переключен на: ${lang}`);
    // Дополнительно: можно отправить запрос на сервер для смены языка
  });
});