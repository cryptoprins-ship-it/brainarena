"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";

// Privacy page — translated for the 5 native-quality locales (en, nl, de,
// fr, es) plus pt-BR. hi/ja are gated behind "Coming soon" in the language
// switcher, so visitors should never land on this page in those locales;
// if they do, they get the English fallback. We keep this page text-only
// (no per-locale dynamic content beyond the strings) so AdSense crawlers
// can verify the AdSense + cookie disclosure in every language we serve.

type LocaleKey = "en" | "nl" | "de" | "fr" | "es" | "pt-BR";

type Strings = {
  h1: string;
  updated: string;
  summary_h: string;
  summary: string;
  device_h: string;
  device_intro: string;
  device_li: string[];
  device_clear: string;
  scores_h: string;
  scores_intro: string;
  scores_li: string[];
  scores_no: string;
  logs_h: string;
  logs: string;
  ads_h: string;
  ads: string;
  ads_optout: string;
  cookies_h: string;
  cookies: string;
  cookieSettingsLink: string;
  // Plausible block — EN only for now; other locales fall back to EN
  // for this single section if/until proper translations land.
  plausible_h?: string;
  plausible?: string;
  children_h: string;
  children: string;
  rights_h: string;
  rights: string;
  contact_h: string;
  contact: string;
  contactPageLink: string;
};

const COPY: Record<LocaleKey, Strings> = {
  en: {
    h1: "Privacy Policy",
    updated: "Last updated: April 2026",
    summary_h: "Summary",
    summary:
      "BrainArena is a free puzzle and word-game site. We try to collect as little personal data as possible. Your game progress and streaks live on your own device. The only data that leaves your browser is the score you submit to the global leaderboard, plus standard server logs and (if you opt in) advertising cookies.",
    device_h: "Data stored on your device",
    device_intro:
      "The following lives in your browser's localStorage and is never sent to us:",
    device_li: [
      "Your selected language and preferred name.",
      "Daily streak, total games played, time played, and play history (used by /achievements).",
      "Per-game records (best Wordle guesses, top TileDrop score, etc.).",
      "A daily player-count seed (cosmetic).",
    ],
    device_clear: "You can clear it any time from your browser's site-data settings.",
    scores_h: "Leaderboard submissions",
    scores_intro:
      "When you finish a game and tap Submit, the following is sent to our server and saved alongside other players' entries:",
    scores_li: [
      "The display name you typed (24-character limit, anything goes — use a nickname).",
      "Your score, time, and game-specific metadata (e.g. difficulty, accuracy).",
      "The selected language and, if your browser provides it, a 2-letter country code.",
      "The submission timestamp.",
    ],
    scores_no:
      "We never collect your email, phone, address or any government identifier with these submissions. To request removal of an entry, see Contact below.",
    logs_h: "Server logs",
    logs:
      "Our hosting provider records standard request logs (IP address, user agent, requested path, timestamp) for security and abuse-prevention. These are retained for a short period and not combined with any personal profile.",
    ads_h: "Advertising — Google AdSense",
    ads:
      "This website uses Google AdSense, an advertising service from Google. Google uses cookies and web beacons to deliver advertisements based on prior visits to this website or other websites. Google's use of advertising cookies enables it to serve advertisements tailored to the user.",
    ads_optout:
      "You can opt out of personalised advertising via Google Ads Settings (https://adssettings.google.com). You can also revoke or change your consent at any time using the Cookie settings link in the footer.",
    cookies_h: "Cookies and consent",
    cookies:
      "We use a single first-party storage area (browser localStorage), not cookies, for game state. Third-party advertising cookies are set by Google AdSense ONLY after you opt in via the cookie banner. Reject the banner and no advertising scripts load — the site continues to work, just without ads.",
    cookieSettingsLink: "Re-open cookie settings",
    plausible_h: "Analytics — Plausible",
    plausible:
      "We use Plausible Analytics to count anonymous page views. Plausible does not set cookies, does not track you across sites, does not collect personal data, and anonymises IP addresses before they are stored. Because no personal data is processed, no consent is required under GDPR/ePrivacy. You can read Plausible's data policy at plausible.io/data-policy.",
    children_h: "Children",
    children:
      "BrainArena is suitable for all ages, but we don't knowingly collect personal data from children under 13. If you believe a child has submitted personal information, contact us and we'll delete it.",
    rights_h: "Your rights",
    rights:
      "You can erase all on-device data by clearing site data in your browser. For leaderboard removal or any data-protection question (access, deletion, correction), email us at the address below.",
    contact_h: "Contact",
    contact: "For privacy questions: privacy@brainarena.fun — or visit the",
    contactPageLink: "contact page",
  },
  nl: {
    h1: "Privacybeleid",
    updated: "Laatst bijgewerkt: april 2026",
    summary_h: "Samenvatting",
    summary:
      "BrainArena is een gratis puzzel- en woordspellensite. We verzamelen zo min mogelijk persoonsgegevens. Je voortgang en streaks staan op je eigen apparaat. Het enige dat je browser verlaat is de score die je naar het wereldwijde leaderboard stuurt, plus standaard serverlogs en (als je daar voor kiest) advertentie-cookies.",
    device_h: "Gegevens op jouw apparaat",
    device_intro:
      "Het volgende staat in localStorage van je browser en wordt nooit naar ons gestuurd:",
    device_li: [
      "Je gekozen taal en voorkeursnaam.",
      "Dagelijkse streak, aantal gespeelde games, speeltijd en geschiedenis (gebruikt door /achievements).",
      "Per-game records (beste Wordle-pogingen, top TileDrop score, etc.).",
      "Een dagelijkse spelersaantal-seed (cosmetisch).",
    ],
    device_clear: "Je kunt dit altijd wissen via de sitegegevens-instellingen van je browser.",
    scores_h: "Leaderboard-inzendingen",
    scores_intro:
      "Wanneer je een spel voltooit en op Verzenden tikt, wordt het volgende naar onze server gestuurd en bewaard naast die van andere spelers:",
    scores_li: [
      "De weergavenaam die je hebt getypt (max 24 tekens — gebruik een nickname).",
      "Je score, tijd en spel-specifieke metadata (bv. moeilijkheidsgraad, nauwkeurigheid).",
      "De gekozen taal en, als je browser dat geeft, een 2-letter landcode.",
      "Het tijdstip van inzending.",
    ],
    scores_no:
      "We verzamelen nooit je e-mail, telefoon, adres of overheids-ID bij deze inzendingen. Voor het verwijderen van een entry, zie Contact hieronder.",
    logs_h: "Serverlogs",
    logs:
      "Onze hostingprovider houdt standaard request-logs bij (IP-adres, user agent, opgevraagd pad, tijdstip) voor beveiliging en misbruikpreventie. Deze worden kort bewaard en niet gecombineerd met enig persoonsprofiel.",
    ads_h: "Advertenties — Google AdSense",
    ads:
      "Deze website gebruikt Google AdSense, een advertentiedienst van Google. Google gebruikt cookies en webbeacons om advertenties te leveren op basis van eerdere bezoeken aan deze of andere websites. Het gebruik van advertentiecookies door Google maakt het mogelijk om advertenties te tonen die zijn afgestemd op de gebruiker.",
    ads_optout:
      "Je kunt je afmelden voor gepersonaliseerde advertenties via Google Advertentie-instellingen (https://adssettings.google.com). Je kunt je toestemming ook intrekken of wijzigen via de Cookie-instellingen-link in de footer.",
    cookies_h: "Cookies en toestemming",
    cookies:
      "We gebruiken één first-party opslagplek (localStorage), geen cookies, voor de spelstatus. Third-party advertentie-cookies worden ALLEEN gezet door Google AdSense nadat je toestemming hebt gegeven via de cookie-banner. Wijs je de banner af, dan worden er geen advertentie- of analytics-scripts geladen — de site blijft werken, alleen zonder ads.",
    cookieSettingsLink: "Cookie-instellingen opnieuw openen",
    children_h: "Kinderen",
    children:
      "BrainArena is geschikt voor alle leeftijden, maar we verzamelen niet willens en wetens persoonsgegevens van kinderen onder 13. Als je denkt dat een kind persoonlijke gegevens heeft ingestuurd, neem contact op en we verwijderen het.",
    rights_h: "Jouw rechten",
    rights:
      "Je kunt alle on-device data wissen door de site-data te verwijderen in je browser. Voor leaderboard-verwijdering of een data-beschermingsvraag (inzage, verwijdering, correctie): mail ons op het adres hieronder.",
    contact_h: "Contact",
    contact: "Voor privacyvragen: privacy@brainarena.fun — of bezoek de",
    contactPageLink: "contactpagina",
  },
  de: {
    h1: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: April 2026",
    summary_h: "Zusammenfassung",
    summary:
      "BrainArena ist eine kostenlose Rätsel- und Wortspielseite. Wir erheben so wenig personenbezogene Daten wie möglich. Dein Spielfortschritt und deine Serien liegen auf deinem eigenen Gerät. Das Einzige, was dein Browser verlässt, sind die Scores, die du an das globale Leaderboard schickst, sowie Standard-Serverlogs und (sofern du zustimmst) Werbecookies.",
    device_h: "Daten auf deinem Gerät",
    device_intro:
      "Das Folgende liegt im localStorage deines Browsers und wird nie an uns gesendet:",
    device_li: [
      "Deine gewählte Sprache und dein Wunschname.",
      "Tagesserie, gespielte Spiele insgesamt, Spielzeit und Verlauf (verwendet von /achievements).",
      "Spielspezifische Rekorde (beste Wordle-Versuche, höchster TileDrop-Score usw.).",
      "Ein täglicher Spielerzählwert-Seed (kosmetisch).",
    ],
    device_clear: "Du kannst alles jederzeit über die Site-Daten-Einstellungen deines Browsers löschen.",
    scores_h: "Leaderboard-Einträge",
    scores_intro:
      "Wenn du ein Spiel abschließt und auf Senden tippst, wird Folgendes an unseren Server geschickt und neben den Einträgen anderer Spieler gespeichert:",
    scores_li: [
      "Der Anzeigename, den du eingegeben hast (max. 24 Zeichen — nutze einen Spitznamen).",
      "Dein Score, deine Zeit und spielspezifische Metadaten (z. B. Schwierigkeit, Genauigkeit).",
      "Die gewählte Sprache und, sofern dein Browser das liefert, ein 2-Buchstaben-Ländercode.",
      "Der Zeitstempel der Übermittlung.",
    ],
    scores_no:
      "Wir erheben mit diesen Einträgen niemals deine E-Mail, Telefonnummer, Adresse oder einen behördlichen Identifikator. Um einen Eintrag entfernen zu lassen, siehe unten Kontakt.",
    logs_h: "Serverlogs",
    logs:
      "Unser Hosting-Provider erfasst Standard-Request-Logs (IP-Adresse, User-Agent, angeforderter Pfad, Zeitstempel) zur Sicherheit und Missbrauchsabwehr. Diese werden kurz aufbewahrt und nicht mit einem persönlichen Profil verknüpft.",
    ads_h: "Werbung — Google AdSense",
    ads:
      "Diese Website verwendet Google AdSense, einen Werbedienst von Google. Google nutzt Cookies und Web-Beacons, um Anzeigen basierend auf früheren Besuchen dieser oder anderer Websites auszuliefern. Die Nutzung von Werbecookies durch Google ermöglicht personalisierte Anzeigen.",
    ads_optout:
      "Du kannst personalisierte Werbung über die Google-Anzeigeneinstellungen (https://adssettings.google.com) deaktivieren. Du kannst deine Einwilligung jederzeit über den Link \"Cookie-Einstellungen\" im Footer widerrufen oder ändern.",
    cookies_h: "Cookies und Einwilligung",
    cookies:
      "Für den Spielstatus verwenden wir einen First-Party-Speicher (localStorage), keine Cookies. Werbecookies von Drittanbietern werden ausschließlich von Google AdSense gesetzt, NACHDEM du im Cookie-Banner zugestimmt hast. Lehnst du den Banner ab, werden weder Werbe- noch Analyse-Skripte geladen — die Seite funktioniert weiterhin, nur ohne Anzeigen.",
    cookieSettingsLink: "Cookie-Einstellungen erneut öffnen",
    children_h: "Kinder",
    children:
      "BrainArena ist für alle Altersgruppen geeignet, aber wir erheben wissentlich keine personenbezogenen Daten von Kindern unter 13 Jahren. Wenn du glaubst, dass ein Kind persönliche Daten übermittelt hat, kontaktiere uns — wir löschen sie.",
    rights_h: "Deine Rechte",
    rights:
      "Du kannst alle gerätegebundenen Daten löschen, indem du die Site-Daten im Browser löschst. Für Leaderboard-Löschung oder Datenschutzfragen (Auskunft, Löschung, Berichtigung) schreib uns an die unten genannte Adresse.",
    contact_h: "Kontakt",
    contact: "Für Datenschutzfragen: privacy@brainarena.fun — oder besuche die",
    contactPageLink: "Kontaktseite",
  },
  fr: {
    h1: "Politique de confidentialité",
    updated: "Dernière mise à jour : avril 2026",
    summary_h: "Résumé",
    summary:
      "BrainArena est un site gratuit de puzzles et jeux de mots. Nous collectons le moins de données personnelles possible. Ta progression et tes séries restent sur ton appareil. La seule donnée qui quitte ton navigateur est le score que tu envoies au classement mondial, plus les journaux standards du serveur et (si tu acceptes) les cookies publicitaires.",
    device_h: "Données stockées sur ton appareil",
    device_intro:
      "Ce qui suit vit dans le localStorage de ton navigateur et n'est jamais envoyé chez nous :",
    device_li: [
      "Ta langue choisie et ton pseudo préféré.",
      "Série quotidienne, parties jouées, temps de jeu et historique (utilisés par /achievements).",
      "Records par jeu (meilleur Wordle, top TileDrop, etc.).",
      "Une graine de comptage quotidien (cosmétique).",
    ],
    device_clear: "Tu peux tout effacer via les paramètres de données de site de ton navigateur.",
    scores_h: "Soumissions au classement",
    scores_intro:
      "Quand tu termines une partie et tapotes Envoyer, ce qui suit est envoyé à notre serveur et sauvegardé à côté des entrées des autres joueurs :",
    scores_li: [
      "Le pseudo que tu as saisi (24 caractères max — utilise un surnom).",
      "Ton score, ton temps et les métadonnées du jeu (ex. difficulté, précision).",
      "La langue sélectionnée et, si ton navigateur le fournit, un code pays à 2 lettres.",
      "L'horodatage de la soumission.",
    ],
    scores_no:
      "Nous ne collectons jamais ton e-mail, ton téléphone, ton adresse ni aucun identifiant officiel avec ces soumissions. Pour faire retirer une entrée, voir Contact ci-dessous.",
    logs_h: "Journaux serveur",
    logs:
      "Notre hébergeur enregistre des journaux de requêtes standards (IP, user agent, chemin demandé, horodatage) pour la sécurité et la prévention des abus. Ils sont conservés brièvement et non combinés à un profil personnel.",
    ads_h: "Publicité — Google AdSense",
    ads:
      "Ce site utilise Google AdSense, un service publicitaire de Google. Google utilise des cookies et des balises web pour diffuser des annonces basées sur les visites précédentes sur ce site ou d'autres. L'usage des cookies publicitaires par Google permet de proposer des annonces adaptées à l'utilisateur.",
    ads_optout:
      "Tu peux te désinscrire des publicités personnalisées via les paramètres publicitaires de Google (https://adssettings.google.com). Tu peux aussi révoquer ou modifier ton consentement à tout moment via le lien Paramètres des cookies en pied de page.",
    cookies_h: "Cookies et consentement",
    cookies:
      "Pour l'état du jeu nous utilisons un stockage first-party (localStorage), pas de cookies. Les cookies publicitaires tiers sont posés UNIQUEMENT par Google AdSense après ton accord via la bannière. Si tu refuses, aucun script publicitaire ou d'analyse n'est chargé — le site continue de fonctionner, simplement sans annonces.",
    cookieSettingsLink: "Rouvrir les paramètres des cookies",
    children_h: "Enfants",
    children:
      "BrainArena convient à tous les âges, mais nous ne collectons pas sciemment de données personnelles d'enfants de moins de 13 ans. Si tu penses qu'un enfant a soumis des informations personnelles, contacte-nous et nous les supprimerons.",
    rights_h: "Tes droits",
    rights:
      "Tu peux effacer toutes les données locales en supprimant les données de site dans ton navigateur. Pour le retrait du classement ou toute question de protection des données (accès, suppression, rectification), écris-nous à l'adresse ci-dessous.",
    contact_h: "Contact",
    contact: "Pour les questions de confidentialité : privacy@brainarena.fun — ou visite la",
    contactPageLink: "page contact",
  },
  es: {
    h1: "Política de privacidad",
    updated: "Última actualización: abril de 2026",
    summary_h: "Resumen",
    summary:
      "BrainArena es un sitio gratuito de puzzles y juegos de palabras. Intentamos recopilar el mínimo de datos personales. Tu progreso y rachas viven en tu propio dispositivo. Lo único que sale de tu navegador es la puntuación que envías al ranking global, más los registros estándar del servidor y (si aceptas) las cookies publicitarias.",
    device_h: "Datos almacenados en tu dispositivo",
    device_intro:
      "Lo siguiente vive en el localStorage de tu navegador y nunca se envía a nosotros:",
    device_li: [
      "Tu idioma elegido y tu nombre preferido.",
      "Racha diaria, partidas jugadas, tiempo de juego e historial (usado por /achievements).",
      "Récords por juego (mejor Wordle, top TileDrop, etc.).",
      "Una semilla diaria de conteo de jugadores (cosmética).",
    ],
    device_clear: "Puedes borrarlo en cualquier momento desde la configuración de datos de sitio de tu navegador.",
    scores_h: "Envíos al ranking",
    scores_intro:
      "Cuando terminas una partida y tocas Enviar, lo siguiente se envía a nuestro servidor y se guarda junto a las entradas de otros jugadores:",
    scores_li: [
      "El nombre de pantalla que escribiste (máx. 24 caracteres — usa un apodo).",
      "Tu puntuación, tiempo y metadatos del juego (p. ej. dificultad, precisión).",
      "El idioma seleccionado y, si tu navegador lo da, un código de país de 2 letras.",
      "La marca de tiempo del envío.",
    ],
    scores_no:
      "Nunca recopilamos tu email, teléfono, dirección ni ningún identificador oficial en estos envíos. Para solicitar la eliminación de una entrada, ver Contacto abajo.",
    logs_h: "Registros del servidor",
    logs:
      "Nuestro proveedor de hosting registra logs estándar de solicitudes (IP, user agent, ruta solicitada, marca de tiempo) para seguridad y prevención de abuso. Se conservan poco tiempo y no se combinan con ningún perfil personal.",
    ads_h: "Publicidad — Google AdSense",
    ads:
      "Este sitio web usa Google AdSense, un servicio publicitario de Google. Google usa cookies y balizas web para mostrar anuncios basados en visitas previas a este u otros sitios. El uso de cookies publicitarias de Google permite mostrar anuncios adaptados al usuario.",
    ads_optout:
      "Puedes darte de baja de la publicidad personalizada en los Ajustes de anuncios de Google (https://adssettings.google.com). También puedes revocar o cambiar tu consentimiento en cualquier momento desde el enlace Ajustes de cookies en el pie de página.",
    cookies_h: "Cookies y consentimiento",
    cookies:
      "Para el estado del juego usamos un almacenamiento de origen propio (localStorage), no cookies. Las cookies publicitarias de terceros las pone Google AdSense SOLO después de tu consentimiento en el banner. Si lo rechazas, no se carga ningún script publicitario ni de analítica — el sitio sigue funcionando, simplemente sin anuncios.",
    cookieSettingsLink: "Volver a abrir los ajustes de cookies",
    children_h: "Niños",
    children:
      "BrainArena es apto para todas las edades, pero no recopilamos a sabiendas datos personales de menores de 13 años. Si crees que un niño ha enviado información personal, contáctanos y la eliminaremos.",
    rights_h: "Tus derechos",
    rights:
      "Puedes borrar todos los datos del dispositivo limpiando los datos de sitio en tu navegador. Para eliminar entradas del ranking o cualquier pregunta de protección de datos (acceso, supresión, rectificación), escríbenos al correo de abajo.",
    contact_h: "Contacto",
    contact: "Para temas de privacidad: privacy@brainarena.fun — o visita la",
    contactPageLink: "página de contacto",
  },
  "pt-BR": {
    h1: "Política de privacidade",
    updated: "Última atualização: abril de 2026",
    summary_h: "Resumo",
    summary:
      "BrainArena é um site grátis de quebra-cabeças e jogos de palavras. Coletamos o mínimo possível de dados pessoais. Seu progresso e sequências ficam no seu próprio dispositivo. A única coisa que sai do seu navegador é a pontuação que você envia ao ranking global, além dos logs padrão do servidor e (se você consentir) cookies publicitários.",
    device_h: "Dados armazenados no seu dispositivo",
    device_intro:
      "O seguinte fica no localStorage do seu navegador e nunca é enviado para nós:",
    device_li: [
      "Seu idioma escolhido e nome preferido.",
      "Sequência diária, partidas jogadas, tempo de jogo e histórico (usado por /achievements).",
      "Recordes por jogo (melhor Wordle, top TileDrop etc.).",
      "Uma semente diária de contagem de jogadores (cosmética).",
    ],
    device_clear: "Você pode apagar tudo a qualquer momento nas configurações de dados do site do seu navegador.",
    scores_h: "Envios ao ranking",
    scores_intro:
      "Quando você termina uma partida e toca em Enviar, o seguinte é enviado ao nosso servidor e salvo ao lado das entradas de outros jogadores:",
    scores_li: [
      "O nome de exibição que você digitou (máx. 24 caracteres — use um apelido).",
      "Sua pontuação, tempo e metadados específicos do jogo (ex.: dificuldade, precisão).",
      "O idioma selecionado e, se o navegador fornecer, um código de país de 2 letras.",
      "O timestamp do envio.",
    ],
    scores_no:
      "Nunca coletamos seu e-mail, telefone, endereço ou qualquer identificador oficial nestes envios. Para solicitar a remoção de uma entrada, veja Contato abaixo.",
    logs_h: "Logs do servidor",
    logs:
      "Nosso provedor de hospedagem registra logs padrão de requisições (IP, user agent, caminho solicitado, timestamp) para segurança e prevenção de abuso. São retidos por pouco tempo e não combinados com qualquer perfil pessoal.",
    ads_h: "Publicidade — Google AdSense",
    ads:
      "Este site usa o Google AdSense, um serviço de publicidade do Google. O Google usa cookies e web beacons para entregar anúncios com base em visitas anteriores a este ou outros sites. O uso de cookies publicitários pelo Google permite exibir anúncios adaptados ao usuário.",
    ads_optout:
      "Você pode optar por sair de anúncios personalizados pelas Configurações de anúncios do Google (https://adssettings.google.com). Você também pode revogar ou alterar seu consentimento a qualquer momento usando o link Configurações de cookies no rodapé.",
    cookies_h: "Cookies e consentimento",
    cookies:
      "Para o estado do jogo usamos um armazenamento próprio (localStorage), não cookies. Cookies publicitários de terceiros são definidos pelo Google AdSense SOMENTE após o seu consentimento via banner de cookies. Se você recusar, nenhum script de publicidade ou analítica é carregado — o site continua funcionando, apenas sem anúncios.",
    cookieSettingsLink: "Reabrir configurações de cookies",
    children_h: "Crianças",
    children:
      "BrainArena é adequado para todas as idades, mas não coletamos conscientemente dados pessoais de crianças menores de 13 anos. Se você acha que uma criança enviou informações pessoais, entre em contato e nós as removeremos.",
    rights_h: "Seus direitos",
    rights:
      "Você pode apagar todos os dados do dispositivo limpando os dados do site no navegador. Para remoção do ranking ou qualquer questão de proteção de dados (acesso, exclusão, retificação), envie e-mail para o endereço abaixo.",
    contact_h: "Contato",
    contact: "Para questões de privacidade: privacy@brainarena.fun — ou visite a",
    contactPageLink: "página de contato",
  },
};

function pickCopy(locale: string): Strings {
  if (locale in COPY) return COPY[locale as LocaleKey];
  return COPY.en;
}

function openCookieSettings() {
  if (typeof window !== "undefined") window.brainarenaOpenConsent?.();
}

export default function PrivacyPage() {
  const { locale } = useLocale();
  const t = pickCopy(locale);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black md:text-4xl">{t.h1}</h1>
      <p className="mt-2 text-sm text-gray-400">{t.updated}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-300">
        <Section title={t.summary_h}>{t.summary}</Section>

        <Section title={t.device_h}>
          {t.device_intro}
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {t.device_li.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-2">{t.device_clear}</p>
        </Section>

        <Section title={t.scores_h}>
          {t.scores_intro}
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {t.scores_li.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-2">{t.scores_no}</p>
        </Section>

        <Section title={t.logs_h}>{t.logs}</Section>

        <Section title={t.ads_h}>
          <p>{t.ads}</p>
          <p className="mt-2">{t.ads_optout}</p>
        </Section>

        <Section title={t.cookies_h}>
          <p>{t.cookies}</p>
          <button
            type="button"
            onClick={openCookieSettings}
            className="mt-3 inline-block rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-1.5 text-xs hover:border-indigo-400/40"
          >
            {t.cookieSettingsLink}
          </button>
        </Section>

        <Section title={t.plausible_h ?? COPY.en.plausible_h ?? "Analytics — Plausible"}>
          {t.plausible ?? COPY.en.plausible}
        </Section>

        <Section title={t.children_h}>{t.children}</Section>
        <Section title={t.rights_h}>{t.rights}</Section>

        <Section title={t.contact_h} id="contact">
          {t.contact}{" "}
          <a href="mailto:privacy@brainarena.fun" className="underline hover:text-indigo-300">
            privacy@brainarena.fun
          </a>{" "}
          —{" "}
          <Link href="/contact" className="underline hover:text-indigo-300">
            {t.contactPageLink}
          </Link>
          .
        </Section>
      </div>

      <p className="mt-10 text-xs text-gray-600">BrainArena · brainarena.fun</p>
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
