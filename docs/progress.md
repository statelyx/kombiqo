# Kombiqo geliştirme kaydı — 15 Eylül 2026

Proje: `C:\Users\furkan.avcilar\Desktop\kombiqo`

## Hazır

- React Native / Expo SDK 57 ile iOS ve Android için ortak uygulama.
- Gardırop, örnek parçalar, arama ve kategori filtreleri.
- Fotoğraflı ürün ekleme, düzenleme ve kaldırma.
- Tarz/kesim tercihleri ve yerel kombin önerileri; kaydetme, gizleme ve geri getirme.
- iOS/Android'de fotoğraflar uygulamanın kalıcı dosya alanında tutulur. Kayıtlı fotoğraf yolu iOS sandbox değişikliklerine dayanıklı göreli referanstır.
- Eski fotoğraf dosyası ancak güncel gardırop başarıyla kaydedildikten sonra kaldırılır. Kayıt hatası önceki fotoğrafı silmez.
- Depolama hatası kalıcı uyarı ve yeniden deneme düğmesiyle gösterilir.
- Marka ikonu ve Codemagic yapılandırma taslağı.

## Doğrulanan kullanıcı akışları

390 × 844 tarayıcı önizlemesinde:

- Önceki oturumdaki 9 örnek parça ve 1 kayıtlı kombin yeniden açıldı.
- Boş isim gönderildiğinde doğrulama mesajı gösterildi.
- Test ürünü oluşturuldu, aramayla bulundu ve ismi düzenlendi.
- Projenin kendi ikon dosyası test görseli olarak seçildi, küçültüldü ve kaydedildi.
- Sayfa yeniden yüklendiğinde görsel ve ürün bilgileri korundu.
- Yalnızca bu testte oluşturulan ürün kaldırıldı; örnek gardırop korundu.
- İş kullanım alanı 1 uygun kombin üretti; gizleme sonrası boş durum gösterildi, geri getirme çalıştı.
- Mobil gardırop ve kombin ekranları görsel olarak kontrol edildi.

14 otomatik test: ürün kimlikleri, tamamlanmış kombinler, boş gardırop, kullanım alanı, elbise, tercih etkisi, gizleme, silme tutarlılığı, depolama hata yönetimi ve native fotoğraf adaptörü. Native dosya testleri mock kullanır; cihaz testi değildir.

## Henüz yapılmadı

- Apple/Codemagic hesap entegrasyonu, gerçek IPA/APK derlemesi ve TestFlight yüklemesi.
- Gerçek iPhone/Android fotoğraf izinleri, performans, VoiceOver ve uçak modu testleri.
- Görsel yapay zekâ, arka plan temizleme, canlı trend kaynağı, sanal giydirme.
- Bulut eşitleme, veri dışa aktarma ve mağaza yayın hazırlığı.

Windows üzerinde Android native proje üretimi doğrulandı. iOS native proje derlemesi macOS/Codemagic üzerinde yapılacak. JavaScript/Hermes paketlerinin üretilmesi, imzalı uygulama derlemesi anlamına gelmez.

`xcode > uuid` bağımlılığı `^11.1.1` ile sabitlendi: eski uuid güvenlik bildirimi giderildi. Native derleme aracının kullandığı `v4()` API'si korunur; son doğrulama ilk macOS build'inde yapılmalıdır.

Son doğrulama (15 Eylül 2026): TypeScript kontrolü, 14/14 test, Expo Doctor 21/21 kontrol ve git diff --check başarılı. npm audit --omit=dev: 0 açık. Son kaynaklardan web, iOS ve Android export işlemleri work/verified-export dizinine başarıyla tamamlandı. Tarayıcı hata günlüğü boş.

## 0.2 — Fotoğraf stüdyosu

Kamera girişi, iOS 17+ Vision modülü, orijinal/temizlenmiş geçişi, PNG kalıcılığı, askılı fotoğraf sunumu ve marka açılış ekranı eklendi. 17 test, TypeScript, Expo Doctor 21/21 ve tüm platform export işlemleri geçti. Apple autolinking KombiqoCutout modülünü buldu. Swift derlemesi ve gerçek segmentasyon kalitesi TestFlight aşamasında doğrulanacak. Android/web arka plan temizleme, elle maske düzeltme ve gerçek 3D henüz yok.
