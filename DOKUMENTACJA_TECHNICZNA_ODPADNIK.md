# Dokumentacja Techniczna - System ODPADnik

## 1. Opis Ogólny Działania Aplikacji

### Cel i Przeznaczenie
ODPADnik to kompleksowy system zarządzania gospodarką odpadami, przeznaczony dla firm zajmujących się wywozem i utylizacją odpadów. Aplikacja umożliwia zarządzanie całym procesem biznesowym od planowania tras, przez zarządzanie pracownikami i pojazdami, po obsługę zleceń jednorazowych i generowanie dokumentacji.

### Kluczowe Moduły
- **Zarządzanie Pracownikami** - kadry, harmonogramy, karty pracy
- **Zarządzanie Pojazdami** - flota, awarie, przeglądy
- **Zarządzanie Punktami** - adresy odbioru odpadów (zamieszkane/niezamieszkane)
- **Planowanie Tras** - trasówka, harmonogramy dzienne/miesięczne
- **Zlecenia Jednorazowe** - obsługa klientów indywidualnych
- **Zlecenia Worków Gruzowych** - specjalistyczne usługi
- **Zarządzanie Frakcjami** - typy odpadów (PAP, BIO, TW, SZ, ZM)
- **System Uprawnień** - role i uprawnienia użytkowników
- **Generowanie Dokumentów** - PDF, Excel, raporty

## 2. Architektura Systemu

### Diagram Warstw
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  • React 19.1.0 + React Router DOM 7.6.3                   │
│  • Tailwind CSS + Radix UI Components                      │
│  • React Query (TanStack) dla zarządzania stanem           │
│  • Socket.IO Client dla komunikacji real-time              │
│  • Framer Motion dla animacji                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                       │
├─────────────────────────────────────────────────────────────┤
│  • Express.js 5.1.0                                        │
│  • Prisma ORM 6.11.1                                       │
│  • Socket.IO 4.8.1                                         │
│  • JWT Authentication                                       │
│  • Role-Based Access Control (RBAC)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BAZA DANYCH                             │
├─────────────────────────────────────────────────────────────┤
│  • SQLite (development) / PostgreSQL (production)          │
│  • Prisma Migrations                                       │
│  • 376 linii schematu z 20+ tabelami                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SMTP/API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                INTEGRACJE ZEWNĘTRZNE                       │
├─────────────────────────────────────────────────────────────┤
│  • Nodemailer (Gmail/Outlook/SMTP)                         │
│  • Puppeteer (generowanie PDF)                             │
│  • PDFKit/PDF-Lib (manipulacja PDF)                        │
│  • ExcelJS (import/export Excel)                           │
└─────────────────────────────────────────────────────────────┘
```

### Przepływ Danych
1. **Uwierzytelnianie** - JWT token z rolami i uprawnieniami
2. **Autoryzacja** - middleware sprawdzający uprawnienia do modułów
3. **Operacje CRUD** - Prisma ORM z walidacją i relacjami
4. **Real-time Updates** - Socket.IO dla synchronizacji w czasie rzeczywistym
5. **Powiadomienia** - email notifications dla kluczowych zdarzeń
6. **Eksport** - generowanie PDF/Excel z danymi

## 3. Szczegółowy Opis Modułów

### 3.1 Moduł Uwierzytelniania i Autoryzacji
**Pliki:** `backend/routes/auth.js`, `backend/routes/authMiddleware.js`

**Kluczowe Funkcje:**
- `authenticateToken()` - weryfikacja JWT token
- `authorizeModule()` - sprawdzanie uprawnień do modułów
- `attachPermissions()` - dynamiczne uprawnienia z bazy danych
- `hasPermission()` - sprawdzanie konkretnych uprawnień

**Role Systemowe:**
- `admin` - pełny dostęp
- `dyspozytor` - zarządzanie operacyjne
- `bok` - obsługa klienta
- `kierownik` - zarządzanie strategiczne
- `koordynator` - koordynacja zespołów
- `pracownik_biurowy` - praca biurowa
- `kierowca` - operacje terenowe
- `viewer` - tylko podgląd

### 3.2 Moduł Zarządzania Pracownikami
**Pliki:** `backend/routes/employees.js`, `frontend/src/pages/Employees.jsx`

**Funkcje:**
- CRUD pracowników z zaawansowanymi polami
- Import/export Excel z walidacją
- Harmonogramy pracy (7/8h, nadgodziny, nocne)
- Kwalifikacje (prawo jazdy, specjalne uprawnienia)
- Karty pracy z ewidencją czasu
- Orzeczenia o niepełnosprawności

**Kluczowe Endpointy:**
- `GET /api/employees` - lista pracowników
- `POST /api/employees` - dodanie pracownika
- `GET /api/employees/schedule/by-date` - harmonogram na datę
- `POST /api/employees/import` - import z Excel

### 3.3 Moduł Zarządzania Pojazdami
**Pliki:** `backend/routes/vehicles.js`, `frontend/src/pages/Vehicles.jsx`

**Funkcje:**
- Zarządzanie flotą pojazdów
- System zgłaszania awarii z powiadomieniami email
- Statusy operacyjne (sprawny/niesprawny)
- Historia napraw i przeglądów
- Integracja z zleceniami

**Integracje:**
- Email notifications przy awariach
- Automatyczne powiadomienia o naprawach
- Integracja z harmonogramami pracy

### 3.4 Moduł Planowania Tras (Trasówka)
**Pliki:** `backend/routes/trasowka.js`, `frontend/src/pages/Trasowka.jsx`

**Funkcje:**
- Generowanie tras odbioru odpadów
- Przypisywanie frakcji do punktów
- Generowanie PDF z kolorowym kodowaniem
- Planowanie harmonogramów dziennych/miesięcznych

**Format PDF:**
- A4 landscape z kolorowym kodowaniem frakcji
- 25 wierszy na stronę z paginacją
- Kolory: PAP (niebieski), BIO (czerwony), TW (żółty), SZ (zielony), ZM (szary)

### 3.5 Moduł Zleceń Jednorazowych
**Pliki:** `backend/routes/oneTimeOrders.js`, `frontend/src/pages/OneTimeOrders.jsx`

**Funkcje:**
- Obsługa zleceń poza kontraktem
- Upload dokumentów PDF
- Statusy realizacji z powiadomieniami
- Generowanie raportów PDF
- Integracja z pojazdami dostawy/odbioru

**Statusy:**
- `AWAITING_EXECUTION` - oczekuje na realizację
- `CONTAINER_DELIVERED` - kontener dostarczony
- `AWAITING_COMPLETION` - oczekuje na odbiór
- `COMPLETED` - zakończone
- `CANCELLED` - anulowane

### 3.6 Moduł Worków Gruzowych
**Pliki:** `backend/routes/debrisBagOrders.js`, `frontend/src/pages/DebrisBagOrders.jsx`

**Funkcje:**
- Zarządzanie zleceniami worków gruzowych
- Typy worków (M - małe, D - duże)
- Śledzenie realizacji z KPO
- Integracja z systemem fakturowania

### 3.7 Moduł Kart Pracy
**Pliki:** `backend/routes/workCard.js`, `frontend/src/pages/WorkCard.jsx`

**Funkcje:**
- Ewidencja czasu pracy
- Różne typy absencji
- Dyżury i nadgodziny
- Eksport do Excel i PDF
- Walidacja przepisów pracy

### 3.8 Moduł Real-time (Socket.IO)
**Pliki:** `backend/server.js`, `frontend/src/lib/socket.js`

**Funkcje:**
- Synchronizacja zasobów w czasie rzeczywistym
- Blokowanie zasobów (pracownicy/pojazdy)
- Powiadomienia o zmianach
- TTL dla blokad (10 minut)

## 4. Opis Endpointów API

### 4.1 Autoryzacja
```
POST /api/auth/login
POST /api/auth/register (tylko admin)
```

### 4.2 Pracownicy
```
GET    /api/employees                    - lista pracowników
POST   /api/employees                    - dodanie pracownika
PUT    /api/employees/:id                - edycja pracownika
DELETE /api/employees/:id                - usunięcie pracownika
GET    /api/employees/schedule/by-date   - harmonogram na datę
POST   /api/employees/import             - import z Excel
```

### 4.3 Pojazdy
```
GET    /api/vehicles                     - lista pojazdów
POST   /api/vehicles                     - dodanie pojazdu
PUT    /api/vehicles/:id                 - edycja pojazdu
DELETE /api/vehicles/:id                 - usunięcie pojazdu
POST   /api/vehicles/:id/fault           - zgłoszenie awarii
PUT    /api/vehicles/:id/fault/resolve   - naprawa awarii
```

### 4.4 Zlecenia Jednorazowe
```
GET    /api/one-time-orders              - lista zleceń
POST   /api/one-time-orders              - nowe zlecenie
PUT    /api/one-time-orders/:id          - edycja zlecenia
DELETE /api/one-time-orders/:id          - usunięcie zlecenia
GET    /api/one-time-orders/pending-pdf  - raport PDF oczekujących
POST   /api/one-time-orders/:id/pdf      - upload dokumentu
GET    /api/one-time-orders/:id/merged-pdf - PDF z dokumentem
```

### 4.5 Trasówka
```
POST   /api/trasowka/generate            - generowanie PDF trasówki
```

### 4.6 Karty Pracy
```
GET    /api/work-card/:employeeId        - karta pracownika
POST   /api/work-card/:employeeId        - dodanie wpisu
PUT    /api/work-card/:employeeId/:date  - edycja wpisu
GET    /api/work-card/:employeeId/export-xlsx - eksport Excel
```

### 4.7 PDF Generation
```
POST   /api/pdf/work-card                - generowanie PDF karty pracy
POST   /api/pdf/monthly-schedule         - generowanie harmonogramu
```

### 4.8 Real-time
```
POST   /api/dailyAssignments/reserve-resource    - blokowanie zasobu
POST   /api/dailyAssignments/release-resource    - zwolnienie zasobu
GET    /api/dailyAssignments/locks               - status blokad
```

## 5. Opis Bazy Danych

### 5.1 Diagram ERD (Główne Encje)
```
User (1) ──── (N) OneTimeOrder
Employee (1) ──── (N) EmployeeSchedule
Employee (1) ──── (N) WorkCardEntry
Employee (1) ──── (N) EmployeeDamage
Vehicle (1) ──── (N) VehicleFaultReport
Vehicle (1) ──── (N) DailyAssignment
Region (1) ──── (N) Point
Region (1) ──── (N) DailyAssignment
Fraction (1) ──── (N) PointFraction
Fraction (1) ──── (N) RegionFraction
Point (1) ──── (N) PointFraction
DailyAssignment (1) ──── (N) DailyAssignmentAssistant
DailyAssignment (1) ──── (N) DailyAssignmentFraction
```

### 5.2 Główne Tabele

#### User
```sql
- id: Int (PK)
- name: String
- email: String (unique)
- password: String (hashed)
- role: String
- avatarUrl: String?
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

#### Employee
```sql
- id: Int (PK)
- name: String
- surname: String
- position: String
- phone: String
- email: String?
- hiredAt: DateTime?
- terminatedAt: DateTime?
- hasDisabilityCertificate: Boolean
- workHours: Int (7/8)
- overtimeAllowed: Boolean
- nightShiftAllowed: Boolean
- driversLicenseCategories: String?
- specialQualifications: String?
- vacationDays: Int?
```

#### Vehicle
```sql
- id: Int (PK)
- brand: String
- registrationNumber: String (unique)
- vehicleType: String
- capacity: Float
- fuelType: String
- purchaseDate: DateTime?
- isActive: Boolean
- faultStatus: String
```

#### Region
```sql
- id: Int (PK)
- name: String
- unitName: String
- notes: String?
```

#### Point
```sql
- id: Int (PK)
- type: String (zamieszkala/niezamieszkala)
- town: String
- street: String
- number: String
- notes: String?
- companyName: String?
- activityNotes: String?
- startDate: DateTime?
- endDate: DateTime?
- isIndefinite: Boolean
- kompostownik: Boolean
- regionId: Int? (FK)
```

#### Fraction
```sql
- id: Int (PK)
- name: String
- code: String
- color: String
```

#### OneTimeOrder
```sql
- id: Int (PK)
- dateReceived: DateTime
- receivedById: Int (FK)
- deliveryDate: DateTime
- pdfFile: String?
- clientCode: String
- orderingPerson: String
- address: String
- phone: String
- containerType: String
- wasteType: String
- status: OrderStatus
- deliveryVehicleId: Int? (FK)
- pickupVehicleId: Int? (FK)
- pickupDate: DateTime?
- invoiceNumber: String?
- completedAt: DateTime?
- notes: String?
```

#### WorkCardEntry
```sql
- id: Int (PK)
- employeeId: Int (FK)
- date: DateTime
- actualFrom: String?
- actualTo: String?
- actualTotal: Float?
- absenceTypeId: Int? (FK)
- onCall: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

### 5.3 Relacje i Indeksy
- Wszystkie klucze obce mają indeksy
- Unikalne indeksy na email użytkowników
- Unikalne indeksy na numery rejestracyjne pojazdów
- Unikalne indeksy na kombinacje region-frakcja-data

## 6. Konfiguracja i Środowisko Uruchomieniowe

### 6.1 Wymagania Systemowe
- **Node.js:** 18.x lub nowszy
- **npm:** 9.x lub nowszy
- **Baza danych:** SQLite (dev) / PostgreSQL (prod)
- **Przeglądarka:** Chrome 90+, Firefox 88+, Safari 14+

### 6.2 Zależności Backend
```json
{
  "@prisma/client": "^6.11.1",
  "bcryptjs": "^3.0.2",
  "cors": "^2.8.5",
  "express": "^5.1.0",
  "jsonwebtoken": "^9.0.2",
  "multer": "^2.0.1",
  "nodemailer": "^7.0.4",
  "pdfkit": "^0.15.2",
  "puppeteer": "^24.12.1",
  "socket.io": "^4.8.1",
  "exceljs": "^4.3.0",
  "pdf-lib": "^1.17.1"
}
```

### 6.3 Zależności Frontend
```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-router-dom": "^7.6.3",
  "@tanstack/react-query": "^5.81.5",
  "socket.io-client": "^4.8.1",
  "tailwindcss": "^3.x",
  "@radix-ui/react-*": "^1.x",
  "framer-motion": "^12.23.0",
  "xlsx": "^0.18.5"
}
```

### 6.4 Zmienne Środowiskowe
```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-secret-key"

# Email (Gmail)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
FLEET_EMAIL="fleet@yourcompany.com"

# SMTP (alternatywnie)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Server
PORT="3000"
NODE_ENV="development"
```

### 6.5 Instrukcja Uruchomienia

#### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

#### Baza danych
```bash
# Inicjalizacja bazy
npx prisma migrate dev

# Seed danych testowych (opcjonalnie)
node seed-fractions.js
node seed-test-data.js
```

## 7. Mechanizmy Bezpieczeństwa

### 7.1 Uwierzytelnianie
- **JWT Tokens** z czasem wygaśnięcia 1 dzień
- **bcryptjs** do hashowania haseł (salt rounds: 10)
- **Automatyczne odświeżanie** tokenów
- **Logout** z czyszczeniem localStorage

### 7.2 Autoryzacja
- **Role-Based Access Control (RBAC)**
- **Dynamiczne uprawnienia** z bazy danych
- **Middleware** sprawdzający uprawnienia na poziomie modułów
- **Granularne uprawnienia** (read, create, update, delete)

### 7.3 Ochrona Danych
- **CORS** skonfigurowany dla frontend
- **Input validation** na wszystkich endpointach
- **SQL Injection protection** przez Prisma ORM
- **File upload validation** (tylko PDF)
- **Rate limiting** (możliwość dodania)

### 7.4 Bezpieczeństwo Sesji
- **JWT w localStorage** (można przenieść do httpOnly cookies)
- **Automatyczne wylogowanie** przy wygaśnięciu tokenu
- **Refresh token pattern** (możliwość implementacji)

## 8. Integracje z Zewnętrznymi Usługami

### 8.1 Email (Nodemailer)
**Konfiguracja:**
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

**Użycie:**
- Powiadomienia o awariach pojazdów
- Statusy zleceń jednorazowych
- Zmiany w harmonogramach pracy
- Raporty systemowe

### 8.2 PDF Generation (Puppeteer + PDFKit)
**Puppeteer:**
- Generowanie PDF z HTML
- Karty pracy
- Harmonogramy miesięczne
- Raporty zleceń

**PDFKit:**
- Trasówka z kolorowym kodowaniem
- Dokumenty techniczne
- Etykiety i formularze

### 8.3 Excel Import/Export (ExcelJS + XLSX)
**Import:**
- Pracownicy z szablonami
- Punkty odbioru
- Frakcje odpadów
- Regiony

**Export:**
- Karty pracy do Excel
- Raporty operacyjne
- Listy kontrolne

### 8.4 Real-time Communication (Socket.IO)
**Zdarzenia:**
- `resourceReserved` - zasób zablokowany
- `resourceReleased` - zasób zwolniony
- `assignmentUpdated` - aktualizacja przydziału

**Użycie:**
- Synchronizacja harmonogramów
- Blokowanie zasobów
- Powiadomienia real-time

## 9. Procesy i Przepływy Pracy

### 9.1 Proces Planowania Dziennego
1. **Wybór daty** - interfejs kalendarza
2. **Sprawdzenie dostępności** - pracownicy i pojazdy
3. **Przydział zasobów** - blokowanie w czasie rzeczywistym
4. **Planowanie tras** - automatyczne lub manualne
5. **Generowanie harmonogramu** - PDF do druku
6. **Powiadomienia** - email do zespołu

### 9.2 Proces Obsługi Zlecenia Jednorazowego
1. **Przyjęcie zlecenia** - formularz lub import
2. **Weryfikacja danych** - walidacja pól
3. **Przydział pojazdów** - dostawa i odbiór
4. **Śledzenie statusu** - aktualizacje w czasie rzeczywistym
5. **Powiadomienia** - email o zmianach statusu
6. **Dokumentacja** - PDF z podsumowaniem

### 9.3 Proces Zarządzania Awariami Pojazdów
1. **Zgłoszenie awarii** - formularz z opisem
2. **Automatyczne powiadomienie** - email do floty
3. **Zmiana statusu** - pojazd oznaczony jako niesprawny
4. **Planowanie naprawy** - harmonogram serwisu
5. **Potwierdzenie naprawy** - zmiana statusu na sprawny
6. **Powiadomienie o gotowości** - email do dyspozytora

### 9.4 Proces Ewidencji Czasu Pracy
1. **Wprowadzenie danych** - karta pracy pracownika
2. **Walidacja przepisów** - sprawdzenie limitów
3. **Obliczenia** - nadgodziny, dyżury, absencje
4. **Eksport** - Excel lub PDF
5. **Archiwizacja** - miesięczne podsumowania

### 9.5 Proces Generowania Trasówki
1. **Wybór regionu** - lista dostępnych regionów
2. **Ładowanie punktów** - automatyczne z bazy danych
3. **Przypisanie frakcji** - modal z datami
4. **Podgląd** - kolorowe kodowanie
5. **Generowanie PDF** - A4 landscape
6. **Druk** - gotowy dokument do użycia

## 10. Rozszerzenia i Możliwości Rozwoju

### 10.1 Planowane Funkcjonalności
- **Mobile App** - React Native dla kierowców
- **GPS Tracking** - śledzenie pojazdów w czasie rzeczywistym
- **QR Code System** - skanowanie worków i kontenerów
- **Advanced Analytics** - dashboard z metrykami
- **API Integration** - integracja z systemami zewnętrznymi

### 10.2 Optymalizacje Wydajnościowe
- **Caching** - Redis dla często używanych danych
- **Database Indexing** - optymalizacja zapytań
- **CDN** - dla statycznych zasobów
- **Load Balancing** - dla wysokiego ruchu

### 10.3 Bezpieczeństwo
- **2FA** - dwuskładnikowa autoryzacja
- **Audit Logs** - logowanie wszystkich operacji
- **Backup Strategy** - automatyczne kopie zapasowe
- **SSL/TLS** - szyfrowanie komunikacji

---

**Wersja dokumentacji:** 1.0  
**Data ostatniej aktualizacji:** 2025-01-27  
**Autor:** System ODPADnik Development Team










