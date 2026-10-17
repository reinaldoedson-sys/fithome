# FitHome — Treino em Casa & Evolução Corporal

Aplicativo web progressivo (PWA) de alto desempenho voltado para treinos em casa (peso corporal, cadeira, mochila com sobrecarga, elásticos e toalha), acompanhamento de sobrecarga progressiva, mapa muscular anatômico interativo, temporizador sonoro com voz e auditoria completa de evolução física e antropométrica (pesagens, medidas, fotos antes/depois, IMC e relatórios periódicos).

O sistema suporta tanto uso 100% offline (modo convidado com isolamento de dados no `localStorage`) quanto sincronização em tempo real na nuvem através do Google Firebase (Authentication & Cloud Firestore).

---

## Sumário

- [Visão Geral e Propósito](#visão-geral-e-propósito)
- [Funcionalidades](#funcionalidades)
  - [1. Treinos em Casa, Sobrecarga e Calendário](#1-treinos-em-casa-sobrecarga-e-calendário)
  - [2. Áudio, Voz e Temporizador de Descanso](#2-áudio-voz-e-temporizador-de-descanso)
  - [3. Criador de Rotinas Personalizadas](#3-criador-de-rotinas-personalizadas)
  - [4. Módulo de Evolução Corporal v2](#4-módulo-de-evolução-corporal-v2)
  - [5. Backup, Restauração e Integridade de Dados](#5-backup-restauração-e-integridade-de-dados)
  - [6. Progressive Web App (PWA) e Modo Offline](#6-progressive-web-app-pwa-e-modo-offline)
  - [7. Autenticação e Sincronização em Nuvem](#7-autenticação-e-sincronização-em-nuvem)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura e Estrutura de Pastas](#arquitetura-e-estrutura-de-pastas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Execução em Desenvolvimento](#execução-em-desenvolvimento)
- [Testes, Tipagem e Build](#testes-tipagem-e-build)
- [Firebase & Firestore](#firebase--firestore)
  - [Modelagem de Dados e Subcoleções](#modelagem-de-dados-e-subcoleções)
  - [Regras de Segurança (`firestore.rules`)](#regras-de-segurança-firestorerules)
  - [Sincronização e Prevenção de Regressão](#sincronização-e-prevenção-de-regressão)
- [Boas Práticas e Notas de Engenharia](#boas-práticas-e-notas-de-engenharia)
- [Licença](#licença)

---

## Visão Geral e Propósito

O **FitHome** foi projetado para transformar o treino caseiro em uma experiência estruturada, motivadora e cientificamente embasada. Ele elimina a dependência de equipamentos comerciais de academia ao catalogar movimentos executáveis com o peso do corpo ou mobília/itens residenciais acessíveis, oferecendo ao mesmo tempo controle rigoroso de sobrecarga progressiva, intervalos sonoros assistidos por voz, consistência gamificada com calendário e sequências ativas (*streaks*), além de uma central antropométrica completa para medição de resultados corporais reais.

---

## Funcionalidades

### 1. Treinos em Casa, Sobrecarga e Calendário
- **Catálogo de Exercícios & Mapa Muscular Anatômico (`BodyMap`)**:
  - Filtro anatômico interativo via SVG vetorial de grupos musculares (peito, costas, ombros, braços, abdômen, pernas, etc.).
  - Classificação por equipamento doméstico: peso do corpo (`bodyweight`), cadeira/degrau (`chair`), mochila com sobrecarga (`backpack`), elásticos (`resistance_band`), toalha (`towel`), parede (`wall`) e halteres caseiros (`dumbbell`).
  - Filtro dedicado para treinos silenciosos e sem impacto (*Apartment-Friendly*).
- **Sessão Ativa de Treino (`ActiveWorkoutModal`)**:
  - Cronômetro decorrido em tempo real com indicador de tempo sob tensão.
  - Tipagem rigorosa de séries: Aquecimento (`warmup`), Normal (`normal`), Drop Set (`dropset`) e Falha (`failure`).
  - Controle de repetições ou tempo sob tensão/isometria (em segundos).
  - Cálculo automático de volume de carga (kg totais movimentados) e contagem de séries executadas.
  - Detecção imediata de **Recorde Pessoal (PR)** superado durante o exercício com celebração visual (`canvas-confetti`).
- **Consistência, Sequências & Calendário Mensal (`WorkoutStreakCalendar`)**:
  - Calendário mensal interativo com navegação rápida entre meses anteriores e posteriores.
  - Indicadores esmeralda nos dias de treino com contador visual de sessões concluídas no dia.
  - **Inspetor Diário**: ao tocar em qualquer dia com treino registrado, exibe os detalhes completos dos exercícios, séries executadas, cargas e duração.
  - Contador de **Sequência Ativa (Streak)** em dias consecutivos de treino e registro histórico da maior sequência alcançada.
  - Totalizadores mensais de tempo sob treino (minutos) e volume acumulado de sobrecarga (kg).
- **Histórico e Recordes Pessoais (`WorkoutHistory`)**:
  - Listagem cronológica detalhada de treinos anteriores.
  - Ação de "Repetir Treino" com pré-carregamento imediato dos mesmos exercícios e cargas.
  - Mural de PRs por exercício com histórico de evolução.

### 2. Áudio, Voz e Temporizador de Descanso
- **Cronômetro de Descanso Avançado (`RestTimer`)**:
  - Temporizador rápido para intervalos de descanso com predefinições de 30s, 60s, 90s, 120s ou ajuste manual livre.
  - **Sinais Sonoros Sintetizados (`audio.ts`)**: utiliza a Web Audio API nativa (sem necessidade de downloads de áudio externos), disparando bips nos 3, 2 e 1 segundos finais e um acorde sonoro duplo na conclusão.
  - **Alerta de Voz Nativo em Português**: integração com a Web Speech API (`speechSynthesis`) falando em português do Brasil (*"Descanso finalizado! Hora de treinar!"*).
  - **Controles de Preferência**: botões dedicados de ativar/desativar som e voz diretamente no cabeçalho do temporizador, persistidos no `localStorage` sob chaves seguras.

### 3. Criador de Rotinas Personalizadas
- **Rotinas Prontas e Personalizadas (`WorkoutRoutines` & `CustomRoutineModal`)**:
  - Templates pré-configurados prontos para execução imediata (Full Body, Superiores, Inferiores, Core, etc.).
  - **Criador e Editor Visual de Rotinas**: permite criar planos de treino sob medida, especificando nome, descrição, duração estimada e selecionando múltiplos exercícios do catálogo.
  - Reordenação de exercícios na lista com botões de mover para cima/baixo.
  - Definição de metas de séries por exercício e repetições sugeridas ou segundos de isometria.
  - Abas de navegação: "Todas", "Prontas" e "Minhas Rotinas" com contagem dinâmica.
  - Edição, duplicação e exclusão de rotinas customizadas com confirmação.
  - Integração nativa no backup JSON universal e no cache do usuário.

### 4. Módulo de Evolução Corporal v2
- **Painel Geral (Sub-aba Resumo)**:
  - Cards de destaque com peso atual, peso de referência inicial, variação absoluta (kg) e percentual (%), meta de peso e percentual de atingimento da meta.
  - Data e status da última pesagem.
  - Atalhos imediatos para lançamento de nova pesagem ou medidas.
- **Gráficos Interativos (Sub-aba Gráficos)**:
  - Construídos com **Recharts**, responsivos e otimizados com `CartesianGrid`, `LineChart`, `Tooltip` e `ReferenceLine`.
  - Filtros de período: 30 dias (`30d`), 3 meses (`3m`), 6 meses (`6m`), 1 ano (`1y`) e todo o histórico (`all`).
  - Linha de referência da meta de peso configurada pelo usuário.
  - Gráfico evolutivo de circunferências corporais com seletor (cintura, abdômen, peito, quadril, braços, antebraços, coxas e panturrilhas).
- **Indicador e Histórico de IMC (Sub-aba IMC)**:
  - Integração direta com a altura em centímetros cadastrada na meta do atleta.
  - Cálculo de alta precisão: classificação clínica baseada no valor bruto do IMC (OMS), com arredondamento visual a 1 casa decimal.
  - Faixas de corte adulto: Abaixo do peso (< 18,5), Normal (18,5–24,9), Sobrepeso (25,0–29,9), Obesidade Grau I (30,0–34,9), Obesidade Grau II (35,0–39,9) e Obesidade Grau III (≥ 40,0).
  - Faixa de peso saudável recomendada calculada dinamicamente para a altura cadastrada.
  - Histórico cronológico de cada pesagem com seu respectivo IMC e badge de status.
- **Marcos Automáticos de Progresso (Sub-aba Marcos)**:
  - Identificação algorítmica de conquistas alcançadas e próximas metas:
    - Primeiro registro no FitHome.
    - Menor peso histórico atingido.
    - Quebra de marcos redondos de perda de peso (-3 kg, -5 kg, -10 kg, etc.).
    - Atingimento formal da meta cadastrada.
    - Redução significativa de cintura/abdômen.
- **Relatórios de Evolução por Período (Sub-aba Relatórios)**:
  - Seleção rápida de período (30 dias, 3 meses, 6 meses, 1 ano, todo o histórico) ou intervalo personalizado com validação de datas.
  - Diferenciação estrita entre:
    - Ausência total de dados no período.
    - Comparação indisponível (apenas 1 registro no período).
    - Variação real de 0,0 kg (manutenção com comparação válida).
  - Tabela comparativa de medidas corporais: valor inicial, valor final e diferença em centímetros.
  - **Exportação para CSV** com formatação padrão brasileira (separador ponto e vírgula `;`, decimais com vírgula e cabeçalhos em português).
  - **Modo de Impressão Amigável (`@media print`)**: folha A4 limpa sem menus de navegação nem cabeçalhos desnecessários.
- **Galeria de Fotos de Progresso & Comparador (Sub-aba Fotos & Comparação)**:
  - Registro de fotos com categorização (frente, costas, perfil/lado e outro) e anotações.
  - Armazenamento em Base64 no `localStorage` local (não consome armazenamento pago de nuvem nem expõe privacidade desnecessária).
  - **Comparador lado a lado**: seleção de duas fotos de datas distintas para análise visual de progresso.
  - **Comparador Slider Interativo**: slider deslizante que sobrepõe as duas fotografias para visualização de transformação corporal.

### 5. Backup, Restauração e Integridade de Dados
- **Exportação JSON Universal**:
  - Exporta treinos (`sessions`), recordes (`personalRecords`), pesagens (`weights`), medidas (`measurements`), metas (`goals`), fotografias corporais (`bodyPhotos`) e rotinas personalizadas (`customRoutines`).
  - Geração de carimbo de data/hora no nome do arquivo: `fithome_backup_YYYY-MM-DD.json`.
- **Restauração com Validação Estrita (`validateFitHomeBackup`)**:
  - Validação atômica e preventiva antes de qualquer alteração de estado em memória ou disco.
  - Rejeição imediata de arquivos corrompidos, esquemas adulterados ou campos malformados com indicação do campo específico.
  - Compatibilidade retroativa completa: backups de versões anteriores sem novos campos ou com formatos legados continuam sendo restaurados perfeitamente.
- **Dois Modos Explícitos de Restauração (`RestoreConfirmModal` & `backupRestoreService`)**:
  - **Mesclar Dados (Merge - Recomendado)**:
    - Preserva registros existentes que não estão no arquivo.
    - Adiciona novos registros do backup e atualiza registros com a mesma chave primária (`id` ou `exerciseId`).
    - Não gera duplicações em reexecuções.
    - Sincroniza adições e alterações no Cloud Firestore para usuários autenticados.
  - **Substituir Dados (Replace - Integral)**:
    - Garante paridade exata com o conteúdo do arquivo para as categorias incluídas.
    - Remove registros excedentes locais e na nuvem (`deleteUser...FromFirestore`) após confirmação explícita do usuário.
    - Trata categorias vazias ou ausentes sem ressuscitar dados apagados.
- **Proteção de Quota de Armazenamento**:
  - Tratamento resiliente de `QuotaExceededError` no `localStorage` (especialmente para fotos em Base64), evitando corrupção de outros dados.

### 6. Progressive Web App (PWA) e Modo Offline
- **Instalabilidade Nativa (PWA)**:
  - Suporte completo ao manifesto de aplicativo web (`public/manifest.webmanifest`) com modos de exibição `standalone`, safe-zones maskable e tema escuro esmeralda (`#022c22`).
  - **Instalação no Android e Desktop**: aciona o prompt nativo do navegador via hook `usePWAInstall` e banner `PWAInstallBanner`.
  - **Instalação no iOS (Safari)**: guia passo a passo interativo que orienta o usuário a tocar no ícone "Compartilhar" e selecionar "Adicionar à Tela de Início".
- **Estratégia de Cache e Resiliência Offline**:
  - Service Worker dedicado (`public/sw.js`) que realiza o pré-carregamento dos recursos essenciais da aplicação e serve as páginas mesmo sem conexão com a internet.
  - Cache prioritário para ícones, fontes e manifesto com fallback de rede para rotas de navegação.

### 7. Autenticação e Sincronização em Nuvem
- **Modo Convidado (Offline-First)**:
  - Funciona imediatamente ao abrir o aplicativo, sem exigência de cadastro ou login prévio.
  - Armazenamento no `localStorage` sob chaves seguras e isoladas por usuário (`guest_*` ou `${uid}_*`).
- **Google Sign-In (Firebase Auth)**:
  - Autenticação com um clique através de popup oficial do Google.
  - Sincronização em tempo real bidirecional via Firestore `onSnapshot`.
- **Migração Independente por Categoria (`migrationService`)**:
  - Cada categoria (`workouts`, `weights`, `measurements`, `records`, `goals`) possui ciclo de vida e estado independentes (`pending`, `in_progress`, `completed`, `failed`).
  - Uso estrito de `async/await` e `Promise.all` — uma categoria só é marcada como migrada após o sucesso confirmado de todas as gravações no Firestore.
  - Bloqueio de concorrência por categoria e usuário para evitar execuções simultâneas ou duplicações.
  - Flag de migração idempotente (`fithome_migrated_${userId}_${category}`) que impede que exclusões legítimas na nuvem sejam recriadas por snapshots vazios ou reconexões.

---

## Tecnologias Utilizadas

| Camada / Função | Tecnologia | Versão |
| :--- | :--- | :--- |
| **Linguagem** | TypeScript | `~7.0.2` |
| **Framework UI** | React | `^19.0.1` |
| **Build & Bundler** | Vite | `^8.3.0` |
| **Estilização** | Tailwind CSS | `^4.3.3` (com `@tailwindcss/vite`) |
| **Ícones** | Lucide React | `^0.546.0` |
| **Gráficos** | Recharts | `^3.10.1` |
| **Animações / Efeitos** | Motion (`motion`) / Canvas-Confetti | `^12.23.24` / `^1.9.4` |
| **Backend & Nuvem** | Google Firebase (Auth + Cloud Firestore) | `^13.0.0` |
| **PWA & Cache Offline** | Service Worker + Web App Manifest | Nativo |
| **Áudio e Síntese de Voz** | Web Audio API + Web Speech API | Nativo |
| **Testes Automatizados** | Vitest | `^5.0.4` |

---

## Arquitetura e Estrutura de Pastas

```text
/
├── .env.example                 # Exemplo documentado de variáveis de ambiente
├── firebase-applet-config.json  # Credenciais de conexão do Firebase Client SDK
├── firebase-blueprint.json      # Especificação das entidades e coleções Firestore
├── firestore.rules              # Regras de segurança de granularidade fina do Firestore
├── index.html                   # Entry point HTML com metatags PWA otimizadas
├── metadata.json                # Metadados e capacidades da aplicação
├── package.json                 # Declaração de scripts e dependências
├── tsconfig.json                # Configurações do compilador TypeScript
├── vite.config.ts               # Configuração do Vite e plugins (React, Tailwind)
├── public/                      # Ativos estáticos PWA e Service Worker
│   ├── manifest.webmanifest     # Manifesto PWA completo (cores, orientação e atalhos)
│   ├── sw.js                    # Service Worker com cache offline e atualização automática
│   ├── icon.svg                 # Ícone vetorial da marca com safe zone maskable
│   ├── pwa-192x192.png          # Ícone PNG 192px para telas iniciais Android
│   ├── pwa-512x512.png          # Ícone PNG 512px para splash screens
│   ├── pwa-maskable-512x512.png # Ícone PNG maskable com margem de segurança
│   └── apple-touch-icon.png     # Ícone PNG 180px para iOS Safari
└── src/
    ├── main.tsx                 # Ponto de montagem da aplicação React
    ├── index.css                # Estilos globais e importação Tailwind (@import "tailwindcss")
    ├── App.tsx                  # Componente raiz: gerencia estado global, auth, tabs e listeners
    ├── components/              # Componentes de interface modulares
    │   ├── ActiveWorkoutModal.tsx     # Modal de treino ativo com séries e cronômetro
    │   ├── BodyEvolution.tsx          # Painel principal de evolução corporal (sub-abas)
    │   ├── BodyMap.tsx                # Mapa anatômico SVG interativo de músculos
    │   ├── CustomRoutineModal.tsx     # Criador e editor de rotinas personalizadas
    │   ├── ExerciseLibrary.tsx        # Biblioteca e filtros de exercícios caseiros
    │   ├── GoalModal.tsx              # Modal de configuração de meta de peso, data e altura
    │   ├── MeasurementsFormModal.tsx  # Modal de cadastro de circunferências corporais
    │   ├── PhotoCompareModal.tsx      # Comparador de fotos (lado a lado e slider)
    │   ├── PhotoUploadModal.tsx       # Modal de upload e recorte de foto corporal
    │   ├── PWAInstallBanner.tsx       # Banner de instalação do app com suporte Android e iOS
    │   ├── RestTimer.tsx              # Cronômetro de descanso com beeps 3-2-1 e voz sintetizada
    │   ├── RestoreConfirmModal.tsx    # Modal de seleção de modo de restauração (Mesclar/Substituir)
    │   ├── WeeklyProgress.tsx         # Painel de resumo da semana e consistência
    │   ├── WeightFormModal.tsx        # Modal de lançamento de pesagem com validação
    │   ├── WorkoutHistory.tsx         # Listagem de treinos, exportação/importação e PRs
    │   ├── WorkoutRoutines.tsx        # Rotinas pré-configuradas e minhas rotinas customizadas
    │   └── WorkoutStreakCalendar.tsx  # Calendário mensal interativo e sequências ativas (streaks)
    ├── data/                    # Dados estáticos e estruturas padrão
    │   ├── exercises.ts               # Catálogo de exercícios e dicas para casa
    │   ├── sampleHistory.ts           # Histórico de demonstração opcional
    │   └── templates.ts               # Templates de rotinas sugeridas
    ├── hooks/                   # React Hooks customizados
    │   └── usePWAInstall.ts           # Hook de detecção de instalação PWA e prompt nativo
    ├── lib/                     # Integrações com serviços externos
    │   ├── firebase.ts                # Inicialização do Firebase Auth e Firestore
    │   └── firestoreService.ts        # Métodos de CRUD e listeners reativos do Firestore
    ├── services/                # Serviços centrais de domínio desacoplados
    │   ├── backupRestoreService.ts    # Motor de restauração de dados nos modos Merge e Replace
    │   └── migrationService.ts        # Serviço de migração por categoria com concorrência e idempotência
    ├── types/                   # Definições de tipagem TypeScript
    │   ├── bodyEvolution.ts           # Tipos de pesagem, medidas, fotos, IMC e relatórios
    │   └── workout.ts                 # Tipos de exercícios, séries, treinos, rotinas e PRs
    └── utils/                   # Funções puras utilitárias e testes unitários
        ├── audio.ts                   # Sintetizador Web Audio API e síntese de voz nativa
        ├── backupValidator.ts         # Validador de esquemas de backup JSON
        ├── bmiUtils.ts                # Cálculo de IMC e faixas de peso saudável
        ├── bodyDateUtils.ts           # Manipulação e formatação estrita de datas locais
        ├── csvExportUtils.ts          # Utilitário de escape e download de CSV
        ├── migrationUtils.ts          # Utilitários de controle e flags de migração por categoria
        ├── milestonesUtils.ts         # Motor de derivação de marcos e conquistas
        ├── reportUtils.ts             # Geração de relatórios por período
        ├── streakUtils.ts             # Motor de cálculo de sequências consecutivas e matriz mensal
        └── __tests__/                 # Suíte de testes automatizados com Vitest (60 testes aprovados)
            ├── audioUtils.test.ts     # Testes dos alertas sonoros e de voz (5 testes)
            ├── backupRestore.test.ts  # Testes dos modos Merge/Replace e sincronização (10 testes)
            ├── backupValidator.test.ts# Testes do validador de backups e contratos (10 testes)
            ├── bmiUtils.test.ts       # Testes de cálculo e classificação de IMC (2 testes)
            ├── bodyDateUtils.test.ts  # Testes de parsing e formatação de datas (4 testes)
            ├── migrationSync.test.ts  # Testes de migração independente por categoria (11 testes)
            ├── milestonesUtils.test.ts# Testes dos marcos e metas corporais (6 testes)
            ├── reportUtils.test.ts    # Testes de relatórios de período e exportação CSV (6 testes)
            └── streakUtils.test.ts    # Testes de cálculo de sequência ativa e calendário (6 testes)
```

---

## Pré-requisitos

- **Node.js**: Versão `18.x`, `20.x` ou superior recomendada.
- **Gerenciador de Pacotes**: `npm` (versão 9+) ou `bun`.
- **Navegador**: Qualquer navegador moderno com suporte a ES Modules, PWA e Web Audio API (Chrome, Edge, Firefox, Safari).

---

## Instalação

1. Clone o repositório ou faça o download dos arquivos:
   ```bash
   git clone <url-do-repositorio>
   cd fithome
   ```

2. Instale as dependências declaradas no `package.json`:
   ```bash
   npm install
   ```

---

## Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto tomando como base o arquivo `.env.example`:

```bash
cp .env.example .env
```

Conteúdo das variáveis suportadas:

```env
# GEMINI_API_KEY: Opcional, para recursos assistidos de IA do ambiente Google AI Studio
GEMINI_API_KEY="SUA_CHAVE_AQUI"

# APP_URL: URL base pública do app (injetada automaticamente pelo host ou localhost)
APP_URL="http://localhost:3000"
```

### Configuração do Firebase
O aplicativo se conecta ao Firebase utilizando o arquivo `firebase-applet-config.json` presente na raiz do projeto. Caso queira apontar para seu próprio projeto Firebase:
1. Crie um projeto no [Console do Firebase](https://console.firebase.google.com/).
2. Ative o **Firebase Authentication** com o provedor **Google**.
3. Crie um banco de dados **Cloud Firestore**.
4. Substitua as credenciais em `firebase-applet-config.json` com os dados do seu Web App:
   ```json
   {
     "projectId": "seu-projeto-id",
     "appId": "seu-app-id",
     "apiKey": "sua-api-key",
     "authDomain": "seu-projeto-id.firebaseapp.com",
     "firestoreDatabaseId": "(default)",
     "storageBucket": "seu-projeto-id.firebasestorage.app",
     "messagingSenderId": "seu-sender-id"
   }
   ```

---

## Execução em Desenvolvimento

Para iniciar o servidor local de desenvolvimento na porta `3000`:

```bash
npm run dev
```

O aplicativo estará acessível no endereço:
```text
http://localhost:3000
```

---

## Testes, Tipagem e Build

Todos os comandos abaixo estão configurados e validados no `package.json`:

### 1. Executar os Testes Automatizados
Executa a suíte completa de **60 testes unitários** no **Vitest** distribuídos em 9 arquivos de teste:
```bash
npm test
```

Para executar os testes em modo interativo de observação (*watch*):
```bash
npx vitest
```

### 2. Verificação de Tipos TypeScript (Linting)
Verifica se existem erros de tipagem estática sem emitir arquivos:
```bash
npm run lint
```

### 3. Compilação para Produção (Build)
Gera o bundle otimizado e minificado na pasta `dist/`:
```bash
npm run build
```

### 4. Visualizar o Build de Produção Localmente
Inicia um servidor local para inspecionar os arquivos da pasta `dist/`:
```bash
npm run preview
```

---

## Firebase & Firestore

### Modelagem de Dados e Subcoleções

Os dados do usuário autenticado são modelados sob um padrão estritamente isolado de subcoleções do Firestore (`users/{userId}`):

- `/users/{userId}`: Documento de perfil do usuário (`id`, `email`, `displayName`, `photoURL`, `updatedAt`).
- `/users/{userId}/workouts/{workoutId}`: Sessões de treino concluídas (`WorkoutSession`).
- `/users/{userId}/weights/{weightId}`: Registros de pesagem corporal (`WeightEntry`).
- `/users/{userId}/measurements/{measurementId}`: Circunferências em centímetros (`MeasurementEntry`).
- `/users/{userId}/goals/{goalId}`: Metas de peso e altura (`BodyGoal`).
- `/users/{userId}/records/{recordId}`: Recordes pessoais de exercícios (`PersonalRecord`).

> **Privacidade por Design:** Fotos de progresso (`ProgressPhoto`) e rotinas personalizadas locais em modo offline **nunca** violam a privacidade do usuário, permanecendo salvas no armazenamento local do navegador ou sincronizadas com as regras específicas do perfil.

### Regras de Segurança (`firestore.rules`)

As regras implementam o princípio do menor privilégio:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Bloqueio global de segurança por padrão
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    // Apenas o próprio usuário autenticado pode ler e gravar em seus subdocumentos
    match /users/{userId} {
      allow get: if isOwner(userId) && isValidId(userId);
      allow create, update: if isOwner(userId) && isValidId(userId);
      allow delete: if false;

      match /workouts/{workoutId} {
        allow get, list: if isOwner(userId);
        allow create, update, delete: if isOwner(userId) && isValidId(workoutId);
      }

      match /weights/{weightId} {
        allow get, list: if isOwner(userId);
        allow create, update, delete: if isOwner(userId) && isValidId(weightId);
      }

      match /measurements/{measurementId} {
        allow get, list: if isOwner(userId);
        allow create, update, delete: if isOwner(userId) && isValidId(measurementId);
      }

      match /goals/{goalId} {
        allow get, list: if isOwner(userId);
        allow create, update, delete: if isOwner(userId) && isValidId(goalId);
      }

      match /records/{recordId} {
        allow get, list: if isOwner(userId);
        allow create, update, delete: if isOwner(userId) && isValidId(recordId);
      }
    }
  }
}
```

### Sincronização e Prevenção de Regressão

Para resolver o problema clássico de recriação indevida de dados após exclusão na nuvem, o FitHome adota uma estratégia de controle de sincronização:
1. Cada usuário possui flags de migração local `fithome_migrated_${userId}_${category}` gerenciadas por `migrationService`.
2. Ao realizar o primeiro login com dados de convidado, o app sobe a carga inicial para o Firestore de forma atômica e marca a categoria como concluída.
3. Se o usuário apagar todas as suas pesagens ou treinos na nuvem (resultando em um snapshot remoto vazio `[]`), o sistema reconhece que o usuário já migrou e **não** recria os dados a partir de dados locais obsoletos.
4. Caso o usuário faça logout, seus dados de convidado originais permanecem intactos sob o prefixo `guest_*`.

---

## Boas Práticas e Notas de Engenharia

1. **Manipulação de Datas Locais**:
   - Nunca use `new Date("YYYY-MM-DD")` diretamente para exibição ao usuário, pois o construtor nativo do JavaScript interpreta strings ISO puras no fuso UTC, gerando o problema de "um dia a menos" nos fusos das Américas (como GMT-3 no Brasil).
   - Utilize sempre os utilitários de `src/utils/bodyDateUtils.ts` (`parseLocalDate`, `formatDateBR`, `formatDateShort`), que operam com parsing das partes de ano, mês e dia no fuso horário local do navegador.

2. **Cálculo de IMC Sem Arredondamento Prematuro**:
   - Em `src/utils/bmiUtils.ts`, a classificação do IMC (Abaixo do peso, Normal, Sobrepeso, etc.) é sempre avaliada sobre o valor em ponto flutuante bruto (`weightKg / (heightM * heightM)`).
   - O arredondamento a uma casa decimal é realizado **exclusivamente na camada de exibição visual** (`Math.round(rawBmi * 10) / 10`), evitando classificações distorcidas em valores limítrofes (ex: 24,94 vs 25,00).

3. **Validação de Backup Atômico e Contratos**:
   - Ao adicionar novos campos ou coleções ao aplicativo, atualize obrigatoriamente a função `validateFitHomeBackup` em `src/utils/backupValidator.ts` e sua respectiva suíte de testes em `src/utils/__tests__/backupValidator.test.ts`.
   - Mantenha sempre a compatibilidade retroativa com backups legados onde novos campos opcionais possam não existir.

4. **Isolamento de Cache no `localStorage`**:
   - Use a função utilitária `getStorageKey(prefix, userId)` ao interagir com o armazenamento local, garantindo que diferentes usuários ou convidados que compartilhem o mesmo dispositivo não tenham seus dados mesclados.

5. **Sintetização de Áudio com Fallback Silencioso**:
   - Todos os métodos em `src/utils/audio.ts` encapsulam chamadas em blocos `try/catch` seguros e verificam a existência de `window.AudioContext` ou `window.webkitAudioContext`, prevenindo que ambientes sem suporte a áudio interrompam a contagem regressiva do usuário.

---

## Licença

Projeto desenvolvido para fins de acompanhamento físico e bem-estar pessoal. Consulte os termos da licença no repositório.
