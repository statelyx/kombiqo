# iPhone'da TestFlight hazırlığı

Bu dosya bir hazırlık rehberidir. Apple veya Codemagic hesabına bağlanılmadı; henüz IPA derlenmedi/yüklenmedi.

1. `com.kombiqo.app` geçici seçilmiş uygulama kimliğidir. Apple hesabında uygunluğunu doğrulayın; farklı kimlik kullanacaksanız `app.config.ts` ve `codemagic.yaml` dosyalarını birlikte değiştirin.
2. App Store Connect'te yeni uygulama kaydı oluşturun. Kombiqo adının kullanılabilirliği bu adımda ayrıca kontrol edilir.
3. Codemagic’e https://github.com/statelyx/kombiqo deposunu bağlayın ve main dalını seçin.
4. Codemagic'te App Store Connect entegrasyonunu `kombiqo-app-store` adıyla tanımlayın. API anahtarını sadece Codemagic'in gizli alanına ekleyin; repoya veya sohbete koymayın.
5. Aynı bundle ID için App Store distribution sertifikası ve provisioning profile hazırlayıp Codemagic code signing identities bölümüne ekleyin.
6. `ios-testflight` iş akışını elle başlatın. Expo SDK 57 için Xcode 26.4 veya üzeri gerekir; ilk bulut derlemesinin hata günlüğü incelenecek.
7. Apple işleme adımı bitince TestFlight'ta dahili test grubuna bu sürümü ekleyin, gerekli ihracat uyumluluğu sorularını gerçek uygulama davranışına göre yanıtlayın.
8. iPhone'da TestFlight'tan yükleyin. App Store'da herkese açık yayınlama kapalıdır.

İş akışı numarası uygulama build numarasına dönüştürülür. Yeni bir Codemagic projesine taşınırken veya başka bir yerden build yüklenmişse numaranın Apple'daki son numaradan büyük olduğunu doğrulayın.

## Cihaz testleri

- Örnek gardıropla başla; örnek ürünlerin etiketi görünmeli.
- Fotoğraf ekle, uygulamayı tamamen kapatıp yeniden aç; fotoğraf ve özellikler kalmalı.
- Fotoğraf seçimini iptal et; parça verileri değişmemeli.
- Fotoğraf erişimi kısıtlıyken akışın anlaşılır olduğunu kontrol et.
- İş/Günlük/Dışarıda filtrelerini, boş dolabı, elbise+ayakkabı kombinini dene.
- Kombin kaydet, reddet, geri getir; kaydettiğin parçayı sil ve bağlı kombinlerin kaldırıldığını doğrula.
- Küçük ekran, büyük yazı, klavye ve VoiceOver ile dene.
- Uçak modunda gardırop, kombin ve kaydetme çalışmalı.

Kaynaklar: https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/ ve https://docs.codemagic.io/yaml-publishing/app-store-connect/

Fotoğraf stüdyosu için iOS 17+ gereklidir. İlk build sırasında KombiqoCutout podunun kurulduğunu ve Swift derlemesinin geçtiğini kontrol edin. Ayrıntılı cihaz senaryoları: [Fotoğraf stüdyosu](photo-studio.md).
