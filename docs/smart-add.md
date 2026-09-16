# Akıllı kıyafet ekleme

## Kullanım

Kıyafet ekleme ekranında **Akıllı ekleme** anahtarını aç, galeriden/kameradan tek bir kıyafet seç veya ürün görselini yapıştır. Fotoğraf seçicide kırpma kullanılabilir. **Fotoğrafı incele** tarama ekranını açar. Sonuçta bulunamayan alanlar **Bilinmiyor** gösterilir. **Önerileri forma aktar**, yalnızca bulunan alanları mevcut düzenlenebilir forma yazar; gardıroba kayıt ayrıca kullanıcı tarafından yapılır. Elle ekleme korunmuştur.

- iPhone: mevcut yerel Expo modülüne eklenen Apple Vision sınıflandırma ve metin okuma; merkez bölgeden renk örnekleme. Fotoğraf dışarı çıkmaz. Marka yalnızca okunmuş metinle eşleştirilir, logodan tahmin edilmez.
- Web: cihazdaki canvas üzerinden renk önerisi; marka/tür tanıma iddiası yok.
- Android / eski TestFlight modülü: desteklenmeyen alanlar bilinmiyor; elle devam edilir.
- Tarz/kesim gibi yorum gerektiren alanlar yerel işlemde uydurulmaz.
- Tarama iptal edilebilir; geç gelen sonuçlar uygulanmaz. Bekleme 18 saniye ile sınırlıdır.
- Sonuçları tekrar kullanmak için yalnızca bellekte en fazla 4 analiz tutulur. Yeniden başlatıldığında silinir.
- Var olan veri şeması korunmuştur; eski gardıroplar ve yedekler geçerlidir.

## Çevrimiçi analiz: Cloudflare üzerinde yayında

Uygulama `https://kombiqo-analysis.avcilarfurkan.workers.dev/analyze` adresine bağlıdır. Cloudflare Free planı korunmuştur; ücretli plan açılmadı. Kullanıcı onayıyla Meta Llama 3.2 koşulları kabul edildi. Görsel model canlı ürün fotoğrafında kategori, lacivert renk, kesim ve tarz döndürdü. Model doğruluğu garanti değildir; kullanıcı sonuçları düzenler.

`server/worker.mjs` ve `server/wrangler.jsonc` dağıtım kaynaklarıdır. Yeniden dağıtım: `npx wrangler@4 deploy --config server/wrangler.jsonc`. Cloudflare kimlik doğrulaması gerekir. Varsayılan servis adresi `src/analysis-config.ts` içindedir; API anahtarı değildir.

- Tüm uygulama için UTC günü başına 30 Cloudflare denemesi; IP başına 5 istek; aynı anda 2 işlem. Ortak Wi-Fi kullanıcıları IP kotasını paylaşır.
- Sayaçlar Durable Object içinde kalıcıdır; yeniden dağıtım kotayı sıfırlamaz. Sağlayıcının ücretsiz sınırı da ayrıca geçerlidir.
- Kota veya ağ/model hatasında cihazdaki bilgiler ve elle tamamlama kullanılabilir. Sınırsız çevrimiçi analiz vaat edilmez.
- Tarayıcı CORS izni `http://localhost:8082`; başka web yayını için `WEB_ORIGIN` güncellenir. Native uygulama Origin başlığı göndermez.
- Anahtar ve fotoğraf gövdeleri loglanmaz, fotoğraf dosyası saklanmaz. Başarılı sonuçlar en fazla bir saat bellekte önbelleklenir.

Hugging Face ve RapidAPI adaptörleri hazır fakat **canlıda kapalıdır**. Hugging Face `kombiqo` anahtarı kullanıcının açık tercihiyle Full Access olarak oluşturulmuş, yalnızca Git dışında `.env.server.local` dosyasında tutulmuştur. Uygulamaya veya Cloudflare'e yüklenmemiştir. İncelenen RapidAPI planları sınırlı kredi ve bant genişliği aşım bedeli içerdiğinden abonelik yapılmadı. Yeni Hugging Face Space oluşturma hesapta PRO gerektirdiğinden ücretli hosting açılmadı.

Ek sağlayıcı ancak ücretsiz kullanım/aşım koşulları doğrulanıp sunucu sırları ve sonlu kota tanımlanınca açılmalıdır. Sağlayıcı değişimi ortak çıktı biçimiyle uygulanmıştır; bugün etkin tek çevrimiçi sağlayıcı Cloudflare'dir.

### Alternatif Node sunucusu

`server/index.mjs`, Node 22 üzerinde ek bağımlılık gerektirmeyen alternatif aracı servistir. Aşağıdaki dosya kotası ayarları bu alternatif içindir; yayındaki Cloudflare kalıcı Durable Object kullanır.

### Yerel sunucu

```powershell
npm run analysis:server
```

Varsayılan yalnızca `127.0.0.1:8787`; `GET /health`, `POST /analyze`. Sağlayıcılar kapalıyken analiz `source: device` döner ve dış servise istek yapmaz.

### Ücretsiz sınırlar doğrulandıktan sonra

1. Sunucuyu HTTPS destekli bir hostta **tek süreç/tek örnek** olarak çalıştır. Kalıcı, yazılabilir kota dosyası gerekir. Örnekler arası paylaşımsız sayaçlarla yatay ölçekleme yapılmaz.
2. Sağlayıcı hesabında otomatik ödeme/aşım olmayacağını doğrula. `*_FREE_ONLY_VERIFIED=true` yalnızca bu kontrol sonrası ayarlanır. Bu bayrak tek başına hizmet sağlayıcının faturalandırmasını değiştirmez.
3. `.env.server.local` veya hostun sır yöneticisinde `HF_TOKEN`, görsel destekleyen `HF_VISION_MODEL`; RapidAPI için `RAPIDAPI_KEY` kullanılır. RapidAPI host/yol sunucuda sabittir, istemciden URL alınmaz.
4. `server/quota.example.json` dosyasından `server/quota.local.json` oluştur. `remaining` gerçek kullanılabilir krediden daha küçük, `validUntil` hesap dönemi bitiminden önce olmalıdır. Örnek sıfır kota ile gelir. Kredi başına istek maliyeti ayrıca doğrulanmalıdır.
5. Mobil derlemede `EXPO_PUBLIC_ANALYSIS_URL=https://sunucu.example/analyze` ve `EXPO_PUBLIC_ANALYSIS_PROVIDERS=Hugging Face ve API4AI (RapidAPI)` ayarlanır. Yalnızca gerçekten etkin alıcılar listelenmelidir. **Bu değişkenler herkese açık: anahtar koyma.**
6. Kullanıcı her kıyafet düzenleme oturumunda fotoğraf gönderimine ayrıca izin verir. Sunucu yapılandırılmadığında bu seçenek gösterilmez.

Kotalar otomatik yenilenmez; diğer uygulamalar aynı hesap kredisini kullanabilir. Her deneme öncesi kota kalıcı olarak düşer; hatalar geri eklenmez. Bozuk/eksik/yazılamayan/son tarihi geçmiş dosyada dış istek yapılmaz. Kota veya kimlik hatası sağlayıcıyı kapatır. Diğer hatalarda kısa bekleme uygulanır; en fazla iki sağlayıcı denenir. Başarılı sonuçlar 1 saat ve en fazla 100 kayıt için bellekte tutulur, fotoğraf dosyası tutulmaz. Kimlik/anahtar/gövde loglanmaz. Ağ sağlayıcılarının kendi veri politikaları ayrıca incelenmelidir.

IP başına 24 saatte 5 istek, aynı anda 2 işlem; proxy arkasında IP başlığına güvenilmediğinden bu sınır ortaklaşabilir. Public mağaza ölçeğinde dağıtım öncesinde cihaz doğrulama/kimliklendirme ve kalıcı kullanıcı kotaları eklenmelidir. Mevcut servis sınırlı beta içindir.

## Doğrulama

`npm run check` ve `npm run export:web`. 56 otomatik test geçti. Canlı servis ürün fotoğrafıyla doğrulandı; tarayıcıda lacivert renk ve cihazda devam akışı kontrol edildi. iOS Swift derlemesi ve cihaz üzerindeki Vision doğruluğu Windows üzerinde doğrulanamaz; yeni native TestFlight derlemesinde kontrol edilmelidir. Expo Go yeni native metotları içermez.

TestFlight: yeni kıyafet/var olan kıyafet, izin reddi, çevrimdışı kullanım, iptal, kötü ışık, logosuz ürün, okunabilir etiket, çok parçalı fotoğraf, yeniden açılış ve yedek geri yükleme. Manken üzerindeki kıyafeti düz ürün fotoğrafına dönüştürme bu sürümün kapsamı değildir.
