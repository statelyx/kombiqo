# Günüm ve gardırop araçları

- Günüm: Türkiye saatiyle tarih, başlangıç/dönüş saati, şehir, mekân, açık/kapalı alan ve etkinlik planı. Geceyi aşan saat aralığı desteklenir. Planlar cihazda/yedekte saklanır.
- İsteğe bağlı telefon takvimi: izin yalnızca düğmeye dokununca istenir; seçilen gündeki etkinlikler gösterilir, yalnızca kullanıcının seçtiği etkinlik forma aktarılır. Takvim metinleri sunucuya gönderilmez. Çok günlük etkinlikler günlük planlara ayrılmalıdır.
- MET Norway: mevcut Cloudflare Worker üzerinden 12 şehir merkezi, CC BY 4.0 atfı, Expires/Last-Modified önbelleği, uygulama genelinde günde en fazla 200 kaynak isteği. Ücretli hava/model aboneliği yok. Diğer şehirlerde elle hava girişi vardır. Konum izni istenmez.
- Saat aralığının tamamı güncel saatlik tahminle kapsanmıyorsa elle giriş sunulur. Sıcaklık, yağış ve rüzgâr kullanılır; hissedilen sıcaklık hesaplanmaz. Kayıtlı tahmin tarihsel bir anlık görüntüdür; düzenlemede yeniden istenir.
- Kıyafetlerde sıcak tutma, mevsim ve yağmura uygunluk etiketleri. Eksik etiketlerde kullanıcıya bilgi verilir. Çamaşırdaki parçalar önerilmez. Soğuk/yağış/rüzgâr koşullarında mevcut uygun dış giyim eklenir. Öneriler cihazda hesaplanır.
- Kombin panosu: sürükleme, ölçek, döndürme, erişilebilir yön düğmeleri, üç hazır düzen, PNG dışa aktarma. iOS sistem paylaşım ekranı, web indirme. Düzen kombinle birlikte saklanır. Günüm üzerinden düzenlenen kombin gün planına da kaydedilir.
- Valiz: her eşsiz kıyafet için kalıcı hazır/eksik işareti ve toplam; çamaşırdaki parça uyarısı.
- İlham: geçici fotoğraf, cihazdaki analizden ipuçları, kullanıcının kategori/renk/tarz onayı ve kendi gardırobundan üç etiket eşleşmesi. Birden fazla parça için aynı fotoğrafla ayrı eşleştirme yapılır. Birebir görsel benzerlik veya tüm görünümün otomatik anlaşılması iddiası yoktur.

Yeni native bağımlılıklar: expo-calendar, expo-sharing, react-native-view-shot. Yeni iOS derlemesi gerekir; mevcut kurulu TestFlight sürümüne web yenilemesiyle gelmez. Web takvim yerine elle planlama sunar.

Doğrulama: `npm run check`, `npm run export:web`; manuel web hava ve pano akışları. iOS takvim izni, ret akışı ve PNG paylaşımı fiziksel cihazda kontrol edilmelidir.

Kaynaklar: https://api.met.no/doc/TermsOfService · https://api.met.no/doc/License · https://docs.expo.dev/versions/v57.0.0/sdk/calendar/
