export default function PrivacyPolicyPage() {
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
        Politika privatnosti
      </h1>
      <div
        style={{
          borderBottom: "1px solid var(--border-light)",
          marginBottom: 32,
        }}
      />

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>1. Opšte informacije</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        MojLektor ("Servis", "mi", "nas") je servis za automatizovanu lekturu i korekturu teksta kojim upravlja fizičko lice sa sjedištem u Crnoj Gori. Korišćenjem Servisa prihvatate prikupljanje i korišćenje informacija u skladu sa ovom Politikom privatnosti.
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Servis je namijenjen osobama starijim od 16 godina. Ako ste mlađi od 16 godina, molimo vas da ne koristite Servis bez saglasnosti roditelja ili zakonskog staratelja.
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Za sva pitanja u vezi sa privatnošću možete nas kontaktirati na: <a href="mailto:spojnica.me@gmail.com" style={{ color: "var(--accent)", textDecoration: "none" }}>spojnica.me@gmail.com</a>
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>2. Koje podatke prikupljamo</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>Podaci koje nam direktno dajete:</p>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>Email adresa (pri registraciji)</li>
        <li style={{ marginBottom: 4 }}>Lozinka (čuvamo isključivo kao hash, nikada u originalnom obliku)</li>
        <li style={{ marginBottom: 4 }}>Tekst koji podnosite na obradu</li>
      </ul>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>Podaci koje automatski prikupljamo:</p>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>IP adresa</li>
        <li style={{ marginBottom: 4 }}>Informacije o sesiji i kolačićima</li>
        <li style={{ marginBottom: 4 }}>Podaci o korišćenju Servisa (broj obrađenih tokena, datum i vrsta obrade)</li>
      </ul>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>Podaci o plaćanju:</p>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Plaćanja se vrše isključivo putem Stripe platforme. MojLektor ne prikuplja niti čuva podatke o platnim karticama. Stripe ima vlastitu politiku privatnosti dostupnu na <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>stripe.com</a>.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>3. Kako koristimo vaše podatke</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>Vaše podatke koristimo isključivo za:</p>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>Pružanje usluge lekture i korekture teksta</li>
        <li style={{ marginBottom: 4 }}>Upravljanje vašim korisničkim računom i balansom tokena</li>
        <li style={{ marginBottom: 4 }}>Procesiranje plaćanja putem Stripe platforme</li>
        <li style={{ marginBottom: 4 }}>Zaštitu od zloupotrebe Servisa (ograničavanje broja zahtjeva, detekcija prevara)</li>
        <li style={{ marginBottom: 4 }}>Komunikaciju u vezi sa vašim računom</li>
      </ul>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Pravna osnova za obradu vaših podataka je izvršenje ugovora (pružanje Servisa) i legitimni interes (zaštita od zloupotrebe).
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>4. Obrada teksta putem AI</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Tekst koji podnosite na obradu proslijeđuje se OpenAI API servisu radi automatske obrade. Prihvatanjem ovih uslova saglasni ste sa ovim proslijeđivanjem. Preporučujemo da ne podnosite tekstove koji sadrže osjetljive lične podatke trećih lica. OpenAI ima vlastitu politiku privatnosti dostupnu na <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>openai.com</a>.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>5. Čuvanje podataka</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Vaši podaci se čuvaju na serverima Supabase (PostgreSQL baza podataka). Čuvamo podatke dok god je vaš nalog aktivan. Nakon brisanja naloga, vaši podaci se brišu u roku od 30 dana. Možete zatražiti brisanje vašeg naloga i svih povezanih podataka slanjem zahtjeva na <a href="mailto:spojnica.me@gmail.com" style={{ color: "var(--accent)", textDecoration: "none" }}>spojnica.me@gmail.com</a>.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>6. Kolačići (Cookies)</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Koristimo isključivo funkcionalne kolačiće neophodne za rad Servisa — kolačić sesije (ml_session) koji vas drži prijavljenim. Ne koristimo kolačiće za praćenje ili reklamne svrhe.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>7. Dijeljenje podataka sa trećim stranama</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>Ne prodajemo, ne iznajmljujemo niti dijelimo vaše lične podatke sa trećim stranama, osim:</p>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>Stripe — za procesiranje plaćanja</li>
        <li style={{ marginBottom: 4 }}>OpenAI — za obradu teksta</li>
        <li style={{ marginBottom: 4 }}>Supabase — za čuvanje podataka</li>
        <li style={{ marginBottom: 4 }}>Kada to zahtijeva zakon ili nadležni organ</li>
      </ul>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Korišćenjem Servisa saglasni ste da vaši podaci mogu biti obrađivani izvan Evropskog ekonomskog prostora od strane navedenih trećih strana, koje primjenjuju odgovarajuće mjere zaštite podataka.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>8. Vaša prava</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>U skladu sa važećim propisima imate pravo da:</p>
      <ul style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16, paddingLeft: 24, listStyleType: "disc" }}>
        <li style={{ marginBottom: 4 }}>Zatražite uvid u podatke koje čuvamo o vama</li>
        <li style={{ marginBottom: 4 }}>Zatražite ispravku netačnih podataka</li>
        <li style={{ marginBottom: 4 }}>Zatražite brisanje vaših podataka</li>
        <li style={{ marginBottom: 4 }}>Povučete saglasnost za obradu podataka</li>
      </ul>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Zahtjeve šaljite na: <a href="mailto:spojnica.me@gmail.com" style={{ color: "var(--accent)", textDecoration: "none" }}>spojnica.me@gmail.com</a>
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>9. Sigurnost</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Preduzimamo razumne tehničke mjere zaštite vaših podataka uključujući enkripciju lozinki, HTTPS protokol i JWT autentifikaciju. Međutim, nijedan sistem nije 100% siguran i ne možemo garantovati apsolutnu sigurnost podataka.
      </p>

      <h2 style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>10. Izmjene politike</h2>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-main)", marginBottom: 16 }}>
        Zadržavamo pravo izmjene ove Politike. O značajnim izmjenama obavijestićemo korisnike putem emaila ili obavještenja na Servisu.
      </p>

      <div style={{ borderTop: "1px solid var(--border-light)", marginTop: 48, paddingTop: 24 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          MojLektor · <a href="mailto:spojnica.me@gmail.com" style={{ color: "var(--text-muted)", textDecoration: "none" }}>spojnica.me@gmail.com</a> · Crna Gora
        </p>
      </div>
    </div>
  );
}