# Fotoğraf stüdyosu — 0.2

## Akış

Galeri veya kamera → boyutlandırma → orijinal önizleme → iOS Vision maskeleme → şeffaf PNG → orijinal/temizlenmiş karşılaştırma → cihazda kalıcı kayıt → askı ve gölgeli kart.

İşlem sunucu veya ücretli API kullanmaz. Kamera izni yalnızca kamerayla çekme seçildiğinde istenir. Fotoğraf seçimi iptal edilirse mevcut görsel korunur.

## Uygulama

- `modules/kombiqo-cutout`: yerel Expo Swift modülü. iOS 17+ kontrolü; Vision foreground instance mask; yön normalleştirme; görüntü sınırı 1536 piksel; kırpılmış PNG. Ağ çağrısı yok.
- `src/cutout.native.ts`: isteğe bağlı native modül; Expo Go, eski iOS ve Android'de anlaşılır destek mesajı.
- `src/photos.native.ts`: JPEG ve şeffaf PNG kalıcı uygulama klasöründe tutulur. Göreli referanslar uygulama güncellemelerinde sandbox kökü değişse de çözümlenir.
- Orijinal ve temizlenmiş dosyalar birlikte saklanır. Orijinale dönüp kaydetme desteklenir. Eski dosyalar ancak yeni kayıt başarıyla yazılınca kaldırılır.

## Gerçek sınırlar

Bu, nesne ayırmadır; kıyafet yeniden üretimi veya gerçek 3D değildir. Birden fazla ön plan nesnesi birlikte seçilebilir. İnsan üzerindeki kıyafeti kişiden ayırma, elle maske boyama ve görünmeyen kısımları tamamlama bu sürümde yoktur. Önizleme uygun değilse orijinal saklanabilir.

## Cihaz kabul kontrolü

İlk macOS derlemesinde Swift derlenmesi ve modülün bağlanması kontrol edilecek. Windows'taki autolinking çözümlemesi bunu tek başına kanıtlamaz.

TestFlight'ta iOS 17+ cihazla, uçak modunda:

1. Aydınlık, düz zemindeki tişört: kenarlar, yaka ve baskı korunsun.
2. Desenli koltuk ve dağınık zemin: yanlış nesne seçimi değerlendirilip orijinale dönüş denensin.
3. Koyu kumaş, ince askı, birden fazla ürün: kalite sınırları kaydedilsin.
4. Temizleme sonrası kaydet, tamamen kapat, tekrar aç: PNG şeffaflığı ve orijinale dönüş korunsun.
5. Fotoğraf değiştir, kaldır, ürün sil: ilişkili dosyalar tutarlı kalsın.
6. Kamera iznini reddet, galeriden devam et. İşlem hatasında mevcut fotoğraf kaybolmasın.

Swift/Vision işlemi henüz bu Windows ortamında çalıştırılmadı. Kalite/hız garantisi yok; gerçek cihaz sonucu ölçülmeli.
