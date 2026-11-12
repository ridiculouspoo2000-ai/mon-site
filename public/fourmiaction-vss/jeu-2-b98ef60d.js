/* Les Hautes Herbes — scénario. Fourmi'Action, « Prévenir les VSS et agir en ACM ». */
const CHAPTERS = [
  { n: 1, title: "Premier jour", goal: "Repérer ce qui, dans l’organisation, peut créer des inégalités ou des risques.", comp: "C1" },
  { n: 2, title: "Le briefing", goal: "Distinguer ce qui est observé, rapporté ou supposé, et nommer le harcèlement.", comp: "C2" },
  { n: 3, title: "Les règles du jeu", goal: "Comprendre et expliquer le consentement, y compris face à l’autorité d’un adulte.", comp: "C2" },
  { n: 4, title: "Le départ", goal: "Accueillir une révélation, protéger et alerter les bons relais à temps.", comp: "C3" },
  { n: 5, title: "Ce qu’on change", goal: "Concevoir une prévention concrète et vérifiable.", comp: "C4" },
  { n: 6, title: "La dernière journée", goal: "Tout mobiliser dans une situation où la direction freine.", comp: "C3" },
];

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

const SCREENS = [
  /* ---------------- CHAPITRE 1 ---------------- */
  { id: "avatar", ch: 1, type: "avatar" },
  { id: "c1", ch: 1, type: "chapter" },
  { id: "intro", ch: 1, type: "story", scene: "welcome", kicker: "Lundi, 8 h 30",
    lines: [
      { who: "nour", mood: "big", t: "Bienvenue aux Hautes Herbes ! Vingt-quatre jeunes arrivent demain. Moi, c’est Nour, directrice adjointe. Je suis aussi la référente de l’équipe pour les violences sexistes et sexuelles." },
      { who: "nour", mood: "smile", t: "Cette semaine, tu vas croiser des situations délicates. Personne ne te demande d’être juge : on te demande de repérer, de protéger et de transmettre." },
      { who: "nour", mood: "calm", t: "À chaque étape, je te laisse une page de mon carnet. Tu pourras l’ouvrir à tout moment, en haut de l’écran." },
    ] },
  { id: "dbefore", ch: 1, type: "positions", mode: "before", title: "Avant de commencer : vos convictions",
    intro: "Répondez avec vos idées d’aujourd’hui. Rien n’est noté : vous les retrouverez à la fin de la semaine." },
  { id: "map", ch: 1, type: "hotspots", comp: "C1", title: "Le tour du camp",
    intro: "Nour vous fait visiter le site. Quatre points méritent votre attention. Sélectionnez les lieux du plan pour les examiner.",
    spots: [
      { x: 5.8, y: 31.1, w: 23.4, h: 38.2, label: "Atelier radio", real: true, title: "À l’atelier radio", t: "Sur le planning de l’atelier : « Garçons à la console, filles aux textes ». Plusieurs filles ont demandé à apprendre le réglage des micros.", lesson: "La répartition dépend du sexe et ferme l’accès à un apprentissage. Ce n’est pas une infraction en soi, mais c’est une inégalité à corriger.", ref: "R01" },
      { x: 31.8, y: 31.8, w: 24.4, h: 37.5, label: "Salle d’équipe", real: true, title: "Dans la salle d’équipe", t: "Au tableau, la répartition annoncée par le directeur : « Conflits : les hommes. Consoler les enfants : les femmes. »", lesson: "Des rôles attribués à partir d’un stéréotype plutôt que des capacités et des besoins. Une équipe mixte ne garantit pas, à elle seule, l’égalité des rôles.", ref: "R01" },
      { x: 59, y: 36.8, w: 20, h: 32.5, label: "Soins", real: true, title: "À l’espace soins", t: "Zoé, en situation de handicap, communique avec un tableau d’images. Elle a besoin d’aide pour certains soins d’hygiène. Aucun accord d’équipe ne précise qui l’aide, comment recueillir son choix, ni comment respecter son intimité.", lesson: "Aucune violence n’est décrite, mais l’absence de protocole crée une vulnérabilité. Une aide nécessaire n’autorise pas un accès illimité au corps.", ref: "R10" },
      { x: 81.8, y: 43, w: 14.4, h: 33.4, label: "Panneau d’affichage", real: true, title: "Au panneau d’affichage", t: "Le menu, le planning… et un emplacement vide. Les coordonnées du 119 ne sont affichées nulle part.", lesson: "L’affichage du 119 dans les lieux qui accueillent habituellement des mineurs est prévu par la loi (CASF, art. L226-8). Le 3018 a aussi sa place à côté.", ref: "R10" },
      { x: 37.6, y: 72.5, w: 23.6, h: 12.9, label: "Les tentes", real: false, title: "Les tentes", t: "Chaque tente a un adulte référent identifié, dont le prénom est écrit sur la porte.", lesson: "Rien d’inquiétant ici : c’est même une bonne pratique. Des adultes ressources identifiables, c’est une porte d’entrée pour parler." },
      { x: 69.2, y: 75, w: 13.6, h: 14.3, label: "Le potager", real: false, title: "Le potager", t: "Chacun choisit sa tâche : arroser, semer, récolter. Les rôles changent tous les jours.", lesson: "Rien à signaler : un accès libre aux rôles, c’est exactement ce qu’on cherche." },
    ] },
  { id: "radio", ch: 1, type: "choice", comp: "C4", scene: "S01", kicker: "Mardi, atelier radio",
    context: "Bastien anime l’atelier : « Les garçons à la console, les filles aux textes. C’est naturel, elles préfèrent écrire. » Léna lui redemande d’apprendre à régler les micros.",
    prompt: "Que faites-vous ?",
    opts: [
      { t: "Je laisse faire : chacun ses goûts, et l’atelier tourne bien.", q: 0, cons: "Léna retourne à ses textes. À la fin de la semaine, aucune fille n’a touché la console.", fb: "Le « naturel » cache une répartition selon le sexe qui ferme l’accès à un apprentissage." },
      { t: "Je propose une rotation des rôles ouverte à tous, et j’en reparle avec Bastien après l’atelier.", q: 1, cons: "Léna règle son premier micro. Bastien accepte d’en reparler au débrief.", fb: "Vous rouvrez l’accès sans humilier personne, et vous travaillez le raisonnement de l’adulte. C’est la réponse attendue." },
      { t: "Je reprends Bastien devant les jeunes : « Ce que tu dis est sexiste ! »", q: 0.5, cons: "Les jeunes rient, Bastien se braque. La répartition, elle, ne change pas.", fb: "Nommer le problème est juste, mais l’humiliation publique bloque le changement. L’essentiel : rouvrir les rôles." },
      { t: "Cette fois, je réserve la console aux filles.", q: 0.5, cons: "Les garçons protestent… et la répartition reste fondée sur le sexe.", fb: "Inverser la règle ne la supprime pas. L’enjeu, c’est que chacun puisse choisir et essayer." },
    ],
    better: "Rouvrir le choix des rôles, faire tourner les responsabilités et reprendre le raisonnement de l’adulte, sans humiliation." },
  { id: "k1", ch: 1, type: "explain", page: { title: "Sexisme ou discrimination ?",
    pts: [
      "Un stéréotype attribue des aptitudes ou des rôles à tout un groupe. Il devient un levier d’inégalité quand il guide les décisions.",
      "Une discrimination, c’est une décision défavorable liée à un critère interdit (sexe, orientation sexuelle, identité de genre, handicap…), par exemple un refus d’embauche.",
      "Repérer un fonctionnement sexiste ne suffit pas à fixer une qualification pénale. On agit sur l’organisation : rôles, accès au matériel, affichage.",
    ], refs: ["R01", "R02", "Code du travail L1142-2-1", "Code pénal 225-1 et 225-2", "CASF L226-8"] } },

  /* ---------------- CHAPITRE 2 ---------------- */
  { id: "c2", ch: 2, type: "chapter" },
  { id: "brief", ch: 2, type: "story", scene: "S03", kicker: "Mercredi, briefing du matin",
    lines: [
      { who: null, t: "Depuis lundi, à chaque briefing, Bastien et Yanis lancent à Inès, responsable de l’atelier vélo, des remarques sur « les filles qui se prennent pour des garçons »." },
      { who: null, t: "Ce matin, elle leur a demandé d’arrêter. Ils ont continué, en imitant sa façon de parler. Toute l’équipe a ri, sauf elle." },
      { who: "ines", mood: "concern", t: "Tu as deux minutes ? Je crois que je commence à exagérer…" },
    ] },
  { id: "ines", ch: 2, type: "dialogue", comp: "C3", title: "Inès, après le briefing", npc: "ines", start: "n1",
    nodes: {
      n1: { mood: "concern", t: "Tu as vu ? Je me dis que c’est peut-être moi qui le prends mal.",
        opts: [
          { t: "Tu n’exagères pas. Ces remarques se répètent alors que tu as demandé d’arrêter : ce n’est pas normal.", to: "n2", q: 1 },
          { t: "Ils sont lourds, mais c’est de l’humour. Ne le prends pas mal.", to: "n1b", q: 0, note: "Minimiser isole la personne. Ce qui se répète malgré un refus n’est plus de l’humour." },
          { t: "Il faut que tu portes plainte, tout de suite.", to: "n1c", q: 0.5, note: "La plainte est une possibilité, mais une adulte décide de ses démarches. On commence par écouter et informer." },
        ] },
      n1b: { mood: "concern", t: "D’accord… Laisse tomber, alors.",
        opts: [{ t: "Attends, je me suis mal exprimé·e. Ce qui se répète malgré ton refus, ce n’est pas de l’humour.", to: "n2", q: 0.5 }] },
      n1c: { mood: "o", t: "Une plainte ? Je ne sais même pas si c’est grave…",
        opts: [{ t: "C’est toi qui décides de tes démarches. Je peux t’aider à en parler à Nour et te donner des contacts d’aide.", to: "n2", q: 1 }] },
      n2: { mood: "calm", t: "Merci. Mais je ne veux pas d’histoires avec l’équipe.",
        opts: [
          { t: "Je peux venir avec toi voir Nour. L’employeur a l’obligation de faire cesser ces faits.", to: "end", q: 1 },
          { t: "Je vais aller leur régler leur compte moi-même.", to: "n3", q: 0.5, note: "Ton intention est de protéger, mais un règlement de comptes ne garantit ni l’arrêt des faits ni un suivi." },
          { t: "Alors on n’en parle à personne, promis.", to: "n3b", q: 0, note: "Garder le secret laisse la situation continuer. Une alerte interne déclenche l’obligation de l’employeur." },
        ] },
      n3: { mood: "concern", t: "Je préférerais que ça ne tourne pas à la dispute…",
        opts: [{ t: "Tu as raison. On alerte Nour pour que l’employeur fasse cesser les faits, et on garde une trace de ce qui s’est passé.", to: "end", q: 1 }] },
      n3b: { mood: "calm", t: "…Mais si ça continue demain ?",
        opts: [{ t: "Tu as raison, se taire ne réglera rien. Allons voir Nour ensemble : l’employeur doit faire cesser ces faits.", to: "end", q: 0.5 }] },
      end: { end: true, mood: "smile", t: "D’accord. On y va après le déjeuner.",
        lesson: "Le harcèlement sexuel peut reposer sur des propos sexistes répétés, sans aucune proposition sexuelle. Écouter sans minimiser, soutenir, alerter un responsable : l’employeur doit faire cesser les faits (Code du travail, L1153-5)." } } },
  { id: "rire", ch: 2, type: "choice", comp: "C2", npc: "bastien", mood: "smile", kicker: "Au déjeuner",
    context: "Bastien vous arrête : « Franchement, c’était pour rire. On ne voulait pas la blesser. »",
    prompt: "Que lui répondez-vous ?",
    opts: [
      { t: "Si vous ne vouliez pas la blesser, alors ça va.", q: 0, mood: "big", cons: "Bastien repart soulagé. Demain, les remarques reprennent.", fb: "L’intention affichée ne rend pas une plaisanterie acceptable (D1)." },
      { t: "L’intention ne change pas l’effet. Elle vous a demandé d’arrêter et vous avez continué.", q: 1, mood: "o", cons: "Bastien hésite : « Vu comme ça… » Il ne refera pas cette blague.", fb: "Vous ramenez la discussion aux faits : répétition, refus exprimé, effet sur la personne." },
      { t: "Ne t’inquiète pas, je ne dirai rien à Nour.", q: 0, mood: "big", cons: "Inès reste seule face à la situation.", fb: "Promettre le silence à l’auteur des faits va à l’encontre de la protection." },
    ],
    better: "Revenir aux faits : la répétition, le refus exprimé et l’effet sur la personne comptent plus que l’intention affichée." },
  { id: "chat", ch: 2, type: "choice", comp: "C2", kicker: "Jeudi soir, conversation de l’équipe",
    chat: [
      { who: "Yanis", t: "Inès en short aujourd’hui… on comprend le succès de l’atelier vélo." },
      { who: "Bastien", t: "Ha ha, elle devrait faire ça plus souvent." },
      { who: "Hugo", t: "+1, et pas que pour le vélo." },
      { who: "Inès", t: "Arrêtez, s’il vous plaît.", me: false, her: true },
      { who: "Kévin", t: "Détends-toi, c’est entre nous." },
    ],
    prompt: "Chacun n’a écrit qu’un seul message. Peut-on parler de harcèlement sexuel ?",
    opts: [
      { t: "Non : il faut que la même personne répète les propos.", q: 0, fb: "La loi prévoit aussi le cas de plusieurs personnes qui savent que leurs propos s’ajoutent les uns aux autres." },
      { t: "Oui, c’est possible : plusieurs personnes qui savent que leurs propos caractérisent une répétition peuvent y contribuer.", q: 1, fb: "Exactement. Tous ont lu les messages précédents, et la conversation continue malgré la demande d’Inès (Code pénal, art. 222-33)." },
      { t: "Seulement si c’est une messagerie professionnelle.", q: 0, fb: "Une messagerie professionnelle ou privée ne rend pas ces faits acceptables." },
    ],
    better: "Plusieurs auteurs, même avec un seul message chacun, peuvent caractériser un harcèlement quand ils savent que leurs propos s’ajoutent à une répétition." },
  { id: "chatact", ch: 2, type: "multi", comp: "C3", kicker: "Toujours ce jeudi soir",
    prompt: "Que faites-vous ? Sélectionnez toutes les actions utiles.",
    opts: [
      { t: "Je demande d’arrêter et j’écris à Inès pour la soutenir.", ok: true, why: "Faire cesser les propos et soutenir la personne : premiers gestes." },
      { t: "Je conserve une trace utile, sans republier les messages.", ok: true, why: "Préserver les éléments sans prolonger l’exposition d’Inès." },
      { t: "J’alerte Nour : l’employeur doit faire cesser les faits.", ok: true, why: "L’alerte interne déclenche l’obligation de l’employeur." },
      { t: "Je transfère la conversation à toute l’équipe pour que chacun voie.", ok: false, why: "Diffuser à nouveau, c’est prolonger l’exposition d’Inès." },
      { t: "J’attends de voir si ça recommence.", ok: false, why: "La répétition est déjà là, et Inès a demandé d’arrêter." },
    ] },
  { id: "theo", ch: 2, type: "sort", comp: "C1", kicker: "Vendredi, temps calme",
    context: "Théo, 8 ans, a fait un dessin à contenu sexuel, puis a refusé l’atelier cirque qu’il adorait. Votre collègue Jade est catégorique : « Il a été agressé par quelqu’un de sa famille. »",
    prompt: "Classez chaque élément : est-il observé, rapporté ou supposé ?",
    hint: "Demandez-vous qui a vu ou entendu directement. Une conclusion, même convaincue, reste une hypothèse.",
    cats: [{ id: "obs", label: "Observé" }, { id: "rap", label: "Rapporté" }, { id: "sup", label: "Supposé" }],
    items: [
      { t: "Théo a réalisé un dessin à contenu sexuel pendant le temps calme.", cat: "obs", why: "Toi ou l’équipe l’avez vu directement." },
      { t: "Théo a refusé l’atelier cirque, qu’il appréciait.", cat: "obs", why: "Un changement de comportement constaté." },
      { t: "Un autre enfant dit que Théo « a fait des cauchemars cette nuit ».", cat: "rap", why: "C’est la parole de quelqu’un d’autre : on la note comme telle." },
      { t: "Il a été agressé par un membre de sa famille.", cat: "sup", why: "C’est la conclusion de Jade : aucun récit ni autre fait précis ne la fonde." },
      { t: "Théo est sûrement traumatisé.", cat: "sup", why: "Une interprétation, pas une observation." },
    ] },
  { id: "theo2", ch: 2, type: "choice", comp: "C3", kicker: "Et maintenant ?",
    context: "Vous avez trié les faits. Jade attend votre réaction.",
    prompt: "Quelle est la réponse la plus juste ?",
    opts: [
      { t: "Interroger Théo jusqu’à savoir qui lui a fait ça.", q: 0, fb: "L’enquête appartient aux services compétents. Des questions insistantes peuvent orienter et fragiliser sa parole." },
      { t: "Ne rien faire tant qu’on n’a pas de preuve.", q: 0, fb: "Un signe n’est pas une preuve, mais attendre une certitude avant de demander de l’aide est aussi une erreur." },
      { t: "Observer sans interpréter, proposer une écoute non suggestive, et transmettre l’inquiétude à Nour, puis au 119 ou à la CRIP selon la situation.", q: 1, fb: "C’est la réponse attendue : agir sur une inquiétude, sans la transformer en accusation." },
      { t: "Appeler ses parents pour leur demander ce qui se passe à la maison.", q: 0, fb: "Cela peut exposer l’enfant si un adulte du foyer est en cause. L’information des familles s’organise avec les autorités." },
    ],
    better: "Observer, écouter sans suggérer, transmettre : au responsable, puis au 119 ou à la CRIP selon la situation." },
  { id: "k2", ch: 2, type: "explain", page: { title: "Harcèlement, faits et hypothèses",
    pts: [
      "Le harcèlement sexuel peut résulter de propos ou comportements sexuels ou sexistes répétés, même sans proposition sexuelle.",
      "Plusieurs personnes peuvent y contribuer, même si chacune n’agit qu’une fois, quand elles savent que leurs propos s’ajoutent à une répétition.",
      "Je décris les faits et ce qui manque. Je sépare observations et hypothèses. Je n’attends pas d’être certain pour demander de l’aide.",
      "Enfant en danger ou en risque de l’être : 119 ou CRIP, la cellule départementale qui recueille les informations préoccupantes.",
    ], refs: ["R03", "R10", "Code pénal 222-33", "Code du travail L1153-5"] } },

  /* ---------------- CHAPITRE 3 ---------------- */
  { id: "c3", ch: 3, type: "chapter" },
  { id: "ronde", ch: 3, type: "dialogue", comp: "C4", title: "La ronde de l’accueil", npc: "jade", scene: "S15", start: "n1",
    nodes: {
      n1: { mood: "big", narr: "Samedi matin, accueil du nouveau groupe.", t: "Pour se dire bonjour, chacun fait un câlin à son voisin ! … Malo ? Allez, toute l’équipe le fait, ne fais pas ton timide !",
        opts: [
          { t: "Malo, tu peux choisir : un signe de la main, un check du coude… ou juste un « salut ».", to: "n2", q: 1 },
          { t: "Allez Malo, juste un petit câlin, ça ne coûte rien.", to: "n1b", q: 0, note: "Insister transforme une invitation en pression. Un refus doit pouvoir s’exprimer sans humiliation." },
          { t: "Je ne dis rien : c’est Jade qui anime.", to: "n1c", q: 0, note: "Se taire laisse un enfant seul face à la pression du groupe." },
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
  { id: "silence", ch: 3, type: "choice", comp: "C2", kicker: "Une question de Nour",
    context: "« Et s’il n’a rien dit, rien fait, il est resté sans réaction ? »",
    prompt: "Est-ce un accord ?",
    opts: [
      { t: "Oui : s’il n’a pas dit non, c’est qu’il était d’accord.", q: 0, fb: "Le consentement ne peut être déduit du seul silence ou de la seule absence de réaction." },
      { t: "Non : le silence ou l’absence de réaction ne suffisent pas à établir un accord.", q: 1, fb: "C’est ce que dit l’article 222-22 du Code pénal. Un rire ou une attitude amicale ne le prouvent pas non plus." },
      { t: "Ça dépend s’ils étaient amis.", q: 0, fb: "Une relation antérieure, une amitié ou un flirt ne constituent pas une autorisation." },
    ],
    better: "Le silence, l’absence de réaction, un rire ou une relation antérieure ne prouvent jamais le consentement." },
  { id: "kevin", ch: 3, type: "multi", comp: "C2", npc: "kevin", mood: "smile", kicker: "Le soir, à la pause",
    context: "Kévin, animateur de 24 ans, vous confie : « Clara a 17 ans, elle est d’accord. Notre relation est autorisée, non ? » Clara fait partie du groupe qu’il encadre.",
    prompt: "Quels arguments lui opposer ? Sélectionnez tous ceux qui sont justes.",
    opts: [
      { t: "Tu encadres son groupe : tu as autorité sur elle. La loi protège le mineur face à un majeur ayant autorité, même après 15 ans.", ok: true, why: "C’est l’article 227-27 du Code pénal." },
      { t: "Un animateur garde une distance éducative avec les jeunes qu’il encadre.", ok: true, why: "C’est le cœur du rôle éducatif." },
      { t: "La question n’est pas de savoir si elle paraît mature.", ok: true, why: "La maturité supposée ne change rien à la protection." },
      { t: "À partir de 15 ans, tout est permis.", ok: false, why: "Règle simpliste et fausse : l’autorité et l’âge restent déterminants." },
      { t: "Le seul problème, c’est que ça se sache.", ok: false, why: "Le problème, c’est la situation d’autorité, pas sa visibilité." },
    ],
    after: "Et ensuite : mettre fin à la situation d’autorité exposante, alerter l’organisateur et les autorités compétentes, sans culpabiliser Clara." },
  { id: "k3", ch: 3, type: "explain", page: { title: "Le consentement",
    quote: "« Au sens de la présente section, le consentement est libre et éclairé, spécifique, préalable et révocable. » Code pénal, art. 222-22 (loi du 6 novembre 2025)",
    pts: [
      "Sans pression, avec compréhension, pour ce qui est proposé, avant l’acte, et avec le droit de changer d’avis.",
      "Le silence ou l’absence de réaction ne suffisent pas. Une personne endormie ne peut pas donner son accord.",
      "L’âge et l’autorité comptent : un accord exprimé ne suffit pas à rendre licite tout acte entre un adulte et un mineur.",
      "Dans les gestes ordinaires : proposer des alternatives sans contact, laisser un refus possible sans humiliation.",
    ], refs: ["R06", "R07", "Code pénal 222-22", "Code pénal 227-27"] } },

  /* ---------------- CHAPITRE 4 ---------------- */
  { id: "c4", ch: 4, type: "chapter" },
  { id: "depart", ch: 4, type: "story", scene: "S13", kicker: "Samedi, 15 h · départ à 16 h",
    lines: [
      { who: null, t: "Les familles arrivent dans une heure. Lou, 10 ans, s’approche, son sac à la main." },
      { who: "lou", mood: "calm", t: "Je veux pas rentrer. Un adulte à la maison me touche, et il m’a dit de rien dire. Tu gardes le secret, hein ?" },
      { who: null, t: "La personne que Lou désigne doit venir le chercher dans une heure." },
    ] },
  { id: "lou", ch: 4, type: "dialogue", comp: "C3", title: "Accueillir la parole de Lou", npc: "lou", start: "n1",
    nodes: {
      n1: { mood: "calm", t: "Tu gardes le secret, hein ?",
        opts: [
          { t: "Promis, je ne dirai rien à personne.", to: "nsecret", q: 0, flag: "secret", note: "Tu promets ce que tu ne pourras pas tenir : pour protéger Lou, tu devras en parler." },
          { t: "Qui ça ? Il t’a fait quoi exactement ? Montre-moi.", to: "nquest", q: 0, flag: "enquete", note: "Demander une démonstration ou des détails n’est pas ton rôle : ça peut orienter et fragiliser sa parole." },
          { t: "Merci de me l’avoir dit. Tu as bien fait. Ce n’est pas de ta faute.", to: "n2", q: 1 },
        ] },
      nsecret: { mood: "smile", t: "Merci…",
        opts: [{ t: "Lou, je me suis trompé·e. Pour t’aider, je vais devoir prévenir des personnes dont c’est le métier de protéger les enfants.", to: "n2b", q: 0.5 }] },
      nquest: { mood: "concern", t: "…Je sais pas. Laisse tomber.",
        opts: [{ t: "Pardon, tu n’as pas à m’en dire plus. Merci de m’avoir parlé, ce n’est pas de ta faute.", to: "n2", q: 0.5 }] },
      n2: { mood: "calm", t: "Tu vas le dire à qui ?",
        opts: [
          { t: "À des personnes dont c’est le métier de protéger les enfants. Je reste avec toi pendant ce temps.", to: "end", q: 1 },
          { t: "À personne, ne t’inquiète pas.", to: "nsecret2", q: 0, flag: "secret", note: "Rassurer par un secret, c’est bloquer la protection." },
          { t: "Je te promets qu’il ira en prison.", to: "n3", q: 0, note: "On ne garantit ni une peine, ni l’absence de conséquence familiale." },
        ] },
      n2b: { mood: "concern", t: "Tu avais promis…",
        opts: [{ t: "Je sais. Je préfère te dire la vérité : on va chercher de l’aide, et je reste avec toi.", to: "end", q: 1 }] },
      nsecret2: { mood: "smile", t: "D’accord…",
        opts: [{ t: "En fait, non : je dois prévenir des personnes qui protègent les enfants. Je reste avec toi.", to: "end", q: 0.5 }] },
      n3: { mood: "o", t: "En prison ?!",
        opts: [{ t: "Je ne sais pas ce qui va se passer. Mais je vais chercher de l’aide, et je reste avec toi.", to: "end", q: 0.5 }] },
      end: { end: true, mood: "calm", t: "…D’accord.",
        lesson: "Remercier, dire que l’enfant n’est pas responsable, ne jamais promettre le secret, expliquer simplement que certaines informations doivent être partagées pour le protéger. Ne pas demander de démonstration, ne pas faire répéter." } } },
  { id: "call", ch: 4, type: "choice", comp: "C3", kicker: "15 h 05 · l’adulte désigné arrive à 16 h",
    prompt: "Quel est votre premier appel ?",
    opts: [
      { t: "Le 17 (ou le 112)", q: 1, cons: "Les gendarmes prennent l’appel et organisent la prise en charge avant 16 h.", fb: "L’exposition est imminente. Seules les forces de l’ordre et la justice peuvent organiser la protection de Lou avant le départ." },
      { t: "Le 119", q: 0.5, cons: "L’écoutant vous oriente… et vous conseille d’appeler immédiatement le 17.", fb: "Le 119 aide à s’orienter, mais ici l’exposition est imminente : le 17 d’abord." },
      { t: "L’adulte désigné, pour annuler sa venue", q: 0, cons: "L’adulte est alerté avant toute protection. Lou est davantage exposé.", fb: "Ne jamais appeler seul la personne mise en cause, ni lui demander de s’expliquer." },
      { t: "Personne : j’attends M. Garnier, le directeur, qui revient à 17 h", q: 0, cons: "À 16 h, Lou serait déjà parti.", fb: "Une information interne ne remplace pas les démarches externes, et l’urgence n’attend pas." },
    ],
    better: "Danger imminent : 17 ou 112. Puis la direction et l’organisateur. Le 119 peut aider à s’orienter." },
  { id: "acts", ch: 4, type: "sort", comp: "C3", kicker: "Pendant que les gendarmes arrivent",
    prompt: "Triez les cartes Actions pour la situation de Lou.",
    hint: "Ce qui protège tout de suite s’engage maintenant. Ce qui expose Lou, retarde l’alerte ou élargit la diffusion s’écarte.",
    cats: [{ id: "eng", label: "À engager" }, { id: "eca", label: "À écarter" }, { id: "dur", label: "Dans la durée" }],
    items: [
      { t: "A01 · Mettre à l’abri", cat: "eng", why: "Éviter une nouvelle exposition, rechercher les secours." },
      { t: "A02 · Accueillir la parole", cat: "eng", why: "Écouter sans suggérer, expliquer à qui l’on transmet." },
      { t: "A03 · Noter les faits", cat: "eng", why: "Observations, paroles exactes, date et contexte." },
      { t: "A04 · Alerter", cat: "eng", why: "Responsable sûr et autorités, sans attendre une enquête interne." },
      { t: "A05 · Promettre le secret", cat: "eca", why: "La protection exige de transmettre." },
      { t: "A06 · Confronter les personnes", cat: "eca", why: "Jamais de confrontation : l’enquête appartient aux services compétents." },
      { t: "A07 · Attendre une preuve", cat: "eca", why: "On n’attend ni certitude ni aveux pour alerter." },
      { t: "A09 · Prévenir les parents tout de suite", cat: "eca", why: "Ici, l’adulte désigné vit au domicile : l’information des parents se décide avec les autorités." },
      { t: "A10 · Informer toute l’équipe", cat: "eca", why: "Seules les personnes qui doivent agir reçoivent les informations nécessaires." },
      { t: "A08 · Organiser le suivi", cat: "dur", why: "Vérifier les mesures de protection, les relais, l’absence de représailles." },
    ] },
  { id: "ordre", ch: 4, type: "order", comp: "C3", kicker: "Les dix premières minutes",
    prompt: "Remettez ces actions dans un ordre pertinent à l’aide des flèches.",
    items: [
      { t: "Rester avec Lou, à l’écart de la cour du départ", g: 1, why: "Protéger d’abord : Lou n’est jamais laissé seul." },
      { t: "Appeler le 17", g: 2, why: "L’exposition est imminente." },
      { t: "Prévenir Nour, qui informe l’organisateur", g: 2, why: "En même temps que l’appel, ou juste après : l’interne ne remplace pas l’externe." },
      { t: "Noter les mots exacts de Lou", g: 3, why: "Rapidement, mais les actions urgentes n’attendent pas l’écrit." },
      { t: "Organiser le suivi avec les services", g: 4, why: "La protection continue après l’alerte." },
    ] },
  { id: "transm", ch: 4, type: "multi", comp: "C1", kicker: "16 h 20 · votre transmission écrite",
    prompt: "Cochez ce qui doit figurer dans votre transmission.",
    opts: [
      { t: "Samedi, 15 h, cour du départ : Lou (10 ans) vient me parler.", ok: true, why: "Date et contexte." },
      { t: "Ses mots : « Un adulte à la maison me touche, et il m’a dit de rien dire. »", ok: true, why: "Les paroles exactes, entre guillemets." },
      { t: "Mesures prises : Lou reste avec moi ; 17 appelé à 15 h 05 ; Nour prévenue.", ok: true, why: "Mesures et interlocuteurs contactés." },
      { t: "Identité exacte de l’adulte : non connue.", ok: true, why: "On écrit « non connu » plutôt que d’inventer." },
      { t: "Lou avait l’air de dramatiser.", ok: false, why: "Une interprétation, qui n’a pas sa place dans les faits." },
      { t: "Le père est sûrement violent.", ok: false, why: "Une supposition sur une personne : on ne colle pas d’étiquette." },
    ] },
  { id: "k4", ch: 4, type: "explain", page: { title: "Agir face à une révélation",
    pts: [
      "Protéger et écouter : faire cesser l’exposition, écouter sans suggérer, ne pas promettre le secret.",
      "Noter sans enquêter : contexte, mots entendus, faits observés. Pas d’aveux, pas de confrontation.",
      "Danger immédiat : 17 ou 112 (114 par SMS). Urgence médicale : 15. Enfant en danger : 119 ou CRIP.",
      "Violences sexuelles sur un mineur : autorités judiciaires. En ACM, l’organisateur signale aussi sans délai au SDJES.",
      "L’information des parents s’organise avec les autorités lorsqu’un risque l’impose.",
    ], refs: ["A01 à A10", "R10", "Code pénal 434-3", "CASF R227-11"] } },

  /* ---------------- CHAPITRE 5 ---------------- */
  { id: "c5", ch: 5, type: "chapter" },
  { id: "bilanequipe", ch: 5, type: "story", scene: "S17", kicker: "Dimanche matin, réunion d’équipe",
    lines: [
      { who: "nour", mood: "smile", t: "On ne repart pas comme on est venus. Reprends un des points repérés lundi pendant le tour du camp." },
      { who: "nour", mood: "calm", t: "Propose une mesure qu’on pourra vraiment vérifier : un changement, une personne responsable, un moment, un indicateur." },
    ] },
  { id: "build", ch: 5, type: "build", comp: "C4", title: "Concevoir une prévention qui se voit" },
  { id: "affiche", ch: 5, type: "choice", comp: "C4", npc: "bastien", mood: "smile", kicker: "Bastien a une idée",
    context: "« Et si on mettait juste une grande affiche “Ici, on respecte tout le monde” ? C’est réglé, non ? »",
    prompt: "Que lui répondez-vous ?",
    opts: [
      { t: "Une affiche peut aider, mais elle ne prouve pas que le fonctionnement a changé. Il nous faut une mesure et un indicateur.", q: 1, mood: "o", fb: "Une affiche seule peut être utile, mais ne démontre pas que les pratiques ont changé." },
      { t: "Oui, c’est suffisant.", q: 0, mood: "big", fb: "Une bonne intention ne suffit pas : il faut un changement concret et vérifiable." },
      { t: "Non, les affiches ne servent à rien.", q: 0.5, mood: "concern", fb: "Certaines affiches sont même obligatoires, comme celle du 119. Elles complètent une mesure, sans la remplacer." },
    ],
    better: "Garder l’affiche si elle est utile, mais l’accompagner d’un changement concret et d’un indicateur observable." },
  { id: "k5", ch: 5, type: "explain", page: { title: "Une prévention qui se voit",
    pts: [
      "Une mesure désigne un changement, une personne responsable, un moment et un indicateur observable.",
      "Créer plusieurs portes d’entrée pour parler et rendre les adultes ressources identifiables.",
      "Afficher le 119 et le 3018. Fixer des règles claires sur les échanges numériques et la vie d’équipe.",
      "L’égalité concerne aussi le recrutement, les réunions et les tâches de soin ou de rangement.",
      "Un contrôle d’honorabilité ne remplace jamais cette vigilance.",
    ], refs: ["Carte des domaines de prévention", "CASF L226-8"] } },

  /* ---------------- CHAPITRE 6 ---------------- */
  { id: "c6", ch: 6, type: "chapter" },
  { id: "maelys", ch: 6, type: "story", scene: "S07", kicker: "Dimanche, 13 h",
    lines: [
      { who: "maelys", mood: "calm", t: "Je peux te parler ? … Hier, pendant le rangement du local, l’intervenant de l’atelier bois m’a imposé des attouchements." },
      { who: "maelys", mood: "concern", t: "Je ne veux plus entrer dans cette pièce. Et il y a atelier bois à 15 h." },
      { who: null, t: "Vous remerciez Maëlys de vous avoir parlé et lui dites que ce n’est pas de sa faute. Maintenant, il faut décider." },
    ] },
  { id: "f1", ch: 6, type: "choice", comp: "C3", kicker: "13 h 05",
    prompt: "Votre toute première décision ?",
    opts: [
      { t: "Faire en sorte, tout de suite, que Maëlys ne croise pas l’intervenant : elle n’ira pas à l’atelier, et un adulte reste avec elle.", q: 1, cons: "Maëlys souffle. Elle reste avec vous à la bibliothèque.", fb: "Protéger d’abord : éviter toute nouvelle exposition." },
      { t: "Aller voir l’intervenant pour entendre sa version.", q: 0, cons: "L’intervenant est prévenu et peut faire pression.", fb: "Pas d’enquête personnelle, pas de confrontation : cela appartient aux services compétents." },
      { t: "Lui demander de vous montrer comment ça s’est passé.", q: 0, cons: "Maëlys se ferme.", fb: "Ne jamais demander de démonstration des gestes, ni vérifier soi-même le récit." },
      { t: "Attendre la fin du séjour pour ne pas l’inquiéter.", q: 0, cons: "À 15 h, elle reverrait l’intervenant.", fb: "La protection passe avant le programme." },
    ],
    better: "Éviter toute nouvelle exposition, puis alerter : responsable sûr et autorités." },
  { id: "garnier", ch: 6, type: "dialogue", comp: "C3", title: "Le bureau du directeur", npc: "garnier", start: "n1",
    nodes: {
      n1: { mood: "concern", t: "Maëlys ? Elle a dû mal comprendre. Il travaille ici depuis dix ans. On verra demain avec l’organisateur, je ne veux pas de scandale.",
        opts: [
          { t: "D’accord, on attend demain.", to: "nwait", q: 0, note: "Attendre laisse l’intervenant au contact des jeunes. Rien ne justifie ce délai." },
          { t: "Ces faits doivent être portés aux autorités sans attendre, et l’organisateur doit les signaler au SDJES. Si on attend, je les contacte moi-même.", to: "n2", q: 1 },
          { t: "Je vais régler ça directement avec l’intervenant.", to: "nconf", q: 0, flag: "enquete", note: "Une confrontation peut exposer Maëlys et compromettre l’enquête." },
        ] },
      nwait: { mood: "calm", narr: "L’atelier bois commence dans moins de deux heures.", t: "Voilà, c’est plus raisonnable.",
        opts: [{ t: "Non. Une information interne ne remplace pas les démarches externes. Si la direction empêche d’agir, je contacte directement les services.", to: "n2", q: 0.5 }] },
      nconf: { mood: "o", t: "Tu vas aller le voir ?",
        opts: [{ t: "Non, tu as raison de t’inquiéter : l’enquête appartient aux services compétents. On alerte maintenant.", to: "n2", q: 0.5 }] },
      n2: { mood: "o", t: "…Bon. Qui appelle qui ?",
        opts: [
          { t: "Je contacte la gendarmerie. Tu préviens l’organisateur pour le signalement au SDJES, et l’intervenant est écarté de l’atelier.", to: "end", q: 1 },
          { t: "J’envoie un message à toute l’équipe pour que chacun soit vigilant.", to: "endb", q: 0, note: "Seules les personnes qui doivent agir reçoivent les informations nécessaires." },
        ] },
      end: { end: true, mood: "calm", t: "C’est noté. J’appelle l’organisateur.",
        lesson: "Plusieurs démarches peuvent coexister, sans attendre l’une pour l’autre : protection, mesures de l’organisateur, signalement judiciaire, signalement au SDJES. Le responsable qui freine n’est jamais un passage obligé." },
      endb: { end: true, mood: "concern", t: "Toute l’équipe ? Et Maëlys, dans tout ça ?",
        lesson: "L’alerte va aux autorités judiciaires et, par l’organisateur, au SDJES. L’intervenant est écarté. Le reste de l’équipe sait seulement qu’une situation est prise en charge." } } },
  { id: "f3", ch: 6, type: "multi", comp: "C3", npc: "maelys", mood: "calm", kicker: "14 h",
    context: "Maëlys vous demande : « Je vais avoir des problèmes ? »",
    prompt: "Que pouvez-vous lui dire ? Sélectionnez toutes les phrases justes.",
    opts: [
      { t: "Tu as bien fait de parler. Ce n’est pas de ta faute.", ok: true, why: "Prendre la parole au sérieux, déculpabiliser." },
      { t: "Des adultes dont c’est le métier vont t’aider. Je dois leur transmettre ce que tu m’as dit.", ok: true, why: "Expliquer simplement pourquoi on transmet." },
      { t: "Tu n’iras pas à l’atelier, et un adulte reste avec toi.", ok: true, why: "Dire concrètement ce qui la protège maintenant." },
      { t: "Je te promets qu’il sera puni.", ok: false, why: "On ne garantit pas une peine." },
      { t: "Personne d’autre ne le saura.", ok: false, why: "On ne promet jamais le secret." },
    ] },
  { id: "dafter", ch: 6, type: "positions", mode: "after", title: "Tes convictions, une semaine plus tard",
    intro: "Mêmes affirmations qu’au premier jour. Répondez à nouveau, puis comparez." },
  { id: "bilan", ch: 6, type: "bilan" },
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
    { id: "planning", scene: "S17", title: "La répartition de l’équipe",
      change: [
        { t: "Répartir les tâches selon les compétences, avec des relais explicites et révisables.", q: 1, fb: "C’est ce que proposait déjà une collègue en réunion d’installation." },
        { t: "Garder la répartition, mais en discuter un jour.", q: 0, fb: "Rien ne change dans les faits." },
        { t: "Tirer les rôles au sort chaque matin.", q: 0.5, fb: "Casse le stéréotype, mais ignore les compétences et les besoins." },
      ],
      ind: [
        { t: "Vérifier en réunion qui prend effectivement en charge conflits et consolations.", q: 1, fb: "On regarde la pratique réelle, pas l’intention." },
        { t: "Avoir autant d’hommes que de femmes dans l’équipe.", q: 0, fb: "Une présence équilibrée ne garantit pas, à elle seule, l’égalité des rôles." },
        { t: "Demander si tout le monde est content.", q: 0.5, fb: "Un ressenti, pas une observation." },
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
  { id: "protect", label: "Protéger d’abord : éviter toute nouvelle exposition", ch: 6, from: [["f1", 1]] },
  { id: "listen", label: "Écouter sans promettre le secret ni enquêter", ch: 4, from: [["lou", 0.8]] },
  { id: "alert", label: "Alerter les autorités adaptées, même si la direction freine", ch: 4, from: [["call", 1], ["garnier", 0.75]] },
  { id: "note", label: "Séparer faits observés, paroles rapportées et suppositions", ch: 2, from: [["theo", 0.8], ["transm", 0.8]] },
  { id: "prev", label: "Prévenir avec une mesure vérifiable", ch: 5, from: [["build", 0.75]] },
];

const NUMBERS = [
  ["17 · 112", "Danger immédiat"], ["114", "Par SMS, pour les personnes sourdes, malentendantes ou ne pouvant pas parler"], ["15", "Urgence médicale"],
  ["119", "Enfance en danger, 24 h/24"], ["3018", "Violences numériques faites aux mineurs"], ["3919", "Violences faites aux femmes"],
  ["116 006", "France Victimes, aide aux victimes"], ["3928", "Défenseur des droits, discriminations"],
];

/* Textes lus à voix haute en plus des répliques (même logique pour le jeu et pour la génération des voix). */
const VOICE_TXT = {
  // Contexte d'une situation : récit par la narratrice ou le narrateur, citations par le personnage présent.
  parts(sc) {
    const P = [];
    if (sc.type === "chapter") { const c = CHAPTERS[sc.ch - 1]; P.push(["narr", `Chapitre ${c.n}. ${c.title}. ${c.goal}`]); return P; }
    if (sc.type === "explain" && sc.page) { P.push(["nour", [sc.page.title, ...(sc.page.pts || [])].join(" ")]); return P; }
    if (sc.intro) P.push(["narr", sc.intro]);
    const t = sc.context;
    if (t) {
      const q = [...t.matchAll(/«\s*([^»]+?)\s*»/g)];
      if (sc.npc && q.length) {
        const a = t.slice(0, q[0].index).replace(/[\s:,]+$/, "").trim(), z = t.slice(q[q.length - 1].index + q[q.length - 1][0].length).replace(/^[\s.,]+/, "").trim();
        if (a) P.push(["narr", a]);
        P.push([sc.npc, q.map((m) => m[1]).join(" … ")]);
        if (z) P.push(["narr", z]);
      } else P.push(["narr", t]);
    }
    if (sc.prompt) P.push(["narr", sc.prompt]);
    return P;
  },
  spot(s) { return ["nour", `${s.title}. ${s.t} ${s.lesson}`]; },
  fb(sc, o) { return ["narr", [o.cons, o.fb, o.q < 1 && sc.better ? "Pour faire mieux : " + sc.better : ""].filter(Boolean).join(" ")]; },
};
