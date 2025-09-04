// Gerekli kütüphaneleri çağırıyoruz
require('dotenv').config();
const express = require('express');

// Express uygulamasını başlatıyoruz
const app = express();

// Sunucunun çalışacağı portu .env dosyasından alıyoruz, eğer orada tanımlı değilse 3001'i kullanıyoruz
const PORT = process.env.PORT || 3001;

// Basit bir "sağlık kontrolü" rotası oluşturuyoruz.
// Bu, sunucunun ayakta olup olmadığını kontrol etmek için kullanılır.
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Gym OS API is running!' });
});

// Sunucuyu belirtilen portta dinlemeye başlatıyoruz
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
