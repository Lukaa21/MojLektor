export default function TermsPage() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "60px 24px",
        fontFamily: "var(--font-ui)",
      }}
    >
      <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
        Datum stupanja na snagu: 22. mart 2026.
      </div>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 42,
          fontWeight: 400,
          margin: "0 0 32px 0",
        }}
      >
        Uslovi korišćenja
      </h1>
      <div
        style={{
          borderBottom: "1px solid var(--border-light)",
          marginBottom: 32,
        }}
      />
      
      {/* TERMS OF SERVICE CONTENT */}
      
      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>1. Prihvatanje uslova</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Korišćenjem MojLektor Servisa potvrđujete da ste pročitali, razumjeli i prihvatili ove Uslove korišćenja u cijelosti. Ako se ne slažete sa bilo kojim dijelom ovih Uslova, molimo vas da ne koristite Servis.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>2. Opis Servisa</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        MojLektor je online servis za automatizovanu lekturu i korekturu teksta koji koristi vještačku inteligenciju. Servis je namijenjen obradi tekstova na srpskom, crnogorskom, hrvatskom i bosanskom jeziku.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>3. Korisnički račun</h2>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>Morate imati važeću email adresu za registraciju</li>
        <li style={{ marginBottom: 4 }}>Odgovorni ste za čuvanje tajnosti vaše lozinke</li>
        <li style={{ marginBottom: 4 }}>Odgovorni ste za sve aktivnosti koje se odvijaju putem vašeg računa</li>
        <li style={{ marginBottom: 4 }}>Obavezni ste da nas odmah obavijestite o neovlašćenom korišćenju vašeg računa na spojnica.me@gmail.com</li>
      </ul>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>4. Tokeni i plaćanje</h2>
      <h3 style={{ fontFamily: "var(--font-ui)", fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4.1 Sistem tokena</h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Servis funkcioniše na osnovu sistema tokena. Tokeni se kupuju unaprijed i troše se pri svakoj obradi teksta. Cijena obrade zavisi od dužine teksta i odabrane vrste usluge.
      </p>
      
      <h3 style={{ fontFamily: "var(--font-ui)", fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4.2 Kupovina tokena</h3>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>Sve kupovine se vrše putem Stripe platforme</li>
        <li style={{ marginBottom: 4 }}>Cijene su izražene u eurima (EUR) i uključuju sve primjenljive poreze</li>
        <li style={{ marginBottom: 4 }}>Kupovina je završena u trenutku potvrde plaćanja od strane Stripe-a</li>
      </ul>

      <h3 style={{ fontFamily: "var(--font-ui)", fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4.3 Nevraćanje novca — VAŽNO</h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Sve kupovine tokena su konačne i nepovratne. MojLektor ne vrši povrat novca za kupljene tokene, bez obzira na razlog, uključujući ali ne ograničavajući se na:
      </p>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>Nekorišćenje kupljenih tokena</li>
        <li style={{ marginBottom: 4 }}>Nezadovoljstvo kvalitetom AI obrade</li>
        <li style={{ marginBottom: 4 }}>Promjenu odluke korisnika</li>
        <li style={{ marginBottom: 4 }}>Tehničke probleme na strani korisnika</li>
      </ul>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Tokeni nemaju rok trajanja i ostaju dostupni na vašem računu dok god je račun aktivan.
      </p>

      <h3 style={{ fontFamily: "var(--font-ui)", fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>4.4 Izuzetak</h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Povrat novca može se razmotriti isključivo u slučaju dokazane tehničke greške na strani MojLektor Servisa koja je rezultovala nemogućnošću korišćenja plaćenih tokena. Zahtjev je potrebno poslati na spojnica.me@gmail.com u roku od 7 dana od kupovine.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>5. Prihvatljivo korišćenje</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>Saglasni ste da nećete koristiti Servis za:</p>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>Obradu tekstova koji krše autorska prava trećih lica</li>
        <li style={{ marginBottom: 4 }}>Obradu tekstova koji sadrže nezakonit sadržaj</li>
        <li style={{ marginBottom: 4 }}>Pokušaje zaobilaženja sistema ograničenja ili sigurnosnih mjera</li>
        <li style={{ marginBottom: 4 }}>Automatizovano slanje zahtjeva (botovi, skripte) bez prethodnog odobrenja</li>
        <li style={{ marginBottom: 4 }}>Bilo kakvu aktivnost koja bi mogla oštetiti, preopteretiti ili narušiti rad Servisa</li>
      </ul>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>6. Kvalitet usluge i odricanje od odgovornosti</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        6.1 MojLektor pruža AI-asistiranu lekturu i korekturu, ali ne garantuje apsolutnu tačnost, potpunost ni prikladnost rezultata obrade za bilo koju konkretnu svrhu.<br />
        6.2 Korisnik je isključivo odgovoran za provjeru i validaciju svih rezultata obrade prije njihove upotrebe.<br />
        6.3 MojLektor se izričito odriče svake odgovornosti za:
      </p>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>Greške ili propuste u rezultatima AI obrade</li>
        <li style={{ marginBottom: 4 }}>Štetu nastalu upotrebom ili oslanjanjem na rezultate obrade</li>
        <li style={{ marginBottom: 4 }}>Gubitak podataka ili prekid Servisa</li>
        <li style={{ marginBottom: 4 }}>Indirektnu, slučajnu ili posljedičnu štetu bilo koje vrste</li>
      </ul>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        6.4 Koristite Servis isključivo na vlastitu odgovornost.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>7. Intelektualna svojina</h2>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>MojLektor zadržava sva prava na Servis, njegovo ime, dizajn i tehnologiju</li>
        <li style={{ marginBottom: 4 }}>Vi zadržavate sva prava na tekstove koje podnosite na obradu</li>
        <li style={{ marginBottom: 4 }}>Davanjem teksta na obradu dajete MojLektor-u ograničenu, neekskluzivnu licencu za procesiranje teksta isključivo u svrhu pružanja usluge</li>
      </ul>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>8. Dostupnost Servisa</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        MojLektor ne garantuje neprekidnu dostupnost Servisa. Servis može biti privremeno nedostupan zbog održavanja, tehničkih problema ili okolnosti van naše kontrole. MojLektor ne odgovara za štetu nastalu nedostupnošću Servisa.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>9. Raskid</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Zadržavamo pravo da suspendujemo ili ukinemo vaš korisnički račun bez prethodne najave u slučaju kršenja ovih Uslova korišćenja. Tokeni na suspendovanom računu zbog kršenja Uslova neće biti refundirani.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>10. Mjerodavno pravo</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Na ove Uslove primjenjuje se pravo Crne Gore. Sve sporove nastale u vezi sa ovim Uslovima stranke će nastojati riješiti sporazumno, a u slučaju neuspjeha nadležan je sud u Crnoj Gori.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>11. Izmjene Uslova</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Zadržavamo pravo izmjene ovih Uslova u bilo kom trenutku. Nastavljanjem korišćenja Servisa nakon objave izmjena smatrase da ste prihvatili izmijenjene Uslove.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>12. Kontakt</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Za sva pitanja u vezi sa ovim Uslovima kontaktirajte nas na: spojnica.me@gmail.com
      </p>
    </div>
  );
}
