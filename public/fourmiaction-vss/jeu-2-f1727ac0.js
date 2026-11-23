/* Les Hautes Herbes — scénario. Fourmi'Action, « Prévenir les VSS et agir en ACM ». */
const CHAPTERS = [
  { n: 1, day: "Lundi", title: "L’arrivée", comp: "C1",
    goal: "Découvrir l’accueil et repérer ce qui, dans l’organisation, peut créer des inégalités ou des risques de violences.",
    plan: [["7 h 45", "Ouverture, l’équipe se retrouve"], ["8 h 30", "Arrivée des familles"], ["9 h 30", "Le tour de l’accueil avec Nour"], ["14 h", "Atelier radio"], ["17 h", "Départ des enfants"]] },
  { n: 2, day: "Mardi", title: "Les mots qui blessent", comp: "C2",
    goal: "Distinguer ce qui est observé, rapporté ou supposé, et nommer le sexisme et le harcèlement.",
    plan: [["8 h 30", "Briefing du matin"], ["12 h 15", "Déjeuner"], ["14 h", "Temps calme"], ["17 h 50", "Départ des familles"], ["18 h", "Point du soir en équipe"]] },
  { n: 3, day: "Mercredi", title: "La grosse journée", comp: "C2",
    goal: "Comprendre et expliquer le consentement, y compris face à l’autorité d’un adulte.",
    plan: [["8 h", "52 enfants attendus"], ["15 h", "Temps libre"], ["17 h 30", "Départ des familles"], ["20 h 30", "Nuitée (accueil avec hébergement)"]] },
  { n: 4, day: "Jeudi", title: "La parole d’un enfant", comp: "C3",
    goal: "Accueillir une révélation, protéger et alerter les bons relais à temps.",
    plan: [["8 h 30", "Arrivée des familles"], ["14 h", "Activités"], ["16 h", "Rangement et goûter"], ["17 h", "Départ des familles"]] },
  { n: 5, day: "Vendredi", title: "Ce qu’on change", comp: "C4",
    goal: "Concevoir une prévention concrète, puis tout mobiliser quand la direction freine.",
    plan: [["8 h 30", "Réunion d’équipe"], ["10 h", "Message des familles"], ["13 h", "Fin de l’atelier bois"], ["17 h", "Fin de la semaine"]] },
];

// Bilan de fin de journée : ce qu'il faut retenir (lu à voix haute)
const DAYEND = {
  1: { t: "17 h 15", vu: "Aujourd’hui, vous avez découvert l’accueil et repéré ce qui, dans l’organisation, peut créer des inégalités ou des risques de violences.", lead: "17 h 15. Les familles repartent les unes après les autres. Avant de partir, vous repensez à votre premier jour.",
    learn: ["L’organisation fait partie de la prévention : qui va où, avec qui, et à quel moment, surtout aux sanitaires.", "Les stéréotypes s’installent dans le jeu et dans la répartition des rôles : c’est à l’adulte de garantir à chacun le même accès.", "Repérer, c’est d’abord observer et noter des faits, sans juger."] },
  2: { t: "18 h 15", fam: false, vu: "Aujourd’hui, vous avez appris à distinguer ce que l’on voit, ce que l’on rapporte et ce que l’on suppose, et à nommer le sexisme et le harcèlement.", lead: "18 h 15. Le point du soir est terminé, les derniers enfants sont partis. Vous repensez à cette journée.",
    learn: ["Distinguez ce que vous avez vu, ce qu’on vous a rapporté et ce que vous supposez.", "Le sexisme et le harcèlement se nomment : une remarque qui se répète n’est pas une blague.", "Une parole recueillie se transmet à la direction, le jour même."] },
  3: { t: "17 h 40", vu: "Aujourd’hui, vous avez vu ce qu’est le consentement, y compris face à l’autorité d’un adulte.", lead: "17 h 40. La grosse journée se termine au portail. Vous repensez à ce que vous avez vu.",
    learn: ["Le consentement est libre et réversible : un enfant peut dire non, même à un adulte.", "Un adulte ne force jamais un contact, même affectueux : ni bisou, ni câlin imposés.", "Jamais seul avec un enfant, hors de la vue des autres."] },
  4: { t: "17 h 50", fam: false, vu: "Aujourd’hui, vous avez vu comment accueillir la parole d’un enfant, le protéger, et alerter les bons relais à temps.", lead: "17 h 50. Tous les enfants sont partis, la cour est vide. La journée a été lourde ; vous repensez à ce que Lou vous a confié.",
    learn: ["Quand un enfant se confie : l’écouter, le croire, ne pas l’interroger pour enquêter, et ne pas promettre de garder le secret.", "Protéger d’abord, puis alerter le jour même : la direction et, selon la situation, le 119 ou le procureur.", "Noter ses mots exacts, la date et l’heure, sans interprétation."] },
};

const COMPS = {
  C1: "Repérer des faits et distinguer ce qui est observé, rapporté ou supposé",
  C2: "Utiliser des repères sur le sexisme, le consentement et les violences",
  C3: "Choisir une réponse de protection et un relais adapté",
  C4: "Proposer une prévention concrète dans l’accueil",
};

const DQ = [
  { id: "D1", t: "Une plaisanterie devient acceptable dès que son auteur dit ne pas vouloir blesser.", truth: "Faux", why: "Une plaisanterie annoncée comme telle peut blesser et constituer un comportement interdit : c’est l’effet qui compte, pas l’intention affichée." },
  { id: "D2", t: "Plusieurs personnes peuvent contribuer à un harcèlement même si chacune n’intervient qu’une fois.", truth: "Vrai", why: "Oui, sous conditions : quand les propos sont imposés de manière concertée, ou par des personnes qui savent qu’ils caractérisent une répétition (Code pénal, art. 222-33)." },
  { id: "D3", t: "Le silence suffit pour conclure qu’une personne accepte un geste sexuel.", truth: "Faux", why: "Le consentement ne peut être déduit du seul silence ou de la seule absence de réaction (Code pénal, art. 222-22)." },
  { id: "D4", t: "On peut protéger et demander de l’aide sans savoir nommer exactement l’infraction.", truth: "Vrai", why: "On n’attend pas d’être certain du nom de l’infraction pour agir : la qualification appartient aux autorités compétentes." },
];

// Prélude (nouvelle partie) : des phrases entendues tous les jours, qui résonnent avant d’entrer aux Hautes Herbes.
// Elles paraissent anodines ; chacune touche aux violences sexistes et sexuelles (consentement, stéréotypes,
// minimisation, culpabilisation de la victime, silence, secret, doute). Voix : e_* (voir voix.mjs).
const ECHOES = {
  // consigne de l'accueil, en plein écran et à l'oral
  son: "Pour vivre une expérience ultime, activez le son de votre appareil. Voix, musique et ambiances font partie du jeu.",
  // Le narrateur se présente, puis annonce la semaine, juste avant les citations.
  intro: "Bonjour. Je serai votre narrateur pendant toute cette semaine : appelez-moi Bafaël. Cette semaine, à l’accueil de loisirs des Hautes Herbes, vous allez pouvoir proposer vos solutions face à certaines situations, inspirées de faits réels.",
  lines: [
    { who: "e_maman", label: "Une maman, au portail", t: "Allez, fais un bisou à tonton, ne fais pas ta timide." },
    { who: "e_papa", label: "Un papa", t: "Arrête de pleurer, t’es un garçon." },
    { who: "e_anim", label: "Un animateur", t: "Les filles, vous rangez. Les garçons, vous portez les tables." },
    { who: "e_fille", label: "Une petite fille, 7 ans", t: "Il… il m’a soulevé ma jupe… devant tout le monde…" },
    { who: "e_animatrice", label: "Une animatrice", t: "Ce n’est rien, c’est parce qu’il t’aime bien." },
    { who: "e_ado", label: "Un ado, 15 ans", t: "C’était pour rire. Elle sait pas rigoler." },
    { who: "e_maman", label: "Une voisine", t: "Habillée comme ça, faut pas s’étonner." },
    { who: "e_ado_f", label: "Une adolescente, 14 ans", t: "Il m’envoie des messages tous les soirs. J’ose pas en parler." },
    { who: "e_papa", label: "Un père", t: "Ce qui se passe à la maison, ça ne regarde personne." },
    { who: "e_garcon", label: "Un petit garçon, 8 ans", t: "Il m’a dit que… que c’était notre secret." },
    { who: "e_anim", label: "Un adulte", t: "Elle invente. Elle veut juste se rendre intéressante." },
  ],
  outro: "Ces phrases, on les entend tous les jours. Certaines blessent, d’autres font taire. Cette semaine, aux Hautes Herbes, vous allez apprendre à les entendre… et à agir.",
};
// Écran du rôle : phrase lue par le narrateur, puis le but du jeu expliqué simplement.
const ROLE = {
  voice: "Vous êtes recrutée comme animatrice volante pour une semaine de vacances à l’accueil de loisirs des Hautes Herbes. Sans groupe attitré, vous allez là où l’équipe a besoin de vous, avec une mission : être vigilante, et agir.",
  goalTitle: "Comment on joue",
  goal: [
    ["Laissez-vous guider", "Nour, la directrice, vous a recrutée et vous fait confiance. Des enfants, des parents et des collègues viennent vous voir. À chaque étape, le jeu vous dit où vous êtes, quelle heure il est et ce qui se passe."],
    ["Réagissez, comme sur le terrain", "Quand une situation se présente, choisissez ce que vous faites. Personne ne vous dit sur le moment si c’était juste : votre décision est enregistrée, et la semaine continue."],
    ["Relevez des petites missions", "Faire le tour de l’accueil, organiser le planning, trouver un enfant qui vous cherche, composer un numéro d’urgence, vérifier les départs au portail : chaque mission entraîne un réflexe concret."],
    ["Le retour du vendredi", "En fin de semaine, vous revenez sur chacune de vos décisions : vous voyez ce qu’elle a produit chez les enfants et l’équipe, puis ce que dit le cadre. Ensuite viennent votre bilan, votre score et votre place au classement."],
  ],
  goalVoice: "Comment on joue ? Laissez-vous guider : des personnages vont venir vous voir, et le jeu vous dit à chaque fois ce qui se passe. Réagissez comme sur le terrain : personne ne vous dit sur le moment si c’était juste. Le vendredi, vous revenez sur chaque décision, ce qu’elle a produit, et ce que dit le cadre.",
};
// Accords au masculin, quand on joue un animateur (le jeu est écrit au féminin) : seulement ce qui désigne le joueur.
// Ces règles servent aussi à préparer les voix au masculin (voix/extract.mjs).
const GENRE_M = [
  ["recrutée comme animatrice volante", "recruté comme animateur volant"], ["comme animatrice volante", "comme animateur volant"],
  ["notre animatrice volante", "notre animateur volant"], ["être vigilante", "être vigilant"], ["tu restes vigilante", "tu restes vigilant"],
  ["vous a recrutée", "vous a recruté"], ["tu t’es formée", "tu t’es formé"], ["tu gères seule", "tu gères seul"],
  ["vous êtes seule", "vous êtes seul"], ["vous laisse seule", "vous laisse seul"], ["Seule en salle des animateurs", "Seul en salle des animateurs"],
  ["Pas seule aux sanitaires", "Pas seul aux sanitaires"], ["assurer seule", "assurer seul"], ["en volante", "en animateur volant"],
  ["restez attentive", "restez attentif"], ["en restant concentrée", "en restant concentré"], ["vous êtes restée concentrée", "vous êtes resté concentré"],
  ["vous êtes prête", "vous êtes prêt"], ["faire l’animatrice ?", "faire l’animateur ?"], ["L’animatrice apprend elle-même", "L’animateur apprend lui-même"],
  ["Rester gentille", "Rester gentil"], ["L’animatrice a dit que c’était rien", "L’animateur a dit que c’était rien"],
];
const genreM = (t) => typeof t !== "string" ? t : GENRE_M.reduce((x, [a, b]) => x.split(a).join(b), t);
// Façon neutre (ni « il » ni « elle ») : des tournures épicènes, qui se disent aussi à voix haute (pas de point médian).
const GENRE_N = [
  ["Vous êtes recrutée comme animatrice volante", "Vous rejoignez l’équipe en renfort volant"], ["Tu nous rejoins comme animatrice volante", "Tu nous rejoins en renfort volant"],
  ["tu es notre animatrice volante", "tu es notre renfort volant"], ["être vigilante", "rester en alerte"], ["tu restes vigilante", "tu restes en alerte"],
  ["vous a recrutée et vous fait confiance", "vous a confié ce poste et vous fait confiance"], ["vous a recrutée", "vous a confié ce poste"],
  ["tu t’es formée", "tu as suivi une formation"], ["tu gères seule", "tu gères sans renfort"], ["vous êtes seule", "vous êtes sans collègue"],
  ["vous laisse seule", "vous laisse"], ["Seule en salle des animateurs", "Dans la salle des animateurs vide"], ["Pas seule aux sanitaires", "Jamais sans collègue aux sanitaires"],
  ["assurer seule", "assurer sans renfort"], ["en volante", "en renfort volant"], ["restez attentive à", "gardez un œil sur"], ["restez attentive", "restez à l’écoute"],
  ["en restant concentrée", "sans vous disperser"], ["vous êtes restée concentrée", "vous n’avez pas perdu le fil"], ["quand vous êtes prête", "quand vous voulez"],
  ["vous êtes prête", "c’est bon pour vous"], ["faire l’animatrice ?", "faire l’adulte ?"], ["L’animatrice apprend elle-même", "L’adulte apprend"],
  ["Rester gentille", "Rester à l’écoute"], ["L’animatrice a dit que c’était rien", "L’adulte a dit que c’était rien"],
];
const genreN = (t) => typeof t !== "string" ? t : GENRE_N.reduce((x, [a, b]) => x.split(a).join(b), t);
const SCREENS = [
  { id: "avatar", ch: 1, type: "avatar" },
  { id: "c1", ch: 1, type: "chapter" },
  { id: "intro", ch: 1, type: "story", scene: "welcome", kicker: "Lundi, 8 h 30",
    lines: [
      { who: null, live: "portail", t: "Au portail, les parents déposent leurs enfants, échangent un mot avec l’équipe et repartent travailler. Depuis les affaires du périscolaire qui secouent Paris cette année, beaucoup posent la même question : qui encadre mon enfant, et comment ?" },
      { who: "nour", mood: "big", t: "Bienvenue aux Hautes Herbes ! Moi, c’est Nour, la directrice. Tu nous rejoins comme animatrice volante pour la semaine des vacances. Quarante-huit enfants et jeunes de 6 à 17 ans sont inscrits, cinquante-deux mercredi." },
      { who: "nour", mood: "concern", t: "Je ne sais pas si tu as entendu, mais depuis janvier, à Paris, cent trente-deux animateurs du périscolaire ont été suspendus, dont une cinquantaine pour des soupçons de violences sexuelles ou sexistes. Les parents en parlent beaucoup, ici aussi. Et c’est pour ça que j’ai besoin de toi." },
      { who: "nour", mood: "calm", t: "L’équipe, je la connais à peu près, et ça devrait le faire, même si je sais qu’il y a encore des petites choses à améliorer. Moi, je n’ai pas le temps de tout gérer, et j’ai confiance en toi : j’ai lu ton CV : tu t’es formée aux VSS." },
      { who: "nour", mood: "smile", t: "Ce que j’attends de toi, donc : tu es notre animatrice volante pour la semaine des vacances. Tu circules partout, tu restes vigilante, et quand quelque chose te paraît anormal, tu agis et tu me le transmets." },
      { who: "nour", mood: "smile", t: "Il y a trois groupes : les 6-11 ans avec Jade, les 11-14 ans avec Inès et Yanis, les 14-17 ans avec Bastien et Kévin. Toi, tu n’as pas de groupe attitré : tu vas là où on a besoin de toi." },
      { who: "nour", mood: "calm", reveal: "clock", t: "En haut à gauche, tu suis le jour, l’heure et la fatigue de l’équipe. Plus la semaine avance, plus on est fatigués : c’est souvent là que la vigilance baisse." },
      { who: "nour", mood: "smile", reveal: "phone", t: "Et ton téléphone… Malheureusement, ton numéro a fuité sur le groupe WhatsApp, et je crois que certains ados l’ont récupéré. À toi de juger ce qui peut attendre, et ce qu’il faut recadrer." },
      { who: "nour", mood: "calm", t: "À chaque étape, je te laisse une page de mon carnet. Tu pourras l’ouvrir à tout moment, en haut de l’écran." },
    ] },
  { id: "dbefore", ch: 1, type: "positions", mode: "before", title: "Avant de commencer : vos convictions",
    intro: "Répondez avec vos idées d’aujourd’hui. Rien n’est noté : vous les retrouverez à la fin de la semaine." },
  { id: "map", ch: 1, type: "hotspots", comp: "C1", title: "Le tour de l’accueil",
    intro: "C’est l’heure de la visite. Nour, la directrice, vous fait découvrir l’accueil. Touchez un bâtiment ou un lieu : elle vous dit à quoi il sert et ce qui s’y passe. Vous avez quatre minutes, et le temps s’arrête pendant qu’elle parle.", timer: 240, hints: 2,
    spots: [
      { x: 5.8, y: 31.1, w: 23.4, h: 38.2, key: "radio", label: "L’atelier radio", real: false, title: "À l’atelier radio", t: "Ici, c’est la salle de l’atelier radio : c’est là où les enfants et les jeunes peuvent animer une émission radio. Cet après-midi, par exemple, Bastien y anime l’émission des jeunes. Oui, on sait, c’est pas commun, ça…", lesson: "Rien à signaler : un atelier ouvert aux enfants comme aux jeunes.", ref: "R01" },
      { x: 31.8, y: 31.8, w: 24.4, h: 37.5, key: "equipe", label: "La salle des animateurs", real: false, title: "Dans la salle des animateurs", t: "C’est ici que les animateurs et animatrices peuvent prendre leurs pauses. C’est aussi ici qu’on fera nos petites réunions, s’il y en a, le matin et l’après-midi.", lesson: "Rien à signaler : un lieu pour l’équipe, et pour se coordonner.", ref: "R01" },
      { x: 40, y: 32, w: 14, h: 20, key: "cuisine", label: "La cuisine pédagogique", real: false, title: "La cuisine pédagogique", t: "La cuisine pédagogique : on y prépare les goûters et les ateliers cuisine avec les enfants. La plaque et le four, c’est toujours avec un adulte, et on note tout dans le cahier de traçabilité.", lesson: "Rien à signaler : un lieu d’activité encadré, avec des règles d’hygiène et de sécurité." },
      { x: 59, y: 36.8, w: 20, h: 32.5, key: "soins", label: "L’infirmerie", real: true, title: "À l’infirmerie", t: "Bon, l’infirmerie, tu connais, je pense. On ne donne pas de médicament s’il n’y a pas d’ordonnance médicale d’un médecin ; Bastien est nommé assistant sanitaire. Et on a Zoé, une enfant en situation de handicap. Elle a besoin d’aide pour certains soins d’hygiène ; elle viendra peut-être te voir, et là, tu vois avec Bastien.", lesson: "Les soins d’hygiène de Zoé touchent à son intimité : « tu vois avec Bastien » ne suffit pas. L’équipe doit convenir de qui l’aide, de comment recueillir son choix (avec son tableau d’images) et de comment respecter son intimité. Une aide nécessaire n’autorise pas un accès illimité au corps.", ref: "R10" },
      { x: 81.8, y: 43, w: 14.4, h: 33.4, key: "panneau", label: "Le panneau d’affichage", real: false, title: "Au panneau d’affichage", t: "Le menu, et les affiches des animateurs et des jeunes, avec les sensibilisations des activités de la journée et de la semaine. Certains enfants adorent venir voir.", lesson: "Rien à signaler : un lieu d’information vivant, que les enfants s’approprient.", ref: "R10" },
            { x: 10, y: 60, w: 20, h: 14, key: "jeux", label: "L’aire de jeux", real: false, title: "L’aire de jeux", t: "L’aire de jeux des 6-11 ans : un terrain de foot et une araignée de cordes. Idéalement, deux animateurs : l’un joue avec le groupe, l’autre avec ceux qui restent à l’écart.", lesson: "Rien d’inquiétant : on ne veut pas de simples surveillants. Les animateurs jouent avec les enfants, y compris ceux qui restent à l’écart, et gardent un œil sur l’ensemble." },
      { x: 69.2, y: 75, w: 13.6, h: 14.3, key: "potager", label: "Le potager", real: false, title: "Le potager", t: "Notre potager ! Tout le monde peut y participer, et tout le monde peut y planter des petites choses. Chacun choisit sa tâche : arroser, semer, récolter. Faut juste faire attention aux ballons, des fois, qui abîment le potager.", lesson: "Rien à signaler : chacun choisit son rôle." },
      { x: 80, y: 18, w: 10, h: 18, key: "local", label: "La régie", real: true, title: "À la régie, le local du matériel", t: "La régie, au fond du terrain : un local à l’écart, où l’on range aussi le matériel de l’atelier bois. Le planning prévoit qu’en fin d’atelier l’intervenant y range le matériel avec un ou deux jeunes.", lesson: "Un local à l’écart, où un adulte range le matériel seul avec un ou deux jeunes : c’est une situation à risque. On range à plusieurs, porte ouverte, et l’équipe sait qui est où." },
            { x: 40, y: 70, w: 10, h: 8, key: "parc", label: "Le parc", real: false, title: "Le parc, derrière le bâtiment", t: "Notre petit espace vert, pour les grands jeux et tout, c’est sympa. Il faut juste être vigilant, car les 14-17 sont à côté et, des fois, ils occupent tout l’espace.", lesson: "Rien d’inquiétant : un espace partagé, où l’équipe veille à ce que chaque groupe ait sa place." },
      { x: 45, y: 20, w: 18, h: 18, key: "refectoire", label: "La salle de restauration", real: false, title: "La salle de restauration", t: "Pendant le service, les jeunes s’installent où ils veulent. Le service et le débarrassage sont faits par les enfants eux-mêmes : eh oui, ici, ils apprennent. Les adultes mangent avec les enfants, pas entre eux. On peut aussi y proposer des animations adaptées au repas, bien sûr !", lesson: "Rien à signaler : les enfants participent, et les adultes mangent avec eux." },
            { x: 35, y: 20, w: 10, h: 12, key: "sanitaires", label: "Les sanitaires", real: true, title: "Aux sanitaires", t: "Les sanitaires de l’accueil, pour tous les enfants et les jeunes, sont ici, dans un bloc extérieur, derrière le bâtiment, hors de vue de la cour. Les enfants peuvent y venir quand ils veulent. Nous, animateurs, on garde un œil et une oreille, surtout entre les 14-17 et les 6-11, ce qui peut être un peu compliqué des fois.", lesson: "Un bloc hors de vue de la cour, où se croisent des 6-11 ans et des 14-17 ans sans adulte à proximité : c’est un lieu à risque. On organise la présence d’un adulte à proximité, porte du bloc ouverte, des moments ou des espaces distincts selon les âges, et l’on respecte l’intimité de chacun dans sa cabine." },
      { x: 8, y: 40, w: 12, h: 18, key: "petits", label: "La salle des 6-11 ans", real: false, title: "La salle des 6-11 ans", t: "La salle des 6-11 ans : des tables basses, un coin lecture avec des coussins et plein d’autres choses. Si un enfant ne veut pas faire l’activité avec l’adulte, c’est OK : il peut rester ici ou aller ailleurs, à condition qu’il prévienne l’adulte. Ah oui, aussi : dans toutes les salles, quand il n’y a pas d’adulte, on fait en sorte que la porte reste ouverte ; comme ça, on voit toute la salle depuis le couloir.", lesson: "Rien à signaler : on respecte le choix de l’enfant, et les portes restent ouvertes." },
      { x: 20, y: 40, w: 12, h: 18, key: "grands", label: "La salle des 11-14 ans", real: false, title: "La salle des 11-14 ans", t: "La salle des 11-14 ans : un baby-foot, des jeux de société, et un tableau où les jeunes proposent leurs projets de la semaine. C’est marrant : ils essaient de faire les grands ados, alors que certains sont encore des petits sixièmes.", lesson: "Rien à signaler : les jeunes participent aux choix, sous le regard de l’équipe." },
      { x: 70, y: 30, w: 10, h: 12, key: "libre", label: "La salle d’activités", real: false, title: "La salle d’activités", t: "À côté de l’atelier radio, la salle d’activités : de grandes tables, des chevalets de peinture et des bacs de matériel en libre accès. C’est là que les groupes peuvent venir pour se séparer, pour y faire un projet, une activité. Pour information, dans notre accueil de loisirs, les pistolets à colle ainsi que les ciseaux sont en libre accès pour les enfants. Pour le pistolet à colle, il faut juste faire attention à ce que les plus jeunes aient bien une paire de gants quand ils l’utilisent. D’ailleurs, les plus jeunes passent même un permis cutter avec un anim, pour pouvoir l’utiliser seuls. Et je te rassure, on n’a jamais eu de catastrophe : c’est fou, hein ?", lesson: "Rien à signaler côté violences : du matériel en libre accès, avec des règles de sécurité adaptées à l’âge." },
      { x: 4, y: 20, w: 10, h: 12, key: "ados", label: "La salle des 14-17 ans", real: false, title: "La salle des 14-17 ans", t: "Un peu à l’écart du grand bâtiment, la salle des 14-17 ans. Bon, comme tu vois, il y a des canapés, une table de ping-pong et un tableau pour les projets : par exemple, c’est eux qui coordonnent la fête de la fin de l’été avec un anim, ils kiffent. On les a depuis petits, donc ils sont bien, en vrai.", lesson: "Rien à signaler : les jeunes sont acteurs de leurs projets, avec un animateur." },
      { x: 50, y: 45, w: 16, h: 22, key: "direction", label: "L’accueil et le bureau", real: false, title: "Le bureau de Nour", t: "Mon bureau, juste à côté de l’entrée. Les fiches sanitaires pour les sorties sont rangées dans l’armoire, avec aussi les trousses sanitaires. Pense à les prendre, sinon tu seras en difficulté si un enfant se blesse. Tu peux même missionner certains jeunes pour les prendre, ils adorent cette responsabilité.", lesson: "Rien à signaler : les informations médicales sont rangées, et les trousses partent avec les groupes." },
            { x: 52, y: 62, w: 10, h: 10, key: "cour", label: "Le portail des familles", real: false, title: "Le portail des familles", t: "Les enfants viennent pour la plupart seuls, sauf les 6-11 ans. Le matin, leurs parents viennent les déposer au portail et repartent. Le soir, parmi ces enfants, un enfant n’est remis qu’à un adulte inscrit sur sa fiche, et l’équipe vérifie son identité.", lesson: "Rien d’inquiétant : le départ des enfants est contrôlé." },
    ] },
  // Lundi après-midi : promenade libre. On circule dans l'accueil, on tombe sur des scènes, on réagit, on repart.
  { id: "lundi-libre", ch: 1, type: "roam", kicker: "Lundi, 13 h 30 · temps libre", bridge: "13 h 30. La visite est finie et vous avez déjeuné avec l’équipe.", title: "Votre après-midi, en volant",
    start: "13 h 30", end: "17 h", from: "cour", guided: "foot",
    intro: "Vous circulez dans l’accueil, en volante. Avancez sur les chemins, entrez dans les salles, et restez attentive à ce qui se passe autour de vous.",
    life: [
      { who: "jade", loop: [[15.7, 8.6], [12.6, 8.8], [12.4, 6.6], [15.9, 6.8]], speed: 3.1, pose: "run", pause: 600, gest: ["laugh", "raise", "nod"] },
      { who: "k1", loop: [[12.4, 6.6], [15.9, 6.8], [15.7, 8.6], [12.6, 8.8]], speed: 3, pose: "run", pause: 300 },
      { who: "k2", loop: [[15.9, 6.8], [15.7, 8.6], [12.6, 8.8], [12.4, 6.6]], speed: 2.8, pose: "run", pause: 500, gest: ["laugh", "raise"] },
      { who: "k4", loop: [[12.6, 8.8], [12.4, 6.6], [15.9, 6.8]], speed: 2.9, pose: "run", pause: 700 },
      { who: "tom", at: [15.3, 28.7], gest: ["explain", "present", "nod", "thumb"] },
      { who: "k3", at: [16.6, 26.9], gest: ["fidget", "laugh", "scratch", "raise"] },
      { who: "k6", at: [20.6, 28.0], gest: ["nod", "laugh", "fidget"] },
      { who: "t1", at: [17.3, 23.7], gest: ["explain", "laugh", "shrug", "lookaway"], face: [18.2, 24.3] },
      { who: "t2", at: [18.2, 24.4], gest: ["laugh", "explain2", "cross"], face: [17.3, 23.7], back: true },
      { who: "nour", at: [25.3, 22.3], gest: ["explain", "calm", "nod", "present"], to: "15 h 30" },
      { who: "pa1", at: [26.0, 23.3], gest: ["nod", "explain", "checkwatch", "bagstrap"], back: true, to: "15 h 30" },
      { who: "k5", loop: [[16.4, 22.3], [10.6, 22.5]], speed: 3.2, pose: "run", pause: 1500 },
      { who: "theo", loop: [[5.6, 25.3], [7.9, 26.3], [7.4, 24.9]], speed: 3, pose: "run", pause: 400, after: "foot", prop: "dribble" },
      { who: "zoe", loop: [[7.9, 26.3], [7.4, 24.9], [5.6, 25.3]], speed: 2.8, pose: "run", pause: 600, after: "foot", gest: ["raise", "laugh"] },
      { who: "malo", loop: [[7.4, 24.9], [5.6, 25.3], [7.9, 26.3]], speed: 2.6, pose: "run", pause: 900, after: "foot" },
    ],
    guide: ["nour", "Pour commencer, va voir à l’aire de jeux : j’ai entendu des éclats de voix du côté du foot. Ensuite, promène-toi : à toi de repérer. Et vers 14 h, passe à l’atelier radio."],
    places: ["jeux", "radio", "sanitaires", "potager", "parc", "refectoire", "equipe", "cour"],
    events: [
      { id: "foot", at: "jeux", from: "13 h 30", to: "15 h", comp: "C2",
        // Noé et Malo sur le mini-terrain ; Zoé arrive vers eux, le ballon sous le bras (elle les rejoint avant que la scène ne commence)
        spots: [["theo", 7.0, 25.35, "point", ["point", "stomp", "hips", "laugh"]], ["zoe", 9.7, 24.4, "sad", ["downcast", "fidget", "hug"]], ["malo", 6.3, 24.95, "stand", ["laugh", "point"]]], props: { zoe: "ball" }, kicker: "Lundi après-midi · l’aire de jeux", title: "Le foot",
        cast: [["theo", "a", "point"], ["zoe", "b", "sad"], ["malo", "c", "stand"], ["you", "f", "walk"]],
        act: [[200, "zoe", "mv", [-.5, .3, 1.4]], [900, "theo", "g", "stop"], [1500, "malo", "g", "laugh"], [2100, "zoe", "g", "downcast"], [2300, "zoe", "mv", [.9, -.4, 1.2]]],
        lines: [["narr", "Une partie de foot s’organise. Zoé, 8 ans, s’approche avec le ballon sous le bras."], ["theo", "Non, t’es une fille ! Tu peux pas jouer au foot avec nous."], ["zoe", "Mais… moi je joue bien, euh… je joue tous les mercredis."], ["narr", "Malo rigole. Zoé recule vers le banc."]],
        prompt: "Que faites-vous ?",
        opts: [
          { t: "Je dis à tout le groupe : « Ici, tout le monde peut jouer. » Et je compose moi-même deux équipes mélangées.", q: 1, react: { zoe: "talk", theo: "stand" }, reply: ["zoe", "C’est vrai ? Euh… je peux être goal ?"],
            cons: "Les équipes mélangées tournent tout l’après-midi. Zoé marque un but ; à la fin, Noé lui tape dans la main.",
            fb: "Vous nommez la règle, sans exclusion selon le sexe, et vous agissez sur l’organisation du jeu. C’est la prévention au quotidien : on ne laisse pas un stéréotype devenir la règle du groupe." },
          { t: "Je propose à Zoé un autre jeu, avec d’autres filles.", q: 0.5, react: { zoe: "stand", theo: "talk" }, reply: ["zoe", "D’accord… je vais voir."],
            cons: "Zoé joue à côté, mais le terrain de foot reste « celui des garçons ». Le lendemain, plus aucune fille ne s’en approche.",
            fb: "Vous évitez à Zoé d’être mise à l’écart, mais en la séparant, vous validez le stéréotype : l’espace commun reste aux garçons." },
          { t: "Je laisse faire : ils ont le droit de choisir avec qui ils jouent.", q: 0, react: { zoe: "sad", theo: "talk" }, reply: ["theo", "Tu vois, l’animateur il dit rien !"],
            cons: "Zoé passe l’après-midi sur le banc. Le mercredi suivant, elle n’apporte plus son ballon.",
            fb: "Laisser passer une exclusion fondée sur le sexe l’installe comme une règle. Les stéréotypes se construisent tôt, dans le jeu, et l’adulte qui se tait les cautionne." },
        ],
        better: "Nommer la règle devant le groupe et réorganiser le jeu : équipes mélangées, rôles qui tournent." },
      { id: "radio", at: "radio", room: "radio", from: "14 h", to: "17 h", must: true, nudge: "14 h 15", nudgeLine: ["nour", "Tu passes à l’atelier radio ? Bastien démarre avec les grands."],
        cast: [["you", "a"], ["bastien", "c", "talk"], ["enzo", "s1"], ["lena", "s2"], ["clara", "d"]],
        lines: [["narr", "À l’atelier radio, Bastien répartit les postes avec les 13-17 ans."], ["bastien", "Je propose que les filles aillent à l’écriture du texte : les garçons sont pas aussi forts que les filles en français. Et vous, les mecs… on va vous proposer un truc manuel… Tiens, vous allez paramétrer la console…"], ["lena", "Euh… moi j’aimerais bien apprendre à régler les micros… je peux ?"], ["bastien", "Une autre fois, Léna. Les textes, c’est important aussi."]],
        reacts: [{ lena: "talk", bastien: "listen" }, { lena: "listen", bastien: "talk" }, { lena: "talk", bastien: "sad" }, { lena: "sad", bastien: "talk" }],
        replies: [["lena", "Ah… d’accord. Demain, alors."], ["lena", "Trop bien ! Je peux commencer ?"], ["bastien", "Bon… si tu veux le faire à ma place."], ["lena", "Bon… je retourne aux textes."]] },
      { id: "photo", at: "preau", from: "14 h 40", to: "16 h 30", comp: "C2", kicker: "Lundi après-midi · le préau", title: "La photo",
        spots: [["enzo", 15.3, 23.5, "point", ["point", "laugh", "shrug"]], ["clara", 14.1, 24.5, "sad", ["cover", "stop", "hug"]]], props: { enzo: "phone" },
        cast: [["enzo", "a", "point"], ["clara", "b", "sad"], ["you", "f", "walk"]],
        act: [[200, "enzo", "g", "phone"], [700, "clara", "g", "cover"], [1100, "clara", "mv", [-.5, .4, 1.6]], [1500, "enzo", "mv", [-.4, .3, 1.6]], [1900, "enzo", "g", "phone"], [2500, "clara", "g", "stop"]],
        crowd: [["t1", 16.4, 23.4], ["t2", 16.8, 24.4]],
        lines: [["narr", "Sous le préau, Enzo, 14 ans, tend son téléphone vers Clara, 17 ans, qui se cache le visage. Deux autres jeunes rigolent."], ["clara", "Arrête, Enzo ! Efface ça tout de suite, je t’ai dit non !"], ["enzo", "Ça va, c’est pour rigoler… Je la mets juste sur le groupe, personne verra."]],
        prompt: "Que faites-vous ?",
        opts: [
          { t: "Je m’interpose calmement, je demande à Enzo de supprimer la photo devant moi, et j’en parle à Bastien et à Nour.", q: 1, react: { enzo: "sad", clara: "listen" }, reply: ["enzo", "Bon… c’est bon, je l’efface. Regarde."],
            cons: "La photo est supprimée devant vous. Nour reprend le droit à l’image avec le groupe des grands : le lendemain, c’est Enzo qui rappelle la règle à un autre jeune.",
            fb: "Photographier quelqu’un qui refuse, et surtout diffuser son image sans accord, porte atteinte à sa vie privée ; la diffusion peut constituer une infraction. Vous faites cesser, vous vérifiez la suppression et vous transmettez : c’est complet." },
          { t: "Je confisque le téléphone d’Enzo jusqu’au soir, sans plus de discussion.", q: 0.5, react: { enzo: "angry", clara: "stand" }, reply: ["enzo", "T’as pas le droit ! C’est mon téléphone !"],
            cons: "Enzo récupère son téléphone le soir… et la photo, jamais supprimée, circule le lendemain sur le groupe.",
            fb: "Confisquer fait cesser sur le moment, mais sans vérifier la suppression ni transmettre, la photo peut encore circuler. Et personne n’a expliqué pourquoi c’est grave." },
          { t: "Je dis à Clara de ne pas en faire une histoire : ce n’est qu’une photo entre jeunes.", q: 0, react: { enzo: "talk", clara: "sad" }, reply: ["clara", "Ok… laisse tomber."],
            cons: "La photo circule le soir même, avec des commentaires. Clara ne revient pas le mercredi.",
            fb: "Minimiser renvoie la responsabilité sur la victime. Une image prise et diffusée sans accord est une atteinte grave ; entre jeunes, elle nourrit vite le harcèlement." },
        ],
        better: "Faire cesser, faire supprimer devant soi, transmettre à l’équipe, puis reprendre le droit à l’image avec le groupe." },
      { id: "sanit", at: "sanitaires", room: "sanitaires", from: "14 h 30", to: "16 h 30", comp: "C3", kicker: "Lundi après-midi · les sanitaires", title: "Devant les toilettes",
        cast: [["malo", "d", "sad"], ["you", "e", "walk"]],
        lines: [["narr", "Devant les toilettes, Malo, 7 ans, se tient le ventre et n’ose pas entrer."], ["malo", "Je veux pas y aller… Les grands, ils… ils regardent par-dessus la porte. Et après ils rigolent."]],
        prompt: "Que faites-vous ?",
        opts: [
          { t: "Je rassure Malo, je reste près de la porte pendant qu’il y va, puis je préviens Nour pour organiser des passages encadrés.", q: 1, react: { malo: "stand" }, reply: ["malo", "Tu restes là, hein ? D’accord."],
            cons: "Dès le lendemain, l’équipe organise les passages des petits, en binôme, porte du bloc ouverte. Les grands qui regardaient par-dessus les portes sont recadrés.",
            fb: "Vous protégez Malo tout de suite, puis vous transmettez : les sanitaires sont un lieu sensible, où l’intimité de chaque enfant doit être garantie. C’est l’organisation, et non l’enfant, qui doit changer." },
          { t: "Je vais tout de suite crier sur les grands qui traînent là.", q: 0.5, react: { malo: "sad" }, reply: ["malo", "Ils vont me dire que j’ai cafté…"],
            cons: "Les grands s’en vont, mais rien ne change dans l’organisation. Le lendemain, ils sont revenus.",
            fb: "Faire cesser, c’est bien ; mais sans organisation et sans transmission à la référente, la situation se reproduit, et Malo peut être exposé à des représailles." },
          { t: "Je lui dis d’y aller vite : ce n’est rien, ils jouent.", q: 0, react: { malo: "sad" }, reply: ["malo", "…"],
            cons: "Malo se retient tout l’après-midi. Le soir, il dit à sa mère qu’il ne veut plus venir.",
            fb: "Ce n’est pas « rien » : regarder un enfant aux toilettes porte atteinte à son intimité. Minimiser apprend à l’enfant que sa parole ne compte pas." },
        ],
        better: "Protéger l’enfant sur le moment, puis transmettre pour que l’organisation change : passages encadrés, binômes, porte du bloc ouverte." },
    ],
    calm: {
      petits: { cast: [["you", "b"]], room: "petits", t: "La salle des 6-11 ans est vide : le groupe de Jade est dehors, entre le parc et l’aire de jeux. Le goûter, elle le prendra ici avec eux, à 16 h 30." },
      ados: { cast: [["kevin", "d", "talk"], ["t1", "p1", "pingpong"], ["t2", "p2", "pingpong"], ["t3", "s1"], ["you", "b"]], room: "ados", t: "Dans la salle des 14-17 ans, Kévin anime un tournoi de ping-pong. Sur le canapé, un jeune prépare le programme de la soirée de vendredi." },
      grands: { cast: [["ines", "a", "talk"], ["you", "b"], ["sacha", "s1"]], room: "grands", t: "Dans la salle des 11-14 ans, Inès aide Sacha à finir une maquette." },
      direction: { cast: [["you", "b"]], room: "direction", t: "Le bureau de Nour est vide : elle est sur le terrain, avec les familles. Sur la porte vitrée, un mot : « Je suis dans la cour, venez me voir au besoin. »" },
      soins: { cast: [["you", "a"]], room: "soins", t: "L’infirmerie est vide. Le registre des soins est rangé à sa place, dans l’armoire." },
      cuisine: { cast: [["yanis", "a", "talk"], ["k1", "c"], ["k2", "d"], ["you", "b"]], room: "cuisine", t: "Dans la cuisine pédagogique, Yanis et trois enfants préparent le goûter de leur groupe : salade de fruits pour tout le monde." },
      libre: { cast: [["lea", "a", "talk"], ["k9", "c"], ["t5", "d"], ["you", "b"]], room: "libre", t: "Dans la salle d’activités, Léa fait un jeu de mime avec les plus jeunes. Ça rit beaucoup." },
      local: { cast: [["you", "a"]], room: "local", t: "La régie est fermée à clé." },
      preau: { t: "Sous le préau, quelques grands discutent à l’ombre." },
      potager: { cast: [["tom", "a", "talk"], ["k3", "b", "stand"], ["you", "f", "walk"]], t: "Au potager, Tom et quelques enfants arrosent les tomates." },
      parc: { cast: [["jade", "a", "wave"], ["theo", "b", "walk"], ["you", "f", "walk"]], t: "Au parc, le groupe de Jade fait un jeu de piste. Ça court, ça rit, chacun a sa place." },
      refectoire: { cast: [["you", "a", "walk"]], room: "refectoire", t: "La salle de restauration est vide : elle ne sert qu’au repas de midi. Le goûter, chaque animateur le prend avec son groupe, dans sa salle." },
      equipe: { cast: [["you", "b"]], room: "equipe", t: "La salle des animateurs est calme. Tous les animateurs semblent être avec leur groupe." },
      cour: { cast: [["nour", "a", "talk"], ["you", "b", "walk"]], t: "Dans la cour, Nour discute avec un parent. Elle vous fait un signe de la main." },
      jeux: { cast: [["theo", "a", "walk"], ["zoe", "b", "walk"], ["malo", "c", "wave"], ["you", "f", "walk"]], t: "À l’aire de jeux, ça court dans tous les sens." },
      radio: { cast: [["bastien", "c", "talk"], ["lena", "s2", "sit"], ["you", "a", "walk"]], room: "radio", before: "Bastien installe le matériel : l’atelier radio commence à 14 h.", t: "L’atelier radio se poursuit. Léna est à sa table." },
      sanitaires: { cast: [["you", "d", "walk"]], room: "sanitaires", before: "Les sanitaires sont vides pour l’instant.", t: "Les sanitaires sont calmes." },
    },
    end_t: "Les familles commencent à arriver au portail : votre après-midi se termine." },
  { id: "radio", inRoam: "lundi-libre", ch: 1, type: "choice", comp: "C4", scene: "S01", kicker: "Lundi, 14 h · atelier radio", title: "Qui touche à la console ?",
    context: "Bastien anime l’atelier : « Je propose que les filles aillent à l’écriture du texte : les garçons sont pas aussi forts que les filles en français. Et vous, les mecs… on va vous proposer un truc manuel… Tiens, vous allez paramétrer la console… » Léna lui redemande d’apprendre à régler les micros.",
    prompt: "Que faites-vous ?",
    opts: [
      {t:  "Je n’interviens pas pendant l’atelier, mais j’ouvre demain une séance « technique » ouverte à toutes et à tous.", q:  0.5, cons:  "Demain, quatre filles viennent à la séance. Aujourd’hui, Léna est restée aux textes.", fb:  "Vous ouvrez l’accès, mais un jour trop tard, et le raisonnement de Bastien n’est pas travaillé : la même règle se reproduira ailleurs."},
      {t:  "Je propose tout de suite une rotation des rôles ouverte à tous, et j’en reparle avec Bastien après l’atelier.", q:  1, cons:  "Léna règle son premier micro. Bastien accepte d’en reparler au débrief.", fb:  "Vous rouvrez l’accès sans humilier personne, et vous travaillez le raisonnement de l’adulte. C’est la réponse attendue.", mood:  "big"},
      {t:  "Je prends la place de Bastien à la console et j’apprends moi-même à Léna à régler les micros.", q:  0.5, cons:  "Léna apprend. Bastien, mis de côté devant les jeunes, s’agace et ne change rien à sa règle.", fb:  "Léna accède à l’apprentissage, mais la règle de l’atelier et la posture de Bastien restent intactes, et vous fragilisez un collègue devant le groupe."},
      {t:  "Je laisse faire : les jeunes ont choisi leur place, et aucun ne s’est plaint.", q:  0, cons:  "Léna retourne à ses textes. À la fin de la semaine, aucune fille n’a touché la console.", fb:  "Léna a pourtant demandé deux fois. Un « choix » orienté par une consigne de l’adulte n’est pas un choix libre."},
    ],
    why: {"q": "Et pourquoi ?", "opts": [{"t": "Parce que répartir selon le sexe ferme l’accès à un apprentissage.", "ok": true}, {"t": "Parce que la parité impose autant de filles que de garçons à chaque poste.", "ok": false, "no": "Il ne s’agit pas de quotas, mais d’accès : chacun doit pouvoir choisir et apprendre."}, {"t": "Parce que ces propos sont une infraction pénale qu’il faut faire cesser.", "ok": false, "no": "Ce n’est pas une infraction en soi : c’est une inégalité à corriger, par l’organisation et le dialogue."}]},
    better: "Rouvrir le choix des rôles, faire tourner les responsabilités et reprendre le raisonnement de l’adulte, sans humiliation." },
  { id: "fin1", ch: 1, type: "dayend" },
  { id: "k1", ch: 1, type: "explain", page: { title: "Sexisme ou discrimination ?",
    pts: [
      "Un stéréotype attribue des aptitudes ou des rôles à tout un groupe. Il devient un levier d’inégalité quand il guide les décisions.",
      "Une discrimination, c’est une décision défavorable liée à un critère interdit (sexe, orientation sexuelle, identité de genre, handicap…), par exemple un refus d’embauche.",
      "Repérer un fonctionnement sexiste ne suffit pas à fixer une qualification pénale. On agit sur l’organisation : rôles, accès au matériel, affichage.",
    ], refs: ["R01", "R02", "Code du travail L1142-2-1", "Code pénal 225-1 et 225-2", "CASF L226-8"] } },
  { id: "c2", ch: 2, type: "chapter" },
  { id: "brief", ch: 2, type: "story", scene: "S03", kicker: "Mardi, 8 h 30 · briefing du matin",
    lines: [
      { who: "bastien", mood: "big", chain: true, t: "Et l’atelier vélo, Inès ? C’est toujours le club des filles qui se prennent pour des garçons ?" },
      { who: "yanis", mood: "big", chain: true, t: "Ha ! Avec les genouillères roses, quand même." },
      { who: "ines", mood: "concern", chain: true, t: "Arrête, Bastien. Je te l’ai déjà dit hier : ça ne me fait pas rire." },
      { who: "bastien", mood: "big", chain: true, t: "« Ça ne me fait pas rire »… Oh là là, on se détend !" },
      { who: null, t: "Toute l’équipe rit, sauf Inès. Depuis lundi, c’est comme ça à chaque briefing." },
      { who: "ines", mood: "concern", t: "Tu as deux minutes ? Je crois que je commence à exagérer…" },
    ] },
  { id: "ines", ch: 2, type: "dialogue", comp: "C3", title: "Inès, après le briefing", kicker: "Mardi, 9 h", npc: "ines", start: "n1",
    nodes: {
      n1: { mood: "concern", t: "Tu as vu ? Je me dis que c’est peut-être moi qui le prends mal.",
        opts: [
          { t: "Tu n’exagères pas : tu leur as demandé d’arrêter et ça continue. Ce n’est pas normal.", to: "n2", q: 1 },
          { t: "Ils sont lourds, c’est vrai, mais je crois que c’est maladroit plus que méchant. Laisse passer la semaine.", to: "n1b", q: 0, note: "Minimiser isole la personne. Ce qui se répète malgré un refus n’est plus de l’humour." },
          { t: "Ce sont des faits graves : il faut que tu ailles porter plainte dès ce soir, sans attendre.", to: "n1c", q: 0.5, note: "La plainte est une possibilité, mais une adulte décide de ses démarches. On commence par écouter et informer." },
        ] },
      n1b: { mood: "concern", t: "D’accord… Laisse tomber, alors.",
        opts: [{ t: "Attends, je me suis mal exprimé·e. Ce qui se répète malgré ton refus, ce n’est pas de l’humour.", to: "n2", q: 0.5 }] },
      n1c: { mood: "o", t: "Une plainte ? Je ne sais même pas si c’est grave…",
        opts: [{ t: "C’est toi qui décides de tes démarches. Je peux t’aider à en parler à Nour et te donner des contacts d’aide.", to: "n2", q: 1 }] },
      n2: { mood: "calm", t: "Merci. Mais je ne veux pas d’histoires avec l’équipe.",
        opts: [
          { t: "Je viens avec toi voir Nour : l’employeur doit faire cesser ça.", to: "end", q: 1 },
          { t: "Je vais aller leur parler moi-même ce soir, entre collègues, ce sera plus simple.", to: "n3", q: 0.5, note: "Ton intention est de protéger, mais un règlement de comptes ne garantit ni l’arrêt des faits ni un suivi." },
          { t: "Si tu préfères, on n’en parle à personne pour l’instant, et on voit si ça se calme.", to: "n3b", q: 0, note: "Garder le secret laisse la situation continuer. Une alerte interne déclenche l’obligation de l’employeur." },
        ] },
      n3: { mood: "concern", t: "Je préférerais que ça ne tourne pas à la dispute…",
        opts: [{ t: "Tu as raison. On alerte Nour pour que l’employeur fasse cesser les faits, et on garde une trace de ce qui s’est passé.", to: "end", q: 1 }] },
      n3b: { mood: "calm", t: "…Mais si ça continue demain ?",
        opts: [{ t: "Tu as raison, se taire ne réglera rien. Allons voir Nour ensemble : l’employeur doit faire cesser ces faits.", to: "end", q: 0.5 }] },
      end: { end: true, mood: "smile", t: "D’accord. On y va après le déjeuner.",
        lesson: "Le harcèlement sexuel peut reposer sur des propos sexistes répétés, sans aucune proposition sexuelle. Écouter sans minimiser, soutenir, alerter un responsable : l’employeur doit faire cesser les faits (Code du travail, L1153-5)." } } },
  { id: "rire", ch: 2, type: "choice", comp: "C2", npc: "bastien", mood: "smile", kicker: "Mardi, 12 h 15 · au déjeuner",
    context: "« J’ai vu que tu as parlé à Inès ce matin. Franchement, c’était pour rire, on ne voulait pas la blesser. »",
    prompt: "Que lui répondez-vous ?",
    opts: [
      {t:  "Je sais que ce n’était pas méchant. Allez vous excuser auprès d’elle, et on tourne la page.", q:  0.5, cons:  "Inès reçoit des excuses rapides. Le lendemain, une nouvelle « blague » circule.", fb:  "Des excuses ne suffisent pas : en refermant le sujet, vous laissez penser que l’intention efface l’effet."},
      {t:  "Elle vous a demandé d’arrêter et vous avez continué. On en parle avec Nour.", q:  1, cons:  "Bastien se tait, puis admet qu’il n’avait pas vu les choses ainsi. Nour reprend le sujet en équipe.", fb:  "Vous nommez le cœur du problème, la demande d’arrêt ignorée, et vous impliquez la référente.", mood:  "concern"},
      {t:  "Entre adultes, chacun son humour ; mais devant les enfants, vous devez faire attention à l’image.", q:  0, cons:  "Les blagues continuent, plus discrètes. Inès évite désormais les pauses.", fb:  "Le problème n’est pas le public : c’est ce que subit Inès. Vous légitimez les propos."},
      {t:  "Je ne veux pas trancher à chaud : je laisse Nour décider, c’est son rôle de référente.", q:  0.5, cons:  "Nour est informée deux jours plus tard. Entre-temps, Bastien pense que rien n’a été dit de grave.", fb:  "Informer la référente est utile, mais sans rien dire à Bastien, vous laissez la situation se prolonger."},
    ],
    why: {"q": "Et pourquoi ?", "opts": [{"t": "Parce que ce qui compte, c’est l’effet sur elle, et elle a demandé d’arrêter.", "ok": true}, {"t": "Parce que tout humour à connotation sexuelle est interdit au travail, quel que soit le contexte.", "ok": false, "no": "La règle n’est pas l’interdiction de tout humour : c’est le respect de la personne et de sa demande."}, {"t": "Parce que Bastien risque une sanction disciplinaire s’il recommence.", "ok": false, "no": "La sanction possible n’est pas la raison : il s’agit de faire cesser une situation qui atteint Inès."}]},
    later: true,
    better: "Revenir aux faits : la répétition, le refus exprimé et l’effet sur la personne comptent plus que l’intention affichée." },
  { id: "planning", ch: 2, type: "planning", comp: "C4", kicker: "Mardi, 13 h 30 · avant les activités", title: "Organiser l’après-midi",
    intro: "Sa réunion à la mairie dure jusqu’à 17 h. Avant de partir, elle vous confie le planning de l’après-midi : « Tu connais les règles, je te fais confiance. » Placez chaque animateur sur un poste, en respectant les règles de l’équipe affichées en salle d’équipe : elles sont dans votre carnet.",
    staff: [["jade", "Jade", "animatrice, référente des 6-11 ans"], ["ines", "Inès", "animatrice"], ["kevin", "Kévin", "animateur"], ["bastien", "Bastien", "stagiaire BAFA"], ["you", "Vous", "animateur ou animatrice"]],
    posts: [
      { id: "atelier", t: "Atelier bois à la régie", d: "6 grands, avec l’intervenant extérieur", n: 1 },
      { id: "sanit", t: "Sanitaires des 6-11 ans", d: "accompagnement", n: 2 },
      { id: "calme", t: "Temps calme des 6-11 ans", d: "salle des 6-11 ans", n: 1 },
      { id: "parc", t: "Grands au parc", d: "12 jeunes", n: 1 },
    ],
    rules: [
      { k: "calme", t: "Le temps calme des 6-11 ans est encadré par leur référente.", test: "calme=jade" },
      { k: "sanit", t: "Aux sanitaires des 6-11 ans, on accompagne en binôme.", test: "sanit#2" },
      { k: "stagiaire", t: "Un stagiaire n’est jamais le seul animateur d’un groupe.", test: "bastien-not:atelier,parc,calme" },
      { k: "atelier", t: "Un intervenant extérieur n’encadre jamais seul : un animateur est toujours présent.", test: "atelier#1" },
    ],
    twist: { who: "kevin", t: "Message de Kévin, depuis la régie : « L’intervenant propose de garder Maëlys seule avec lui après l’atelier, pour finir son étagère. Je dis oui ? »",
      opts: [{ t: "Non : personne ne reste seul avec un enfant dans la régie. Elle finira demain, avec le groupe.", q: 1 },
             { t: "Oui, mais tu passes jeter un œil toutes les dix minutes.", q: 0.3, fb: "Un passage régulier ne change rien : l’enfant reste seule avec un adulte, porte fermée, dans un local sans fenêtre." },
             { t: "Oui, c’est un professionnel, et Maëlys a l’air contente.", q: 0, fb: "La règle protège tout le monde, y compris de l’habitude qui s’installe : jamais un adulte seul avec un enfant hors de la vue des autres." }] } },
  { id: "theo", ch: 2, type: "sort", comp: "C1", kicker: "Mardi, 14 h · temps calme",
    context: "Noé, 8 ans, a dessiné pendant le temps calme deux personnages nus, couchés l’un sur l’autre, et il a vite caché sa feuille. Depuis deux jours, il refuse aussi l’atelier cirque qu’il adorait. Votre collègue Jade est catégorique : « Il a été agressé par quelqu’un de sa famille. »",
    prompt: "Classez chaque élément : est-il observé, rapporté ou supposé ?",
    hint: "Demandez-vous qui a vu ou entendu directement. Une conclusion, même convaincue, reste une hypothèse.",
    cats: [{ id: "obs", label: "Observé" }, { id: "rap", label: "Rapporté" }, { id: "sup", label: "Supposé" }],
    items: [
      { t: "Noé a dessiné deux personnages nus, couchés l’un sur l’autre, et a caché la feuille quand Jade s’est approchée.", cat: "obs", why: "Toi ou l’équipe l’avez vu directement." },
      { t: "Noé a refusé l’atelier cirque, qu’il appréciait.", cat: "obs", why: "Un changement de comportement constaté." },
      { t: "Un autre enfant dit que Noé « a fait des cauchemars cette nuit ».", cat: "rap", why: "C’est la parole de quelqu’un d’autre : on la note comme telle." },
      { t: "Il a été agressé par un membre de sa famille.", cat: "sup", why: "C’est la conclusion de Jade : aucun récit ni autre fait précis ne la fonde." },
      { t: "Noé est sûrement traumatisé.", cat: "sup", why: "Une interprétation, pas une observation." },
    ] },
  { id: "theo2", ch: 2, type: "choice", npc: "jade", mood: "concern", comp: "C3", kicker: "Et maintenant ?",
    context: "Vous avez trié les faits. Jade attend votre réaction.",
    prompt: "Quelle est la réponse la plus juste ?",
    opts: [
      {t:  "Prendre Noé à part, au calme, et lui demander directement si quelqu’un lui a fait du mal.", q:  0, cons:  "Noé se ferme. Ses réponses, influencées par la question, seront plus difficiles à exploiter.", fb:  "Une question fermée et suggestive peut influencer la parole de l’enfant et fragiliser une enquête future."},
      {t:  "Tout noter et attendre la fin de la semaine pour voir si d’autres signes apparaissent.", q:  0.5, cons:  "Vous notez deux nouveaux signes jeudi. L’information part avec deux jours de retard.", fb:  "Noter est juste, mais attendre n’est pas nécessaire : une inquiétude étayée se transmet sans délai."},
      {t:  "Noter les faits, rester disponible sans questionner Noé, et transmettre à Nour aujourd’hui.", q:  1, cons:  "Nour transmet une information préoccupante à la CRIP le jour même.", fb:  "Observer sans interpréter, écouter sans suggérer, transmettre : c’est la réponse attendue.", mood:  "calm"},
      {t:  "En parler à ses parents ce soir au portail, pour comprendre ce qui se passe à la maison.", q:  0, cons:  "Le soir même, Noé ne revient plus à l’atelier qu’il aimait. Rien n’a été transmis.", fb:  "Si les violences ont lieu dans la famille, en parler aux parents peut exposer l’enfant à des pressions."},
    ],
    why: {"q": "Et pourquoi ?", "opts": [{"t": "Parce qu’on n’enquête pas : on transmet des faits, d’autres évaluent.", "ok": true}, {"t": "Parce qu’il faut d’abord réunir une preuve solide avant toute transmission.", "ok": false, "no": "Aucune preuve n’est demandée : une inquiétude fondée sur des faits suffit pour transmettre."}, {"t": "Parce que seule la police a le droit de parler à un enfant d’un sujet pareil.", "ok": false, "no": "On peut écouter un enfant qui parle : ce qu’on évite, c’est de le questionner ou de l’orienter."}]},
    later: true,
    better: "Observer, écouter sans suggérer, transmettre : au responsable, puis au 119 ou à la CRIP selon la situation." },
  { id: "parent1", hour: "17 h 50", ch: 2, type: "dialogue", comp: "C4", title: "Au portail : le papa de Zoé", npc: "roussel", start: "n1", parent: true,
    intro: "Mardi, 17 h 50. Au portail, les parents récupèrent leurs enfants et repartent vite. M. Roussel, le papa de Zoé, attend que les autres soient partis pour vous parler.",
    nodes: {
      n1: { mood: "concern", t: "Bonsoir. Hier soir, avec son tableau d’images, Zoé m’a fait comprendre qu’un animateur l’avait aidée à se changer après sa chute dans la boue. Elle avait l’air gênée. Comment ça se passe, ici, ces moments-là ?",
        opts: [
          { t: "Merci de m’en parler. Elle se change seule si possible, un adulte à proximité. Je vérifie pour Zoé.", to: "n2", q: 1 },
          { t: "Rassurez-vous : toute l’équipe est diplômée, contrôlée et formée, il n’y a aucun risque ici.", to: "n1b", q: 0, note: "Le diplôme ne répond pas à la question. Le parent attend des règles concrètes, et sa remarque mérite d’être vérifiée." },
          { t: "Je préfère ne pas répondre à la place de la direction : je vous invite à prendre rendez-vous.", to: "n1c", q: 0.5, note: "Orienter vers la direction est utile, mais une question simple sur l’organisation mérite une réponse claire." },
        ] },
      n1b: { mood: "angry", t: "Diplômés ?! Ce n’est pas ma question ! Je vous demande qui était avec ma fille, et comment ça se passe !",
        opts: [{ t: "Vous avez raison. On la laisse se changer seule autant que possible, à l’abri des regards, un adulte à proximité. Je vérifie avec l’équipe ce qui s’est passé pour Zoé.", to: "n2", q: 0.5 }] },
      n1c: { mood: "angry", t: "Pardon ? Je vous pose une question simple, et vous me renvoyez ailleurs ?",
        opts: [{ t: "Pardon. L’enfant se change seul autant que possible, à l’abri des regards, un adulte à proximité. Et je transmets votre question à la direction dès ce soir.", to: "n2", q: 0.5 }] },
      n2: { mood: "calm", t: "D’accord. Et si elle me redit qu’elle a été gênée ?",
        opts: [
          { t: "Écoutez-la sans orienter, notez ses mots, et revenez vers nous. Je préviens Nour ce soir.", to: "end", q: 1 },
          { t: "À cet âge, les enfants amplifient parfois ; attendez de voir si elle en reparle d’elle-même.", to: "n3", q: 0, note: "Mettre en doute la parole d’un enfant devant son parent ferme la porte aux prochaines confidences." },
          { t: "Posez-lui des questions précises ce soir pour savoir exactement qui a fait quoi, et quand.", to: "n3b", q: 0.5, note: "Des questions répétées ou orientées peuvent troubler l’enfant et fragiliser sa parole. On écoute, on note, on transmet." },
        ] },
      n3: { mood: "angry", t: "Exagérer ? Ma fille n’invente pas ce genre de choses ! Vous la connaissez à peine !",
        opts: [{ t: "Vous avez raison, sa parole compte. Écoutez-la, notez ses mots, et on en reparle avec la direction. Je transmets ce soir.", to: "end", q: 0.5 }] },
      n3b: { mood: "calm", t: "Je ne veux pas la brusquer non plus…",
        opts: [{ t: "Vous avez raison. Écoutez-la simplement, notez ses mots, et revenez vers nous. Je transmets ce soir à Nour.", to: "end", q: 1 }] },
      end: { end: true, mood: "smile", t: "Merci. Ça me rassure de savoir comment vous vous organisez.",
        lesson: "Les parents sont des alliés de la prévention. On répond par des règles concrètes et vérifiables, on ne met jamais en doute la parole de l’enfant, et toute remarque inquiétante est transmise à la direction le jour même." } } },
  { id: "chat", ch: 2, type: "choice", comp: "C2", kicker: "Mardi, 18 h · conversation de l’équipe",
    chat: [
      { who: "Yanis", t: "Inès en short aujourd’hui… on comprend le succès de l’atelier vélo." },
      { who: "Bastien", t: "Ha ha, elle devrait faire ça plus souvent." },
      { who: "Hugo", t: "+1, et pas que pour le vélo." },
      { who: "Inès", t: "Arrêtez, s’il vous plaît.", me: false, her: true },
      { who: "Kévin", t: "Détends-toi, c’est entre nous." },
    ],
    prompt: "Chacun n’a écrit qu’un seul message. Peut-on parler de harcèlement sexuel ?",
    opts: [
      {t:  "Non : aucun message, pris seul, n’est assez grave ou répété pour constituer un harcèlement.", q:  0, cons:  "", fb:  "La loi prévoit justement le cas de plusieurs personnes : la répétition peut venir du groupe."},
      {t:  "Oui : à plusieurs, un seul message chacun peut suffire à faire la répétition.", q:  1, cons:  "", fb:  "C’est le « harcèlement de meute » prévu par le Code pénal, sans qu’il y ait besoin de concertation entre les auteurs."},
      {t:  "Seulement si Inès porte plainte ; sans plainte, cela reste un conflit d’équipe à régler en interne.", q:  0, cons:  "", fb:  "La qualification ne dépend pas d’une plainte. Et l’employeur doit faire cesser des agissements dont il a connaissance."},
      {t:  "Non : la conversation est privée et se tient hors du temps de travail, l’employeur n’y peut rien.", q:  0, cons:  "", fb:  "Une messagerie d’équipe n’efface pas le lien de travail, et les propos visent une collègue."},
    ],
    why: {"q": "Et pourquoi ?", "opts": [{"t": "Parce que des propos de plusieurs personnes qui s’additionnent font la répétition.", "ok": true}, {"t": "Parce qu’un seul message à connotation sexuelle suffit toujours à constituer un harcèlement.", "ok": false, "no": "Pas toujours : c’est la répétition, ici collective, qui caractérise le harcèlement."}, {"t": "Parce que tout ce qui se dit dans un groupe de travail engage la responsabilité de l’employeur.", "ok": false, "no": "C’est trop large : la qualification repose sur les propos et leur répétition, pas sur le canal."}]},
    better: "Plusieurs auteurs, même avec un seul message chacun, peuvent caractériser un harcèlement quand ils savent que leurs propos s’ajoutent à une répétition." },
  { id: "chatact", ch: 2, type: "multi", comp: "C3", kicker: "Toujours mardi, 18 h",
    prompt: "Que faites-vous ? Sélectionnez toutes les actions utiles.",
    opts: [
      { t: "Je demande d’arrêter et j’écris à Inès pour la soutenir.", ok: true, why: "Faire cesser les propos et soutenir la personne : premiers gestes." },
      { t: "Je conserve une trace utile, sans republier les messages.", ok: true, why: "Préserver les éléments sans prolonger l’exposition d’Inès." },
      { t: "J’alerte Nour : l’employeur doit faire cesser les faits.", ok: true, why: "L’alerte interne déclenche l’obligation de l’employeur." },
      { t: "Je transfère la conversation à toute l’équipe pour que chacun voie.", ok: false, why: "Diffuser à nouveau, c’est prolonger l’exposition d’Inès." },
      { t: "J’attends de voir si ça recommence.", ok: false, why: "La répétition est déjà là, et Inès a demandé d’arrêter." },
    ] },
  { id: "fin2", ch: 2, type: "dayend" },
  { id: "k2", ch: 2, type: "explain", page: { title: "Harcèlement, faits et hypothèses",
    pts: [
      "Le harcèlement sexuel peut résulter de propos ou comportements sexuels ou sexistes répétés, même sans proposition sexuelle.",
      "Plusieurs personnes peuvent y contribuer, même si chacune n’agit qu’une fois, quand elles savent que leurs propos s’ajoutent à une répétition.",
      "Je décris les faits et ce qui manque. Je sépare observations et hypothèses. Je n’attends pas d’être certain pour demander de l’aide.",
      "Enfant en danger ou en risque de l’être : 119 ou CRIP, la cellule départementale qui recueille les informations préoccupantes.",
    ], refs: ["R03", "R10", "Code pénal 222-33", "Code du travail L1153-5"] } },
  { id: "c3", ch: 3, type: "chapter" },
  { id: "sousef", ch: 3, type: "choice", npc: "nour", mood: "calm", comp: "C4", timer: 30, kicker: "Mercredi, 8 h 05 · le milieu de la semaine",
    context: "C’est la grosse journée : 52 enfants attendus du matin au soir. Trois jours de suite, la fatigue se voit sur tous les visages, et deux animateurs viennent d’appeler : malades. Nour vous prend à part : « On fait avec. Ce matin, tu gères seule les petits, et l’accompagnement aux sanitaires. »",
    prompt: "Que lui répondez-vous ?",
    opts: [
      { t: "Pas seule aux sanitaires : on regroupe des activités et on demande un renfort à l’organisateur.", q: 1, mood: "calm",
        cons: "L’organisateur envoie une animatrice remplaçante à 10 h. Jusque-là, deux groupes sont réunis dans la grande salle.",
        fb: "La fatigue et le sous-effectif sont précisément les moments où les règles tiennent ou cèdent : on adapte l’organisation, pas la sécurité." },
      { t: "D’accord pour ce matin : je ferai au mieux, on n’a pas vraiment le choix.", q: 0,
        cons: "À 9 h 40, vous êtes seule aux sanitaires avec un enfant en pleurs, et dix petits sans adulte dans la salle.",
        fb: "Accepter d’être seul, c’est laisser à la fois l’accompagnement et le groupe sans cadre. Le taux d’encadrement et le binôme ne sont pas négociables." },
      { t: "On annule les activités et on met tout le monde devant un film dans la salle de restauration.", q: 0.5,
        cons: "Le film calme la matinée, mais rien n’est prévu pour les sanitaires ni pour l’après-midi.",
        fb: "Réduire l’activité peut aider, mais ne règle ni l’encadrement ni l’accompagnement : il faut un renfort." },
    ] },
  { id: "parent2", hour: "8 h 40", ch: 3, type: "dialogue", comp: "C4", title: "Au portail : la maman de Malo", npc: "benali", start: "n1", parent: true,
    intro: "Mercredi, 8 h 40. Les parents déposent les enfants au portail, un mot rapide, et repartent. Mme Benali, la maman de Malo, revient sur ses pas.",
    nodes: {
      n1: { mood: "concern", t: "Je peux vous parler deux minutes ? Hier soir, Malo m’a dit qu’un grand lui avait montré des vidéos « pas pour les enfants » sur un téléphone, aux toilettes. Il m’a fait promettre de ne rien dire.",
        opts: [
          { t: "Merci d’être venue. Ce n’est pas normal, ni de sa faute. Je préviens la direction maintenant.", to: "n2", q: 1 },
          { t: "Les grands testent beaucoup à cet âge ; on va surtout rappeler les règles sur les téléphones.", to: "n1b", q: 0, note: "Montrer des images pornographiques à un enfant n’est jamais anodin, même entre enfants. L’équipe doit réagir." },
          { t: "Qui est-ce ? Donnez-moi son nom, je vais aller le voir tout de suite pour régler ça.", to: "n1c", q: 0.5, note: "Agir seul et à chaud, sans la direction, peut exposer les enfants concernés. On transmet : la direction organise la réponse." },
        ] },
      n1b: { mood: "angry", t: "C’est l’âge ?! Il a huit ans, il était choqué ! Vous trouvez ça normal ?",
        opts: [{ t: "Vous avez raison, pardon. Ce n’est pas anodin, et ce n’est pas sa faute. Je préviens la direction maintenant.", to: "n2", q: 0.5 }] },
      n1c: { mood: "o", t: "Je ne sais pas qui c’est. Il ne veut pas me le dire.",
        opts: [{ t: "D’accord, ne le forcez pas. Je préviens la direction maintenant : c’est elle qui organise la suite.", to: "n2", q: 1 }] },
      n2: { mood: "calm", t: "Et à Malo, qu’est-ce que je dis ? Il a peur qu’on sache que c’est lui qui a parlé.",
        opts: [
          { t: "Dites-lui qu’il a eu raison de parler et que les adultes s’en occupent, sans l’exposer.", to: "end", q: 1 },
          { t: "Conseillez-lui de ne plus aller aux toilettes en même temps que les grands, pour le protéger.", to: "n3", q: 0, note: "La consigne fait porter la protection sur l’enfant. C’est à l’équipe d’organiser les lieux et la surveillance." },
          { t: "On réunit tous les enfants ce matin pour faire un rappel collectif sur les vidéos.", to: "n3b", q: 0.5, note: "Une prévention collective est utile, mais pas à chaud : Malo serait identifié. La direction décide de la réponse, en protégeant sa parole." },
        ] },
      n3: { mood: "angry", t: "Mais ce n’est pas à lui de faire attention ! C’est à vous de surveiller, non ?",
        opts: [{ t: "Non, vous avez raison. C’est à nous d’organiser les toilettes et l’usage des téléphones pour que ça ne se reproduise pas. Dites-lui qu’il a eu raison de parler.", to: "end", q: 0.5 }] },
      n3b: { mood: "o", t: "Tous les enfants ? Il va se sentir montré du doigt…",
        opts: [{ t: "Vous avez raison : on protège d’abord Malo. La direction décidera de la suite, sans l’exposer.", to: "end", q: 0.5 }] },
      end: { end: true, mood: "smile", t: "D’accord. Merci de m’avoir écoutée.",
        lesson: "Quand un parent rapporte la parole de son enfant, on remercie, on ne minimise pas, on n’enquête pas soi-même et on transmet le jour même à la direction. Exposer un mineur à des images pornographiques est interdit (Code pénal, art. 227-24) : même entre enfants, l’équipe réagit et réorganise les lieux sensibles (toilettes, téléphones)." } } },
  { id: "ronde", ch: 3, type: "dialogue", comp: "C4", title: "La ronde de l’accueil", npc: "jade", scene: "S15", start: "n1",
    nodes: {
      n1: { mood: "big", t: "Pour se dire bonjour, chacun fait un câlin à son voisin ! … Malo ? Allez, toute l’équipe le fait, ne fais pas ton timide !",
        opts: [
          { t: "Malo, tu choisis : un signe de la main, un check… ou juste « salut ».", to: "n2", q: 1 },
          { t: "Allez Malo, un petit câlin pour dire bonjour, c’est la tradition de la ronde.", to: "n1b", q: 0, note: "Insister transforme une invitation en pression. Un refus doit pouvoir s’exprimer sans humiliation." },
          { t: "Je ne dis rien sur le moment, et j’en reparle à Jade après la ronde.", to: "n1c", q: 0, note: "Se taire laisse un enfant seul face à la pression du groupe." },
        ] },
      n1b: { mood: "o", narr: "Malo recule d’un pas. Les autres le regardent.", t: "Tu vois, il fait sa tête…",
        opts: [{ t: "Je me suis trompé·e. Malo, tu as le droit de dire non. On peut se saluer de loin.", to: "n2", q: 0.5 }] },
      n1c: { mood: "big", narr: "Malo reste figé. Personne ne bouge.", t: "Bon, Malo, on attend !",
        opts: [{ t: "J’interviens : chacun choisit sa façon de saluer, sans contact obligatoire.", to: "n2", q: 0.5 }] },
      n2: { mood: "smile", t: "Ah… oui, bonne idée. Chacun choisit sa salutation !",
        opts: [
          { t: "Après l’accueil, je propose à Jade qu’on change la consigne pour tout le séjour.", to: "end", q: 1 },
          { t: "Je fais remarquer à Jade, devant le groupe, qu’elle s’y est mal prise.", to: "endb", q: 0.5, note: "Corriger la consigne, oui ; mettre une collègue en difficulté devant les enfants, non." },
        ] },
      end: { end: true, mood: "smile", t: "Tu as raison, je réécris la consigne d’accueil ce soir.",
        lesson: "Le refus d’un contact se respecte. Une alternative sans contact enlève la pression, et corriger la consigne collective prévient la prochaine fois." },
      endb: { end: true, mood: "concern", t: "…D’accord. On en reparle.",
        lesson: "Le fond était juste : respecter le refus et proposer une alternative. La forme compte aussi : une consigne se corrige entre adultes, à l’écart des enfants." } } },
  { id: "chercher", ch: 3, type: "find", comp: "C1", kicker: "Mercredi, 15 h · temps libre", title: "Léna vous cherche",
    intro: "Nour vous transmet un message : Léna, 13 ans, veut vous dire quelque chose, et elle ne veut pas que les autres l’entendent. Elle est quelque part sur le terrain. Trouvez-la.",
    who: "lena", at: [16.6, 6.2], decoys: [["clara", 9.0, 25.0], ["enzo", 24.4, 21.0], ["sacha", 18.2, 24.6], ["zoe", 2.6, 21.2], ["theo", 12.2, 20.6]], timer: 60,
    found: "Léna, à voix basse : « Euh… Enzo, il a pris Clara en photo… dans les vestiaires. Et il dit qu’il va l’envoyer au groupe des grands. »",
    opts: [
      { t: "« Merci de me l’avoir dit, tu as bien fait. Je préviens Nour tout de suite, et on protège Clara. »", q: 1, fb: "Vous accueillez sa parole, sans enquêter, et vous alertez immédiatement : la photo n’a peut-être pas encore circulé." },
      { t: "« Tu es sûre ? Tu l’as vue, cette photo ? Montre-moi. »", q: 0, fb: "Demander à voir l’image, c’est risquer de la faire circuler davantage, et mettre en doute la parole de Léna." },
      { t: "« Je vais aller voir Enzo pour qu’il me donne son téléphone. »", q: 0.4, fb: "L’intention est bonne, mais agir seul et à chaud peut aggraver la situation : on alerte d’abord la référente." },
    ] },
  { id: "consent", ch: 3, type: "sort", comp: "C2", kicker: "Le carnet de Nour",
    context: "Nour vous tend une page : « Depuis la loi du 6 novembre 2025, le Code pénal précise que le consentement est libre et éclairé, spécifique, préalable et révocable. Montre-moi que tu sais les reconnaître. »",
    prompt: "Quelle caractéristique du consentement manque dans chaque situation ?",
    hint: "Libre = sans pression. Éclairé = en comprenant. Spécifique = pour cet acte-là. Préalable = avant. Révocable = on peut changer d’avis.",
    cats: [{ id: "lib", label: "Libre" }, { id: "ecl", label: "Éclairé" }, { id: "spe", label: "Spécifique" }, { id: "pre", label: "Préalable" }, { id: "rev", label: "Révocable" }],
    items: [
      { t: "Elle accepte seulement parce qu’on menace de l’exclure du groupe.", cat: "lib", why: "Un accord obtenu sous pression n’est pas libre." },
      { t: "Il ne comprend pas vraiment ce qu’on lui propose.", cat: "ecl", why: "Sans compréhension, l’accord n’est pas éclairé." },
      { t: "Elle a accepté d’envoyer une photo ; elle circule maintenant dans le groupe.", cat: "spe", why: "Accepter un échange privé n’autorise pas la diffusion." },
      { t: "On lui demande son accord après coup.", cat: "pre", why: "L’accord se donne avant l’acte." },
      { t: "Elle avait dit oui, puis demande d’arrêter.", cat: "rev", why: "On peut retirer son accord à tout moment : demander d’arrêter y met fin." },
    ] },
  { id: "silence", ch: 3, type: "choice", npc: "nour", mood: "calm", comp: "C2", kicker: "Une question de Nour",
    context: "« Et s’il n’a rien dit, rien fait, il est resté sans réaction ? »",
    prompt: "Est-ce un accord ?",
    opts: [
      {t:  "Oui, s’ils se connaissaient bien et qu’il n’a montré aucun signe de refus.", q:  0, cons:  "", fb:  "La relation antérieure ne vaut pas accord. Et l’absence de réaction n’est pas un oui."},
      {t:  "Non : se taire ou ne pas réagir ne veut pas dire accepter.", q:  1, cons:  "", fb:  "Depuis la loi du 6 novembre 2025, le Code pénal le dit explicitement : le consentement ne peut être déduit du seul silence ou de la seule absence de réaction.", mood:  "smile"},
      {t:  "Ça dépend du contexte : de ce qui s’était passé juste avant entre eux.", q:  0.5, cons:  "", fb:  "Les circonstances comptent pour apprécier le consentement, mais elles ne transforment jamais un silence en accord."},
    ],
    why: {"q": "Et pourquoi ?", "opts": [{"t": "Parce qu’un consentement se donne librement : il ne se déduit pas d’un silence.", "ok": true}, {"t": "Parce que tout contact physique entre jeunes est interdit en accueil collectif de mineurs.", "ok": false, "no": "Ce n’est pas la règle : la question est celle de l’accord, pas d’une interdiction générale."}, {"t": "Parce qu’un mineur ne peut jamais consentir à rien, quel que soit son âge.", "ok": false, "no": "C’est inexact dit ainsi : la loi protège spécialement les moins de 15 ans, mais la question posée ici est celle du silence."}]},
    better: "Le silence, l’absence de réaction, un rire ou une relation antérieure ne prouvent jamais le consentement." },
  { id: "fin3", ch: 3, type: "dayend" },
  { id: "kevin", ch: 3, type: "multi", comp: "C2", npc: "kevin", mood: "smile", kicker: "Mercredi, 18 h · après le départ des enfants",
    context: "Kévin, animateur de 24 ans, vous confie : « Clara m’écrit tous les soirs depuis la semaine dernière. Elle est un peu perdue en ce moment, elle a besoin de parler. Elle m’a proposé qu’on se voie samedi, juste un café. Elle a 17 ans, et c’est elle qui le propose… Il n’y a rien de mal, si ? » Clara fait partie du groupe qu’il encadre.",
    prompt: "Quels arguments lui opposer ? Sélectionnez tous ceux qui sont justes.",
    opts: [
      { t: "Tu encadres son groupe : tu as autorité sur elle. La loi protège le mineur face à un majeur ayant autorité, même après 15 ans.", ok: true, why: "C’est l’article 227-27 du Code pénal." },
      { t: "Un animateur garde une distance éducative avec les jeunes qu’il encadre.", ok: true, why: "C’est le cœur du rôle éducatif." },
      { t: "La question n’est pas de savoir si elle paraît mature.", ok: true, why: "La maturité supposée ne change rien à la protection." },
      { t: "À partir de 15 ans, tout est permis.", ok: false, why: "Règle simpliste et fausse : l’autorité et l’âge restent déterminants." },
      { t: "Le seul problème, c’est que ça se sache.", ok: false, why: "Le problème, c’est la situation d’autorité, pas sa visibilité." },
    ],
    after: "Et ensuite : mettre fin à la situation d’autorité exposante, alerter l’organisateur et les autorités compétentes, sans culpabiliser Clara." },
  {"id": "nuit1", "ch": 3, "type": "story", "scene": "S15", "nuitee": true, "lines": [{"who": null, "t": "Mercredi, 20 h 30. Ce soir, douze enfants de 8 à 11 ans dorment à l’accueil : c’est la nuitée prévue dans le projet de la semaine."}, {"who": "nour", "mood": "calm", "t": "Les locaux de couchage ont été déclarés, le planning de la nuit est affiché. Reste le plus important : comment chacun d’entre nous s’organise, adulte par adulte."}, {"who": null, "t": "Pour la nuit, la salle des 6-11 ans est devenue un dortoir. Bastien a apporté sa guitare, Jade distribue les lampes de poche."}], "kicker": "Mercredi, 20 h 30 · la nuitée"},
  {"id": "nuit2", "ch": 3, "type": "sort", "comp": "C2", "nuitee": true, "kicker": "Préparer la nuit", "prompt": "Dans l’organisation de la nuit, qu’est-ce qui protège, et qu’est-ce qui expose ?", "cats": [{"id": "pro", "label": "Protège"}, {"id": "exp", "label": "Expose"}], "items": [{"t": "Les adultes dorment dans une pièce voisine, porte entrouverte, avec un veilleur identifié pour la nuit.", "cat": "pro", "why": "Les adultes sont disponibles sans partager l’espace de couchage des enfants."}, {"t": "Un animateur dort dans le dortoir, entre les lits, « pour rassurer ».", "cat": "exp", "why": "Partager l’espace de couchage brouille les limites et expose enfants et adultes."}, {"t": "Chacun peut se changer à l’abri des regards, filles et garçons dans des espaces séparés.", "cat": "pro", "why": "L’intimité de chaque enfant est respectée."}, {"t": "Bastien filme le coucher pour rassurer les parents sur le groupe de messagerie.", "cat": "exp", "why": "Pas de photos ni de vidéos d’enfants au coucher, en pyjama ou à la toilette."}, {"t": "Les douches se font par petits groupes, un adulte reste à l’extérieur.", "cat": "pro", "why": "La surveillance se fait sans entrer dans un espace d’intimité."}, {"t": "Un enfant qui a peur peut venir finir la nuit dans le lit d’un adulte.", "cat": "exp", "why": "On rassure près du lit de l’enfant, jamais dans celui d’un adulte."}, {"t": "Un enfant qui a mouillé son lit est aidé discrètement, par deux adultes, sans commentaire devant le groupe.", "cat": "pro", "why": "Discrétion pour l’enfant, et deux adultes pour ne jamais être seul avec lui."}, {"t": "Les téléphones des adultes restent dans la salle de l’équipe pendant le coucher.", "cat": "pro", "why": "Moins de risque de photos et plus d’attention aux enfants."}]},
  {"id": "nuit3", "ch": 3, "type": "choice", "npc": "bastien", "mood": "concern", "comp": "C3", "nuitee": true, "timer": 20, "kicker": "Mercredi, 23 h 40", "context": "Sacha, 11 ans, pleure : il a fait un cauchemar. Bastien vous chuchote : « Je le prends dans mon lit cinq minutes, il va se calmer. »", "prompt": "Que faites-vous ?", "opts": [{"t": "D’accord pour cinq minutes, mais il reste habillé et la porte reste ouverte.", "q": 0, "cons": "Sacha se calme… et revient la nuit suivante. Un autre enfant demande la même chose.", "fb": "Même brièvement, le lit d’un adulte n’est pas un lieu pour un enfant : les limites doivent être claires pour tous."}, {"t": "Non : on le rassure assis près de son lit, et je reste avec vous.", "q": 1, "cons": "Sacha se rendort au bout d’un quart d’heure, sa lampe de poche à la main.", "fb": "On rassure l’enfant dans son espace à lui, à deux adultes. C’est la réponse attendue.", "mood": "calm"}, {"t": "Tu l’emmènes dans la salle des adultes pour qu’il ne réveille pas les autres.", "q": 0, "cons": "Sacha se retrouve seul avec un adulte, dans une pièce fermée, en pleine nuit.", "fb": "Isoler un enfant avec un adulte, la nuit, dans une pièce fermée, c’est exactement le risque à éviter."}, {"t": "On appelle ses parents : s’il ne se calme pas, ils viendront le chercher cette nuit.", "q": 0.5, "cons": "Les parents arrivent à 0 h 30. Sacha aurait pu être rassuré sur place.", "fb": "C’est possible si la détresse dure, mais on commence par rassurer l’enfant sur place, dans un cadre sûr."}], "why": {"q": "Et pourquoi ?", "opts": [{"t": "Parce qu’on rassure un enfant chez lui, sans l’isoler avec un adulte.", "ok": true}, {"t": "Parce que les enfants n’ont pas le droit de quitter leur lit pendant la nuit.", "ok": false, "no": "Un enfant peut se lever et être rassuré : ce qui compte, c’est où et avec qui."}, {"t": "Parce que Bastien n’est pas encore titulaire de son BAFA complet.", "ok": false, "no": "La qualification n’est pas en cause : la règle vaut pour tous les adultes."}]}, "better": "Rassurer près du lit de l’enfant, à deux adultes, sans l’isoler. Les règles de la nuit se décident avant la nuitée, avec toute l’équipe."},
  {"id": "kn", "ch": 3, "type": "explain", "nuitee": true, "page": {"title": "La nuitée", "pts": ["En accueil de loisirs, une nuitée est une activité accessoire : d’une à quatre nuits, prévue dans le projet pédagogique, avec des locaux de couchage déclarés.", "La nuit, les risques changent : fatigue, peur, intimité, isolement. On les anticipe : espaces séparés, adultes identifiés, jamais seul dans un lit ou une pièce fermée avec un enfant.", "Aucune photo ni vidéo des enfants au coucher, en pyjama ou à la toilette."], "refs": ["CASF R227-1", "Projet pédagogique"]}},
  { id: "k3", ch: 3, type: "explain", page: { title: "Le consentement",
    quote: "« Au sens de la présente section, le consentement est libre et éclairé, spécifique, préalable et révocable. » Code pénal, art. 222-22 (loi du 6 novembre 2025)",
    pts: [
      "Sans pression, avec compréhension, pour ce qui est proposé, avant l’acte, et avec le droit de changer d’avis.",
      "Le silence ou l’absence de réaction ne suffisent pas. Une personne endormie ne peut pas donner son accord.",
      "L’âge et l’autorité comptent : un accord exprimé ne suffit pas à rendre licite tout acte entre un adulte et un mineur.",
      "Dans les gestes ordinaires : proposer des alternatives sans contact, laisser un refus possible sans humiliation.",
    ], refs: ["R06", "R07", "Code pénal 222-22", "Code pénal 227-27"] } },
  { id: "c4", ch: 4, type: "chapter" },
  // Jeudi après-midi : deuxième promenade libre. Trois situations nouvelles, dont deux formats de mini-jeu inédits :
  // « J'interviens » (agir au bon moment, pendant que la scène se déroule) et « Le panneau » (épingler les bonnes affiches).
  { id: "jeudi-libre", ch: 4, type: "roam", startNode: "f13", kicker: "Jeudi, 13 h 30 · temps libre", title: "Jeudi, en volante",
    bridge: "Jeudi, 13 h 30. Après le repas, Nour vous laisse à nouveau circuler dans l’accueil jusqu’à 16 h.",
    start: "13 h 30", end: "16 h", from: "cour",
    intro: "Avancez sur les chemins, entrez dans les salles, et gardez l’œil ouvert. Nour vous attend au panneau d’affichage avant 15 h 30.",
    life: [
      { who: "samia", loop: [[7.4, 24.9], [5.6, 25.3], [7.9, 26.3]], speed: 3.0, pose: "run", pause: 700, gest: ["laugh", "raise", "nod"] },
      { who: "k3", loop: [[5.6, 25.3], [7.9, 26.3], [7.4, 24.9]], speed: 3, pose: "run", pause: 400, prop: "dribble" },
      { who: "k6", loop: [[7.9, 26.3], [7.4, 24.9], [5.6, 25.3]], speed: 2.6, pose: "run", pause: 600, gest: ["raise", "laugh"] },
      { who: "tom", at: [15.3, 28.7], gest: ["explain", "present", "nod"] },
      { who: "k4", at: [16.6, 26.9], gest: ["laugh", "scratch", "raise"] },
      { who: "t1", at: [17.3, 23.7], gest: ["explain", "laugh", "shrug"], face: [18.2, 24.3] },
      { who: "t2", at: [18.2, 24.4], gest: ["laugh", "explain2", "cross"], back: true },
      { who: "k1", loop: [[16.4, 22.3], [10.6, 22.5]], speed: 3.2, pose: "run", pause: 1500 },
      { who: "k5", at: [26.0, 22.9], gest: ["explain", "laugh", "raise"] },
    ],
    events: [
      { id: "verite", kind: "vigil", at: "parc", from: "13 h 30", to: "15 h 30", comp: "C2", kicker: "Jeudi après-midi · le parc", title: "Action ou vérité",
        spots: [["sacha", 13.4, 6.6, "talk", ["explain", "laugh", "point"]], ["zoe", 14.8, 7.0, "stand", ["fidget", "downcast"]], ["k5", 13.9, 5.6, "stand", ["laugh", "raise"]], ["k2", 15.1, 5.9, "stand", ["laugh"]]],
        cast: [["sacha", "a", "talk"], ["zoe", "b", "sad"], ["you", "f", "walk"]],
        intro: "Au parc, un petit groupe joue à l’écart des animateurs. Observez. Intervenez au moment où il le faut : ni trop tôt pour rien, ni trop tard.",
        beats: [
          ["sacha", "Allez, on joue à action ou vérité ! Zoé, action ou vérité ?", 0],
          ["zoe", "Euh… je prends action.", 0],
          ["sacha", "Action : tu fais un bisou sur la bouche à Malo. Sinon t’es une poule mouillée !", 1],
          ["zoe", "J’ai pas envie… Je veux pas.", 1],
          ["narr", "Les autres se mettent à crier « Bisou ! Bisou ! » et poussent Zoé vers Malo.", 1],
          ["sacha", "Vas-y, t’as pas le choix, c’est la règle du jeu !", 2],
        ],
        // ce que vous pouvez dire dépend de ce qui s'est vraiment passé quand vous intervenez (min / max : répliques entendues)
        words: [
          { max: 2, t: "« Je viens jouer avec vous. Une règle avant de continuer : un gage, on peut toujours le refuser, et on n’insiste pas. »", q: 1 },
          { max: 2, t: "« Allez, on arrête ce jeu de bébés, tout le monde va jouer ailleurs. »", q: 0.5 },
          { min: 3, max: 3, t: "« Stop. Un bisou, ça ne s’impose pas : personne n’est obligé de faire ce gage. On le change. »", q: 1 },
          { min: 3, max: 3, t: "« Allez, on arrête ce jeu de bébés, tout le monde va jouer ailleurs. »", q: 0.5 },
          { min: 4, t: "« Stop. Ici, personne n’est obligé d’embrasser qui que ce soit. Zoé a dit non : on arrête ce gage. »", q: 1 },
          { min: 4, t: "« Allez, on arrête ce jeu de bébés, tout le monde va jouer ailleurs. »", q: 0.5 },
        ],
        opts: [
          { t: "Je suis intervenue dès que le gage a été imposé, et j’ai nommé la règle : personne n’est obligé.", q: 1,
            cons: "Zoé a pu dire non, et ce non a été respecté devant tout le groupe. Le lendemain, quand un gage gênant revient, c’est Sacha lui-même qui dit : « Si elle veut pas, c’est non. »",
            fb: "Un « gage » de bisou imposé par le groupe est une contrainte : le consentement doit être libre, et la pression du groupe l’empêche. L’adulte intervient dès que la contrainte apparaît, et nomme la règle plutôt que de simplement interrompre le jeu." },
          { t: "Je suis intervenue, mais trop tard, ou sans dire pourquoi.", q: 0.5,
            cons: "Le jeu s’est arrêté, mais personne n’a compris pourquoi. Le gage est revenu le lendemain, ailleurs, loin des adultes.",
            fb: "Faire cesser est indispensable ; mais sans nommer la règle (le consentement, le droit de dire non), les enfants n’apprennent rien, et la pression se déplace." },
          { t: "Je ne suis pas intervenue.", q: 0,
            cons: "Zoé a été poussée jusqu’à Malo devant tout le groupe. Le soir, elle a dit à son père qu’elle ne voulait plus jouer au parc.",
            fb: "Laisser faire un gage imposé apprend aux enfants que le « non » ne compte pas face au groupe. C’est exactement ce qu’il faut prévenir." },
          { t: "Je suis intervenue avant qu’un gage ne soit imposé, en rappelant qu’on peut refuser.", q: 0.5,
            cons: "Le jeu a continué avec vous à côté, et chacun savait qu’il pouvait refuser un gage. Mais rien ne s’était encore passé : les enfants n’ont pas vraiment compris ce qui posait problème.",
            fb: "Être présent et poser la règle à l’avance est utile. Mais l’essentiel est d’intervenir au moment où la contrainte apparaît, et de nommer ce qui se passe : personne n’est obligé, un non est un non." },
        ],
        better: "Intervenir dès que la contrainte apparaît, et nommer la règle : personne n’est obligé, un non est un non." },
      { id: "sieste", at: "petits", room: "petits", from: "13 h 45", to: "15 h 45", comp: "C3", kicker: "Jeudi après-midi · la salle des 6-11 ans", title: "La porte fermée",
        cast: [["kevin", "s1", "sit"], ["malo", "s2"], ["you", "a", "walk"]],
        lines: [["narr", "C’est l’heure de la sieste des petits. La porte de la salle est fermée, les rideaux tirés. À l’intérieur, Kévin est seul avec Malo, réveillé, assis tout contre lui."], ["kevin", "Ah, c’est toi ! Il arrivait pas à dormir, je le rassure. Ferme bien derrière toi, ça fait du courant d’air."]],
        prompt: "Que faites-vous ?",
        opts: [
          { t: "Je laisse la porte ouverte, je propose à Malo de venir s’allonger sur un tapis près de moi, et je rappelle la règle à Kévin, puis j’en parle à Nour.", q: 1, react: { kevin: "stand", malo: "stand" }, reply: ["kevin", "Ah… oui, t’as raison. Je fais pas attention."],
            cons: "Depuis jeudi, la porte de la sieste reste ouverte et un deuxième adulte passe régulièrement. Kévin l’a dit lui-même en réunion : « On se protège aussi, comme ça. »",
            fb: "Être seul avec un enfant, porte fermée, avec un contact physique prolongé, c’est une situation à risque, même avec de bonnes intentions : pour l’enfant comme pour l’adulte. On rétablit la règle (jamais seul hors de vue, pas d’enfant sur les genoux pendant la sieste), sans accuser, et on transmet à la direction." },
          { t: "Je ferme la porte derrière moi pour ne pas réveiller les autres et je ressors sans rien dire : il s’occupe bien de lui.", q: 0, react: { kevin: "talk" }, reply: ["kevin", "Merci !"],
            cons: "Rien ne change : la porte de la sieste reste fermée tous les après-midi, avec un seul adulte.",
            fb: "Refermer la porte, c’est valider une situation à risque. Les règles de prudence ne supposent pas que l’adulte est mal intentionné : elles protègent tout le monde." },
          { t: "Je dis à Kévin devant Malo que ce qu’il fait est interdit et je vais tout de suite chercher Nour.", q: 0.5, react: { kevin: "sad", malo: "sad" }, reply: ["malo", "J’ai fait une bêtise, moi ?"],
            cons: "La règle est rétablie, mais Malo a cru qu’il avait fait quelque chose de mal, et Kévin s’est senti accusé devant un enfant.",
            fb: "Rétablir la règle et transmettre, c’est juste. Mais on évite de mettre l’enfant au milieu : on agit calmement sur la situation, puis on en parle entre adultes." },
        ],
        better: "Rouvrir la porte, éloigner calmement l’enfant de la situation, rappeler la règle sans accuser, puis transmettre à la direction." },
      { id: "panneau", kind: "board", must: true, r: 2.2, at: "panneau", props: { nour: "paper" }, from: "13 h 30", to: "16 h", comp: "C4", kicker: "Jeudi après-midi · le panneau d’affichage", title: "Le panneau des familles",
        nudge: "15 h", nudgeLine: ["nour", "Tu passes au panneau d’affichage ? Il me manque des affiches pour l’inspection de demain."],
        spots: [["nour", 25.9, 27.3, "talk", ["explain", "present", "point"]]],
        cast: [["nour", "a", "talk"], ["you", "f", "walk"]],
        lines: [["nour", "Demain, il y a une visite d’inspection. Sur ce panneau, il manque ce qui doit obligatoirement être affiché pour les familles et pour les jeunes. Tu choisis les trois affiches qu’il faut épingler ?"]],
        posters: [
          { t: "Allô 119 · Enfance en danger", s: "Numéro national, gratuit, 24 h sur 24", ok: 1 },
          { t: "Nos règles de vie et le projet pédagogique", s: "Ce qu’on fait ici, et comment on se respecte", ok: 1 },
          { t: "À qui parler ?", s: "Nom et photo de la référente, numéros d’urgence", ok: 1 },
          { t: "Menu de la semaine", s: "Lundi : lasagnes…", ok: 0 },
          { t: "Photo de l’équipe en soirée", s: "Le pot de début de saison", ok: 0 },
          { t: "Sortie au zoo", s: "Inscriptions jusqu’à vendredi", ok: 0 },
        ],
        opts: [
          { t: "J’ai épinglé les trois affiches essentielles : le 119, les règles de vie et « À qui parler ? ».", q: 1,
            cons: "À l’inspection, le panneau est cité en exemple. Et mardi suivant, une jeune a appelé le 119 depuis le numéro vu sur le panneau, pour une situation à la maison.",
            fb: "L’affichage du numéro national de l’enfance en danger (119) est obligatoire dans les accueils collectifs de mineurs. Les règles de vie et un nom à qui parler rendent la prévention visible et la parole possible." },
          { t: "J’ai épinglé deux des trois affiches essentielles.", q: 0.5,
            cons: "Le panneau est presque complet. L’inspection relève un manque, que Nour corrige le soir même.",
            fb: "Le 119 doit être affiché, de façon visible ; et les enfants comme les familles doivent savoir à qui parler, et quelles sont les règles." },
          { t: "J’ai épinglé surtout des affiches pratiques.", q: 0,
            cons: "L’inspection relève l’absence d’affichage obligatoire. Personne, cette semaine, ne savait vers qui se tourner.",
            fb: "L’affichage obligatoire n’est pas décoratif : il donne aux enfants et aux familles les moyens de parler et d’alerter." },
        ],
        better: "Afficher le 119, les règles de vie et le projet, et le nom de la personne à qui parler." },
    ],
    calm: {
      jeux: { t: "À l’aire de jeux, Samia, une animatrice des 6-11 ans, joue au chat avec les enfants. Tout le monde court." },
      potager: { t: "Au potager, Tom et les enfants récoltent les premières courgettes." },
      preau: { t: "Sous le préau, deux grands révisent une chorégraphie pour la fête de vendredi." },
      cour: { t: "Dans la cour, deux enfants gonflent les ballons pour le temps libre." },
      grands: { cast: [["ines", "a", "talk"], ["you", "b"], ["sacha", "s1"], ["k5", "s2"]], room: "grands", t: "Dans la salle des 11-14 ans, Inès aide Sacha et un autre jeune à finir leurs maquettes. Les autres sont dehors." },
      petits: { cast: [["jade", "a", "talk"], ["you", "b"], ["malo", "s2"]], room: "petits", before: "La sieste n’a pas encore commencé : Jade installe les tapis.", t: "La sieste est finie. Jade range les tapis ; la porte est grande ouverte." },
      equipe: { cast: [["you", "b"]], room: "equipe", t: "La salle des animateurs est calme. Tous les animateurs semblent être avec leur groupe." },
      ados: { cast: [["hugo", "a", "talk"], ["t1", "s1"], ["t4", "s2"], ["t2", "d"], ["you", "b"]], room: "ados", t: "Dans la salle des 14-17 ans, Hugo et les ados répètent le sketch qu’ils joueront vendredi à la fête. On rit beaucoup." },
      cuisine: { cast: [["yanis", "a", "talk"], ["k2", "c"], ["k9", "d"], ["you", "b"]], room: "cuisine", t: "Dans la cuisine pédagogique, Yanis prépare la pâte à crêpes du goûter avec deux enfants de son groupe." },
      libre: { cast: [["lea", "a", "talk"], ["k7", "c"], ["k8", "d"], ["you", "b"]], room: "libre", t: "Dans la salle d’activités, Léa anime un atelier de perles avec des petits." },
      direction: { cast: [["you", "b"]], room: "direction", t: "Le bureau de Nour est vide : elle est au panneau d’affichage, à préparer la visite d’inspection de demain." },
      refectoire: { cast: [["you", "a"]], room: "refectoire", t: "La salle de restauration est vide. Les tables sont déjà dressées pour demain midi." },
      radio: { cast: [["bastien", "c", "talk"], ["lena", "s2", "sit"], ["clara", "s1", "sit"], ["you", "a"]], room: "radio", t: "À l’atelier radio, Léna et Clara sont à la console. Elles enregistrent la météo de la semaine." },
      sanitaires: { cast: [["you", "b"]], room: "sanitaires", t: "Aux sanitaires, la porte du bloc est ouverte, et un planning de passages est affiché." },
    },
    end_t: "Le temps libre se termine : les enfants se rassemblent dans la cour en attendant leurs parents." },
  { id: "depart", ch: 4, type: "story", scene: "S13", kicker: "Jeudi, 16 h · les familles arrivent à 17 h",
    lines: [
      { who: null, t: "Les familles arrivent dans une heure. Lou, 10 ans, s’approche, son sac à la main." },
      { who: "lou", mood: "calm", t: "Je… je veux pas rentrer. Y a un adulte, à la maison… il me touche. Et il m’a dit de rien dire. Tu gardes le secret, hein ?" },
      { who: null, t: "La personne que Lou désigne doit venir le chercher dans une heure." },
    ] },
  { id: "lou", ch: 4, type: "dialogue", comp: "C3", title: "Accueillir la parole de Lou", npc: "lou", start: "n1",
    nodes: {
      n1: { mood: "calm", t: "Tu… tu gardes le secret, hein ?",
        opts: [
          { t: "D’accord, c’est promis : je ne dirai rien à personne, tu peux me faire confiance.", to: "nsecret", q: 0, flag: "secret", note: "Tu promets ce que tu ne pourras pas tenir : pour protéger Lou, tu devras en parler." },
          { t: "Qui ça ? Il t’a fait quoi exactement ? Raconte-moi tout, depuis le début.", to: "nquest", q: 0, flag: "enquete", note: "Demander une démonstration ou des détails n’est pas ton rôle : ça peut orienter et fragiliser sa parole." },
          { t: "Merci de me l’avoir dit. Tu as bien fait. Ce n’est pas ta faute.", to: "n2", q: 1 },
        ] },
      nsecret: { mood: "smile", t: "Merci…",
        opts: [{ t: "Lou, je me suis trompé·e. Pour t’aider, je vais devoir prévenir des personnes dont c’est le métier de protéger les enfants.", to: "n2b", q: 0.5 }] },
      nquest: { mood: "concern", t: "Euh… je sais pas. Laisse tomber.",
        opts: [{ t: "Pardon, tu n’as pas à m’en dire plus. Merci de m’avoir parlé, ce n’est pas de ta faute.", to: "n2", q: 0.5 }] },
      n2: { mood: "calm", t: "Tu vas… tu vas le dire à qui ?",
        opts: [
          { t: "À des gens dont c’est le métier de protéger les enfants. Je reste avec toi.", to: "end", q: 1 },
          { t: "À personne sans ton accord, ne t’inquiète pas : c’est toi qui décides.", to: "nsecret2", q: 0, flag: "secret", note: "Rassurer par un secret, c’est bloquer la protection." },
          { t: "Je te promets qu’il ne pourra plus jamais te faire de mal, il ira en prison.", to: "n3", q: 0, note: "On ne garantit ni une peine, ni l’absence de conséquence familiale." },
        ] },
      n2b: { mood: "concern", t: "Mais… t’avais promis…",
        opts: [{ t: "Je sais. Je préfère te dire la vérité : on va chercher de l’aide, et je reste avec toi.", to: "end", q: 1 }] },
      nsecret2: { mood: "smile", t: "D’accord…",
        opts: [{ t: "En fait, non : je dois prévenir des personnes qui protègent les enfants. Je reste avec toi.", to: "end", q: 0.5 }] },
      n3: { mood: "o", t: "Euh… en prison ?!",
        opts: [{ t: "Je ne sais pas ce qui va se passer. Mais je vais chercher de l’aide, et je reste avec toi.", to: "end", q: 0.5 }] },
      end: { end: true, mood: "calm", t: "…D’accord. Merci.",
        lesson: "Remercier, dire que l’enfant n’est pas responsable, ne jamais promettre le secret, expliquer simplement que certaines informations doivent être partagées pour le protéger. Ne pas demander de démonstration, ne pas faire répéter." } } },
  { id: "numero", ch: 4, type: "dial", comp: "C3", kicker: "Jeudi, 16 h 05", title: "Il faut appeler quelqu’un, maintenant", timer: 30,
    intro: "L’adulte qu’il désigne doit venir le chercher dans moins d’une heure. Il faut appeler quelqu’un, tout de suite. Qui appelez-vous ? Composez le numéro.",
    help: "Le danger est immédiat : Lou risque d’être remis à cet adulte dans moins d’une heure. Ce sont les forces de l’ordre qu’il faut appeler : le 17, ou le 112.",
    caller: "Gendarmerie", relay: { "112": "Urgences, 112. Je vous mets en relation avec la gendarmerie, ne quittez pas." }, convo: [
      { t: "Gendarmerie nationale, je vous écoute.", opts: [
        { t: "Je suis animateur à l’accueil de loisirs des Hautes Herbes. Un enfant de 10 ans vient de me révéler des violences sexuelles de la part de l’adulte qui doit venir le chercher à 17 h.", q: 1, fb: "Qui vous êtes, où vous êtes, ce qui se passe et l’urgence : l’essentiel en une phrase." },
        { t: "Je crois qu’un père agresse son enfant, il faut venir l’arrêter.", q: 0.3, fb: "Vous rapportez une conclusion, pas ce que l’enfant a dit. Et l’enfant n’a pas désigné son père." },
        { t: "Je voulais juste vous demander conseil, ce n’est peut-être rien.", q: 0, fb: "Minimiser retarde l’intervention : le danger est immédiat, dites-le." } ] },
      { t: "Qu’est-ce que l’enfant vous a dit, exactement ?", opts: [
        { t: "Ses mots : « Y a un adulte, à la maison… il me touche. Et il m’a dit de rien dire. » Je les ai notés, avec l’heure.", q: 1, fb: "Les mots exacts, sans les interpréter : c’est ce qui protège sa parole." },
        { t: "Je lui ai posé des questions pour avoir des détails, et il a fini par dire oui.", q: 0, fb: "Des questions orientées fragilisent la parole de l’enfant. Ce n’est pas votre rôle." },
        { t: "En gros, qu’on le touche. Je ne me souviens plus des mots.", q: 0.4, fb: "Notez les mots exacts dès que l’enfant parle : ils comptent pour la suite." } ] },
      { t: "Où se trouve l’enfant en ce moment ?", opts: [
        { t: "Avec moi et une collègue, au calme, à l’intérieur de l’accueil. Personne ne le remettra à cet adulte.", q: 1, fb: "L’enfant est protégé et accompagné : c’est la priorité." },
        { t: "Il est retourné jouer avec les autres, dans la cour, près du portail.", q: 0, fb: "Près du portail, l’enfant reste exposé à l’adulte qui arrive." },
        { t: "Je l’ai laissé seul dans le bureau pour pouvoir vous appeler.", q: 0.3, fb: "Un enfant qui vient de parler ne doit pas rester seul : demandez à une collègue de rester avec lui." } ] },
    ],
    ok: ["17", "112"], near: { "119": "Le 119 conseille et transmet, mais ne se déplace pas : le danger est immédiat, il faut le 17 ou le 112.", "15": "Le 15, c’est l’urgence médicale. Ici, il faut empêcher que Lou soit remis à cet adulte : 17 ou 112.", "114": "Le 114 est le numéro d’urgence par SMS, pour les personnes qui ne peuvent pas parler. Vous pouvez appeler : 17 ou 112.", "3018": "Le 3018 concerne le harcèlement en ligne. Ici, le danger est immédiat : 17 ou 112." },
    interrupt: { who: "clara", t: "Clara vous tire par la manche : « Tu viens arbitrer le match ? Ils trichent ! »" },
    done: "Très bien. Une patrouille arrive. Restez avec l’enfant, ne le remettez à personne, ne prévenez pas cet adulte, et informez votre direction." },
  { id: "acts", ch: 4, type: "swipe", comp: "C3", kicker: "16 h 06 · après l’appel", title: "Décider sous pression",
    interrupts: [
      { who: "bastien", t: "Bastien passe la tête : « Qu’est-ce qui se passe avec Lou ? Tout le monde se demande. »", ok: "« Nour s’en occupe, je ne peux pas t’en dire plus. » Je reste avec Lou.", ko: "Je lui raconte ce que Lou m’a confié, il est de l’équipe.", why: "Seules les personnes qui doivent agir reçoivent l’information : Lou n’a pas à devenir le sujet de conversation de l’équipe." },
      { who: "k5", t: "Deux enfants accourent : le ballon est coincé sur le toit du préau, ils veulent que vous veniez.", ok: "« Allez voir Jade, elle va vous aider. » Je reste avec Lou.", ko: "J’y vais deux minutes, Lou m’attend ici.", why: "Lou ne reste jamais seul après avoir parlé : un collègue peut s’occuper du ballon." },
    ],
    prompt: "L’adulte désigné par Lou doit venir le chercher à 17 h. Chaque action prend du temps : faites celles qui protègent Lou, et seulement celles-là.",
    cats: [{ id: "eng", label: "À engager" }, { id: "eca", label: "À écarter" }, { id: "dur", label: "Dans la durée" }],
    items: [
      { t: "A01 · Mettre Lou à l’abri", cat: "eng", min: 4, now: "Lou reste avec vous, à l’écart du portail des familles.", why: "Éviter une nouvelle exposition, rechercher les secours." },
      { t: "A02 · Accueillir sa parole", cat: "eng", min: 8, now: "Vous l’écoutez sans lui poser de questions, et vous lui expliquez à qui vous allez en parler.", why: "Écouter sans suggérer, expliquer à qui l’on transmet." },
      { t: "A03 · Noter ses mots exacts", cat: "eng", min: 6, now: "Ses mots, l’heure, le lieu : tout est noté.", why: "Observations, paroles exactes, date et contexte." },
      { t: "A04 · Alerter Nour et les autorités", cat: "eng", min: 5, now: "Nour est prévenue ; les gendarmes sont en route.", why: "Responsable sûr et autorités, sans attendre une enquête interne." },
      { t: "A05 · Promettre le secret à Lou", cat: "eca", min: 3, cost: 6, effect: "Lou se ferme : « Tu avais promis… ». Il faut tout réexpliquer.", why: "La protection exige de transmettre." },
      { t: "A06 · Appeler M. Rey pour comprendre", cat: "eca", min: 5, cost: 15, effect: "M. Rey est prévenu : il part tout de suite pour l’accueil. Il arrive plus tôt.", why: "Jamais de confrontation : l’enquête appartient aux services compétents." },
      { t: "A07 · Attendre une preuve", cat: "eca", min: 10, effect: "Dix minutes perdues : on n’attend ni certitude ni aveux pour alerter.", why: "On n’attend ni certitude ni aveux pour alerter." },
      { t: "A09 · Prévenir la maman tout de suite", cat: "eca", min: 4, cost: 10, effect: "La maman appelle son compagnon… M. Rey est en route.", why: "Ici, l’adulte désigné vit au domicile : l’information des parents se décide avec les autorités." },
      { t: "A10 · Raconter à toute l’équipe", cat: "eca", min: 6, effect: "L’information circule : plusieurs collègues viennent poser des questions à Lou.", why: "Seules les personnes qui doivent agir reçoivent les informations nécessaires." },
      { t: "A08 · Organiser le suivi avec les services : vérifier la protection, les relais, l’absence de représailles", cat: "dur", why: "La protection continue après l’alerte : on vérifie les mesures, les relais, l’absence de représailles." },
    ] },
  { id: "ordre", crisis: {"secs": 75, "start": "16 h 06", "intro": "Il est 16 h 06. Lou vient de parler, l’adulte désigné arrive à 17 h. Agissez dans l’ordre qui protège Lou, en restant concentrée : d’autres demandes vont arriver.", "events": [{"at": 9, "who": "phone", "t": "Le téléphone de l’accueil sonne : une maman demande si sa fille peut partir plus tôt.", "opts": [{"t": "Je décroche et je règle ça", "ok": false, "no": "Vous quittez Lou des yeux pendant de longues minutes."}, {"t": "Je demande à Jade de répondre", "ok": true}]}, {"at": 24, "who": "k5", "t": "Des enfants vous appellent : le ballon est coincé sur le toit du préau.", "opts": [{"t": "Je reste avec Lou et je demande à Bastien de s’en occuper", "ok": true}, {"t": "J’y vais vite, Lou m’attend ici", "ok": false, "no": "Lou se retrouve seul, à quelques mètres du portail."}]}, {"at": 42, "who": "lou", "t": "Lou vous demande tout bas : « Tu vas… tu vas le dire à qui ? »", "opts": [{"t": "« À personne, promis. Ne t’inquiète pas. »", "ok": false, "no": "Promettre le secret est impossible : vous devez alerter, et Lou se sentirait trahi."}, {"t": "« À des personnes dont le métier est de te protéger. Tu as bien fait de parler. »", "ok": true}]}]}, ch: 4, type: "order", comp: "C3", kicker: "Les dix premières minutes",
    prompt: "Remettez ces actions dans un ordre pertinent à l’aide des flèches.",
    items: [
      { t: "Rester avec Lou, à l’écart du portail des familles", g: 1, why: "Protéger d’abord : Lou n’est jamais laissé seul." },
      { t: "Appeler le 17", g: 2, why: "L’exposition est imminente." },
      { t: "Prévenir Nour, qui informe l’organisateur", g: 2, why: "En même temps que l’appel, ou juste après : l’interne ne remplace pas l’externe." },
      { t: "Noter les mots exacts de Lou", g: 3, why: "Rapidement, mais les actions urgentes n’attendent pas l’écrit." },
      { t: "Organiser le suivi avec les services", g: 4, why: "La protection continue après l’alerte." },
    ] },
  { id: "portail", ch: 4, type: "match", comp: "C3", kicker: "17 h · le portail", title: "Les familles arrivent",
    intro: "Les gendarmes sont dans le bureau avec Nour et Lou. Au portail, les familles arrivent. Vérifiez chaque départ avec les fiches d’inscription de votre carnet.",
    cards: [
      { who: "roussel", t: "M. Roussel vient chercher Zoé, comme chaque soir.", kid: "Zoé", ok: "give", fb: { give: "M. Roussel est sur la fiche de Zoé, et vous le connaissez : départ noté sur le registre.", id: "Vous le connaissez et il est sur la fiche : vérifier son identité n’était pas utile, mais pas grave.", refuse: "M. Roussel est le père de Zoé et figure sur la fiche : rien ne justifiait de refuser.", keep: "Rien ne justifiait de garder Zoé." } },
      { who: "karim", t: "Un homme souriant : « Je suis Karim, l’oncle de Noé. Sa mère m’a demandé de passer le prendre. »", kid: "Noé", ok: "refuse", fb: { give: "Karim n’est pas sur la fiche de Noé. Un enfant n’est remis qu’à un adulte autorisé par écrit, même s’il a l’air de connaître la famille.", id: "Une pièce d’identité prouve qui il est, pas qu’il est autorisé : Karim n’est pas sur la fiche.", refuse: "Karim n’est pas sur la fiche. Vous appelez la mère de Noé, qui confirme et envoie une autorisation écrite.", keep: "Noé n’est pas en danger : il suffit de refuser poliment et d’appeler sa mère." } },
      { who: "petit", t: "Une dame âgée que vous n’avez jamais vue : « Je suis la grand-mère de Clara, Mme Petit. »", kid: "Clara", ok: "id", fb: { give: "Mme Petit est bien sur la fiche, mais vous ne la connaissez pas : il fallait d’abord vérifier son identité.", id: "Elle est sur la fiche, et sa pièce d’identité le confirme. Départ noté.", refuse: "Elle figure sur la fiche : refuser sans vérifier n’était pas nécessaire. Une pièce d’identité suffisait.", keep: "Rien ne justifiait de garder Clara : une vérification d’identité suffisait." } },
      { who: "rey", press: 12, pressT: "M. Rey attend, il s’énerve", t: "M. Rey, le beau-père de Lou, arrive, pressé : « Je viens chercher Lou. Il est où ? »", kid: "Lou", ok: "keep", fb: { give: "M. Rey est sur la fiche, mais c’est l’adulte désigné par Lou : Lou ne lui est pas remis. Les gendarmes gèrent.", id: "Vérifier son identité ne change rien : Lou ne doit pas lui être remis, les gendarmes sont là.", refuse: "Refuser est juste, mais sans lui expliquer quoi que ce soit : c’est aux gendarmes, présents, de lui parler.", keep: "Vous restez calme, sans rien révéler. Lou reste à l’intérieur avec Nour, et les gendarmes reçoivent M. Rey." } },
    ],
    actions: [["give", "Remettre l’enfant"], ["id", "Demander une pièce d’identité"], ["refuse", "Refuser et appeler la famille"], ["keep", "Garder l’enfant à l’intérieur, laisser les gendarmes gérer"]] },
  { id: "transm", ch: 4, type: "multi", comp: "C1", kicker: "17 h 20 · votre transmission écrite",
    prompt: "Cochez ce qui doit figurer dans votre transmission.",
    opts: [
      { t: "Jeudi, 16 h, près du portail : Lou (10 ans) vient me parler.", ok: true, why: "Date et contexte." },
      { t: "Ses mots : « Y a un adulte, à la maison… il me touche. Et il m’a dit de rien dire. »", ok: true, why: "Les paroles exactes, entre guillemets." },
      { t: "Mesures prises : Lou reste avec moi ; 17 appelé à 16 h 05 ; Nour prévenue.", ok: true, why: "Mesures et interlocuteurs contactés." },
      { t: "Identité exacte de l’adulte : non connue.", ok: true, why: "On écrit « non connu » plutôt que d’inventer." },
      { t: "Lou avait l’air de dramatiser.", ok: false, why: "Une interprétation, qui n’a pas sa place dans les faits." },
      { t: "Le père est sûrement violent.", ok: false, why: "Une supposition sur une personne : on ne colle pas d’étiquette." },
    ] },
  { id: "fin4", ch: 4, type: "dayend" },
  { id: "k4", ch: 4, type: "explain", page: { title: "Agir face à une révélation",
    pts: [
      "Protéger et écouter : faire cesser l’exposition, écouter sans suggérer, ne pas promettre le secret.",
      "Noter sans enquêter : contexte, mots entendus, faits observés. Pas d’aveux, pas de confrontation.",
      "Danger immédiat : 17 ou 112 (114 par SMS). Urgence médicale : 15. Enfant en danger : 119 ou CRIP.",
      "Violences sexuelles sur un mineur : autorités judiciaires. En ACM, l’organisateur signale aussi sans délai au SDJES.",
      "L’information des parents s’organise avec les autorités lorsqu’un risque l’impose.",
    ], refs: ["A01 à A10", "R10", "Code pénal 434-3", "CASF R227-11"] } },
  { id: "c5", ch: 5, type: "chapter" },
  { id: "bilanequipe", ch: 5, type: "story", scene: "S17", kicker: "Vendredi, 8 h 30 · réunion d’équipe",
    lines: [
      { who: "nour", mood: "smile", t: "On ne repart pas comme on est venus. Reprends un des points repérés cette semaine." },
      { who: "nour", mood: "calm", t: "Propose une mesure qu’on pourra vraiment vérifier : un changement, une personne responsable, un moment, un indicateur." },
    ] },
  { id: "build", ch: 5, type: "build", comp: "C4", title: "Concevoir une prévention qui se voit" },
  { id: "affiche", ch: 5, type: "choice", comp: "C4", npc: "bastien", mood: "smile", kicker: "Bastien a une idée",
    context: "« Et si on mettait juste une grande affiche “Ici, on respecte tout le monde” ? C’est réglé, non ? »",
    prompt: "Que lui répondez-vous ?",
    opts: [
      {t:  "Elle peut aider, mais il faut surtout une mesure concrète et un moyen de vérifier qu’elle tient.", q:  1, cons:  "Bastien garde son affiche… et propose d’en mesurer l’effet avec un point d’équipe chaque semaine.", fb:  "Une prévention se vérifie : un changement concret, une personne responsable, un moment, un indicateur.", mood:  "smile"},
      {t:  "Oui : afficher la règle, c’est déjà s’engager publiquement devant les familles et les jeunes.", q:  0, cons:  "L’affiche est posée. Rien d’autre ne change dans l’organisation.", fb:  "Un engagement affiché sans changement concret ni vérification reste une intention."},
      {t:  "Non, une affiche ne sert à rien : seules des sanctions claires changent les comportements.", q:  0.5, cons:  "Bastien renonce, vexé. L’équipe ne construit rien ensemble.", fb:  "Les sanctions sont utiles mais tardives : la prévention agit avant. Et une affiche a sa place si elle s’accompagne d’actes."},
      {t:  "Oui, et on la fait signer par chaque jeune pour qu’il s’engage personnellement à la respecter.", q:  0.5, cons:  "Les jeunes signent. Les pratiques des adultes, elles, ne changent pas.", fb:  "Faire porter l’engagement aux jeunes déplace la responsabilité : c’est d’abord l’organisation des adultes qui doit changer."},
    ],
    why: {"q": "Et pourquoi ?", "opts": [{"t": "Parce qu’une prévention se vérifie : un changement, un responsable, un indicateur.", "ok": true}, {"t": "Parce que toute affiche doit d’abord être validée par la direction et l’organisateur.", "ok": false, "no": "La validation n’est pas le sujet : la question est ce qui change réellement dans le fonctionnement."}, {"t": "Parce qu’une affiche n’a de valeur que si elle cite précisément les articles de loi.", "ok": false, "no": "Le texte de l’affiche importe moins que les pratiques qu’elle accompagne."}]},
    later: true,
    better: "Garder l’affiche si elle est utile, mais l’accompagner d’un changement concret et d’un indicateur observable." },
  {"id": "familles", "fact": "Ce message fait écho à l’actualité : en avril 2026, Paris a adopté un plan pour sécuriser le périscolaire, et en octobre, un rapport du Sénat a dénoncé l’omerta et demandé des contrôles d’honorabilité chaque année.", "ch": 5, "type": "choice", "npc": "nour", "mood": "calm", "comp": "C4", "kicker": "Vendredi, 10 h · un message des familles", "context": "Après les affaires du périscolaire parisien, plusieurs parents écrivent à l’accueil : « Qui encadre nos enfants, et comment savoir qu’ils sont en sécurité ? » Nour vous demande ce que l’accueil doit répondre.", "prompt": "Que proposez-vous ?", "opts": [{"t": "Des règles vérifiables : jamais un adulte seul hors de vue, toilettes organisées, contrôles, et à qui parler.", "q": 1, "cons": "Le livret part lundi. Deux parents proposent même de relire la version destinée aux enfants.", "fb": "La confiance se gagne par des règles concrètes, connues de tous et vérifiables.", "mood": "smile"}, {"t": "Rassurer : « Aucun incident n’a jamais eu lieu chez nous, et toute l’équipe est de confiance. »", "q": 0, "cons": "Les parents ne sont pas rassurés. L’un d’eux demande ce qui serait fait si un incident survenait.", "fb": "L’absence d’incident connu ne protège personne : c’est souvent le silence qui l’explique. Les familles attendent des règles."}, {"t": "Interdire tout contact physique entre adultes et enfants, même pour consoler ou pour soigner.", "q": 0.5, "cons": "Une petite qui s’est fait mal attend seule qu’on « trouve une solution ». L’équipe est mal à l’aise.", "fb": "La règle se veut protectrice mais empêche des soins et un réconfort nécessaires. On encadre les gestes plutôt que de les interdire."}, {"t": "Installer des caméras dans les couloirs et à l’entrée des sanitaires, pour pouvoir tout vérifier.", "q": 0, "cons": "Le projet est abandonné : filmer les sanitaires porterait atteinte à l’intimité des enfants.", "fb": "La surveillance vidéo des espaces d’intimité n’est pas une réponse : elle expose les enfants au lieu de les protéger."}], "why": {"q": "Et pourquoi ?", "opts": [{"t": "Parce que la sécurité repose sur des règles connues que les familles peuvent vérifier.", "ok": true}, {"t": "Parce que la loi oblige à informer toutes les familles de chaque incident survenu dans l’accueil.", "ok": false, "no": "Ce n’est pas le fond du sujet : la question est ce qui protège réellement, avant tout incident."}, {"t": "Parce que les parents doivent pouvoir entrer librement dans l’accueil à tout moment.", "ok": false, "no": "L’ouverture totale n’est pas une mesure de protection : c’est l’organisation de l’équipe qui compte."}]}, "better": "Des règles simples et vérifiables : jamais seul hors de la vue des autres, lieux sensibles réaménagés, contrôle d’honorabilité, un adulte référent connu des enfants et des familles."},
  { id: "maelys", ch: 5, type: "dialogue", comp: "C1", title: "Maëlys vous parle", kicker: "Vendredi, 13 h", npc: "maelys", start: "n1",
    nodes: {
      n1: { mood: "calm", t: "Je… je peux te parler ? … Hier, quand on rangeait le local… le monsieur de l’atelier bois, il m’a touchée. Là où il a pas le droit. Moi, je voulais pas.",
        opts: [
          { t: "Merci de me le dire. Tu as bien fait, et ce n’est pas de ta faute.", to: "n2", q: 1 },
          { t: "Il t’a touchée comment, exactement ? Montre-moi où.", to: "n1b", q: 0, note: "On ne demande ni détails ni gestes : on accueille. Le récit précis, ce sont les enquêteurs qui le recueillent." },
          { t: "Tu es sûre ? Il travaille ici depuis longtemps, tu sais.", to: "n1b", q: 0, note: "Mettre en doute sa parole lui apprend à se taire. On croit, on protège, on transmet." },
        ] },
      n1b: { mood: "concern", t: "Je… je sais pas… je veux plus en parler.",
        opts: [{ t: "Pardon. Tu n’as rien à prouver. Tu as bien fait de me le dire, et ce n’est pas de ta faute.", to: "n2", q: 0.5 }] },
      n2: { mood: "concern", t: "Je veux plus aller là-bas. Et… y a atelier bois à 15 h.",
        opts: [
          { t: "Tu n’iras pas. Je reste avec toi. Hier, au local, tu étais seul avec lui ?", to: "n3", q: 1 },
          { t: "Tu n’iras pas. Je reste avec toi. Est-ce qu’il y avait quelqu’un d’autre, pas loin ?", to: "n3", q: 1 },
          { t: "Tu n’iras pas, promis. Et je ne le dirai à personne.", to: "n2b", q: 0, note: "Vous ne pouvez pas promettre le secret : vous allez devoir transmettre. Dites-le-lui simplement." },
          { t: "On verra. Peut-être que ce n’est qu’un malentendu.", to: "n2b", q: 0, note: "Minimiser l’expose à nouveau. Elle ne doit plus croiser l’intervenant." },
        ] },
      n2b: { mood: "sad", t: "…D’accord.",
        opts: [{ t: "Je me suis mal exprimée. Tu n’iras pas, je reste avec toi, et je vais en parler à des adultes dont c’est le rôle. Hier, tu étais seul avec lui ?", to: "n3", q: 0.5 }] },
      n3: { end: true, mood: "calm", t: "Non… Je crois que Sacha était peut-être à côté. Il rangeait les outils. Je sais pas s’il a vu.",
        lesson: "Accueillir sans questionner sur les faits : remercier, déculpabiliser, protéger. Une question sur le contexte (qui était là ?) aide à transmettre sans orienter le récit." } } },
  { id: "f1", ch: 5, type: "choice", comp: "C3", kicker: "13 h 05",
    prompt: "Votre toute première décision ?",
    opts: [
      {t:  "Tout de suite, Maëlys ne croise plus l’intervenant : un adulte reste avec elle.", q:  1, cons:  "Maëlys reste avec Inès, loin du local. Vous pouvez alerter.", fb:  "Protéger d’abord : éviter toute nouvelle exposition, puis alerter.", mood:  "calm"},
      {t:  "Aller voir l’intervenant pour entendre sa version des faits avant de prendre une décision.", q:  0, cons:  "L’intervenant est prévenu. Il passe voir Maëlys « pour s’expliquer ».", fb:  "Confronter la personne mise en cause expose la victime et peut compromettre l’enquête."},
      {t:  "Lui demander de raconter précisément ce qui s’est passé, pour transmettre sans erreur.", q:  0, cons:  "Maëlys se fige et répète qu’elle ne veut plus en parler.", fb:  "On accueille la parole sans la provoquer : l’audition, ce sont les enquêteurs qui la mènent."},
      {t:  "Prévenir Nour tout de suite et la laisser gérer : c’est elle la directrice.", q:  0.5, cons:  "Nour est en réunion à la mairie. L’atelier commence dans deux heures, Maëlys est toujours inscrite.", fb:  "Informer la direction est nécessaire, mais la mise à l’abri immédiate de Maëlys ne peut pas attendre."},
    ],
    why: {"q": "Et pourquoi ?", "opts": [{"t": "Parce qu’on protège d’abord : aucune nouvelle exposition, puis on alerte.", "ok": true}, {"t": "Parce qu’on doit d’abord vérifier que son récit est crédible et cohérent.", "ok": false, "no": "Ce n’est pas à l’équipe d’évaluer la crédibilité : on protège et on alerte."}, {"t": "Parce que l’intervenant n’est pas salarié de l’accueil, il dépend d’une association.", "ok": false, "no": "Son statut ne change rien : toute personne mise en cause est tenue à l’écart."}]},
    timer: 25,
    better: "Éviter toute nouvelle exposition, puis alerter : responsable sûr et autorités." },
  { id: "trouver", ch: 5, type: "find", free: true, comp: "C1", kicker: "Vendredi, 13 h 15 · temps libre", title: "Sacha était peut-être là",
    intro: "L’alerte est lancée. Maëlys a parlé de Sacha. À vous de décider : vous pouvez aller le voir, sans enquêter, ou simplement transmettre son nom. Personne ne vous dit où il est : demandez autour de vous, discrètement.",
    clues: { clara: "Sacha ? Je l’ai vu partir vers le préau avec le sac de ballons.", enzo: "Aucune idée. Pourquoi, il a fait quoi ?", lena: "Il était au parc tout à l’heure… Non, attends, au préau, je crois.", zoe: "Sacha, il range toujours le matériel, lui.", theo: "Je sais pas. Tu joues avec nous ?" },
    skip: { t: "Je ne vais pas le chercher : je transmets à Nour que Sacha était peut-être là", q: 1, fb: "C’est une réponse juste : vous signalez un témoin possible, sans mener d’enquête. Ce sont les enquêteurs qui l’entendront, s’ils le jugent utile. Si Sacha vient vous parler de lui-même, vous l’écouterez." },
    who: "sacha", at: [18.2, 24.6], decoys: [["clara", 9.0, 25.0], ["enzo", 24.4, 21.0], ["lena", 16.6, 6.2], ["zoe", 2.6, 21.2], ["theo", 12.2, 20.6]], timer: 60,
    found: "Sacha range des ballons sous le préau. Il vous voit arriver et baisse les yeux, l’air embêté.",
    opts: [
      { t: "« Sacha, tu as deux minutes ? Viens, on va s’asseoir un peu à l’écart. »", q: 1, fb: "Vous le prenez à part, au calme, sans évoquer les faits devant les autres. Vous ne menez pas d’enquête : s’il veut parler, vous l’écoutez, vous notez ses mots, et vous transmettez." },
      { t: "« Maëlys dit que tu as tout vu hier. C’est vrai ? »", q: 0, fb: "Vous lui révélez ce que Maëlys a confié, et vous orientez sa réponse : son témoignage risque de ne plus être le sien." },
      { t: "« Tu as vu ce que le monsieur de l’atelier a fait à Maëlys ? Raconte-moi tout. »", q: 0.3, fb: "La question suggère déjà ce qui se serait passé : préférez une invitation ouverte, à l’écart des autres." },
    ] },
  { id: "temoin", ch: 5, type: "interview", comp: "C1", kicker: "13 h 20 · salle des 11-14 ans", title: "Sacha a vu quelque chose",
    intro: "Sacha, 11 ans, a peut-être vu quelque chose. Il ne s’agit pas d’enquêter : accueillez ce qu’il dit, notez ses mots exacts, puis remerciez-le et transmettez.",
    open: "Euh… j’ai vu un truc, à la régie… mais je sais pas si je dois le dire.",
    quit: "Euh… je veux plus en parler. Laisse tomber.",
    npc: "sacha", facts: ["où", "qui", "quand", "après"],
    qs: [
      { t: "Tu veux me raconter ce que tu as vu ?", kind: "ouverte", a: "Ben… j’ai vu le monsieur, euh… celui de l’atelier bois. Il a fermé la porte de la régie. Et Maëlys, elle était dedans.", fact: ["où", "qui"], trust: 6 },
      { t: "C’était à quel moment ?", kind: "neutre", a: "C’était… à la fin de l’atelier. Quand on rangeait les outils, tout ça.", fact: ["quand"], trust: 2 },
      { t: "Et après ?", kind: "relance", a: "Après… elle est sortie. Elle pleurait. Et elle est partie aux toilettes en courant.", fact: ["après"], trust: 4 },
      { t: "Il l’a touchée, c’est ça ?", kind: "suggestive", a: "Euh… oui… peut-être… je sais pas.", taint: true, trust: -14, fb: "Question suggestive : la réponse vient de vous, pas de lui. Elle ne vaut plus rien, et peut fragiliser l’enquête." },
      { t: "Pourquoi tu n’es pas venu me le dire tout de suite ?", kind: "culpabilisante", a: "…", trust: -18, fb: "Un « pourquoi » sonne comme un reproche : Sacha se ferme." },
      { t: "Tu es sûr ? Tu ne te trompes pas ?", kind: "doute", a: "Ben… je crois. Laisse tomber.", trust: -16, fb: "Mettre en doute sa parole lui apprend qu’il vaut mieux se taire." },
      { t: "Je te promets que je ne le répéterai à personne.", kind: "promesse", a: "D’accord… merci.", trust: -6, fb: "Vous ne pouvez pas tenir cette promesse : vous allez devoir transmettre." },
    ],
    close: { t: "Merci Sacha, tu as bien fait de me le dire. Je vais en parler à des adultes dont c’est le rôle.", a: "D’accord. Et… Maëlys, elle va bien ?" } },
  { id: "garnier", ch: 5, type: "dialogue", comp: "C3", title: "L’organisateur", npc: "garnier", start: "n1",
    intro: "13 h 25. Nour est toujours en réunion à la mairie. Dans son bureau, vous trouvez M. Lambert, le responsable enfance de la mairie, l’organisateur de l’accueil, passé déposer des dossiers. Vous lui expliquez la situation.",
    nodes: {
      n1: { mood: "concern", t: "Maëlys ? Elle a dû mal comprendre. Il travaille avec nous depuis dix ans. On verra demain avec Nour, je ne veux pas de scandale pour la commune.",
        opts: [
          { t: "D’accord, on attend demain matin, après avoir entendu l’intervenant et sa version.", to: "nwait", q: 0, note: "Attendre laisse l’intervenant au contact des jeunes. Rien ne justifie ce délai." },
          { t: "On ne peut pas attendre : ces faits vont aux autorités aujourd’hui, sinon j’appelle moi-même.", to: "n2", q: 1 },
          { t: "Je vais régler ça directement avec l’intervenant, pour qu’il ne revienne plus à l’atelier.", to: "nconf", q: 0, flag: "enquete", note: "Une confrontation peut exposer Maëlys et compromettre l’enquête." },
        ] },
      nwait: { mood: "calm", narr: "L’atelier bois commence dans moins de deux heures.", t: "Voilà, c’est plus raisonnable.",
        opts: [{ t: "Non. Une information interne ne remplace pas les démarches externes. Si l’on m’empêche d’agir, je contacte directement les services.", to: "n2", q: 0.5 }] },
      nconf: { mood: "o", t: "Vous allez aller le voir ?",
        opts: [{ t: "Non, vous avez raison de vous inquiéter : l’enquête appartient aux services compétents. On alerte maintenant.", to: "n2", q: 0.5 }] },
      n2: { mood: "o", t: "…Bon. Qui appelle qui ?",
        opts: [
          { t: "J’appelle la gendarmerie, je préviens Nour, et vous écartez l’intervenant dès maintenant.", to: "end", q: 1 },
          { t: "J’envoie un message à toute l’équipe pour que chacun reste vigilant avec l’intervenant.", to: "endb", q: 0, note: "Seules les personnes qui doivent agir reçoivent les informations nécessaires." },
        ] },
      end: { end: true, mood: "calm", t: "C’est noté. Je l’écarte, et je préviens le SDJES.",
        lesson: "Plusieurs démarches peuvent coexister, sans attendre l’une pour l’autre : protection, mesures de l’organisateur, signalement judiciaire, signalement au SDJES. Le responsable qui freine, même l’organisateur, n’est jamais un passage obligé." },
      endb: { end: true, mood: "concern", t: "Toute l’équipe ? Et Maëlys, dans tout ça ?",
        lesson: "L’alerte va aux autorités judiciaires et, par l’organisateur, au SDJES. L’intervenant est écarté. Le reste de l’équipe sait seulement qu’une situation est prise en charge." } } },
  { id: "f3", ch: 5, type: "multi", comp: "C3", npc: "maelys", mood: "calm", kicker: "14 h",
    context: "Maëlys vous demande : « Je… je vais avoir des problèmes ? »",
    prompt: "Que pouvez-vous lui dire ? Sélectionnez toutes les phrases justes.",
    opts: [
      { t: "Tu as bien fait de parler. Ce n’est pas de ta faute.", ok: true, why: "Prendre la parole au sérieux, déculpabiliser." },
      { t: "Des adultes dont c’est le métier vont t’aider. Je dois leur transmettre ce que tu m’as dit.", ok: true, why: "Expliquer simplement pourquoi on transmet." },
      { t: "Tu n’iras pas à l’atelier, et un adulte reste avec toi.", ok: true, why: "Dire concrètement ce qui la protège maintenant." },
      { t: "Je te promets qu’il sera puni.", ok: false, why: "On ne garantit pas une peine." },
      { t: "Personne d’autre ne le saura.", ok: false, why: "On ne promet jamais le secret." },
    ] },
  { id: "k5", ch: 5, type: "explain", page: { title: "Une prévention qui se voit",
    pts: [
      "Une mesure désigne un changement, une personne responsable, un moment et un indicateur observable.",
      "Créer plusieurs portes d’entrée pour parler et rendre les adultes ressources identifiables.",
      "Afficher le 119 et le 3018. Fixer des règles claires sur les échanges numériques et la vie d’équipe.",
      "L’égalité concerne aussi le recrutement, les réunions et les tâches de soin ou de rangement.",
      "Un contrôle d’honorabilité ne remplace jamais cette vigilance.",
    ], refs: ["Carte des domaines de prévention", "CASF L226-8"] } },

  { id: "dafter", ch: 5, type: "positions", mode: "after", kicker: "Vendredi, 17 h 30", title: "Tes convictions, une semaine plus tard",
    intro: "Mêmes affirmations qu’au premier jour. Répondez à nouveau, puis comparez." },
  { id: "souvenirs", ch: 5, type: "replay", kicker: "Vendredi, 18 h · fin de la semaine", title: "Vous vous souvenez ?" },
  { id: "bilan", ch: 5, type: "bilan" }
];

const BUILD = {
  common: {
    resp: { label: "Qui en est responsable ?", opts: [
      { t: "Une personne nommée, qui s’y engage (par exemple Inès).", q: 1, fb: "Une personne identifiée rend la mesure réelle." },
      { t: "Toute l’équipe, en général.", q: 0, fb: "Quand c’est tout le monde, ce n’est souvent personne." },
      { t: "La direction, quand elle aura le temps.", q: 0.5, fb: "La direction appuie, mais il faut une personne et un moment." },
    ] },
    when: { label: "Quand ?", opts: [
      { t: "Dès le prochain accueil.", q: 1, fb: "Applicable tout de suite : c’est le bon critère." },
      { t: "À la fin du séjour, pour en parler au bilan.", q: 0.5, fb: "Le bilan compte, mais la mesure doit protéger dès maintenant." },
      { t: "Quand ce sera possible.", q: 0, fb: "Sans date, la mesure risque de ne jamais exister." },
    ] },
  },
  sits: [
    { id: "radio", scene: "S01", title: "L’atelier radio",
      change: [
        { t: "Une rotation des rôles techniques, ouverte à tous les volontaires.", q: 1, fb: "Un changement concret qui rouvre l’accès au matériel." },
        { t: "Une affiche « Ici, on est égaux ».", q: 0.5, fb: "Utile, mais ne change pas qui tient la console." },
        { t: "Interdire la console aux garçons.", q: 0, fb: "Une nouvelle règle fondée sur le sexe." },
      ],
      ind: [
        { t: "Sur trois séances, la liste de qui a effectivement manipulé le matériel.", q: 1, fb: "Observable, comptable, vérifiable." },
        { t: "L’ambiance est meilleure.", q: 0, fb: "Une impression, pas un indicateur." },
        { t: "Les jeunes disent que c’est bien.", q: 0.5, fb: "Un retour utile, mais qui ne montre pas qui a eu accès au matériel." },
      ] },
    { id: "regie", scene: "S17", room: "local", title: "La régie, en fin d’atelier",
      change: [
        { t: "Le rangement se fait à plusieurs, porte ouverte, avec un animateur présent jusqu’à la fin.", q: 1, fb: "Un changement concret : plus jamais un adulte seul avec un ou deux jeunes, hors de vue." },
        { t: "Une affiche « Porte ouverte » sur la régie.", q: 0.5, fb: "Utile comme rappel, mais personne n’est chargé de la faire respecter." },
        { t: "Supprimer l’atelier bois.", q: 0, fb: "On supprime une activité au lieu d’organiser sa sécurité." },
      ],
      ind: [
        { t: "Chaque jour, le cahier de l’atelier indique qui était présent au rangement.", q: 1, fb: "Observable, vérifiable, au jour le jour." },
        { t: "L’intervenant dit que tout se passe bien.", q: 0, fb: "La parole de la personne concernée par la règle ne suffit pas à la vérifier." },
        { t: "Les jeunes ne se plaignent pas.", q: 0.5, fb: "Un silence n’est pas un indicateur." },
      ] },
    { id: "soins", scene: "S14", title: "L’aide aux soins de Zoé",
      change: [
        { t: "Un protocole préparé avec Zoé, ses responsables et les professionnels : qui aide, comment elle indique son choix ou son refus, comment respecter son intimité.", q: 1, fb: "Une aide expliquée, adaptée, limitée au nécessaire." },
        { t: "Celui ou celle qui est disponible aide Zoé.", q: 0, fb: "Sans protocole, la vulnérabilité demeure." },
        { t: "Une seule personne aide Zoé, sans en parler au reste de l’équipe.", q: 0.5, fb: "Une personne identifiée, oui ; mais sans cadre partagé ni recueil du choix de Zoé." },
      ],
      ind: [
        { t: "Le tableau d’images de Zoé comporte un pictogramme « stop », et l’équipe vérifie qu’il est respecté.", q: 1, fb: "Zoé peut exprimer un inconfort ou un refus, et on le vérifie." },
        { t: "Zoé ne se plaint pas.", q: 0, fb: "L’absence de plainte ne prouve rien, surtout avec un mode de communication différent." },
        { t: "Le protocole est imprimé et rangé.", q: 0.5, fb: "Il existe, mais on ne sait pas s’il est appliqué." },
      ] },
    { id: "salut", scene: "S15", title: "L’accueil du matin",
      change: [
        { t: "Une consigne d’accueil avec un choix libre de salutation, sans contact imposé.", q: 1, fb: "Le refus devient possible sans humiliation." },
        { t: "Supprimer tout rituel d’accueil.", q: 0, fb: "On perd un moment utile au lieu de le rendre respectueux." },
        { t: "Laisser chaque animateur faire comme il veut.", q: 0.5, fb: "Sans consigne commune, la pression peut revenir." },
      ],
      ind: [
        { t: "À chaque accueil, plusieurs façons de saluer sont proposées et aucun refus n’est commenté.", q: 1, fb: "Observable à chaque accueil." },
        { t: "Les enfants ont l’air contents.", q: 0, fb: "Une impression, pas un indicateur." },
        { t: "La consigne est écrite dans le projet pédagogique.", q: 0.5, fb: "Écrite, mais est-elle appliquée ?" },
      ] },
  ],
};

const REFLEXES = [
  { id: "protect", label: "Protéger d’abord : éviter toute nouvelle exposition", ch: 5, from: [["f1", 1]] },
  { id: "listen", label: "Écouter sans promettre le secret ni enquêter", ch: 4, from: [["lou", 0.8]] },
  { id: "alert", label: "Alerter les autorités adaptées, même si la hiérarchie freine", ch: 4, from: [["numero", 1], ["garnier", 0.75]] },
  { id: "note", label: "Séparer faits observés, paroles rapportées et suppositions", ch: 2, from: [["theo", 0.8], ["transm", 0.8]] },
  { id: "prev", label: "Prévenir avec une mesure vérifiable", ch: 5, from: [["build", 0.75]] },
];

const NUMBERS = [
  ["17 · 112", "Danger immédiat"], ["114", "Par SMS, pour les personnes sourdes, malentendantes ou ne pouvant pas parler"], ["15", "Urgence médicale"],
  ["119", "Enfance en danger, 24 h/24"], ["3018", "Violences numériques faites aux mineurs"], ["3919", "Violences faites aux femmes"],
  ["116 006", "France Victimes, aide aux victimes"], ["3928", "Défenseur des droits, discriminations"],
];

/* Textes lus à voix haute en plus des répliques (même logique pour le jeu et pour la génération des voix). */
const EPILOGUE = {
  lou: { who: "Lou", good: "La patrouille est arrivée avant 17 h : Lou n’a pas été remis à l’adulte qu’il désignait. Une enquête est ouverte, et Lou est accompagné par des professionnels.", mid: "L’alerte est partie avec un quart d’heure de retard. Lou a été protégé de justesse : l’enquête suit son cours.", low: "L’alerte est partie trop tard : Lou est rentré avec l’adulte. Le signalement envoyé le soir a déclenché l’intervention des services le lendemain." },
  maelys: { who: "Maëlys", good: "Maëlys n’a plus croisé l’intervenant. Les faits ont été signalés le jour même, et l’atelier bois est suspendu pendant l’enquête.", mid: "Maëlys a été tenue à l’écart, mais M. Lambert a retardé l’alerte d’une journée. Les faits ont finalement été signalés.", low: "Maëlys a recroisé l’intervenant avant que l’alerte ne parte. Elle a été mise à l’abri le lendemain, et un signalement a été fait." },
  ines: { who: "Inès", good: "Inès est restée dans l’équipe. À la rentrée, c’est elle qui présente la règle du groupe de messagerie aux nouveaux animateurs.", mid: "Inès termine les vacances, mais ne s’est réinscrite que pour l’été.", low: "Inès a quitté l’accueil à la fin des vacances, sans dire pourquoi." },
  parents: { who: "Les parents", good: "M. Roussel et Mme Benali ont été écoutés et rappelés. Au portail, les familles savent désormais à qui parler, et elles le font.", mid: "Les parents ont eu une réponse, mais ont dû relancer. Une permanence au portail est prévue à la rentrée.", low: "Mme Benali a écrit à la mairie : elle estime ne pas avoir été entendue. La direction la reçoit la semaine suivante." },
  familles: { who: "Les familles", good: "Le livret des familles est distribué : règles de non-isolement, accompagnement aux toilettes, adulte référent. Deux parents ont rejoint le comité de suivi.", mid: "Les familles ont reçu une réponse, mais pas encore de règles concrètes : la question reviendra à la prochaine réunion." },
};
// Documents du carnet : ils s'ajoutent au fil de la semaine et servent à débloquer certaines situations.
const DOCS = {
  numeros: { at: "intro", title: "Numéros utiles", kind: "numeros", icon: "☎",
    rows: [["17 ou 112", "Danger immédiat : police, gendarmerie, urgences"], ["15", "Urgence médicale (SAMU)"], ["119", "Enfance en danger : conseil, écoute, transmission à la CRIP"],
           ["114", "Urgences par SMS, pour qui ne peut pas parler"], ["3018", "Harcèlement et violences en ligne, retrait d’images"], ["18", "Pompiers"], ["Antipoison", "Centre antipoison de la région (affiché au bureau)"],
           ["SDJES · DDETS · ARS", "Administrations : jeunesse et sports, inspection du travail, santé"], ["Nour", "Référente VSS de l’équipe, joignable en permanence"]] },
  regles: { at: "brief", title: "Règles de l’équipe", kind: "panneau", icon: "📌",
    notes: ["Jamais un adulte seul avec un enfant hors de la vue des autres.", "Sanitaires des petits : accompagnement en binôme, porte du bloc ouverte.",
            "Un intervenant extérieur n’encadre jamais seul : un animateur est toujours présent.", "Un stagiaire n’est jamais le seul animateur d’un groupe.",
            "Chaque groupe a sa référente : Jade pour les petits, Inès pour les grands.", "Réseaux sociaux : aucun échange privé avec un jeune."] },
  fiches: { at: "depart", title: "Fiches d’inscription", kind: "fiches", icon: "🗂",
    kids: [["Lou", "10 ans", ["Mme Rey (mère)", "M. Rey (beau-père)"], "lou"], ["Zoé", "8 ans", ["M. Roussel (père)", "Mme Roussel (mère)"], "zoe"],
           ["Noé", "9 ans", ["Mme Martin (mère)"], "theo"], ["Clara", "12 ans", ["M. Petit (père)", "Mme Petit (grand-mère)"], "clara"]],
    note: "Un enfant n’est remis qu’à un adulte inscrit sur sa fiche. Adulte inconnu de l’équipe : pièce d’identité." },
};

// Le téléphone : des notifications arrivent pendant le jeu, parfois au pire moment.
const PHONE = [
  { id: "t1", at: "k1", app: "Instagram", from: "Enzo, 14 ans", av: "enzo", t: "Enzo a demandé à vous suivre.", comp: "C3",
    opts: [{ t: "Refuser, et lui dire demain, simplement, que vous ne suivez pas les jeunes.", q: 1, fb: "Une règle dite simplement protège tout le monde, Enzo compris." },
           { t: "Accepter : c’est juste un abonnement, ça crée du lien.", q: 0, fb: "Un lien privé avec un jeune ouvre la porte à des échanges hors de tout cadre, et vous expose aussi." },
           { t: "Ignorer la demande sans rien lui dire.", q: 0.5, fb: "Sans explication, Enzo peut le vivre comme un rejet : mieux vaut poser la règle de vive voix." }] },
  { id: "t2", at: "chat", app: "Message privé", from: "Léna, 13 ans", av: "lena", t: "tu peux me donner ton snap stp ? c pour te demander un truc perso 🙈", comp: "C3",
    opts: [{ t: "« Je ne parle pas aux jeunes sur mes réseaux. On en parle demain à l’accueil, ou avec Nour. »", q: 1, fb: "Vous gardez le cadre sans fermer la porte : si Léna veut confier quelque chose, elle sait où vous trouver." },
           { t: "« Ok, mais tu le dis à personne 😉 »", q: 0, fb: "Un secret partagé en privé avec un jeune, c’est exactement le mécanisme qu’utilisent les agresseurs : jamais." },
           { t: "Ne pas répondre, et ne rien en dire.", q: 0.4, fb: "Elle voulait peut-être confier quelque chose : sans réponse ni relais, sa parole se perd. Répondez sobrement et prévenez Nour." }] },
  { id: "t3", at: "consent", app: "Groupe « Les grands 🔥 »", from: "Enzo, 14 ans", av: "enzo", t: "😂😂 regardez Clara aux vestiaires [photo]", comp: "C3", urgent: true,
    opts: [{ t: "Ne pas ouvrir la photo, prévenir Nour tout de suite, et protéger Clara.", q: 1, fb: "Une image intime d’une mineure ne se regarde pas, ne se garde pas, ne se transfère pas. Nour alerte la direction ; le 3018 aide à la faire retirer." },
           { t: "Écrire dans le groupe : « Supprimez ça immédiatement ! »", q: 0.5, fb: "Stopper la diffusion est utile, mais ne gérez pas seul : il faut alerter Nour et protéger Clara." },
           { t: "Ouvrir la photo pour vérifier de quoi il s’agit.", q: 0, fb: "Ouvrir, c’est déjà regarder une image intime d’une mineure sans son accord. Ne l’ouvrez pas : alertez." }] },
  { id: "t4", at: "ordre", app: "Groupe des parents", from: "Mme Diallo", av: "parent", t: "Bonjour, le portail est fermé ?? On attend dehors depuis 5 minutes", comp: "C3", urgent: true,
    opts: [{ t: "Ne pas répondre maintenant : Lou d’abord. Nour gérera le portail.", q: 1, fb: "En pleine crise, chaque minute compte pour Lou : les autres demandes attendent." },
           { t: "Répondre : « On a un gros souci, je vous explique dès que possible. »", q: 0.3, fb: "Vous perdez du temps, et vous inquiétez les familles sans pouvoir rien dire." }] },
  { id: "t5", at: "maelys", app: "SMS", from: "Nour", av: "nour", t: "Je suis en réunion à la mairie jusqu’à 14 h. Tout va bien à l’accueil ?", comp: "C3",
    opts: [{ t: "« Non. Maëlys vient de me confier quelque chose de grave. Appelle-moi dès que tu peux. »", q: 1, fb: "Vous alertez la référente tout de suite, sans détailler par écrit." },
           { t: "« Oui, tout roule 👍 »", q: 0, fb: "Rassurer la référente alors qu’un enfant vient de se confier, c’est retarder l’alerte." }] },
];

// Conséquences rejouées : ce que vos choix « à retardement » ont produit.
const REPLAY = {
  rire: { at: "equipe", room: "equipe", label: "La plaisanterie de Bastien sur Inès",
    tiers: {
      excellent: { cast: [["bastien", "a", "talk"], ["ines", "b"], ["you", "c"]], lines: [["bastien", "J’ai repensé à ce que tu m’as dit. Je me suis excusé auprès d’Inès, pour de vrai, devant Nour."], ["ines", "Et depuis, plus rien. Je me sens de nouveau à ma place dans l’équipe."], ["narr", "Un recadrage clair, appuyé par la référente, a suffi à arrêter la répétition."]] },
      moyen: { cast: [["ines", "a", "talk"], ["you", "b"]], lines: [["ines", "Il s’est excusé, oui. Et deux jours après, ça a recommencé dans la conversation de l’équipe."], ["narr", "Sans cadre posé avec la référente, les excuses n’ont rien changé."]] },
      catastrophe: { cast: [["kevin", "a", "talk"], ["you", "b"]], lines: [["kevin", "Inès ? Elle a démissionné vendredi. Elle a dit qu’ici, personne ne réagissait."], ["narr", "Laisser passer, c’est laisser la répétition s’installer. L’équipe perd une animatrice, et l’employeur a manqué à son obligation de protection."]] } } },
  theo2: { at: "direction", room: "direction", label: "Les signes chez Noé",
    tiers: {
      excellent: { cast: [["nour", "a", "talk"], ["you", "b"]], lines: [["nour", "Grâce à tes notes, l’information préoccupante est partie le jour même. Les services ont rencontré la famille."], ["narr", "Noé est aujourd’hui accompagné. Vos observations, recueillies sans questions orientées, ont pu servir."]] },
      moyen: { cast: [["nour", "a", "talk"], ["you", "b"]], lines: [["nour", "Tu as attendu la fin de la semaine… On a perdu cinq jours."], ["narr", "L’information est partie, mais tard. Pendant ce temps, Noé est resté seul avec ce qu’il vivait."]] },
      catastrophe: { cast: [["jade", "a", "talk"], ["you", "b"]], lines: [["jade", "Ses parents sont venus, furieux. Depuis, Noé ne parle plus à personne."], ["narr", "Questionné, puis exposé à sa famille, Noé s’est fermé. Les professionnels auront bien plus de mal à l’aider."]] } } },
  affiche: { at: "panneau", room: null, label: "L’idée d’affiche de Bastien",
    tiers: {
      excellent: { cast: [["bastien", "a", "talk"], ["you", "b"]], lines: [["bastien", "Le binôme aux toilettes, on le vérifie chaque vendredi sur le tableau. Trois mois après, ça tient !"], ["narr", "Une mesure, une personne responsable, un indicateur : la règle est toujours appliquée."]] },
      moyen: { cast: [["nour", "a", "talk"], ["you", "b"]], lines: [["nour", "Les jeunes ont signé l’affiche. Mais dans l’organisation, rien n’a vraiment changé."], ["narr", "S’engager sur le papier ne suffit pas : sans mesure vérifiable, les habitudes reviennent."]] },
      catastrophe: { cast: [["you", "a"]], lines: [["narr", "L’affiche est restée au mur, jaunie. Un mois plus tard, un nouvel incident a eu lieu aux sanitaires, exactement comme avant."]] } } },
  foot: { at: "jeux", room: null, label: "Le foot de l’aire de jeux",
    tiers: {
      excellent: { props: { zoe: "ball" }, cast: [["zoe", "a", "wave"], ["theo", "b", "talk"], ["malo", "c", "walk"], ["you", "f"]], lines: [["narr", "Vendredi, à l’aire de jeux. Les équipes se forment toutes seules, mélangées."], ["theo", "Zoé, tu viens dans mon équipe ? T’es trop forte en goal !"], ["zoe", "Oui ! Mais après, c’est moi qui tire les penaltys."]] },
      moyen: { props: { theo: "ball" }, cast: [["theo", "a", "talk"], ["malo", "c", "stand"], ["zoe", "e", "sad"], ["you", "f"]], lines: [["narr", "Vendredi, à l’aire de jeux. Les garçons jouent au foot ; les filles jouent à côté."], ["zoe", "Le foot, c’est pour les garçons… C’est l’animateur qui l’a dit, enfin… presque."]] },
      catastrophe: { cast: [["theo", "a", "point"], ["malo", "c", "talk"], ["zoe", "e", "sad"], ["you", "f"]], lines: [["narr", "Vendredi. Zoé est assise sur le banc, sans ballon."], ["theo", "Les filles, vous pouvez pas jouer ! Même l’animateur, il a dit qu’on avait le droit de choisir."], ["zoe", "Je… je ramènerai plus mon ballon."]] } } },
  sanit: { at: "sanitaires", room: "sanitaires", label: "Malo devant les toilettes",
    tiers: {
      excellent: { cast: [["malo", "d", "wave"], ["kevin", "a", "stand"], ["you", "e"]], lines: [["narr", "Vendredi, aux sanitaires. Kévin accompagne les petits, porte du bloc ouverte, comme toute l’équipe depuis mardi."], ["malo", "Maintenant, j’ai plus peur d’y aller. Y a toujours quelqu’un."]] },
      moyen: { cast: [["malo", "d", "sad"], ["you", "e"]], lines: [["narr", "Jeudi, aux sanitaires. Les grands sont revenus, et Malo attend devant la porte."], ["malo", "Ils ont dit que j’avais cafté… Alors je dis plus rien."]] },
      catastrophe: { cast: [["nour", "a", "talk"], ["you", "e"]], lines: [["nour", "La maman de Malo a appelé. Il ne veut plus venir : il dit qu’aux toilettes, les grands le regardent. Tu étais au courant ?"], ["narr", "Malo avait parlé. Faute de réponse, c’est sa famille qui l’a retiré de l’accueil."]] } } },
  verite: { at: "parc", room: null, label: "Action ou vérité, au parc",
    tiers: {
      excellent: { cast: [["sacha", "a", "talk"], ["zoe", "b", "stand"], ["you", "f"]], lines: [["narr", "Vendredi, au parc. Un nouveau gage fuse dans le groupe."], ["sacha", "Non, pas ce gage-là ! Si elle veut pas, c’est non. Trouve autre chose."], ["zoe", "Merci, Sacha."]] },
      moyen: { cast: [["zoe", "a", "sad"], ["you", "f"]], lines: [["narr", "Vendredi. Le jeu a repris, derrière les arbres, loin des adultes."], ["zoe", "Ils ont recommencé… mais là où personne voit."]] },
      catastrophe: { cast: [["zoe", "a", "sad"], ["you", "f"]], lines: [["narr", "Jeudi soir, au portail, Zoé ne lâche plus la main de son père."], ["zoe", "Je veux plus aller au parc. Ils m’ont poussée, et personne a rien dit."]] } } },
  sieste: { at: "petits", room: "petits", label: "La porte de la sieste",
    tiers: {
      excellent: { cast: [["kevin", "a", "talk"], ["you", "b"]], lines: [["kevin", "Depuis jeudi, la porte reste ouverte pendant la sieste, et Jade passe toutes les vingt minutes. Franchement, je me sens plus tranquille aussi."]] },
      moyen: { cast: [["kevin", "a", "sad"], ["you", "b"]], lines: [["kevin", "Ok, la règle, je l’ai comprise… mais me faire reprendre devant le petit, ça m’a vexé. Et Malo croit qu’il a fait une bêtise."]] },
      catastrophe: { cast: [["jade", "a", "talk"], ["you", "b"]], lines: [["narr", "Vendredi, à la réunion d’équipe."], ["jade", "La sieste, c’est toujours porte fermée, un seul adulte. Personne n’a rien dit, donc c’est devenu normal."]] } } },
  panneau: { at: "panneau", room: null, label: "Le panneau des familles",
    tiers: {
      excellent: { cast: [["nour", "a", "talk"], ["you", "f"]], lines: [["nour", "L’inspecteur a pris le panneau en photo pour le montrer à d’autres accueils. Et une jeune a appelé le 119 grâce à l’affiche : ça, ça compte vraiment."]] },
      moyen: { cast: [["nour", "a", "talk"], ["you", "f"]], lines: [["nour", "L’inspection a relevé qu’il manquait une affiche. On l’a ajoutée le soir même ; la prochaine fois, on vérifie ensemble."]] },
      catastrophe: { cast: [["nour", "a", "sad"], ["you", "f"]], lines: [["nour", "L’inspection a noté l’absence du 119. C’est une obligation : les enfants doivent pouvoir trouver ce numéro sans avoir à le demander."]] } } },
  photo: { at: "preau", room: null, label: "La photo sous le préau", props: { enzo: "phone" },
    tiers: {
      excellent: { cast: [["enzo", "a", "talk"], ["clara", "b", "stand"], ["you", "f"]], lines: [["narr", "Vendredi, sous le préau. Un jeune sort son téléphone pour filmer un copain qui chute."], ["enzo", "Hé, tu lui demandes d’abord ! Et tu le postes pas sans son accord, c’est la règle."], ["clara", "Il a raison."]] },
      moyen: { cast: [["clara", "a", "sad"], ["you", "f"]], lines: [["narr", "Mardi matin, la photo de Clara a circulé sur le groupe des grands."], ["clara", "Tout le monde l’a vue… Le téléphone, vous l’avez rendu, mais personne lui a demandé de l’effacer."]] },
      catastrophe: { cast: [["enzo", "a", "laugh"], ["you", "f"]], lines: [["narr", "Mercredi. Clara n’est pas revenue. Sa photo, avec des commentaires moqueurs, a fait le tour du groupe."], ["enzo", "Ben quoi ? L’animatrice a dit que c’était rien."]] } } },
  radio: { at: "radio", room: "radio", label: "L’atelier radio",
    tiers: {
      excellent: { cast: [["lena", "c", "talk"], ["clara", "s2"], ["enzo", "s1"], ["you", "a"]], lines: [["narr", "Vendredi, à l’atelier radio. Léna est à la console ; Enzo écrit le texte de l’émission."], ["lena", "Tu vois, là, je baisse le micro de Clara, sinon ça sature. C’est trop bien, la console !"]] },
      moyen: { cast: [["lena", "s2", "sit"], ["bastien", "c", "talk"], ["you", "a"]], lines: [["narr", "Vendredi. À la séance technique, quelques filles sont venues. Mais pendant l’atelier, Bastien répartit toujours de la même façon."], ["bastien", "Les garçons à la console, comme d’habitude ! Les filles, aux textes."]] },
      catastrophe: { cast: [["lena", "s2", "sit"], ["clara", "d"], ["you", "a"]], lines: [["narr", "Vendredi. Aucune fille n’a touché la console de la semaine."], ["lena", "De toute façon, la technique, c’est pas pour nous… C’est ce qu’on nous a dit."]] } } },
};

// Ce que dit la narration en entrant dans une salle (pour toujours savoir où l'on est).
// Retour sur la semaine, raconté par le narrateur, en flash-backs
// Le merci et l'au revoir de Nour : tout à la fin, après le bilan (plus d'écran d'au revoir avant la rétrospective)
const AUREVOIR = [
      { who: null, t: "Vendredi, 18 h. Les dernières familles sont parties. Nour vous attend au portail, là où elle vous avait accueilli lundi matin." },
      { who: "nour", mood: "smile", t: "Je t’ai envoyé par mail le bilan à faire me concernant et concernant ta semaine. Une fois que je l’aurai reçu, je t’enverrai ton bilan avec tes points de valorisation et d’amélioration." },
      { who: "nour", mood: "smile", t: "Et pour terminer, on se fait une visio pour le bilan du projet pédagogique aussi." },
      { who: "nour", mood: "big", t: "Voilà, la semaine est finie. Merci, vraiment, pour ta mission : tu as été là quand les enfants et l’équipe en avaient besoin. Au revoir, et à bientôt." },
];

const FLASH = {
  intro: "C’est moi, Bafaël, votre narrateur. Avant de nous quitter, revenons ensemble sur votre semaine.",
  days: { 1: "Le lundi, vous découvriez l’accueil.", 2: "Le mardi, les mots ont commencé à blesser.", 3: "Le mercredi, c’était la grosse journée.", 4: "Le jeudi, un enfant vous a confié sa parole.", 5: "Et ce vendredi, il a fallu tout mobiliser." },
  chose: "Vous avez pris cette décision.", now: "Voilà ce qu’il en est aujourd’hui.",
  end: "Voilà votre semaine. Merci de l’avoir vécue avec nous.",
};

const ROOM_SAY = {
  petits: "Vous entrez dans la salle des 6-11 ans.", grands: "Vous êtes dans la salle des 11-14 ans.", ados: "Vous entrez dans la salle des 14-17 ans, à l’écart du grand bâtiment.", direction: "Vous êtes à l’accueil, dans le bureau de la direction.",
  equipe: "Vous êtes dans la salle des animateurs.", cuisine: "Vous entrez dans la cuisine pédagogique.", refectoire: "Vous êtes à la restauration.",
  soins: "Vous êtes à l’infirmerie.", sanitaires: "Vous êtes aux sanitaires.", local: "Vous entrez dans la régie, le local du matériel.", radio: "Vous êtes à l’atelier radio.",
  libre: "Vous êtes dans la salle d’activités libre.", dortoir: "C’est la nuitée : vous entrez dans le dortoir.",
};

// Mise en scène sur le plan vivant : où se passe chaque écran, et qui est là.
// at = lieu du plan ; room = salle dans laquelle on entre (sinon on reste dehors) ; cast = [qui, place, attitude].
// « you » = votre personnage. « keep » = on reste dans le décor de l'écran précédent.
// Les articles de presse : proposés à la fin du jeu, « pour aller plus loin ».
const SOURCES = [{"t": "Franceinfo · Périscolaire à Paris : 132 animateurs suspendus depuis le début de l’année", "u": "https://www.franceinfo.fr/societe/education/violences-dans-le-periscolaire/periscolaire-a-paris-132-animateurs-suspendus-depuis-le-debut-de-l-annee-dont-52-pour-suspicions-de-violences-sexuelles-ou-sexistes_8052383.html"}, {"t": "Sud Radio · Paris : plus aucun animateur seul avec un enfant", "u": "https://www.sudradio.fr/societe/crise-du-periscolaire-a-paris-sous-pression-gregoire-lance-une-concertation-sur-les-rythmes-scolaires"}, {"t": "Préfecture des Côtes-d’Armor · Activité accessoire à un accueil sans hébergement", "u": "https://www.cotes-darmor.gouv.fr/contenu/telechargement/49258/345921/file/Activit%C3%A9%20accessoire%20%C3%A0%20un%20accueil%20sans%20h%C3%A9bergement.pdf"}, {"t": "Euronews · Paris adopte un plan pour sécuriser le périscolaire", "u": "https://fr.euronews.com/2026/04/14/paris-adopte-un-plan-pour-securiser-le-periscolaire-apres-les-scandales-des-violences-sexu"}, {"t": "Aleteia · Le rapport du Sénat sur les violences dans le périscolaire", "u": "https://fr.aleteia.org/2026/10/15/la-france-ne-protege-pas-ses-enfants-le-rapport-du-senat-sur-les-violences-dans-le-periscolaire/"}];

// Transitions : une phrase qui dit où l'on est et ce qui vient de se passer, lue en premier.
const BRIDGE = {
  // Lundi
  dbefore: "Nour vous laisse seule un moment dans la salle des animateurs, vide à cette heure-ci. Les enfants ont rejoint leur groupe, et l’équipe a commencé sa journée.",
  map: "9 h 30. Pendant que les groupes sont en activité, Nour revient vous chercher en salle des animateurs.",
  radio: "Lundi, 14 h. Nour vous envoie en renfort à l’atelier radio de Bastien, avec des jeunes du groupe des 13-17 ans.",
  k1: "17 h 30. Votre première journée se termine. Avant que vous partiez, Nour vous laisse une page de son carnet.",
  // Mardi
  brief: "Mardi, 8 h 30, avant l’arrivée des enfants. Briefing du matin en salle des animateurs.",
  ines: "Le briefing est terminé. Pendant que les autres partent préparer leurs activités, Inès reste dans la salle et vous fait signe.",
  rire: "Mardi, 12 h 15, à la restauration.",
  planning: "13 h 30. Retour en salle des animateurs. Nour enfile sa veste : elle doit partir en réunion.",
  theo: "14 h, c’est le temps calme. Jade vous montre un dessin et vous parle de l’enfant qui l’a fait.",
  parent1: "Les activités de l’après-midi se terminent : vous accompagnez les enfants jusqu’au portail.",
  chat: "18 h. Le papa de Zoé est reparti. Vous rejoignez la salle des animateurs pour le point du soir. En sortant votre téléphone, vous découvrez la conversation de groupe de l’équipe, écrite pendant l’après-midi.",
  k2: "Fin de la deuxième journée. Avant que vous rentriez chez vous, Nour vous laisse une nouvelle page de son carnet.",
  // Mercredi
  sousef: "Mercredi, 8 h 05. Avant l’ouverture du portail, Nour, la directrice, réunit l’équipe dans son bureau : il manque du monde aujourd’hui.",
  parent2: "La réunion est finie. Le portail ouvre, et vous prenez votre poste d’accueil.",
  ronde: "Mercredi, 9 h. Les familles sont reparties. Dans la cour, Jade lance la ronde du matin, et vous la rejoignez.",
  chercher: "La matinée et le repas sont passés. Mercredi, 15 h : c’est le temps libre, les enfants sont partout sur le terrain.",
  consent: "Mercredi, 16 h. Après ce que vous a dit Léna, Nour vous retrouve, son carnet à la main.",
  kevin: "Mercredi, 18 h. Les enfants de la journée sont repartis. Pendant que vous rangez la salle des animateurs, Kévin s’approche de vous, l’air gêné.",
  nuit1: "Après le dîner, une partie de l’équipe reste dormir sur place avec les enfants : vous en faites partie.",
  nuit3: "La soirée s’est bien passée et tout le monde est couché. Vous êtes de veille avec Bastien, près du dortoir.",
  kn: "Le lendemain matin, Nour vous laisse une page de son carnet sur la nuitée.",
  k3: "La grosse journée du mercredi est terminée. Nour vous laisse une page de son carnet pour en garder l’essentiel.",
  // Jeudi
  depart: "Jeudi, 16 h. Dans la cour, les enfants jouent en attendant leurs parents.",
  lou: "Vous emmenez Lou un peu à l’écart, dans la salle d’activités libre, pour l’écouter au calme, la porte ouverte.",
  numero: "Lou a parlé. Vous l’avez écouté sans le questionner, et il est toujours à côté de vous.",
  acts: "16 h 06. Les gendarmes ont répondu : ils arrivent.",
  ordre: "Tout s’est enchaîné très vite. Revivez maintenant ces dix premières minutes en temps réel, comme si vous y étiez : chaque seconde compte.",
  portail: "17 h. Nour vous demande de tenir le portail pendant qu’elle reste avec Lou.",
  transm: "17 h 20. Tous les enfants sont partis. Dans le bureau de la direction, vous écrivez ce que vous avez vu et entendu, pendant que c’est encore frais.",
  k4: "Fin d’une journée difficile. Avant que vous partiez, Nour vous laisse une page de son carnet.",
  // Vendredi
  bilanequipe: "Vendredi, 8 h 30. Dernier briefing de la semaine : Nour veut que l’on tire les leçons de ce qui s’est passé.",
  build: "Nour vous confie une mission pour la matinée : rendre la prévention visible à l’accueil, pour les enfants comme pour les adultes.",
  affiche: "Devant le panneau d’affichage, Bastien vous rattrape : il a une idée.",
  familles: "Vendredi, 10 h. Dans le bureau de la direction, Nour vous montre un message arrivé ce matin.",
  maelys: "Vendredi, 13 h. L’atelier bois du matin vient de se terminer. Dans la cour, Maëlys, 14 ans, attend que les autres soient partis pour venir vous voir.",
  trouver: "13 h 15. Maëlys est avec Inès, loin du local.",
  temoin: "13 h 20. Vous vous installez avec Sacha dans la salle des 11-14 ans, au calme.",
  f3: "14 h. Maëlys attend à l’infirmerie, avec Nour. Vous allez la rejoindre.",
  k5: "La semaine touche à sa fin. Nour vous laisse la dernière page de son carnet.",
  dafter: "Vendredi, 17 h 30. Les enfants sont partis. Seule en salle des animateurs, au calme, vous retrouvez les questions du premier jour.",
  souvenirs: "Revenons sur votre semaine, jour par jour : ce que vous aviez fait, et ce que ça a donné.",
};
SCREENS.forEach((sc) => {
  const b = BRIDGE[sc.id]; if (!b) return;
  if (sc.type === "story") sc.lines.unshift({ who: null, t: b });
  else if (sc.type === "dialogue") sc.intro = sc.intro ? b + " " + sc.intro : b;
  else sc.bridge = b;
});

const STAGE = {
  c1: { at: "entree", cast: [["parent", "a", "walk"], ["petit", "b"], ["nour", "d", "wave"], ["sacha", "c", "walk"]] },
  c2: { at: "entree", cast: [["parent", "a", "talk"], ["theo", "b"], ["nour", "d", "wave"], ["you", "e"], ["zoe", "c", "walk"]] },
  c3: { at: "entree", cast: [["parent", "a", "walk"], ["petit", "b", "walk"], ["malo", "c"], ["ines", "d", "wave"], ["you", "e"], ["sacha", "f", "walk"]] },
  c4: { at: "entree", cast: [["parent", "a", "talk"], ["lou", "b"], ["kevin", "d", "wave"], ["you", "e"], ["enzo", "c", "walk"]] },
  c5: { at: "entree", cast: [["parent", "a", "walk"], ["clara", "b", "walk"], ["nour", "d", "wave"], ["you", "e"], ["theo", "c"]] },
  intro: { at: "entree", z: 3.2, cast: [["nour", "c", "wave"], ["you", "b"], ["parent", "e", "walk"], ["theo", "a"], ["sacha", "f", "wave"]] },
  dbefore: { at: "equipe", room: "equipe", cast: [["you", "s1"]] },
  radio: { at: "radio", room: "radio", props: { bastien: "mic" }, cast: [["you", "a"], ["bastien", "c", "talk"], ["enzo", "s1"], ["lena", "s2"], ["clara", "d"]] },
  brief: { at: "equipe", room: "equipe", cast: [["nour", "c", "talk"], ["you", "a"], ["bastien", "s1"], ["ines", "s2"], ["yanis", "d"], ["jade", "f"]] },
  planning: { at: "equipe", room: "equipe", cast: [["nour", "board", "point"], ["you", "a"], ["jade", "c"], ["bastien", "d"], ["ines", "e"], ["kevin", "f"]] },
  ines: { at: "equipe", room: "equipe", cast: [["ines", "b", "talk"], ["you", "a"]] },
  rire: { at: "refectoire", room: "refectoire", meal: true, cast: [["bastien", "a", "talk"], ["you", "b"], ["kevin", "c"], ["theo", "s1"], ["enzo", "s2"], ["clara", "s3"], ["k1", "s8"], ["k2", "s4"], ["k4", "s5"], ["k5", "s6"], ["t3", "s7"], ["k3", "t1"], ["k6", "t2"], ["k7", "t3"], ["k8", "t4"], ["k9", "t5"], ["t5", "t6"], ["t1", "t7"], ["t2", "t8"]] },
  chat: { at: "equipe", room: "equipe", cast: [["you", "a"], ["ines", "s2"], ["jade", "d"]] }, chatact: "keep",
  theo: { at: "petits", room: "petits", props: { theo: "paper" }, cast: [["jade", "a", "talk"], ["you", "b"], ["theo", "s1"], ["zoe", "s2"]] }, theo2: "keep",
  parent1: { at: "entree", cast: [["roussel", "a", "talk"], ["you", "b"], ["zoe", "c"]] },
  sousef: { at: "direction", room: "direction", cast: [["nour", "s1", "talk"], ["jade", "c"], ["kevin", "a"], ["you", "b"]] },
  chercher: { at: "ensemble", cast: [] },
  ronde: { at: "cour", cast: [["jade", "a", "talk"], ["you", "b"], ["malo", "c"], ["zoe", "d"], ["petit", "e"], ["theo", "f"]] },
  consent: { at: "petits", room: "petits", cast: [["nour", "c", "talk"], ["you", "a"], ["zoe", "s1"], ["malo", "s2"], ["sacha", "f"]] },
  silence: { at: "petits", room: "petits", cast: [["nour", "a", "talk"], ["you", "b"]] },
  parent2: { at: "entree", cast: [["benali", "a", "talk"], ["you", "b"], ["malo", "c"]] },
  kevin: { at: "equipe", room: "equipe", cast: [["kevin", "s1", "talk"], ["you", "b"]] },
  nuit1: { at: "petits", room: "dortoir", night: true, props: { bastien: "guitar", malo: "torch", sacha: "torch" }, cast: [["nour", "b", "talk"], ["bastien", "a"], ["you", "c"], ["malo", "e"], ["sacha", "f"]] }, nuit2: "keep",
  nuit3: { at: "petits", room: "dortoir", night: true, props: { sacha: "torch" }, cast: [["bastien", "a", "talk"], ["you", "c"], ["sacha", "e"]] },
  depart: { at: "cour", props: { lou: "bag" }, cast: [["nour", "a"], ["you", "b"], ["lou", "c"], ["parent", "f", "walk"], ["clara", "d"]] },
  lou: { at: "libre", room: "libre", cast: [["lou", "a", "talk"], ["you", "b"]] },
  call_old: { at: "direction", room: "direction", cast: [["you", "a", "talk"], ["lou", "e"], ["nour", "b"]] }, numero: "keep", acts: "keep", ordre: "keep",
  portail: { at: "entree", props: { you: "clip" }, cast: [["you", "a"], ["roussel", "c"], ["karim", "d"], ["petit", "f"], ["rey", "b", "talk"]] },
  transm: { at: "direction", room: "direction", cast: [["you", "a"]] },
  bilanequipe: { at: "equipe", room: "equipe", cast: [["nour", "c", "talk"], ["you", "a"], ["bastien", "s1"], ["ines", "s2"], ["kevin", "d"], ["jade", "f"]] },
  build: { at: "equipe", room: "equipe", cast: [["nour", "a", "talk"], ["you", "b"]] },
  affiche: { at: "panneau", props: { bastien: "paper" }, cast: [["bastien", "a", "point"], ["you", "b"]] },
  familles: { at: "direction", room: "direction", cast: [["nour", "a", "talk"], ["you", "b"]] },
  maelys: { at: "cour", z: 3, cast: [["maelys", "d", "talk"], ["you", "b"]] }, f1: "keep",
  temoin: { at: "grands", room: "grands", cast: [["sacha", "a", "talk"], ["you", "b"]] },
  trouver: { at: "cour", cast: [] },
  souvenirs: { at: "ensemble", cast: [] },
  aurevoir: { at: "entree", z: 3.2, cast: [["nour", "c", "wave"], ["you", "b"]] },   // au même endroit que lundi matin
  garnier: { at: "direction", room: "direction", cast: [["garnier", "s1", "talk"], ["you", "b"]] },
  f3: { at: "soins", room: "soins", cast: [["maelys", "c"], ["nour", "a", "talk"], ["you", "b"]] },
  dafter: { at: "equipe", room: "equipe", cast: [["you", "a"]] },
  bilan: { at: "entree", z: 3.2, cast: [["nour", "c", "wave"], ["you", "b"]] },   // au portail, là où Nour vous avait accueillie lundi
};
// Qui parle dans un texte du récit : les citations « … » sont dites par le personnage nommé juste avant (même phrase),
// le reste par la narratrice ou le narrateur. On entend ainsi un maximum les personnages eux-mêmes.
const SPEAKERS = [["M. Lambert", "garnier"], ["M. Roussel", "roussel"], ["Mme Benali", "benali"], ["Nour", "nour"], ["Bastien", "bastien"], ["Inès", "ines"], ["Jade", "jade"], ["Kévin", "kevin"],
  ["Lou", "lou"], ["Malo", "malo"], ["Maëlys", "maelys"], ["Léna", "lena"], ["Sacha", "sacha"], ["Noé", "theo"], ["Zoé", "zoe"], ["Clara", "clara"], ["Enzo", "enzo"]];
const VOICE_TXT = {
  split(t, fb) {
    t = String(t || ""); const q = [...t.matchAll(/«\s*([^»]+?)\s*»/g)]; if (!q.length) return t ? [["narr", t]] : [];
    const out = []; let from = 0, pend = "";
    const push = (w, x) => { x = x.trim(); if (!x) return; const L = out[out.length - 1]; if (L && L[0] === w && w === "narr") L[1] += " " + x; else out.push([w, x]); };
    for (const m of q) {
      const pre = t.slice(from, m.index), sent = (pend + pre).split(/[.!?…]\s/).pop();
      let who = null, at = -1;
      for (const [nm, w] of SPEAKERS) { const i = sent.lastIndexOf(nm); if (i > at) { at = i; who = w; } }
      if (!who && fb && /[:,]\s*$/.test(pre) && !/parents|familles|message|écrivent/i.test(sent)) who = fb;   // un message écrit par des parents reste lu par le récit
      if (who) { push("narr", pre.replace(/[\s:,]+$/, "")); push(who, m[1]); pend = ""; }
      else { push("narr", pre + "« " + m[1] + " »"); pend = ""; }
      from = m.index + m[0].length;
    }
    push("narr", t.slice(from).replace(/^[\s.,]+/, ""));
    return out;
  },
  // Contexte d'une situation : récit par la narratrice ou le narrateur, citations par le personnage présent.
  parts(sc) {
    const P = [];
    if (sc.type === "chapter") { const c = CHAPTERS[sc.ch - 1]; P.push(["narr", `${c.day}, jour ${c.n} sur ${CHAPTERS.length}. ${c.title}.`]); return P; }
    if (sc.type === "explain" && sc.page) { if (sc.bridge) P.push(["narr", sc.bridge]); P.push(["nour", [sc.page.title, ...(sc.page.pts || [])].join(" ")]); return P; }
    if (sc.crisis) { if (sc.bridge) P.push(["narr", sc.bridge]); P.push(["narr", sc.crisis.intro]); return P; }
    if (sc.bridge) P.push(...this.split(sc.bridge));
    if (sc.fact) P.push(...this.split(sc.fact));
    if (sc.intro) P.push(...this.split(sc.intro));
    if (sc.context) P.push(...this.split(sc.context, sc.npc));
    if (sc.prompt) P.push(["narr", sc.prompt]);
    return P;
  },
  spot(s) { return ["nour", s.t]; },
  fb(sc, o) { return ["narr", [o.cons, o.fb, o.q < 1 && sc.better ? "Pour faire mieux : " + sc.better : ""].filter(Boolean).join(" ")]; },
};

// Promenade libre : chaque scène sur laquelle on peut tomber devient une décision de la semaine (revue vendredi),
// rangée juste après sa promenade. Ces écrans ne s'affichent jamais seuls : on les vit pendant la promenade.
SCREENS.filter((r) => r.type === "roam").forEach((r) => {
  let at = SCREENS.indexOf(r) + 1;
  while (SCREENS[at] && SCREENS[at].inRoam === r.id) at++;
  r.events.forEach((ev) => {
    if (SCREENS.some((x) => x.id === ev.id)) return;   // l'atelier radio existe déjà comme écran
    SCREENS.splice(at++, 0, { id: ev.id, inRoam: r.id, ch: r.ch, type: "choice", comp: ev.comp, kicker: ev.kicker, title: ev.title, context: (ev.lines || ev.beats || []).map(([w, t]) => t).join(" "), prompt: ev.prompt || ev.title, opts: ev.opts, better: ev.better });
    STAGE[ev.id] = { at: ev.at, room: ev.room, cast: ev.cast.map(([w, s, p]) => [w, s, w === "you" ? "stand" : p]) };
  });
});

// Niveau « Moyen » et au-delà : des réponses formulées de façon plus nuancée, moins évidentes (même action, même retour)
const HARD = {
 "sieste": {"0": "Je laisse la porte ouverte, je propose à Malo un tapis près de moi, et j’en reparle à Kévin, puis à Nour.", "1": "Je referme doucement pour ne pas réveiller les autres : il a l’air de bien s’occuper de lui, je repasserai.", "2": "Je dis tout de suite à Kévin que ce n’est pas autorisé et je vais chercher Nour."},
 "photo": {"0": "Je demande à Enzo de supprimer la photo devant moi, puis j’en parle à Bastien et à Nour.", "1": "Je garde le téléphone d’Enzo jusqu’au soir : ça calmera tout le monde.", "2": "Je calme le jeu : c’est entre jeunes, je leur demande de se respecter et je passe à autre chose."},
 "foot": {
  "0": "Je rappelle la règle à tout le groupe et je mélange les équipes moi-même, quitte à faire râler.",
  "1": "Pour éviter le conflit, j’organise vite un autre match à côté, avec Zoé et les filles qui veulent jouer.",
  "2": "Je laisse les enfants régler ça entre eux : à cet âge, c’est en se disputant qu’on apprend à jouer ensemble."
 },
 "sanit": {
  "0": "Je reste avec Malo le temps qu’il y aille, puis j’en parle à Nour pour qu’on revoie l’organisation des passages.",
  "1": "Je vais voir les grands tout de suite et je les sermonne fermement devant les autres, pour que ça ne recommence pas.",
  "2": "Je le rassure : ce sont des jeux de grands, ils ne lui veulent pas de mal. Je l’encourage à y aller."
 },
 "radio": {
  "1": "Je propose qu’on tourne sur les postes dès aujourd’hui, et je reviens vers Bastien après l’atelier.",
  "3": "Je n’interviens pas devant les jeunes pour ne pas désavouer Bastien : chacun reste là où il se sent à l’aise."
 },
 "rire": {
  "2": "Entre collègues, l’humour fait partie de l’ambiance ; je vous demande juste d’être plus discrets devant les enfants."
 },
 "sousef": {
  "1": "D’accord pour ce matin : je garde un œil sur les petits et sur les sanitaires, et on fera le point avec l’organisateur ce soir."
 },
 "silence": {
  "0": "Oui, s’ils se connaissaient bien : il pouvait dire non à tout moment, et il ne l’a pas fait."
 },
 "nuit3": {
  "0": "Je propose un compromis : cinq minutes seulement, il reste habillé et la porte reste ouverte.",
  "2": "Je propose de l’installer un moment dans la salle des adultes, au calme, pour ne pas réveiller les autres."
 },
 "familles": {
  "3": "Proposer des caméras à l’entrée des sanitaires et dans les couloirs, pour rassurer les familles par la transparence."
 }
};

/* ======================================================================
   Niveaux de jeu : enfants, moyen (adultes), expert (adultes)
   ====================================================================== */
// Niveau Moyen et plus : toutes les réponses se ressemblent davantage (on hésite vraiment).
Object.entries({
  radio: { 0: "Je laisse l’atelier se dérouler, et je propose demain une séance technique ouverte à toutes et à tous.", 2: "Je me mets à la console avec Léna pour lui montrer les réglages, pendant que Bastien continue." },
  rire: { 0: "Je sais que vous ne vouliez pas la blesser : allez lui présenter vos excuses, et on n’en parle plus.", 1: "Elle vous a demandé d’arrêter, et vous avez continué : on en reparle avec Nour aujourd’hui.", 3: "Je ne tranche pas à chaud : j’en parlerai à Nour, c’est elle la référente." },
  theo2: { 0: "Prendre Noé à part, au calme, et lui demander s’il s’est passé quelque chose de grave.", 1: "Noter les faits et observer encore deux ou trois jours, pour ne pas alerter sur une simple impression.", 2: "Noter les faits précisément, rester disponible pour Noé sans l’interroger, et transmettre à Nour aujourd’hui.", 3: "En parler à ses parents ce soir au portail, avec tact, pour savoir si quelque chose a changé à la maison." },
  chat: { 0: "Non : chacun n’a écrit qu’une fois ; sans répétition par une même personne, ce n’est pas du harcèlement.", 1: "Oui : quand plusieurs personnes écrivent chacune un message, la répétition peut être constituée.", 2: "Pas tant qu’Inès n’a pas porté plainte : d’ici là, c’est à l’équipe de régler le conflit.", 3: "Non : c’est une conversation privée, hors du temps de travail ; l’employeur n’a pas à s’en mêler." },
  sousef: { 0: "Pas seule aux sanitaires : je propose de regrouper des activités, et on demande un renfort à l’organisateur.", 2: "Je propose un temps calme, film dans la salle de restauration, pour garder tout le monde dans une seule salle, sous les yeux." },
  silence: { 1: "Non : ne pas réagir, ce n’est pas consentir.", 2: "Il faut voir le contexte : ce qui s’était passé juste avant entre eux compte." },
  nuit3: { 1: "Non : on le rassure ensemble, assis près de son lit, et je reste avec vous.", 3: "Si ça ne passe pas, on appelle ses parents pour qu’ils viennent le chercher." },
  affiche: { 0: "Elle peut aider, mais il faut aussi une mesure concrète, et un moyen de vérifier qu’elle tient.", 1: "Oui : afficher la règle, c’est déjà s’engager publiquement devant les familles et les jeunes.", 2: "Une affiche seule ne changera rien : il faut surtout des sanctions claires et connues de tous.", 3: "Oui, et on la fait signer à chaque jeune, pour qu’il s’engage personnellement à la respecter." },
  familles: { 0: "Des règles qu’on peut vérifier : jamais un adulte seul hors de vue, toilettes organisées, contrôles, et à qui parler.", 1: "Rassurer : l’équipe est expérimentée, contrôlée, et aucun incident n’a jamais eu lieu chez nous.", 2: "Proscrire tout contact physique entre adultes et enfants, même pour consoler ou pour soigner." },
  f1: { 0: "Je fais en sorte, tout de suite, que Maëlys ne croise plus l’intervenant : un adulte reste avec elle.", 1: "Je vais entendre la version de l’intervenant avant de décider quoi que ce soit.", 2: "Je lui demande de me raconter précisément ce qui s’est passé, pour transmettre sans erreur.", 3: "Je préviens Nour tout de suite et je la laisse gérer : c’est elle la directrice." },
}).forEach(([id, o]) => { HARD[id] = { ...(HARD[id] || {}), ...o }; });

// Niveau Expert : des situations affinées, des réponses toutes professionnelles en apparence ; seule la nuance départage.
const EXPERT = {
  radio: { 0: "Je ne désavoue pas Bastien devant les jeunes, et j’organise dès demain une séance technique ouverte à toutes et à tous.", 1: "Je propose aux jeunes de tourner sur les postes dès maintenant, puis je reprends le sujet avec Bastien, à froid.", 2: "Je m’installe à la console avec Léna pour lui montrer les réglages, sans interrompre Bastien.", 3: "Je n’interviens pas : les jeunes ont choisi leur poste, aucun ne s’est plaint ; j’en reparlerai si ça se reproduit." },
  foot: { 0: "Je rappelle à tout le groupe que le terrain est à tout le monde, et je compose des équipes mixtes en expliquant pourquoi.", 1: "J’organise un second match juste à côté, pour que Zoé et celles qui le veulent puissent jouer tout de suite.", 2: "Je laisse les enfants trouver un arrangement entre eux, et je n’interviens que si le ton monte." },
  photo: { 0: "Je fais supprimer la photo devant moi, corbeille comprise, puis je préviens Bastien et Nour.", 1: "Je garde le téléphone d’Enzo jusqu’au soir, et je le rendrai à ses parents en expliquant pourquoi.", 2: "Je rappelle à tous qu’on se respecte, je demande à Enzo de ranger son téléphone, et on reprend l’activité." },
  sanit: { 0: "J’accompagne Malo jusqu’à la porte et je reste à proximité, puis je signale à Nour le problème d’organisation des passages.", 1: "Je recadre fermement les grands sur place, pour que Malo puisse y aller sereinement.", 2: "Je rassure Malo : les grands font les malins mais ne lui feront rien ; je l’encourage à y aller seul, comme un grand." },
  rire: { 0: "Je comprends que ce n’était pas pour blesser ; je vous propose d’aller vous excuser auprès d’Inès, et on clôt l’incident.", 1: "Inès vous a demandé d’arrêter, et vous avez continué : je vais en parler avec Nour, c’est elle qui fera le point avec vous.", 2: "Entre collègues, l’humour fait partie de la cohésion ; je vous demande simplement de rester discrets devant les jeunes.", 3: "Je préfère ne pas réagir à chaud et laisser Nour, la référente, décider des suites." },
  theo2: { 0: "Prendre Noé à part, dans un endroit calme, et lui demander avec douceur si quelqu’un lui fait du mal.", 1: "Consigner les faits et poursuivre l’observation quelques jours, pour étayer avant toute transmission.", 2: "Consigner les faits avec ses mots, rester disponible sans le questionner, et transmettre à Nour dans la journée.", 3: "Rencontrer ses parents au portail ce soir, pour croiser les observations avec ce qu’ils voient à la maison." },
  chat: { 0: "Non : faute de répétition par un même auteur, chaque message relève d’un écart isolé.", 1: "Oui : des messages de plusieurs auteurs, à l’initiative de l’un ou en sachant la répétition, peuvent constituer le harcèlement.", 2: "Seule une plainte d’Inès permettrait de qualifier les faits ; d’ici là, cela relève d’un conflit interne.", 3: "Non : l’échange a lieu sur une messagerie privée, hors temps de travail ; l’employeur n’est pas compétent." },
  sousef: { 0: "Je refuse d’assurer seule les sanitaires : on regroupe des activités et on sollicite un renfort auprès de l’organisateur.", 1: "J’accepte pour ce matin en surveillant les petits et les sanitaires, et on alerte l’organisateur ce soir.", 2: "On bascule tout le monde sur un temps calme collectif dans la salle de restauration, pour garder les enfants sous les yeux." },
  silence: { 0: "Oui, dès lors qu’il n’a manifesté aucun refus et qu’ils se connaissaient.", 1: "Non : l’absence de réaction ou le silence ne valent pas consentement.", 2: "Cela dépend de la relation, et des échanges qui ont précédé." },
  nuit3: { 0: "J’accepte cinq minutes, à condition qu’il reste habillé et que la porte reste ouverte.", 1: "Non : on le rassure à deux, assis près de son lit, sans qu’il aille dans le lit d’un adulte.", 2: "On l’installe un moment dans la salle des adultes, au calme, pour ne pas réveiller le dortoir.", 3: "S’il ne se calme pas d’ici un quart d’heure, on appelle ses parents." },
  sieste: { 0: "Je rouvre la porte, j’installe Malo sur un tapis près de moi, je reparle de la règle à Kévin et j’informe Nour.", 1: "Je referme sans bruit pour préserver la sieste : Kévin gère, je repasserai plus tard.", 2: "Je dis à Kévin que ce n’est pas autorisé, et je pars aussitôt chercher Nour." },
  affiche: { 0: "Une affiche peut accompagner, à condition d’y adosser une mesure concrète et un indicateur pour vérifier qu’elle tient.", 1: "Afficher la règle, c’est s’engager publiquement : c’est la première mesure à prendre, visible par les familles.", 2: "Une affiche ne suffit pas : seules des sanctions graduées et connues font évoluer les comportements.", 3: "On la fait signer par chaque jeune : l’engagement personnel rend la règle plus forte." },
  familles: { 0: "Présenter des règles vérifiables : jamais un adulte seul hors de vue, sanitaires organisés, contrôles, et à qui parler.", 1: "Rassurer : l’équipe est expérimentée, contrôlée, et aucun incident n’a été signalé chez nous.", 2: "Proscrire tout contact physique, même pour consoler ou soigner, afin d’écarter tout risque.", 3: "Proposer des caméras à l’entrée des sanitaires et dans les couloirs, au nom de la transparence." },
  f1: { 0: "Je mets Maëlys à l’abri de tout contact avec l’intervenant : un adulte reste avec elle.", 1: "Je recueille la version de l’intervenant avant de prendre une mesure, pour être équitable.", 2: "Je lui demande un récit détaillé, pour transmettre une information exacte.", 3: "Je saisis Nour sans délai et je lui laisse la main : c’est sa responsabilité de directrice." },
};

// Niveau enfants : la même semaine, racontée simplement. On apprend à repérer ce qui n’est pas normal,
// à dire non, et à aller voir un adulte de confiance. Les situations réservées aux adultes ne sont pas jouées.
const KID_SKIP = new Set(["dbefore", "dafter", "ines", "rire", "chat", "chatact", "sousef", "parent1", "parent2", "kevin", "lou", "numero", "acts", "ordre", "portail", "transm", "build", "affiche", "familles", "temoin", "garnier", "f3"]);
const KID = {
  radio: { prompt: "Léna voudrait aussi apprendre à régler les micros. Qu’est-ce qui est juste ?", opts: [
    ["On laisse comme ça aujourd’hui, et demain tout le monde pourra essayer.", "C’est mieux que rien, mais Léna attend encore. Les filles et les garçons peuvent faire les mêmes choses."],
    ["Chacun son tour à la console, filles et garçons, dès maintenant.", "Oui : il n’y a pas de métier « de fille » ou « de garçon ». Chacun peut essayer."],
    ["L’animatrice apprend elle-même à Léna, à la place de Bastien.", "Léna apprend, c’est bien. Mais la règle doit changer pour tout le monde."],
    ["On ne change rien : les garçons à la console, les filles aux textes.", "Ce n’est pas juste : Léna a le droit d’apprendre la console comme les garçons."]] },
  foot: { prompt: "Zoé veut jouer au foot. Qu’est-ce qui est juste ?", opts: [
    ["Tout le monde peut jouer : on fait des équipes mélangées.", "Oui : le foot, c’est pour tout le monde, filles et garçons."],
    ["On propose à Zoé un autre jeu, avec d’autres filles.", "Zoé joue, mais elle est mise à part. Elle avait le droit de jouer au foot."],
    ["On laisse les garçons choisir : c’est leur match.", "Ce n’est pas juste : personne ne doit être exclu parce que c’est une fille."]] },
  photo: { prompt: "Enzo prend Clara en photo alors qu’elle dit non. Que doit faire l’animatrice ?", opts: [
    ["Demander à Enzo d’effacer la photo devant elle, et prévenir les responsables.", "Oui : on n’a pas le droit de prendre ou d’envoyer la photo de quelqu’un qui dit non."],
    ["Prendre le téléphone d’Enzo jusqu’au soir.", "La photo existe encore : il faut l’effacer et prévenir les responsables."],
    ["Dire à Clara que ce n’est pas grave.", "C’est grave : Clara a dit non. Son image lui appartient."]] },
  sanit: { prompt: "Malo n’ose pas aller aux toilettes : des grands regardent par-dessus la porte. Que doit faire l’animatrice ?", opts: [
    ["Rassurer Malo, rester près de la porte, et prévenir la responsable.", "Oui : aux toilettes, chacun a droit à son intimité. Les adultes doivent protéger Malo."],
    ["Crier sur les grands.", "Les grands partent, mais ça peut recommencer. Il faut aussi prévenir la responsable."],
    ["Dire à Malo d’y aller vite, que ce n’est rien.", "Ce n’est pas rien : personne n’a le droit de regarder quelqu’un aux toilettes."]] },
  theo2: { prompt: "Noé a l’air triste et ne mange plus. Que doit faire l’animatrice ?", opts: [
    ["L’obliger à dire tout de suite ce qui ne va pas.", "On ne force pas un enfant à parler. On reste gentil et disponible."],
    ["Attendre quelques jours pour voir.", "Attendre, c’est laisser Noé seul. Il faut en parler vite à la responsable."],
    ["Rester gentille et disponible, et en parler vite à la responsable.", "Oui : Noé sait qu’il peut venir parler, et les adultes s’occupent de lui."],
    ["Demander à ses parents, devant tout le monde.", "Ce n’est pas le bon moment ni le bon endroit. Il faut d’abord en parler à la responsable."]] },
  silence: { prompt: "Si quelqu’un ne dit rien et ne bouge pas, est-ce qu’il est d’accord ?", opts: [
    ["Oui, s’il ne dit pas non.", "Non : se taire, ce n’est pas dire oui. Parfois, on a trop peur pour dire non."],
    ["Non : se taire, ce n’est pas être d’accord.", "Oui : pour être d’accord, il faut le dire vraiment, sans peur."],
    ["Ça dépend.", "Se taire ne veut jamais dire « oui »."]] },
  nuit3: { prompt: "La nuit, Sacha a fait un cauchemar. Que faut-il faire ?", opts: [
    ["Un adulte le prend dans son lit.", "Non : un enfant ne va pas dans le lit d’un adulte."],
    ["On le rassure, assis près de son lit, à plusieurs.", "Oui : on console Sacha près de son lit, et plusieurs adultes sont là."],
    ["On l’emmène tout seul dans la salle des adultes.", "Non : un enfant n’est jamais seul avec un adulte, caché des autres."],
    ["On appelle ses parents.", "Ce n’est pas forcément utile : on peut d’abord le rassurer près de son lit."]] },
  sieste: { prompt: "Pendant la sieste, Kévin est seul avec Malo, porte fermée. Il demande de bien refermer. Que doit faire l’animatrice ?", opts: [
    ["Laisser la porte ouverte, installer Malo près d’elle, et prévenir la responsable.", "Oui : un adulte ne reste pas seul avec un enfant, porte fermée."],
    ["Fermer la porte et s’en aller.", "Non : la porte doit rester ouverte, et un enfant n’est pas seul avec un adulte."],
    ["Crier sur Kévin et partir chercher la responsable.", "Prévenir la responsable, c’est bien. Mais on ne laisse pas Malo seul pendant ce temps."]] },
  f1: { prompt: "Maëlys a raconté qu’un adulte lui a fait quelque chose qui n’est pas normal. Que faut-il faire en premier ?", opts: [
    ["Elle reste avec un adulte de confiance et ne revoit plus cet adulte.", "Oui : d’abord, on protège Maëlys. Elle a bien fait de parler."],
    ["On va d’abord demander à l’adulte si c’est vrai.", "Non : d’abord, on protège Maëlys. Ce sont des professionnels qui vérifient."],
    ["On lui demande de tout raconter en détail.", "Non : on l’écoute, sans la forcer. Des professionnels s’en occuperont."],
    ["On laisse la directrice s’en occuper toute seule.", "Prévenir la directrice, c’est utile, mais il faut d’abord protéger Maëlys."]] },
};
DOCS.reperes = { at: "intro", kidsOnly: true, title: "Mes repères", kind: "panneau", icon: "★",
  notes: ["Mon corps m’appartient : personne n’a le droit de le toucher si je ne veux pas.", "J’ai le droit de dire non, même à un adulte.", "Un secret qui fait peur ou qui fait mal, ça se dit.",
          "Je peux toujours en parler à un adulte de confiance : un animateur, un parent, un professeur.", "Le 119, c’est gratuit, jour et nuit, pour les enfants qui ont besoin d’aide.", "Sur Internet, une photo de moi ne s’envoie pas sans mon accord. Le 3018 peut aider."] };
// Fin de semaine : Bafaël explique pourquoi une réponse passe avant les autres.
const NUANCE = "Oui, on sait : parfois, plusieurs réponses donnent envie d’être cochées, et tout semble s’additionner. Mais la réponse à choisir en premier, c’est la démarche principale à effectuer. Chaque situation est nuancée : ce qui compte, c’est l’ordre dans lequel on agit, et ce qu’on fait d’abord pour protéger.";
const NUANCE_KID = "Parfois, plusieurs réponses avaient l’air bien. Mais la première chose à faire, c’est toujours de protéger, et d’en parler à un adulte de confiance.";

/* Nouvelles scènes vivantes pendant l'exploration libre : une dispute entre deux enfants (lundi),
   et un signal faible, moins frontal (jeudi) : un cadeau et un secret demandés par un adulte. */
(() => {
  const DISPUTE = { id: "dispute", inRoam: true, ch: 1, type: "choice", comp: "C3", kicker: "Lundi après-midi · l’aire de jeux", title: "La dispute",
    context: "Sacha et Léna se tiennent face à face, le ballon entre eux. Le ton monte, Léna pousse Sacha.",
    prompt: "Que faites-vous ?",
    opts: [
      { t: "Je m’interpose calmement, je les sépare, puis j’écoute chacun à son tour avant de chercher une solution avec eux.", q: 1, react: { sacha: "stand", lena: "stand" }, reply: ["sacha", "C’est elle qui a commencé… Bon. D’accord, on joue chacun son tour."], cons: "Les deux enfants reprennent le jeu à tour de rôle. En fin d’après-midi, Léna vient s’excuser d’elle-même.", fb: "Vous faites cesser la violence tout de suite, sans la minimiser, puis vous redonnez la parole à chacun : on règle le conflit avec les enfants, pas à leur place." },
      { t: "Je confisque le ballon et je les mets tous les deux au banc jusqu’au goûter.", q: 0.5, react: { sacha: "sad", lena: "upset" }, reply: ["lena", "C’est trop injuste, c’est lui qui m’a énervée !"], cons: "La bagarre s’arrête, mais personne n’a compris ce qui s’est passé. Le lendemain, ils se disputent à nouveau, plus loin des adultes.", fb: "Arrêter le conflit est nécessaire. Mais une sanction identique, sans écoute, ne règle rien et peut être vécue comme une injustice." },
      { t: "Je les laisse régler ça entre eux : c’est comme ça qu’on apprend.", q: 0, react: { sacha: "upset", lena: "big" }, reply: ["sacha", "Arrête de me pousser !"], cons: "La dispute dégénère : Sacha tombe et s’écorche le genou. Un parent l’apprend le soir même.", fb: "Un geste violent ne se laisse jamais faire : l’adulte protège d’abord, puis aide à régler le conflit." },
    ] };
  const CADEAU = { id: "cadeau", inRoam: true, ch: 4, type: "choice", comp: "C1", kicker: "Jeudi après-midi · le potager", title: "Le bracelet",
    context: "Léna, 12 ans, vous montre un bracelet tout neuf : « C’est le monsieur de l’atelier bois qui me l’a donné. Il a dit de pas le dire aux autres, sinon ils seraient jaloux. »",
    prompt: "Que faites-vous ?",
    opts: [
      { t: "« Merci de me l’avoir montré. Un adulte n’a pas à te demander de garder un secret. » Je note ses mots, l’heure, et j’en parle à Nour aujourd’hui.", q: 1, react: { lena: "smile" }, reply: ["lena", "Ah bon ? D’accord… Je croyais que c’était juste gentil."], cons: "Nour croise ce signalement avec d’autres observations : l’intervenant est recadré, et ne travaille plus jamais seul avec un enfant.", fb: "Un cadeau réservé à un enfant, assorti d’un secret, est un signal faible classique d’emprise. On ne conclut rien, on ne questionne pas plus : on note et on transmet." },
      { t: "Je vais tout de suite voir l’intervenant pour lui demander des explications.", q: 0.3, react: { lena: "concern" }, reply: ["lena", "Tu vas lui dire que je te l’ai dit ?"], cons: "L’intervenant se justifie, et sait désormais qu’on l’observe. Léna, elle, se sent coupable d’avoir parlé.", fb: "Confronter l’adulte expose l’enfant et peut compromettre la suite. Le bon réflexe : noter, puis transmettre à la direction." },
      { t: "« Il est très joli ! C’est gentil de sa part. »", q: 0, react: { lena: "smile" }, reply: ["lena", "Oui, il est super sympa avec moi. Il dit que je suis sa préférée."], cons: "Personne n’a fait le lien. Vendredi, une autre enfant parlera du même intervenant.", fb: "Le cadeau semble anodin, mais le secret demandé change tout : c’est un signal à transmettre, même sans certitude." },
    ] };
  const BAGARRE = { id: "bagarre", inRoam: true, ch: 4, type: "choice", comp: "C2", kicker: "Jeudi après-midi · le préau", title: "La bagarre",
    context: "Sous le préau, Enzo commente le corps de Clara devant ses copains et lui barre le passage. Sacha s’interpose : les deux garçons en viennent aux coups.",
    prompt: "Que faites-vous ?",
    opts: [
      { t: "Je sépare tout de suite les deux garçons et je mets Clara à l’abri avec un collègue. Puis j’écoute Clara, et je reprends avec Enzo ce qu’il lui a fait : ce n’est pas une blague.", q: 1, react: { clara: "calm", enzo: "sad", sacha: "stand" }, reply: ["clara", "Merci… Il fait ça tout le temps, devant tout le monde."], cons: "Les coups cessent net. Nour reçoit Enzo et prévient ses parents ; Sacha est écouté aussi : défendre quelqu’un ne passe pas par les coups. Clara sait désormais vers qui se tourner.", fb: "Vous faites cesser la violence physique sans perdre de vue ce qui l’a déclenchée : commenter le corps de Clara et lui imposer un geste, c’est du harcèlement sexiste. On protège la victime, on nomme les faits, on transmet à la direction." },
      { t: "Je les sépare et je les punis tous les deux pour la bagarre : on ne se bat pas, point.", q: 0.5, react: { sacha: "upset", clara: "sad" }, reply: ["sacha", "Mais c’est lui ! Il embêtait Clara !"], cons: "Les coups s’arrêtent, mais ce qu’a vécu Clara passe à la trappe. Le lendemain, Enzo recommence, plus discrètement.", fb: "Séparer est indispensable. Mais la bagarre cache une violence sexiste : sans la nommer ni protéger Clara, rien ne change." },
      { t: "Je laisse Sacha régler ça : Enzo l’a bien cherché.", q: 0, react: { enzo: "upset", clara: "concern" }, reply: ["enzo", "Lâche-moi ! T’es malade !"], cons: "Enzo tombe et se cogne contre un poteau du préau. Clara, elle, n’a été protégée par aucun adulte.", fb: "Un conflit physique ne se règle jamais entre jeunes, et protéger Clara est le rôle de l’adulte, pas celui de Sacha." },
    ] };
  const i = SCREENS.findIndex((x) => x.id === "foot"); SCREENS.splice(i + 1, 0, DISPUTE);
  const j = SCREENS.findIndex((x) => x.id === "jeudi-libre"); SCREENS.splice(j + 1, 0, CADEAU, BAGARRE);
  const L = SCREENS.find((x) => x.id === "lundi-libre"), J = SCREENS.find((x) => x.id === "jeudi-libre");
  // devant les sanitaires, ça va et vient : des petits y vont, deux grands traînent devant la porte
  L.life.push({ who: "k7", loop: [[8.4, 10.4], [6.2, 9.4], [9.8, 10.2]], speed: 1.6, pause: 2200, from: "14 h 30", to: "16 h 30", gest: ["nod", "laugh"] },
    { who: "k8", loop: [[6.4, 9.6], [9.2, 10.0], [7.6, 10.6]], speed: 1.4, pause: 2800, from: "14 h 30", to: "16 h 30" },
    { who: "t3", at: [6.9, 9.9], from: "14 h 30", to: "16 h 30", gest: ["laugh", "point", "hips"] },
    { who: "t4", at: [7.3, 10.5], from: "14 h 30", to: "16 h 30", gest: ["laugh", "lean", "phone"] });
  const San = L.events.find((x) => x.id === "sanit"); if (San) San.cast = [["malo", "d", "sad"], ["t3", "a", "laugh"], ["t4", "b", "point"], ["you", "e"]];
  L.events.push({ ...DISPUTE, at: "jeux", from: "15 h", to: "16 h 45", duel: ["lena", "sacha"],
    spots: [["sacha", 7.2, 25.5, "upset", ["stomp", "point", "fist"]], ["lena", 8.1, 25.0, "big", ["point", "stomp", "hips"]]],
    ground: [["ball", 7.65, 25.3]],   // le ballon, entre eux deux
    cast: [["sacha", "a", "upset"], ["lena", "b", "big"], ["you", "f", "walk"]],
    act: [[200, "lena", "face", "sacha"], [200, "sacha", "face", "lena"], [400, "lena", "g", "point"], [1100, "sacha", "g", "fist"], [1800, "lena", "g", "stomp"], [2500, "lena", "g", "push"], [2900, "sacha", "hit"], [2900, "sacha", "g", "stagger"], [2900, "sacha", "mv", [-.8, .4, 4]], [3700, "sacha", "g", "point"]],
    crowd: [["k5", 6.4, 24.45], ["k9", 9.5, 26.0]],
    lines: [["lena", "Rends-le ! C’est mon tour, t’as déjà joué !"], ["sacha", "Non, c’est pas vrai ! Lâche-moi !"], ["narr", "Léna pousse Sacha, qui manque de tomber."]] });
  J.events.push({ ...BAGARRE, at: "preau", from: "14 h", to: "16 h 30", tense: true, duel: ["sacha", "enzo"],
    spots: [["enzo", 15.6, 24.6, "big", ["laugh", "point", "hips"]], ["clara", 16.6, 24.0, "upset", ["cover", "stepback", "stop"]], ["sacha", 14.2, 23.4, "upset", ["fist", "stomp"]]],
    cast: [["enzo", "a", "big"], ["clara", "b", "upset"], ["sacha", "c", "upset"], ["you", "f", "walk"]],
    // Enzo harcèle Clara ; Sacha arrive par la gauche et se plante face à lui (même profondeur, l'un en face de l'autre),
    // puis les deux garçons s'empoignent : poussées, recul, retour, poings levés ; Clara recule et se protège
    act: [[200, "enzo", "face", "clara"], [300, "enzo", "g", "point"], [900, "clara", "g", "stepback"], [1300, "enzo", "mv", [.4, -.25, 1.6]], [1800, "enzo", "g", "lean"], [2200, "clara", "g", "cover"], [2400, "clara", "mv", [.5, -.4, 2.2]],
      [2500, "sacha", "mv", [.85, 1.9, 4.2]], [3200, "enzo", "face", "sacha"], [3200, "sacha", "face", "enzo"], [3300, "enzo", "mv", [-.2, .2, 2]],
      [3600, "sacha", "g", "push"], [3900, "enzo", "hit"], [3900, "enzo", "g", "stagger"], [3900, "enzo", "mv", [.35, -.35, 4]],
      [4500, "enzo", "g", "fist"], [4500, "sacha", "g", "fist"], [4900, "enzo", "mv", [-.35, .35, 3]], [5200, "enzo", "g", "push"],
      [5500, "sacha", "hit"], [5500, "sacha", "g", "stagger"], [5500, "sacha", "mv", [-.35, .35, 4]], [6000, "sacha", "face", "enzo"],
      [6100, "sacha", "mv", [.3, -.3, 3]], [6300, "sacha", "g", "push"], [6600, "enzo", "hit"], [6600, "enzo", "g", "stagger"], [6600, "enzo", "mv", [.25, -.25, 4]],
      [7100, "enzo", "face", "sacha"], [7200, "enzo", "g", "fist"], [7200, "sacha", "g", "stomp"]],
    crowd: [["t1", 17.6, 25.2], ["t2", 13.8, 25.4], ["k8", 18.2, 23.4]],
    lines: [["enzo", "Eh, Clara, fais un tour sur toi, qu’on te mette une note !"], ["clara", "Arrête. Je t’ai dit d’arrêter. Laisse-moi passer."], ["narr", "Enzo lui attrape le bras. Sacha fonce sur lui et le pousse ; Enzo le repousse. Ils se battent sous le préau."]] });
  J.events.push({ ...CADEAU, at: "potager", from: "14 h", to: "16 h 30",
    spots: [["lena", 15.0, 27.0, "smile", ["present", "raise", "fidget"]]], props: { lena: "bracelet" },
    cast: [["lena", "a", "smile"], ["you", "b"]],
    lines: [["lena", "Regarde ! C’est le monsieur de l’atelier bois qui me l’a donné. Il a dit de pas le dire aux autres, sinon ils seraient jaloux."]] });
})();
