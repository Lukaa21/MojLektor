import type { ReversibleChange } from "../lib/api";
import { demoTexts } from "./demoTexts";
import { createFullDiff } from "../core/diff";

type DemoOutputEntry = {
  correctedText: string;
  changes: ReversibleChange[];
};

const baseDemoOutputs: Record<
  "akademski" | "clanak",
  Record<"lektura" | "korektura" | "kombinacija", DemoOutputEntry>
> = {
  akademski: {
    lektura: { correctedText: `Uticaj društvenih mreža na akademsku uspešnost studentske populacije
Sažetak
Ovaj rad razmatra kako društvene mreže utiču na akademsku uspešnost studenata. Analizom dostupne literature i rezultata nekoliko empirijskih istraživanja nastojimo utvrditi postoje li dosljedno negativni učinci ili je odnos između korišćenja društvenih mreža i akademskih postignuća složeniji. Zaključujemo da kontekst i način korišćenja imaju veću ulogu nego količina vremena provedena na mrežama.
1. Uvod
Društvene mreže postale su sastavni deo svakodnevnog života mladih ljudi, posebno studenata. Prema istraživanju koje je proveo Statista 2022. godine, više od devedeset posto studenata u dobi između osamnaest i dvadeset pet godina koristi barem jednu društvenu mrežu svakodnevno. Ovaj podatak postavlja pitanje: u kojoj meri ova navika utiče na akademski rad i postignuća studenata?
Akademska zajednica nije jedinstvena u odgovoru na ovo pitanje. Jedni istraživači tvrde da su društvene mreže izvor distrakcije koji direktno narušava sposobnost dubokog, fokusiranog učenja (Rosen, 2012; Kirschner i Karpinski, 2010). Drugi smatraju da ista tehnologija može, ako se koristi na pravi način, podupirati kolaborativno učenje i razmenu znanja (Junco, 2012; Dabbagh i Kitsantas, 2012). Ovaj rad ne zauzima a priori nijedan od ovih stavova, već nastoji da sintetiše postojeće nalaze i ponudi uravnoteženiju sliku od one koja se često sreće u javnom diskursu.
2.Teorijski okvir
Teorijska osnova ovog rada oslanja se na dve komplementarne perspektive. Prva je teorija kognitivnog opterećenja (Sweller, 1988), prema kojoj svaki vanjski podražaj koji ne doprinosi zadatku učenja povećava irelevantno kognitivno opterećenje i smanjuje kapacitet radne memorije dostupan za obradu nastavnog sadržaja. Prema ovoj teoriji, notifikacije i multitasking svojstveni korišćenju društvenih mreža predstavljaju pretnju efikasnom učenju.
Druga perspektiva dolazi iz oblasti socijalnog konstruktivizma. Vygotsky (1978) je naglašavao da se znanje ne konstruiše u izolaciji, već kroz interakciju s drugima. U tom smislu, digitalni prostori koji omogućuju razmenu ideja, zajedničko rešavanje problema i povratne informacije od kolega mogu biti funkcionalni ekvivalent tradicionalnih studijskih grupa. Ključno pitanje nije da li je tehnologija prisutna, nego kako se koristi i u koje svrhe.
3. Pregled istraživanja
Istraživanja koja ispituju vezu između korišćenja društvenih mreža i akademske uspešnosti daju heterogene rezultate, što otežava donošenje jednoznačnih zaključaka. Meta-analiza koju su sproveli Apeanti i Danso (2014) obuhvatila je dvadeset tri primarne studije i pokazala umjerenu negativnu korelaciju između ukupnog vremena provedenog na društvenim mrežama i prosečnih ocena studenata (r = −0,21).Međutim, isti autori naglašavaju da ova korelacija varira u zavisnosti od discipline studija, tipa korišćene platforme i individualnih razlika između studenata.
Posebno je zanimljiv nalaz Junca i saradnika (2011), koji su ustanovili da nisu sve aktivnosti na društvenim mrežama jednako štetne. Pasivno konzumiranje sadržaja, poput skrolanja kroz feed bez jasne namjere, pokazalo je jaču negativnu korelaciju s akademskim uspehom nego aktivno korišćenje — na primer, učestvovanje u akademskim grupama ili komunikacija s kolegama o nastavnom gradivu. Ovaj nalaz sugerira da bi istraživanja trebalo da razlikuju vrste korišćenja umesto da društvene mreže tretiraju kao homogenu aktivnost s istim efektima.
Unatoč ovim nijansiranim nalazima treba napomenuti da veliki deo dostupnih istraživanja ima metodološka ograničenja. Većina studija oslanja se na samoprocenu ispitanika, što uvodi potencijalnu pristrasnost jer je poznato da ljudi sistematski potcenjuju vlastito vreme provedeno na ekranima. pored toga, transverzalni dizajn koji preovladava u ovoj oblasti onemogućuje zaključivanje o uzročno-posledičnim vezama između promenljivih. Iz tih razloga, rezultate treba tumačiti s oprezom.
4. Zaključak
Na osnovu pregledane literature može se zaključiti da je odnos između korišćenja društvenih mreža i akademske uspešnosti posredovan nizom kontekstualnih faktora.Količina vremena provedenog na mrežama slabiji je prediktor akademskog uspeha od kvaliteta i namere korišćenja, što ima direktne implikacije za obrazovnu praksu.Umesto potpunih zabrana ili ograničavanja pristupa, obrazovne institucije trebalo bi da razvijaju programe digitalne pismenosti koji studentima pomažu da kritički upravljaju sopstvenim digitalnim okruženjem.
Buduća istraživanja trebalo bi da koriste longitudinalne nacrte i objektivne mere korišćenja kako bi se prevazišla metodološka ograničenja trenutno dostupnih studija.`, changes: [] },
    korektura: { correctedText: `Uticaj društvenih mreža na akademsku uspešnost studentske populacije
Sažetak
Ovaj rad bavi se pitanjem kako društvene mreže utiču na akademsku uspešnost studenata. Analizom dostupne literature i rezultata nekoliko empirijskih istraživanja, pokušavamo utvrditi postoje li dosledno negativni učinci ili je odnos između korišćenja društvenih mreža i akademskih postignuća složeniji. Zaključujemo da kontekst i način korišćenja imaju veću ulogu nego sama količina vremena provedenog na mrežama.
1. Uvod
Društvene mreže postale su sastavni deo svakodnevnog života mladih ljudi, posebno studentske populacije. Prema istraživanju koje je proveo Statista 2022. godine, više od devedeset posto studenata u dobi između osamnaest i dvadeset pet godina koristi barem jednu društvenu mrežu svakodnevno. Ovaj podatak postavlja važno pitanje: u kojoj meri ova navika utiče na akademski rad i postignuća studenata?
Akademska zajednica nije jedinstvena u svom odgovoru na ovo pitanje. Jedni istraživači tvrde da su društvene mreže izvor distrakcije koji direktno narušava sposobnost dubokog, fokusiranog učenja (Rosen, 2012; Kirschner i Karpinski, 2010). Drugi pak smatraju da ista tehnologija može, ako se koristi na pravi način, podržavati kolaborativno učenje i razmenu znanja (Junco, 2012; Dabbagh i Kitsantas, 2012). Ovaj rad ne zauzima a priori nijedan od ovih stavova, već nastoji da sintetiše postojeće nalaze i ponudi uravnoteženiju sliku od one koja se najčešće sreće u javnom diskursu.
2.Teorijski okvir  
Teorijska osnova ovog rada oslanja se na dve međusobno komplementarne perspektive. Prva je teorija kognitivnog opterećenja (Sweller, 1988), prema kojoj svaki spoljašnji podražaj koji ne doprinosi zadatku koji se uči povećava irelevantno kognitivno opterećenje i time smanjuje kapacitet radne memorije dostupan za obradu nastavnog sadržaja. Prema ovoj teoriji, notifikacije i multitasking koji su svojstveni korišćenju društvenih mreža predstavljaju pretnju efikasnom učenju.  
Druga perspektiva dolazi iz oblasti socijalnog konstruktivizma. Vygotsky (1978) je naglašavao da se znanje ne konstruiše u izolaciji, već kroz interakciju s drugima. U tom smislu, digitalni prostori koji omogućuju razmenu ideja, zajedničko rešavanje problema i povratne informacije od kolega mogu biti funkcionalni ekvivalent tradicionalnih studijskih grupa. Ključno pitanje, dakle, nije da li je tehnologija prisutna, nego kako se ona koristi i u koje svrhe.  
3. Pregled istraživanja  
Istraživanja koja ispituju vezu između korišćenja društvenih mreža i akademske uspešnosti daju heterogene rezultate, što otežava donošenje jednoznačnih zaključaka. Meta-analiza koju su sproveli Apeanti i Danso (2014) obuhvatila je dvadeset tri primarne studije i pokazala umerenu negativnu korelaciju između ukupnog vremena provedenog na društvenim mrežama i prosečnih ocena studenata (r = −0,21).Međutim, isti autori naglašavaju da ova korelacija značajno varira u zavisnosti od discipline studija, tipa korišćene platforme i individualnih razlika između studenata.
Posebno je zanimljiv nalaz Junca i saradnika (2011), koji su ustanovili da nije svaka aktivnost na društvenim mrežama jednako štetna. Pasivno konzumiranje sadržaja, poput skrolanja kroz fid bez jasne namere, pokazalo je jaču negativnu korelaciju s akademskim uspehom nego aktivno korišćenje — na primer, učestvovanje u akademskim grupama ili komuniciranje s kolegama o nastavnom gradivu. Ovaj nalaz sugeriše da bi istraživanja trebalo da razlikuju vrste korišćenja umesto da tretiraju društvene mreže kao homogenu aktivnost koja uvek ima iste efekte.
Uprkos ovim nijansiranim nalazima treba napomenuti da veliki deo dostupnih istraživanja ima metodološka ograničenja koja se ne mogu zanemariti. Većina studija oslanja se na samoprocenu ispitanika, što uvodi potencijalnu pristrasnost jer je poznato da ljudi sistematski potcenjuju sopstveno vreme provedeno na ekranima. Pored toga, transverzalni dizajn koji preovladava u ovoj oblasti onemogućuje zaključivanje o uzročno-posledičnim vezama između promenljivih. Iz tih razloga, rezultate treba tumačiti s oprezom.
4. Zaključak
Na osnovu pregledane literature može se zaključiti da je odnos između korišćenja društvenih mreža i akademske uspešnosti posredovan nizom kontekstualnih faktora.Sama količina vremena provedenog na mrežama slabiji je prediktor akademskog uspeha od kvaliteta i namere korišćenja, što ima direktne implikacije za obrazovnu praksu. Umesto potpunih zabrana ili ograničavanja pristupa, obrazovne institucije trebalo bi da razvijaju programe digitalne pismenosti koji pomažu studentima da kritički upravljaju sopstvenim digitalnim okruženjem.
Buduća istraživanja trebalo bi da koriste longitudinalne nacrte i objektivne mere korišćenja kako bi se prevazišla metodološka ograničenja trenutno dostupnih studija.`, changes: [] },
    kombinacija: { correctedText: `Uticaj društvenih mreža na akademsku uspešnost studentske populacije
Sažetak
Ovaj rad bavi se pitanjem kako društvene mreže utiču na akademsku uspešnost studenata. Analizom dostupne literature i rezultata nekoliko empirijskih istraživanja nastojimo da utvrdimo da li postoje dosledno negativni učinci ili je odnos između korišćenja društvenih mreža i akademskih postignuća složeniji. Zaključujemo da kontekst i način korišćenja imaju veću ulogu od same količine vremena provedene na mrežama.
1. Uvod
Društvene mreže postale su sastavni deo svakodnevnog života mladih ljudi, posebno studentske populacije. Prema istraživanju koje je sproveo Statista 2022. godine, više od devedeset odsto studenata uzrasta od osamnaest do dvadeset pet godina koristi najmanje jednu društvenu mrežu svakodnevno. Ovaj podatak otvara pitanje u kojoj meri ova navika utiče na akademski rad i postignuća studenata.
Akademska zajednica nije jedinstvena u odgovoru na ovo pitanje. Jedni istraživači tvrde da su društvene mreže izvor distrakcije koji direktno narušava sposobnost dubokog, fokusiranog učenja (Rosen, 2012; Kirschner i Karpinski, 2010). Drugi smatraju da ista tehnologija može, ako se koristi na odgovarajući način, da podrži kolaborativno učenje i razmenu znanja (Junco, 2012; Dabbagh i Kitsantas, 2012). Ovaj rad ne zauzima unapred nijedan od ovih stavova, već nastoji da sintetiše postojeće nalaze i ponudi uravnoteženiju sliku od one koja se najčešće sreće u javnom diskursu.
2.Teorijski okvir
Teorijska osnova ovog rada oslanja se na dve međusobno komplementarne perspektive. Prva je teorija kognitivnog opterećenja (Sweller, 1988), prema kojoj svaki spoljašnji podražaj koji ne doprinosi zadatku učenja povećava irelevantno kognitivno opterećenje i time smanjuje kapacitet radne memorije dostupan za obradu nastavnog sadržaja. Prema ovoj teoriji, notifikacije i multitasking, svojstveni korišćenju društvenih mreža, predstavljaju pretnju efikasnom učenju.
Druga perspektiva potiče iz oblasti socijalnog konstruktivizma. Vygotsky (1978) je naglašavao da se znanje ne konstruiše u izolaciji, već kroz interakciju s drugima. U tom smislu, digitalni prostori koji omogućavaju razmenu ideja, zajedničko rešavanje problema i povratne informacije od kolega mogu biti funkcionalni ekvivalent tradicionalnih studijskih grupa. Ključno pitanje, dakle, nije da li je tehnologija prisutna, već kako se koristi i u koje svrhe.
3. Pregled istraživanja
Istraživanja koja ispituju vezu između korišćenja društvenih mreža i akademske uspešnosti daju heterogene rezultate, što otežava donošenje jednoznačnih zaključaka. Meta-analiza koju su sproveli Apeanti i Danso (2014) obuhvatila je dvadeset tri primarne studije i pokazala umerenu negativnu korelaciju između ukupnog vremena provedenog na društvenim mrežama i prosečnih ocena studenata (r = −0,21).Međutim, isti autori naglašavaju da ova korelacija značajno varira u zavisnosti od discipline studija, tipa korišćene platforme i individualnih razlika među studentima.
Posebno je zanimljiv nalaz Junca i saradnika (2011), koji su ustanovili da nije svaka aktivnost na društvenim mrežama jednako štetna. Pasivno konzumiranje sadržaja, poput skrolovanja kroz fid bez jasne namere, pokazalo je jaču negativnu korelaciju s akademskim uspehom nego aktivno korišćenje — na primer, učestvovanje u akademskim grupama ili komunikacija s kolegama o nastavnom gradivu. Ovaj nalaz sugeriše da bi istraživanja trebalo da razlikuju vrste korišćenja, umesto da tretiraju društvene mreže kao homogenu aktivnost koja uvek ima iste efekte.
Uprkos ovim nijansiranim nalazima, treba napomenuti da veliki deo dostupnih istraživanja ima metodološka ograničenja. Većina studija oslanja se na samoprocenu ispitanika, što uvodi potencijalnu pristrasnost, jer je poznato da ljudi sistematski potcenjuju sopstveno vreme provedeno pred ekranima. Pored toga, transverzalni dizajn koji preovladava u ovoj oblasti onemogućava zaključivanje o uzročno-posledičnim vezama između promenljivih. Iz tih razloga, rezultate treba tumačiti s oprezom.
4. Zaključak
Na osnovu pregledane literature može se zaključiti da je odnos između korišćenja društvenih mreža i akademske uspešnosti posredovan nizom kontekstualnih faktora.Sama količina vremena provedenog na mrežama slabiji je prediktor akademskog uspeha od kvaliteta i namere korišćenja, što ima implikacije za obrazovnu praksu. Umesto potpunih zabrana ili ograničavanja pristupa, obrazovne institucije trebalo bi da razvijaju programe digitalne pismenosti koji pomažu studentima da kritički upravljaju sopstvenim digitalnim okruženjem.
Buduća istraživanja trebalo bi da koriste longitudinalne nacrte i objektivne mere korišćenja kako bi prevazišla metodološka ograničenja trenutno dostupnih studija.`, changes: [] },
  },
  clanak: {
    lektura: { correctedText: `U poslednjih nekoliko godina moze se primjetiti da ljudi sve vise vremena provode gledajući u svoje pametne telefone. Ova pojava nije ogranicena samo na mlade osobe, već i stariji ljudi sve češće koriste telefone za aktivnosti koje ranije nisu radili. Na primer, danas je sasvim uobičajeno da neko dok čeka autobus provjerava drustvene mreže ili čita vijesti na internetu. Jedan od razloga zašto se ovo desava jeste što su telefoni postali veoma dostupni i funkcionalni. Većina ljudi danas ima uredjaj koji može da obavlja više zadataka, poput slanja poruka, fotografisanje, gledanja video sadrzaja i obavljanja posla. Zbog toga se telefoni cesto koriste i u situacijama kada to možda i nije neophodno. Medjutim, mnogi stručnjaci upozoravaju da pretjerana upotreba telefona može imati negativne posledice po zdravlje korisnika i njihovu okolinu. Na primer, ljudi koji previše vremena provode na telefonu često imaju problem sa koncentracijom ili kvalitetom sna, što zabrinjava. Takodje se desava da se smanjuje direktna komunikacija između ljudi jer sve više razgovora prelazi u digitalni oblik, koji nije isti kao razgovor licem u lice. Ipak, treba naglasiti da telefoni sami po sebi nisu problem, već način kako ih ljudi koriste. Ako se koriste umjereno i u pravom trenutku oni mogu biti veoma korisni alati za informisanje, ucenje i komunikaciju, jer nude mnogo mogućnosti.Sa druge strane ukoliko se koriste bez kontrole, mogu dovesti do smanjenja produktivnosti i slabije drustvene interakcije. Pametni telefoni će verovatno nastaviti da igraju vaznu ulogu u svakodnevnom životu ljudi. ono što ostaje kao izazov jeste pronaći ravnotežu između korišćenja tehnologije i vremena provedenog u stvarnim interakcijama sa drugim ljudima.`, changes: [] },
    korektura: { correctedText: `U poslednjih nekoliko godina može se primetiti da ljudi sve više vremena provode gledajući u svoje pametne telefone. Ova pojava nije ograničena samo na mlade osobe, već i stariji ljudi sve češće koriste telefone za razne aktivnosti koje ranije nisu radili. Na primer, danas je sasvim uobičajeno da neko dok čeka autobus proverava društvene mreže ili čita vesti na internetu.
Jedan od razloga zašto se ovo dešava jeste što su telefoni postali veoma dostupni i funkcionalni. Većina ljudi danas ima uređaj koji može da obavlja više različitih zadataka, poput slanja poruka, fotografisanja, gledanja video sadržaja i čak obavljanja posla. Zbog toga se telefoni često koriste i u situacijama kada to možda i nije neophodno.
Međutim, mnogi stručnjaci upozoravaju da preterana upotreba telefona može imati negativne posledice po zdravlje korisnika i njihovu okolinu. Na primer, ljudi koji previše vremena provode na telefonu često imaju problem sa koncentracijom ili kvalitetom sna, što je nešto što zabrinjava. Takođe se dešava da se smanjuje direktna komunikacija između ljudi jer sve više razgovora prelazi u digitalni oblik koji nije isti kao razgovor licem u lice.
Ipak, treba naglasiti da telefoni sami po sebi nisu problem, već način kako ih ljudi koriste. Ako se koriste umereno i u pravom trenutku, oni mogu biti veoma korisni alati za informisanje, učenje i komunikaciju, jer imaju mnogo mogućnosti.S druge strane, ukoliko se koriste bez kontrole, mogu dovesti do smanjenja produktivnosti i slabije društvene interakcije, koja je važna za ljude.
Na kraju, može se reći da će pametni telefoni verovatno nastaviti da igraju važnu ulogu u svakodnevnom životu ljudi, s obzirom na to da su postali sastavni deo moderne tehnologije i savremenog društva. Ono što ostaje kao izazov jeste pronaći ravnotežu između korišćenja tehnologije i vremena provedenog u stvarnim interakcijama sa drugim ljudima, što nije lako.`, changes: [] },
    kombinacija: { correctedText: `U poslednjih nekoliko godina može se primetiti da ljudi sve više vremena provode gledajući u svoje pametne telefone. Ova pojava nije ograničena samo na mlade; i stariji sve češće koriste telefone za razne aktivnosti koje ranije nisu obavljali. Na primer, danas je sasvim uobičajeno da neko, dok čeka autobus, proverava društvene mreže ili čita vesti na internetu. Jedan od razloga za to jeste što su telefoni postali veoma dostupni i funkcionalni. Većina ljudi danas ima uređaj koji može da obavlja više različitih zadataka, poput slanja poruka, fotografisanja, gledanja video-sadržaja, pa čak i obavljanja posla. Zbog toga se telefoni često koriste i u situacijama kada to možda nije neophodno. Međutim, mnogi stručnjaci upozoravaju da preterana upotreba telefona može imati negativne posledice po zdravlje korisnika i njihovu okolinu. Na primer, ljudi koji previše vremena provode na telefonu često imaju probleme s koncentracijom ili kvalitetom sna, što izaziva zabrinutost. Takođe se dešava da se smanjuje direktna komunikacija među ljudima, jer sve više razgovora prelazi u digitalni oblik, koji nije isti kao razgovor licem u lice. Ipak, treba naglasiti da telefoni sami po sebi nisu problem, već način na koji ih ljudi koriste. Ako se koriste umereno i u pravom trenutku, mogu biti veoma korisni alati za informisanje, učenje i komunikaciju, jer nude mnogo mogućnosti.S druge strane, ukoliko se koriste bez kontrole, mogu dovesti do smanjenja produktivnosti i slabije društvene interakcije, koja je važna za ljude. Na kraju, može se reći da će pametni telefoni verovatno nastaviti da igraju važnu ulogu u svakodnevnom životu ljudi, s obzirom na to da su postali sastavni deo moderne tehnologije i savremenog društva. Ono što ostaje kao izazov jeste pronaći ravnotežu između korišćenja tehnologije i vremena provedenog u stvarnim interakcijama sa drugim ljudima, što nije lako.`, changes: [] },
  },
};

export const demoOutputs = (Object.keys(baseDemoOutputs) as Array<"akademski" | "clanak">).reduce(
  (acc, textKey) => {
    const originalText = demoTexts[textKey];
    const modes = baseDemoOutputs[textKey];

    acc[textKey] = (Object.keys(modes) as Array<"lektura" | "korektura" | "kombinacija">).reduce(
      (modeAcc, modeKey) => {
        const modeEntry = modes[modeKey];
        const computed = createFullDiff(originalText, modeEntry.correctedText).changes;

        modeAcc[modeKey] = {
          correctedText: modeEntry.correctedText,
          changes: modeEntry.changes.length ? modeEntry.changes : computed,
        };

        return modeAcc;
      },
      {
        lektura: { correctedText: "", changes: [] as ReversibleChange[] },
        korektura: { correctedText: "", changes: [] as ReversibleChange[] },
        kombinacija: { correctedText: "", changes: [] as ReversibleChange[] },
      }
    );

    return acc;
  },
  {
    akademski: {
      lektura: { correctedText: "", changes: [] as ReversibleChange[] },
      korektura: { correctedText: "", changes: [] as ReversibleChange[] },
      kombinacija: { correctedText: "", changes: [] as ReversibleChange[] },
    },
    clanak: {
      lektura: { correctedText: "", changes: [] as ReversibleChange[] },
      korektura: { correctedText: "", changes: [] as ReversibleChange[] },
      kombinacija: { correctedText: "", changes: [] as ReversibleChange[] },
    },
  }
);
