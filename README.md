# Kombiqo

iPhone ve Android için kişisel gardırop. React Native + Expo + TypeScript.

## Windows'ta başlat

```powershell
cd "$env:USERPROFILE\Desktop\kombiqo"
npm.cmd install
npm.cmd start
```

Arayüz Expo Go ile incelenebilir; özel Vision modülü Expo Go içinde bulunmaz. Fotoğraf temizleme için Codemagic ile üretilen TestFlight sürümünü kullanın.

Tarayıcıda arayüz önizlemesi: `npm.cmd run web`. Bu, native iPhone testinin yerine geçmez.

## Akıllı ekleme güncellemesi

İsteğe bağlı tarama ekranı, iPhone üzerinde renk/tür/okunabilir marka önerileri, düzenlenebilir sonuçlar ve bilinmeyen alanlarla elle devam eklendi. Cloudflare üzerindeki ücretsiz çevrimiçi analiz bağlandı; fotoğraf yalnızca kullanıcı izin verirse gönderilir. Kota/ağ sorunu olduğunda cihazdaki bilgilerle devam edilir. [Kullanım ve dağıtım durumu](docs/smart-add.md).

## Çalışan özellikler

- Boş gardırop veya açıkça etiketlenmiş örnek gardırop ile başlangıç.
- Askı çizimleri ve dokunma animasyonu; kategori filtresi ve isim/renk araması.
- Galeri/kamera, boyut küçültme, kıyafet ekleme/düzenleme/silme.
- iOS 17+ için çevrimdışı Apple Vision temizleme modülü; orijinale dönüş, PNG şeffaflığı ve askılı sunum. Native derleme ve kalite doğrulaması TestFlight aşamasında yapılacak. Android/web temizleme desteklemez. [Fotoğraf stüdyosu](docs/photo-studio.md).
- Renk, kesim, tarz ve kullanım alanı seçimi.
- Yerel kayıt: küçültülmüş fotoğraflar iOS/Android dosya alanında, ürün bilgileri ve tercihler cihazdaki anahtar-değer deposunda saklanır. Tarayıcı önizlemesinde fotoğraf verisi tarayıcı deposunda tutulur.
- Gerçek ürün kimliklerinden kombin önerileri; elbise veya üst+alt, yanında ayakkabı.
- Kaydetme, öneri gizleme/geri getirme, tarz ve keşif tercihleri.
- Silinen/düzenlenen parçalara bağlı kayıtlı kombinlerin temizlenmesi.
- İlk açılışta kişisel tarz profili; kombinleri sağa/sola kaydırarak oylama ve son kaydırmayı geri alma.
- Panodan görsel yapıştırma, marka seçimi; tamamı cihazda çalışır.
- Yedekleme: gardırobun tamamı panoya veya bir dosyaya aktarılabilir ve yedekten geri yüklenebilir.

## Verilerin korunması

- Arayüz hatası durumunda beyaz ekran yerine kayıtların korunduğunu bildiren bir ekran gösterilir.
- Okunamayan kayıt üzerine yazılmaz; uygulama veriyi ezmek yerine açıkça hata verir.
- Daha yeni bir Kombiqo sürümüyle yazılmış kayıt silinmez; ayrı bir yere kopyalanır ve kullanıcı bilgilendirilir.
- Kayıt biçimi ileride değişirse eski kayıtlar sürüm adımlarıyla taşınır (`SCHEMA_VERSION` ve `MIGRATIONS`).
- Yedekten geri yükleme mevcut gardırobun yerini alır; bu yüzden önce yedek alınması önerilir.

## Sınırlar

İsteğe bağlı fotoğraf analizi Cloudflare Workers AI kullanır. Canlı trend toplama, hava durumu, sanal giydirme, kullanıcı hesabı ve bulut eşitleme içermez. Dış giyim kataloglanabilir; öneri motoru ilk sürümde temel kombinleri üretir. Tarz etiketleri kullanıcı tarafından seçilir; öneriler kontrollü yerel puanlamadır.

Gardırop bu cihazda kalır; izin verilen çevrimiçi analizde seçili fotoğraf gönderilir. Uygulamanın silinmesi veya tarayıcı verilerinin temizlenmesi kayıtları silebilir. Çok büyük gardıroplar için sonraki aşamada ürün verilerinin veritabanına taşınması planlanır. İlk sürüm küçük kişisel gardıroplar içindir.

## Kontroller

```powershell
npm.cmd run check
npm.cmd run export:web
```

`tests/` önerilerin gerçek ürünlerle sınırlı olması, kullanım alanı, tarz kişiselleştirme, silme tutarlılığı, kayıt biçimi taşıma, yedek/geri yükleme, girdi doğrulama ve depolama hatalarını kapsar. Öneri sıralaması inline snapshot ile sabitlenmiştir; motor değişse bile aynı girdi aynı sırayı üretmelidir.

## Dağıtım

`codemagic.yaml` iOS TestFlight ve Android test APK iş akışlarını içerir. Hesap entegrasyonu ve imzalama henüz yapılandırılmadı. [TestFlight adımları](docs/testflight.md).

`com.kombiqo.app` geçici bundle/package kimliğidir; marka veya alan adı sahipliği beyanı değildir. Apple hesabında kesinleştirin. API anahtarlarını repoya eklemeyin.

## Sonraki geliştirme

1. Gerçek iPhone fotoğraf/izin/kalıcılık testleri ve ilk TestFlight derlemesi.
2. Dış giyim, mevsim ve daha kapsamlı stil geri bildirimi.
3. Tarihli ve kaynaklı stil kütüphanesi; farklı stillerle öneri kalitesi değerlendirmesi.
4. Donanımda küçük görsel model denemesi; başarı ve maliyet ölçümü sonrası entegrasyon.
5. Dışa aktarma/yedekleme ve büyük gardıroplar için veritabanı geçişi.
