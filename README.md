# MojLektor Frontend

Minimalisticki Next.js UI za obradu teksta preko `/api/process` i `/api/estimate`.

## Pokretanje

- Node.js >= 20.9

### 1) Backend (root folder)

- Instalacija:
  - `npm install`
- Pokretanje (preporuka):
  - `npx tsx src/index.ts`

Backend se podize na `http://localhost:3001` (ako ne promijenite `PORT`).

### 2) Frontend (frontend/)

- Instalacija:
  - `npm install`
- Dev server:
  - `npm run dev`

## Konfiguracija API baze

Frontend koristi proxy preko Next.js rewrites. Postavite:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`

Primjer `.env.local` u `frontend/`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Testovi

- Pokretanje frontend testova:
  - `npm test`

## MVP tok

- korisnik unosi tekst
- bira uslugu i vrstu teksta
- frontend salje zahtjev na `/api/process` ili `/api/estimate`
- rezultat i procjena se prikazuju i mogu kopirati
