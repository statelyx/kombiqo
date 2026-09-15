# Kombiqo 0.3.0 — kişisel keşif

- İlk açılışta ad/takma ad, isteğe bağlı yaş, cinsiyet, çoklu tarz ve marka seçimi. Önceki gardırop kayıtları korunur; mevcut kullanıcıya profil bir kez sorulur.
- Kombinler: sağa beğen/kaydet, sola gizle; düğme alternatifleri ve son kaydırmayı geri alma.
- Son 200 değerlendirmeden sınırlı tarz puanı; aynı kombin tekrar oylandığında oy değiştirilir. Yaş/cinsiyet ile kıyafet kısıtlaması yapılmaz.
- Ürün markası ve tercih edilen markalar sıralamaya katılır. Marka kataloğu Dolap'ın https://dolap.com/markalar ve ana sayfasından seçilmiş yaygın giyim markalarıdır; tam katalog/ortaklık değildir. Aramayla özel marka eklenebilir.
- Panodan görsel yapıştırma, galeriden mağaza ekran görüntüsü ekleme. Pano yalnız düğmeye dokununca okunur. URL'den ürün çekme veya otomatik etiketleme yoktur.
- Tamamı cihazda; ücretli API ve yeni sunucu yok.

Doğrulama: npm run check (22 test), iOS/Android/web JS export. Clipboard native bağımlılığı nedeniyle telefona yeni Codemagic IPA kurulmalıdır.

Telefon kontrolü: Güncellemede gardırobun korunduğunu kontrol et. Profili kaydet, uygulamayı yeniden aç. Bir kombini sağa, diğerini sola kaydır, geri al. Kayıtlı kombinleri ve Tarzım özetini kontrol et. Safari'den görsel kopyalayıp yapıştır; ayrıca Fotoğraflar'dan ekran görüntüsü ekle, stüdyoda temizle ve kaydet. Uçak modunda kayıt/öneri akışını dene.
