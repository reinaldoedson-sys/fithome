import { Exercise, MuscleGroup, HomeEquipment } from '../types/workout';

export const MUSCLE_LABELS: Record<MuscleGroup, { pt: string; en: string }> = {
  chest: { pt: 'Peitoral', en: 'Chest' },
  lats: { pt: 'Costas & Dorsais', en: 'Lats' },
  traps: { pt: 'Trapézio', en: 'Traps' },
  shoulders: { pt: 'Ombros / Deltoides', en: 'Shoulders' },
  biceps: { pt: 'Bíceps', en: 'Biceps' },
  triceps: { pt: 'Tríceps', en: 'Triceps' },
  forearms: { pt: 'Antebraço & Pegada', en: 'Forearms' },
  abs: { pt: 'Abdômen & Core', en: 'Abs' },
  quads: { pt: 'Quadríceps (Coxas)', en: 'Quads' },
  hamstrings: { pt: 'Posterior de Coxa', en: 'Hamstrings' },
  glutes: { pt: 'Glúteos', en: 'Glutes' },
  calves: { pt: 'Panturrilhas', en: 'Calves' },
  lower_back: { pt: 'Lombar & Postura', en: 'Lower Back' },
};

export const HOME_EQUIPMENT_LABELS: Record<HomeEquipment, { pt: string; icon: string }> = {
  bodyweight: { pt: 'Apenas Peso Corporal (Zero Equipamento)', icon: '🧍' },
  chair: { pt: 'Cadeira / Sofá / Banco', icon: '🪑' },
  backpack: { pt: 'Mochila com Carga / Garrafas', icon: '🎒' },
  resistance_band: { pt: 'Faixa Elástica / Extensor', icon: '🟡' },
  towel: { pt: 'Toalha de Banho', icon: '🧣' },
  wall: { pt: 'Parede', icon: '🧱' },
  dumbbell: { pt: 'Halteres Caseiros / Pesinhos', icon: '🏋️' },
};

export const EXERCISES: Exercise[] = [
  // --- PEITORAL EM CASA (CHEST) ---
  {
    id: 'pushup-standard',
    name: 'Standard Push-Up',
    namePt: 'Flexão de Braço no Solo',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders', 'abs'],
    equipment: 'bodyweight',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'intermediario',
    instructions: [
      'Posicione as mãos no chão ligeiramente além da largura dos ombros.',
      'Mantenha pernas esticadas, glúteos e abdômen contraídos formando uma linha reta.',
      'Desça o tronco até o peitoral quase tocar o chão, mantendo cotovelos a ~45° do tronco.',
      'Empurre o chão com força até estender os braços.'
    ],
    homeTips: [
      'Caso ainda não consiga fazer com pés no chão, apoie os joelhos no solo ou faça no sofá.',
      'Não deixe a lombar afundar nem o quadril subir.'
    ]
  },
  {
    id: 'pushup-incline-chair',
    name: 'Incline Push-Up (Hands Elevated)',
    namePt: 'Flexão Inclinada no Sofá / Cadeira',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'chair',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Apoie as mãos firmemente no assento do sofá ou de uma cadeira encostada na parede.',
      'Afaste os pés para trás mantendo o corpo totalmente alinhado.',
      'Desça o peitoral em direção ao apoio e empurre de volta.'
    ],
    homeTips: [
      'Variação perfeita para iniciantes ganharem força antes da flexão no solo.',
      'Certifique-se de que a cadeira não deslize (encoste-a contra uma parede firme).'
    ]
  },
  {
    id: 'pushup-decline-couch',
    name: 'Decline Push-Up (Feet Elevated)',
    namePt: 'Flexão Declinada (Pés no Sofá)',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'chair',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'avancado',
    instructions: [
      'Coloque a ponta dos pés sobre o sofá ou cadeira e as mãos no chão.',
      'Mantenha o core firme e desça até quase encostar o peito no solo.',
      'Empurre de volta concentrando na parte superior do peitoral.'
    ],
    homeTips: [
      'Aumenta consideravelmente a carga suportada pelos braços e foca na porção clavicular do peito.',
      'Olhe para o chão logo à frente para não tensionar a cervical.'
    ]
  },
  {
    id: 'diamond-pushup',
    name: 'Diamond Push-Up',
    namePt: 'Flexão Diamante (Peito Interno & Tríceps)',
    primaryMuscle: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: 'bodyweight',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'avancado',
    instructions: [
      'No chão, una os dedos indicadores e polegares formando a figura de um diamante/triângulo.',
      'Desça o tronco levando o peito em direção às mãos.',
      'Estenda os cotovelos com força sentindo forte contração no tríceps.'
    ],
    homeTips: [
      'Excelente construtor de força para braços sem nenhum acessório.',
      'Pode ser feito com joelhos apoiados para facilitar.'
    ]
  },
  {
    id: 'chair-dips',
    name: 'Chair Bench Dips',
    namePt: 'Mergulho no Sofá / Cadeira (Dips)',
    primaryMuscle: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    equipment: 'chair',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Sente-se na borda de uma cadeira ou sofá firme e apoie as mãos ao lado do quadril.',
      'Desloque o quadril para fora do assento e flexione os cotovelos até 90 graus.',
      'Empurre com as palmas até estender os braços novamente.'
    ],
    homeTips: [
      'Pernas dobradas facilitam o exercício; pernas esticadas com calcanhares no chão tornam mais difícil.',
      'Mantenha as costas rente à cadeira na descida.'
    ]
  },

  // --- COSTAS E DORSAIS EM CASA (BACK & LATS) ---
  {
    id: 'table-inverted-row',
    name: 'Table Inverted Row',
    namePt: 'Remada Invertida sob a Mesa',
    primaryMuscle: 'lats',
    secondaryMuscles: ['biceps', 'traps', 'forearms'],
    equipment: 'chair',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'intermediario',
    instructions: [
      'Deite-se debaixo de uma mesa de jantar sólida e resistente.',
      'Segure a borda da mesa com as mãos na largura dos ombros.',
      'Mantendo o corpo reto como uma prancha, puxe o peito em direção à borda da mesa.',
      'Desça com controle até quase estender os braços.'
    ],
    homeTips: [
      'TESTE a estabilidade da mesa antes de colocar seu peso corporal.',
      'O melhor exercício caseiro para simular puxadas e barra fixa sem barra em casa!'
    ]
  },
  {
    id: 'backpack-bent-over-row',
    name: 'Backpack Bent-Over Row',
    namePt: 'Remada Curvada com Mochila Carregada',
    primaryMuscle: 'lats',
    secondaryMuscles: ['biceps', 'traps', 'lower_back'],
    equipment: 'backpack',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Encha uma mochila resistente com livros, garrafas d\'água ou sacos de feijão.',
      'Incline o tronco para a frente a cerca de 45° mantendo a coluna reta.',
      'Segure as alças da mochila e puxe-a em direção ao umbigo, comprimindo as escápulas.',
      'Desça devagar alongando as costas.'
    ],
    homeTips: [
      'Você pode pesar a mochila na balança de casa para registrar exatamente a carga em kg.',
      'Puxe com os cotovelos sem curvar a lombar.'
    ]
  },
  {
    id: 'superman-towel-pulldown',
    name: 'Superman Towel Pulldown',
    namePt: 'Puxada no Solo com Toalha (Superman Pull)',
    primaryMuscle: 'lats',
    secondaryMuscles: ['traps', 'lower_back'],
    equipment: 'towel',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Deite-se de bruços no chão com uma toalha esticada entre as mãos.',
      'Eleve o peito e pés levemente do chão contraindo glúteos e lombar.',
      'Mantendo tensão máxima para abrir a toalha lateralmente, puxe a toalha até encostar no queixo/peito.',
      'Estenda os braços à frente sem relaxar a toalha.'
    ],
    homeTips: [
      'A chave é a força isométrica: tente "rasgar" a toalha no meio durante todo o movimento para ativar as dorsais.'
    ]
  },
  {
    id: 'scapular-ytw-prone',
    name: 'Prone Y-T-W Scapular Raises',
    namePt: 'Elevações Escapulares Y-T-W no Solo',
    primaryMuscle: 'traps',
    secondaryMuscles: ['shoulders', 'lower_back'],
    equipment: 'bodyweight',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Deite de bruços. Levante os braços em formato de "Y" apontando polegares para o teto (10 reps).',
      'Em seguida, abra os braços em "T" apertando as escápulas (10 reps).',
      'Dobre cotovelos em formato de "W" e eleve os punhos e cotovelos simultaneamente (10 reps).'
    ],
    homeTips: [
      'Fundamental para postura, deltoides posteriores e alívio de dores nas costas causadas pelo trabalho no computador.'
    ]
  },
  {
    id: 'doorframe-row',
    name: 'Doorframe Row',
    namePt: 'Remada no Batente da Porta',
    primaryMuscle: 'lats',
    secondaryMuscles: ['biceps', 'forearms'],
    equipment: 'bodyweight',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Fique de pé ao lado do batente da porta e segure-o com uma ou ambas as mãos.',
      'Coloque os pés próximos à base e incline o corpo para trás.',
      'Puxe o peito em direção ao batente contraindo as dorsais.',
      'Retorne estendendo o braço com controle.'
    ],
    homeTips: [
      'Quanto mais os pés estiverem à frente, mais pesado o exercício fica.'
    ]
  },

  // --- MEMBROS INFERIORES EM CASA (LEGS, QUADS, GLUTES) ---
  {
    id: 'air-squat',
    name: 'Bodyweight Air Squat',
    namePt: 'Agachamento Livre com Peso do Corpo',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'calves', 'abs'],
    equipment: 'bodyweight',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Pés na largura dos ombros com pontas ligeiramente voltadas para fora.',
      'Mantenha peito erguido e desça empurrando o quadril para trás como se fosse sentar em um banco invisível.',
      'Desça até as coxas ficarem paralelas ao chão ou mais abaixo.',
      'Empurre pelo calcanhar e fique de pé.'
    ],
    homeTips: [
      'Para aumentar a dificuldade em casa, faça com uma mochila nas costas ou faça 3 segundos de pausa no ponto mais baixo.'
    ]
  },
  {
    id: 'bulgarian-split-squat-couch',
    name: 'Bulgarian Split Squat on Couch',
    namePt: 'Agachamento Búlgaro no Sofá / Cadeira',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'chair',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'intermediario',
    instructions: [
      'De costas para o sofá ou cadeira, apoie a ponta de um pé no assento.',
      'O pé da frente deve ficar a cerca de 90cm à frente.',
      'Desça verticalmente até a coxa da frente ficar paralela ao solo.',
      'Empurre com força pelo calcanhar da frente até estender a perna.'
    ],
    homeTips: [
      'O mais potente exercício unilateral para hipertrofia de coxas e glúteos sem peso externo!',
      'Adicione a mochila na frente do peito quando 15 reps ficarem fáceis.'
    ]
  },
  {
    id: 'wall-sit-isometric',
    name: 'Wall Sit',
    namePt: 'Cadeira Isométrica na Parede (Wall Sit)',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'calves'],
    equipment: 'wall',
    measurementType: 'seconds',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Apoie as costas completamente contra uma parede lisa.',
      'Deslize para baixo até que suas coxas fiquem a um ângulo exato de 90 graus com os joelhos.',
      'Mantenha as mãos fora das pernas (ao lado do corpo ou estendidas à frente).',
      'Sustente a posição respirando de maneira constante.'
    ],
    homeTips: [
      'Exercício em segundos: tente bater seu recorde (ex: 30s, 45s, 60s ou 90s).',
      'Zero barulho para vizinhos e queimação muscular intensa garantida.'
    ]
  },
  {
    id: 'couch-hip-thrust',
    name: 'Couch Hip Thrust',
    namePt: 'Elevação Pélvica no Sofá / Cama (Hip Thrust)',
    primaryMuscle: 'glutes',
    secondaryMuscles: ['hamstrings', 'lower_back'],
    equipment: 'chair',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Apoie a parte superior das costas na beirada do sofá ou cama.',
      'Pés apoiados no chão na largura do quadril, joelhos dobrados a 90° no topo.',
      'Abaixe o quadril e em seguida empurre pelos calcanhares subindo a bacia.',
      'Aperte os glúteos com máxima força no topo por 2 segundos antes de descer.'
    ],
    homeTips: [
      'Coloque uma mochila ou garrafão de água no colo para sobrecarga caseira.',
      'Para avançados, faça com apenas uma perna de cada vez (unilateral).'
    ]
  },
  {
    id: 'static-lunges',
    name: 'Static Walking Lunges',
    namePt: 'Avanço Estático / Passada no Lugar',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    equipment: 'bodyweight',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Dê um passo longo à frente com uma das pernas.',
      'Desça o joelho de trás em direção ao chão sem tocar bruscamente.',
      'O joelho da frente deve manter ângulo em torno de 90° sem ultrapassar excessivamente a ponta do pé.',
      'Empurre de volta mantendo o equilíbrio.'
    ],
    homeTips: [
      'Pode segurar duas garrafas pet com água ou areia em cada mão para peso extra.'
    ]
  },
  {
    id: 'towel-hamstring-curls',
    name: 'Towel Floor Hamstring Curls',
    namePt: 'Flexão de Posterior com Toalha no Chão Liso',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'lower_back'],
    equipment: 'towel',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'intermediario',
    instructions: [
      'Deite de costas em um piso liso (piso frio, porcelanato ou laminado) com uma toalha sob os calcanhares.',
      'Eleve o quadril na posição de ponte.',
      'Deslize os calcanhares para frente estendendo as pernas lentamente.',
      'Puxe os calcanhares de volta em direção aos glúteos recolhendo a toalha com o quadril alto.'
    ],
    homeTips: [
      'Substitui perfeitamente a mesa flexora da academia com contração violenta dos posteriores!'
    ]
  },
  {
    id: 'calf-raise-stairs',
    name: 'Single-Leg Calf Raise on Step/Book',
    namePt: 'Panturrilha em Degrau ou Livro Grosso',
    primaryMuscle: 'calves',
    secondaryMuscles: [],
    equipment: 'chair',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Apoie a ponta de um pé na beirada de um degrau de escada ou livro grosso, calcanhar livre.',
      'Apoie a mão na parede para equilíbrio.',
      'Desça o calcanhar o máximo possível para alongar a panturrilha por 1 segundo.',
      'Suba na ponta do pé o mais alto possível sustentando no topo.'
    ],
    homeTips: [
      'Fazer com 1 perna de cada vez garante o dobro da carga relativa do seu corpo.'
    ]
  },

  // --- OMBROS & BRAÇOS EM CASA (SHOULDERS & ARMS) ---
  {
    id: 'pike-pushup',
    name: 'Pike Push-Up',
    namePt: 'Flexão Pike para Ombros (Deltoides)',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps', 'traps'],
    equipment: 'bodyweight',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'intermediario',
    instructions: [
      'Entre na posição de flexão e caminhe com os pés em direção às mãos formando um "V" invertido.',
      'Olhe para os pés, flexione os cotovelos e desça o topo da cabeça em direção ao solo à frente das mãos.',
      'Empurre o chão para cima retornando ao "V" invertido.'
    ],
    homeTips: [
      'Simula o desenvolvimento militar com barra usando seu peso corporal para construir ombros largos em casa.',
      'Coloque os pés no sofá para tornar o exercício mais avançado.'
    ]
  },
  {
    id: 'backpack-biceps-curl',
    name: 'Backpack Biceps Curl',
    namePt: 'Rosca Direta com Mochila ou Galão d\'Água',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'backpack',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Segure a alça superior da mochila carregada (ou garrafões de 5 litros).',
      'Mantenha os cotovelos fixos colados nas costelas.',
      'Flexione os braços trazendo a carga em direção ao peitoral.',
      'Desça de maneira lenta e controlada sentindo o alongamento do bíceps.'
    ],
    homeTips: [
      'Encha garrafas plásticas com água (1L = 1kg) ou areia (1L ≈ 1.5kg) para regular o peso com precisão.'
    ]
  },
  {
    id: 'isometric-towel-biceps',
    name: 'Isometric Towel Biceps Curl',
    namePt: 'Rosca Bíceps Isométrica com Toalha sob o Pé',
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    equipment: 'towel',
    measurementType: 'seconds',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Pise no meio de uma toalha resistente com um pé.',
      'Segure as pontas da toalha com os cotovelos dobrados a 90 graus.',
      'Puxe a toalha para cima com força máxima como se quisesse flexioná-la, mantendo o pé firme.',
      'Sustente a contração máxima sem relaxar.'
    ],
    homeTips: [
      'Isometria pura recruta 100% das unidades motoras do bíceps sem precisar de anilhas ou halteres.'
    ]
  },
  {
    id: 'lateral-raise-bottles',
    name: 'Lateral Raise with Water Bottles',
    namePt: 'Elevação Lateral com Garrafas de Água',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['traps'],
    equipment: 'backpack',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Segure uma garrafa d\'água em cada mão ao lado das coxas.',
      'Com uma leve flexão nos cotovelos, eleve os braços para os lados até a linha dos ombros.',
      'Pausa de 1 segundo no topo e desça controlando em 3 segundos.'
    ],
    homeTips: [
      'Como a alavanca é longa, garrafas de 1.5L ou 2L já oferecem excelente estímulo para deltoides laterais.'
    ]
  },

  // --- ABDÔMEN & CORE EM CASA (ABS & CORE) ---
  {
    id: 'plank-forearms',
    name: 'Forearm Plank',
    namePt: 'Prancha Frontal Isométrica no Solo',
    primaryMuscle: 'abs',
    secondaryMuscles: ['shoulders', 'glutes', 'lower_back'],
    equipment: 'bodyweight',
    measurementType: 'seconds',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Apoie os antebraços e pontas dos pés no solo.',
      'Mantenha o corpo em linha reta perfeita dos calcanhares à cabeça.',
      'Aperte glúteos e puxe o umbigo para dentro em direção à coluna.',
      'Respire de forma controlada sem deixar o quadril cair.'
    ],
    homeTips: [
      'Meta semanal: registre seus segundos e tente somar 5 a 10 segundos a cada semana!'
    ]
  },
  {
    id: 'bicycle-crunches',
    name: 'Bicycle Crunches',
    namePt: 'Abdominal Bicicleta no Tapete',
    primaryMuscle: 'abs',
    secondaryMuscles: [],
    equipment: 'bodyweight',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Deite de costas no solo com as mãos atrás da cabeça (sem puxar o pescoço).',
      'Eleve as pernas e gire o tronco levando o cotovelo direito até o joelho esquerdo.',
      'Alterne para o outro lado de forma rítmica e controlada.'
    ],
    homeTips: [
      'Trabalha simultaneamente o reto abdominal e os oblíquos com alta ativação eletromiográfica.'
    ]
  },
  {
    id: 'mountain-climbers-silent',
    name: 'Controlled Mountain Climbers',
    namePt: 'Alpinista no Solo (Mountain Climbers Silencioso)',
    primaryMuscle: 'abs',
    secondaryMuscles: ['shoulders', 'quads'],
    equipment: 'bodyweight',
    measurementType: 'reps',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Posição inicial de flexão com braços esticados e abdômen firme.',
      'Traga um joelho em direção ao peito sem encostar o pé no chão no meio do caminho.',
      'Retorne e alterne a perna com ritmo controlado e sem saltos ruidosos.'
    ],
    homeTips: [
      'Execução controlada sem bater os pés no chão, 100% seguro para apartamentos sem incomodar os vizinhos de baixo.'
    ]
  },
  {
    id: 'hollow-body-hold',
    name: 'Hollow Body Hold',
    namePt: 'Canoa Isométrica (Hollow Body Calistenia)',
    primaryMuscle: 'abs',
    secondaryMuscles: ['lower_back', 'quads'],
    equipment: 'bodyweight',
    measurementType: 'seconds',
    apartmentFriendly: true,
    difficulty: 'avancado',
    instructions: [
      'Deite-se de costas, cole a lombar firmemente no solo.',
      'Estenda os braços para trás e eleve as pernas retas a 15-20cm do chão.',
      'Mantenha o corpo arqueado no formato de uma concha/canoa sem desgrudar a lombar do chão.'
    ],
    homeTips: [
      'Exercício clássico de ginastas que constrói um core de aço em casa.'
    ]
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    namePt: 'Prancha Lateral Isométrica',
    primaryMuscle: 'abs',
    secondaryMuscles: ['shoulders', 'glutes'],
    equipment: 'bodyweight',
    measurementType: 'seconds',
    apartmentFriendly: true,
    difficulty: 'iniciante',
    instructions: [
      'Deite-se de lado com o antebraço apoiado abaixo do ombro.',
      'Eleve o quadril formando uma linha reta da cabeça aos pés.',
      'Sustente a posição contraindo os oblíquos e o glúteo médio.'
    ],
    homeTips: [
      'Faça o mesmo tempo para cada um dos lados para equilíbrio postural.'
    ]
  }
];
