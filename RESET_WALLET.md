# Reset Wallet - WelcomeScreen'i Görmek İçin

## Yöntem 1: Browser Console (Önerilen)

1. Tarayıcıda uygulamayı açın (http://localhost:5173)
2. F12 ile Developer Tools'u açın
3. Console sekmesine gidin
4. Şu komutları çalıştırın:

```javascript
// IndexedDB'yi temizle
indexedDB.deleteDatabase('WalletDB');

// localStorage'ı temizle
localStorage.clear();

// Sayfayı yenile
location.reload();
```

## Yöntem 2: UnlockScreen'den Reset

1. UnlockScreen'de en altta "Reset Wallet (Dev Only)" butonunu görürsünüz
2. Butona tıklayın
3. Onaylayın
4. Sayfa otomatik olarak yenilenecek ve WelcomeScreen görünecek

## Yöntem 3: Application Tab (Chrome DevTools)

1. F12 ile Developer Tools'u açın
2. "Application" sekmesine gidin
3. Sol menüden "IndexedDB" > "WalletDB" seçin
4. Sağ tıklayıp "Delete database" seçin
5. "Local Storage" > "http://localhost:5173" seçin
6. Tüm item'ları silin
7. Sayfayı yenileyin

---

**Not:** Bu işlem tüm wallet verilerinizi siler. Seed phrase'iniz varsa kaydedin!

