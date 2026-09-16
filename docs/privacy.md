# Kombiqo 0.3 — veri davranışı

Bu belge mevcut uygulamanın teknik veri davranışını açıklar; mağaza gizlilik formu hazırlanırken mevcut sürüm esas alınmalıdır.

- Kıyafet fotoğrafları, renk/tarz seçimleri, gardırop ve kayıtlı kombinler cihazda tutulur.
- Fotoğraf stüdyosu desteklenen iPhone'larda Apple Vision ile cihaz üzerinde çalışır; fotoğraflar Kombiqo sunucusuna veya harici yapay zekâ API'sine yüklenmez.
- Uygulamada hesap, reklam SDK'sı, kullanıcı davranışı analitiği veya bulut eşitleme yoktur.
- Kamera yalnızca kullanıcı kamerayla fotoğraf çekmeyi seçtiğinde istenir. Galeri seçimi sistem fotoğraf seçicisiyle yapılır.
- Bir ürün silindiğinde ilişkili kayıtlı kombinler kaldırılır; fotoğraf dosyaları yeni gardırop kaydı başarıyla yazıldıktan sonra temizlenir.
- Uygulamanın silinmesi veya tarayıcı verilerinin temizlenmesi verileri kaybettirebilir. İşletim sisteminin yedekleme davranışı cihaz ayarlarına bağlıdır.
- TestFlight/Apple'ın kendi tanılama ve dağıtım süreçleri uygulamanın yerel kayıt mekanizmasından ayrıdır.

Herkese açık mağaza yayını öncesinde geliştirici iletişim bilgisi ve yayımlanmış gizlilik politikası adresi eklenmelidir.

## İsteğe bağlı akıllı ekleme

Cihazdaki Vision ve renk analizi fotoğrafı dışarı göndermez. Sonuçlar kısa süreli bellekte tutulur; kullanıcı kabul etmeden gardırop değiştirilmez. Cloudflare Workers AI çevrimiçi servisi yapılandırılmıştır; gönderim anahtarı varsayılan olarak kapalıdır. Kullanıcı her düzenleme oturumunda açıkça izin verirse yalnızca seçilen küçültülmüş fotoğraf, ekranda belirtilen analiz sağlayıcılarına aracı sunucu üzerinden gönderilir; profil ve gardırop gönderilmez. Aracı sunucu fotoğraf dosyası/gövde logu tutmaz; sonuç önbelleği en fazla bir saattir. Kota kontrolü için güne göre özetlenmiş IP sayacı Cloudflare Durable Object içinde tutulur; ertesi gün yenilenir. Harici sağlayıcının veri işlemesi kendi koşullarına tabidir. Uygulama düzeyinde onay geri alınması sonraki işlemleri durdurur; daha önce gönderilen verilerin sağlayıcıdaki saklanmasını geri almaz.
