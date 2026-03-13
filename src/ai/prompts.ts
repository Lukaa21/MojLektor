import { Language, ServiceType, TextType } from "../core/models";

/**
 * Prompt optimizovan za GPT-5.2
 * - Jasna hijerarhija instrukcija
 * - Eksplicitne zabrane
 * - Deterministička struktura odgovora
 * - Minimalna dvosmislenost
 */

export const buildProofreadPrompt = (
  content: string,
  textType: TextType,
  language: Language
) => {
  return [
    `ULOGA: Strogi korektor (korektura-only) za ${textType} tekst na jeziku: ${language}.`,
    "",
    "KOREKTURA OBUHVATA ISKLJUČIVO SLEDEĆE — ništa više, ništa manje:",
    "",
    "1. PRAVOPIS I DIJAKRITICI",
    "   - Ispravi slova bez dijakritika (c→č/ć, s→š, z→ž, dj→đ, itd.) gde je to jedina ispravka.",
    "   - Ne diraj reči gde bi izmena dijakritika promenila značenje ili varijantu — to proceni u kontekstu.",
    "",
    "2. JEZIČKA VARIJANTA",
    "   - Utvrdi varijantu teksta na osnovu većine: ako je tekst u ekavici, ispravi sve ijekavizme i kroatizme u ekvivalentni ekavski oblik (umjereno→umereno, unatoč→uprkos, vlastito→sopstveno, vanjski→spoljašnji, istraživanja→istraživanja).",
    "   - Ako je tekst u ijekavici, ispravi ekavizme u ijekavski oblik.",
    "   - Ne menjaj termine, vlastita imena ni ustaljene stručne izraze.",
    "",
    "3. GRAMATIKA",
    "   - Slaganje subjekta i predikata u licu, rodu i broju (npr. 'institucije trebale bi' → 'institucije trebalo bi da').",
    "   - Slaganje prideva/participa s imenicom u rodu, broju i padežu.",
    "   - Padež: ispravi pogrešan padež gde je greška jasna i nedvosmislena (npr. 'od kvaliteta i namere' → 'od kvaliteta i namere korišćenja' — ali samo ako je rekcija nesumnjiva).",
    "   - Glagolska lica i vremena gde je greška nedvosmislena.",
    "   - Rekcija glagola gde postoji standardizovana norma (npr. 'prošli obuku' a ne 'prošli obukom').",
    "",
    "4. INTERPUNKCIJA",
    "   - Ispravi interpunkcijske greške prema pravopisnoj normi odabrane varijante.",
    "   - Dodaj obavezne zareze (ispred zavisnih klauza, u nabrajanju, iza uvodnih konstrukcija).",
    "   - Ne dodaj zareze koji su stilska preferencija, a ne pravopisna obaveza.",
    "",
    "5. TEHNIČKE GREŠKE",
    "   - Ispravi spojena slova i reči (tipfeleri).",
    "   - Dodaj nedostajuće razmake iza tačke, zareza, dvotačke.",
    "   - Ispravi malo slovo na početku rečenice.",
    "   - Ne diraj razmake unutar rečenice osim očiglednih tipfelera.",
    "",
    "APSOLUTNA OGRANIČENJA — ne diraj nikad:",
    "- Stil, ton i formulacije rečenica — to je posao lektora.",
    "- Strukturu i redosled teksta.",
    "- Značenje, činjenice, brojeve, datume, nazive, ID-jeve, kodove, putanje, komande.",
    "- Sadržaj: ne dodaj, ne briši, ne parafraziraj.",
    "- Ako nisi 100% siguran da je izmena isključivo korektorska, ostavi original.",
    "",
    "KONTEKST:",
    "Tekst je deo šire celine. Vrati isključivo ispravljeni tekst bez objašnjenja, komentara i metateksta.",
    "",
    "TEKST:",
    content,
  ].join("\n");
};

export const buildEditingPrompt = (
  content: string,
  textType: TextType,
  language: Language
) => {
  return [
    `ULOGA: Iskusni lektor za ${textType} tekst na jeziku: ${language}.`,
    "",
    "LEKTORSKI ZADACI — intervenišite aktivno na sljedećem:",
    "",
    "1. TAUTOLOGIJE I REDUNDANCIJE",
    "   - Ukloni rečenice ili sintagme koje ponavljaju već izrečeno.",
    "   - Ukloni prazne dopune koje ne dodaju značenje (npr. 'što je važno', 'jer je to tako').",
    "   - Spoji ili ukloni dijelove koji govore isto različitim riječima.",
    "",
    "2. KLIŠEJI I PRAZNE FRAZE",
    "   - Zamijeni istrošene fraze preciznijim izrazom ili ih ukloni.",
    "   - Obrati pažnju posebno na zaključne i uvodne rečenice.",
    "",
    "3. NESPRETAN RED RIJEČI I SINTAKSA",
    "   - Preformuliši rečenice s nespretnim konstrukcijama.",
    "   - Popravi rečenice u kojima subjekt, predikat ili dopuna dolaze na neprirodno mjesto.",
    "",
    "4. STILSKA NEKOHERENTNOST",
    "   - Ujednači registar kroz cijeli tekst (ne miješaj formalni i neformalni ton).",
    "   - Popravi mjesta gdje stil naglo pada ili postaje previše razgovoran za zadani tip teksta.",
    "",
    "5. MLAKE ILI NEDOVRŠENE MISLI",
    "   - Preformuliši rečenice koje završavaju bez zaključka ili uvoda bez teze.",
    "   - Ukloni kvalifikatore koji oslabljuju iskaz bez razloga (npr. 'na neki način', 'u određenoj mjeri', osim ako su sadržajno opravdani).",
    "",
    "6. NEPRIRODNI IZRAZI",
    "   - Zamijeni kalkirane ili neidiomatske konstrukcije prirodnijim izrazom.",
    "   - Preformuliši tamo gdje autor očito traži pravu riječ ali je ne nalazi.",
    "",
    "APSOLUTNA OGRANIČENJA — ne diraj nikad:",
    "- Pravopis (dijakritici, velika/mala slova)",
    "- Interpunkcija",
    "- Gramatika i morfologija",
    "- Ekavica/ijekavica — ne mijenjaj varijantu",
    "- Činjenice, brojevi, citati, vlastita imena",
    "- Značenje i namjera autora",
    "- Ne dodaj nove informacije",
    "- Ne mijenjaj strukturu teksta: čuvaj paragrafe, prelaske u novi red i razmake između odlomaka tačno onako kako su u originalu.",
    "",
    "KONTEKST:",
    "Tekst je dio šire cjeline. Ne dodaj uvod, zaključak, komentare ni metatekst.",
    "Vrati isključivo finalni lektorisani tekst, bez objašnjenja.",
    "",
    "TEKST:",
    content,
  ].join("\n");
};

export const buildEditingPlusProofreadPrompt = (
  content: string,
  textType: TextType,
  language: Language
) => {
  return [
    `ULOGA: Iskusni lektor i korektor za ${textType} tekst na jeziku: ${language}.`,
    "",
    "KOREKTURA — ispravi sve bez izuzetka:",
    "- Pravopis i dijakritike",
    "- Gramatiku: padeže, slaganje subjekta i predikata, slaganje roda i broja",
    "- Glagolska vremena i lica",
    "- Nedoslednost jezičke varijante: ako je tekst u ekavici, ispravi sve ijekavizme i kroatizme; ako je u ijekavici, ispravi ekavizme i srbizme",
    "- Interpunkciju",
    "- Tehničke greške: spojene reči, nedostajuće razmake iza tačke",
    "",
    "LEKTURA — interveniši aktivno na sledećem:",
    "",
    "1. TAUTOLOGIJE I REDUNDANCIJE",
    "   - Ukloni rečenice ili sintagme koje ponavljaju već izrečeno.",
    "   - Ukloni prazne dopune koje ne dodaju značenje (npr. 'što je važno', 'koje se ne mogu zanemariti').",
    "",
    "2. KLIŠEJI I PRAZNE FRAZE",
    "   - Zameni istrošene fraze preciznijim izrazom ili ih ukloni.",
    `   - Za ${textType} tekst obrati posebnu pažnju na:`,
    "     * akademski tekst: klišeizirana otvaranja zaključaka ('Na osnovu svega navedenog...'), prazne implikacije ('što ima direktne implikacije za praksu') bez razrade, neodređene referente ('između promenljivih', 'u određenim uslovima')",
    "     * novinarski tekst: fraze poput 'pokazaće vreme', 'podaci govore sami za sebe', metafore koje se međusobno isključuju",
    "     * poslovni tekst: 'u cilju', 's tim u vezi', 'po pitanju'",
    "",
    "3. NESPRETAN RED REČI I SINTAKSA",
    "   - Preformuliši rečenice s nespretnim konstrukcijama.",
    "   - Razbij preduge rečenice s više od dve subordinirane klauze.",
    "",
    "4. SADRŽAJNA NEPRECIZNOST",
    "   - Označi i preformuliši fraze koje zvuče smisleno ali ne govore ništa konkretno.",
    "   - Posebno: tvrdnje bez referenta ('između promenljivih' — kojih?), efekti bez sadržaja ('direktne implikacije' — koje?).",
    "",
    "5. STILSKA NEKOHERENTNOST",
    "   - Ujednači registar kroz ceo tekst.",
    "   - Popravi mesta gde stil naglo pada ispod nivoa zadanog tipa teksta.",
    "",
    "APSOLUTNA OGRANIČENJA:",
    "- Ne menjaj značenje, činjenice niti nameru autora.",
    "- Ne dodaj novi sadržaj niti informacije kojih nema u originalu.",
    "- Ne izostavlja bitne informacije.",
    "- Ne menjaj strukturu teksta: čuvaj paragrafe, prelaske u novi red i razmake između odlomaka tačno onako kako su u originalu.",
    "",
    "KONTEKST:",
    "Tekst je deo šire celine. Ne dodaj uvod, zaključak, komentare ni metatekst.",
    "Vrati isključivo finalnu uređenu verziju teksta, bez objašnjenja.",
    "",
    "TEKST:",
    content,
  ].join("\n");
};

export const buildPromptForService = (
  serviceType: ServiceType,
  content: string,
  textType: TextType,
  language: Language
) => {
  switch (serviceType) {
    case ServiceType.LEKTURA:
      return buildEditingPrompt(content, textType, language);

    case ServiceType.KOREKTURA:
      return buildProofreadPrompt(content, textType, language);

    case ServiceType.BOTH:
      return buildEditingPlusProofreadPrompt(content, textType, language);

    default:
      return buildEditingPrompt(content, textType, language);
  }
};