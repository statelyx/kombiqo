# iPhone'da TestFlight hazırlığı

15 Eylül 2026: Apple uygulama kimliği ve App Store Connect kaydı oluşturuldu. Codemagic imzalama profili bağlandı. İlk gerçek iOS derlemesi başarıyla tamamlandı ve IPA App Store Connect’e hatasız yüklendi. Apple TestFlight işlemesi yüklemeden sonra devam eder.

- Bundle ID: `com.kombiqo.app`
- Apple uygulama ID: `6812286879`
- Codemagic uygulama ID: `6aa90dcbfad5fddd5263af51`
- Sertifika referansı: `kombiqo-distribution`
- Profil referansı: `kombiqo-app-store-profile` (Apple adı: Kombiqo App Store)
- İş akışı: `ios-testflight`, dal: `main`
- Doğrulanan sürüm: `0.2.0 (4)`, Xcode 26.6
- Başarılı build: https://codemagic.io/app/6aa90dcbfad5fddd5263af51/build/6aa923293679c04df699559f
- Test grubu: `Kombiqo Dahili Test`, otomatik dağıtım açık, hesap sahibi eklendi
- IPA: 10.61 MB; native Swift modülü derlendi. Segmentasyon kalitesi ve cihaz davranışı hâlâ gerçek iPhone testi gerektirir.

İlk hata, profile sahip olmayan bundle ID nedeniyle build başlamadan alınan `No matching profiles found` hatasıydı. Mevcut sertifikayla uygulamaya özel profil oluşturularak çözüldü; MooTycoon'un kimliği veya gizli değişkenleri kopyalanmadı.

## Yeniden kurulum

1. `com.kombiqo.app` Apple hesabında kayıtlı uygulama kimliğidir; farklı kimlik kullanacaksanız `app.config.ts` ve `codemagic.yaml` dosyalarını birlikte değiştirin.
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

## Dahili test dağıtımı

0.2.0 (4) Apple tarafından işlendi ve dahili gruba otomatik eklendi. İlk iş akışındaki submit_to_testflight: true dış beta incelemesi talep ettiği için eksik beta iletişim bilgisi hatası verdi. Bu seçenek false olarak düzeltildi; IPA yüklemesi ve dahili grubun otomatik dağıtımı devam eder. Mevcut 0.2.0 (4) için yeniden build gerekmez. Hesap sahibinin Apple TestFlight davetini kabul etmesi gerekir; Invited durumu kabul beklediğini gösterir.
