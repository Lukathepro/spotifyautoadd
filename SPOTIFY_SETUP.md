# 🎵 Spotify Auto-Playlist - Uputstvo za podešavanje

## 🌐 Live aplikacija
**https://bl56etdcvntki.ok.kimi.link**

---

## ⚠️ VAŽNO - Šta treba da izmeniš da bi aplikacija radila

Trenutno aplikacija koristi **DEMO Client ID** koji ne radi za pravu Spotify autentikaciju. 
**Moraš kreirati svoju Spotify aplikaciju** da bi sve funkcionalnosti radile.

---

## 🔧 Korak-po-korak: Kreiranje Spotify aplikacije

### 1. Prijavi se na Spotify Developer Dashboard

1. Otvori: https://developer.spotify.com/dashboard
2. Klikni na **"Log in"** i prijavi se sa svojim Spotify nalogom
3. Klikni na **"Create an App"**

### 2. Popuni podatke o aplikaciji

| Polje | Vrednost |
|-------|----------|
| **App name** | `Moj Auto-Playlist` (ili bilo šta) |
| **App description** | `Automatsko dodavanje novih pesama u plejlistu` |
| **Redirect URIs** | `https://bl56etdcvntki.ok.kimi.link/callback` |
| **Which API/SDKs are you planning to use?** | Označi **Web API** |

Klikni **"Save"**

### 3. Pronađi svoj Client ID

Nakon kreiranja aplikacije, videćeš:
- **Client ID** (npr. `a1b2c3d4e5f6...`)
- **Client Secret** (klikni "Show" da ga vidiš)

**Obeleži ove vrednosti - trebaće ti Client ID!**

---

## 📝 Korak 2: Ažuriranje koda sa tvojim Client ID

### Opcija A: Samostalno hostovanje (preporučeno)

1. Preuzmi izvorni kod sa Kimi-a
2. Otvori fajl: `src/services/spotify.ts`
3. Nađi liniju:
```typescript
const CLIENT_ID = '5cfea3c200d2445a8b43e9c4b1d5b6a6'; // Demo client ID
```

4. Zamenji sa svojim Client ID:
```typescript
const CLIENT_ID = 'TVoj_CLIENT_ID_OVDE'; // Tvoj pravi Client ID
```

5. Build-uj i deploy-uj ponovo:
```bash
cd /mnt/okcomputer/output/app
npm run build
# Deploy dist folder
```

### Opcija B: Zamena direktno u build-ovanom fajlu (brzo rešenje)

1. Otvori `dist/assets/index-*.js` (jedini .js fajl u dist folderu)
2. Pretraži: `5cfea3c200d2445a8b43e9c4b1d5b6a6`
3. Zameniti sa svojim Client ID
4. Upload-uj izmenjeni fajl

---

## 🔐 Dodatna podešavanja (opciono)

### Dozvoli više korisnika (ako deliš sa drugima)

Ako želiš da drugi ljudi koriste tvoju aplikaciju:

1. U Spotify Dashboard, idi na **"Settings"**
2. U polje **"Redirect URIs"** dodaj više URL-ova:
   - `http://localhost:5173/callback` (za lokalni razvoj)
   - `https://tvoj-domen.com/callback` (ako imaš svoj domen)

### Povećaj rate limit

Za produkciju sa mnogo korisnika, zatraži **Extended Quota Mode**:
1. U Dashboard klikni na **"Settings"**
2. Klikni **"Request Extension"**
3. Popuni formular

---

## ✅ Testiranje

Nakon što postaviš svoj Client ID:

1. Otvori aplikaciju
2. Klikni **"Poveži Spotify nalog"**
3. Trebalo bi da te preusmeri na Spotify login stranicu
4. Nakon prijave, trebalo bi da te vrati na aplikaciju
5. Ako vidiš svoj profil u gornjem desnom uglu - **SVE RADI!** 🎉

---

## 🐛 Česti problemi

### "INVALID_CLIENT: Invalid redirect URI"

**Rešenje:** U Spotify Dashboard, proveri da li je Redirect URI tačno:
- Mora biti: `https://bl56etdcvntki.ok.kimi.link/callback`
- Bez `/` na kraju!
- Sa `https://` na početku!

### "User not registered in the Developer Dashboard"

**Rešenje:** Spotify dozvoljava samo registrovane korisnike dok je aplikacija u "Development mode". 
Da dodaš korisnike:
1. U Dashboard idi na **"Users and Access"**
2. Klikni **"Add new user"**
3. Unesi Spotify email adresu korisnika

### Aplikacija se ne učitava posle prijave

**Rešenje:** Proveri da li je `REDIRECT_URI` u kodu isti kao u Spotify Dashboard:
```typescript
const REDIRECT_URI = 'https://bl56etdcvntki.ok.kimi.link/callback';
```

---

## 🚀 Napredne funkcionalnosti

### Automatsko dodavanje pesama

Aplikacija automatski proverava nove pesme svakih **30 minuta**. 
Da promeniš interval:

1. Otvori `src/services/storage.ts`
2. Nađi `autoCheckInterval: 30`
3. Promeni na željenu vrednost (u minutima)

### Browser notifikacije

Da omogućiš notifikacije čak i kada nisi na sajtu:
1. Klikni na zvonce u gornjem desnom uglu
2. Klikni na ikonu podešavanja (zupčanik)
3. Dozvoli notifikacije u browseru

---

## 📁 Struktura projekta

```
app/
├── src/
│   ├── components/          # React komponente
│   │   ├── AudioPlayer.tsx  # Audio player sa kontrolama
│   │   ├── DataTransfer.tsx # Export/import podataka
│   │   ├── NewReleases.tsx  # Pregled novih izdanja
│   │   ├── Notifications.tsx# Sistem notifikacija
│   │   ├── SongFilters.tsx  # Filteri za pesme
│   │   └── Statistics.tsx   # Grafikoni i statistika
│   ├── sections/            # Glavne sekcije
│   │   ├── AlbumSearch.tsx  # Pretraga albuma
│   │   ├── ArtistManager.tsx# Upravljanje izvođačima
│   │   ├── Dashboard.tsx    # Glavni dashboard
│   │   ├── Login.tsx        # Login stranica
│   │   └── Settings.tsx     # Podešavanja
│   ├── services/            # Servisi
│   │   ├── audioPlayer.ts   # Audio player logika
│   │   ├── autoAdd.ts       # Automatsko dodavanje
│   │   ├── dataTransfer.ts  # Export/import
│   │   ├── notifications.ts # Notifikacije
│   │   ├── spotify.ts       # Spotify API
│   │   ├── statistics.ts    # Statistike
│   │   └── storage.ts       # LocalStorage
│   ├── types/               # TypeScript tipovi
│   └── App.tsx              # Glavna aplikacija
└── dist/                    # Build output
```

---

## 🎨 Funkcionalnosti aplikacije

### ✅ Trenutno implementirano:

1. **Spotify OAuth prijava** - Bezbedno povezivanje naloga
2. **Praćenje izvođača** - Dodaj/ukloni izvođače za praćenje
3. **Automatsko dodavanje** - Nove pesme se automatski dodaju
4. **Manuelna pretraga** - Pretraži albume i dodaj pesme
5. **Audio player** - Slušaj preview pesama (30 sekundi)
6. **Statistike** - Grafikoni pesama, izvođača, žanrova
7. **Notifikacije** - Browser notifikacije za nove pesme
8. **Filteri** - Pretraži, filtriraj i sortiraj dodate pesme
9. **Export/Import** - Backup i restore svih podataka
10. **Nova izdanja** - Pregledaj najnovije albume na Spotify-u

### 🔮 Planirano:

- [ ] Dark/Light mode toggle
- [ ] Podešavanje vremena automatske provere
- [ ] Integracija sa drugim servisima (YouTube, Apple Music)
- [ ] Mobilna aplikacija
- [ ] Deljenje plejlisti sa prijateljima

---

## 💡 Saveti

1. **Redovno pravi backup** - Koristi Export funkciju
2. **Dodaj više izvođača** - Što više pratiš, više novih pesma ćeš dobiti
3. **Proveravaj notifikacije** - Ne propusti nove pesme
4. **Koristi filtere** - Lakše pronađi pesme koje tražiš

---

## 📞 Podrška

Ako imaš problema:
1. Proveri da li si pravilno postavio Client ID
2. Proveri Redirect URI u Spotify Dashboard
3. Očisti browser cache i localStorage
4. Pokušaj ponovo sa svежим Spotify tokenom

---

**Uživaj u muzici!** 🎧🎵
