if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log(`Координаты: ${latitude}, ${longitude}`);
      
      // Можно добавить отправку координат на сервер
       fetch('/api/save-location', {
         method: 'POST',
        headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ latitude, longitude })
       });

      // Или отобразить в интерфейсе
       document.getElementById('user-location').textContent =
         `Широта: ${latitude.toFixed(4)}, Долгота: ${longitude.toFixed(4)}`;
    },
    (error) => {
      console.error("Ошибка геолокации:", error.message);
      
      // Обработка различных ошибок
      switch(error.code) {
        case error.PERMISSION_DENIED:
          console.log("Пользователь отказал в запросе геолокации");
          break;
        case error.POSITION_UNAVAILABLE:
          console.log("Информация о местоположении недоступна");
          break;
        case error.TIMEOUT:
          console.log("Время запроса геолокации истекло");
          break;
        case error.UNKNOWN_ERROR:
          console.log("Произошла неизвестная ошибка");
          break;
      }
    },
    {
      // Опции геолокации
      enableHighAccuracy: true, // Высокая точность
      timeout: 10000, // 10 секунд на получение
      maximumAge: 0 // Не использовать кешированные данные
    }
  );
} else {
  console.log("Геолокация не поддерживается вашим браузером");
  // Альтернативное решение для браузеров без поддержки
  // document.getElementById('geolocation-warning').style.display = 'block';
}