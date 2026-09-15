# Kombiqo 0.2 — veri davranışı

Bu belge mevcut uygulamanın teknik veri davranışını açıklar; mağaza gizlilik formu hazırlanırken mevcut sürüm esas alınmalıdır.

- Kıyafet fotoğrafları, renk/tarz seçimleri, gardırop ve kayıtlı kombinler cihazda tutulur.
- Fotoğraf stüdyosu desteklenen iPhone'larda Apple Vision ile cihaz üzerinde çalışır; fotoğraflar Kombiqo sunucusuna veya harici yapay zekâ API'sine yüklenmez.
- Uygulamada hesap, reklam SDK'sı, kullanıcı davranışı analitiği veya bulut eşitleme yoktur.
- Kamera yalnızca kullanıcı kamerayla fotoğraf çekmeyi seçtiğinde istenir. Galeri seçimi sistem fotoğraf seçicisiyle yapılır.
- Bir ürün silindiğinde ilişkili kayıtlı kombinler kaldırılır; fotoğraf dosyaları yeni gardırop kaydı başarıyla yazıldıktan sonra temizlenir.
- Uygulamanın silinmesi veya tarayıcı verilerinin temizlenmesi verileri kaybettirebilir. İşletim sisteminin yedekleme davranışı cihaz ayarlarına bağlıdır.
- TestFlight/Apple'ın kendi tanılama ve dağıtım süreçleri uygulamanın yerel kayıt mekanizmasından ayrıdır.

Herkese açık mağaza yayını öncesinde geliştirici iletişim bilgisi ve yayımlanmış gizlilik politikası adresi eklenmelidir.
