# FitHome — Treino em Casa & Evolução Corporal

Aplicativo web completo voltado para treinos em casa (peso corporal, cadeira, mochila, elásticos e toalha), acompanhamento de sobrecarga progressiva, mapa muscular anatômico interativo e auditoria completa de evolução física e antropométrica (pesagens, medidas, fotos antes/depois, IMC e relatórios periódicos).

O sistema suporta tanto uso 100% offline (modo convidado via `localStorage` isolado) quanto sincronização em tempo real na nuvem através do Google Firebase (Authentication & Cloud Firestore).

---

## Sumário

- [Visão Geral e Propósito](#visão-geral-e-propósito)
- [Funcionalidades](#funcionalidades)
  - [1. Treinos em Casa e Sobrecarga Progressiva](#1-treinos-em-casa-e-sobrecarga-progressiva)
  - [2. Módulo de Evolução Corporal v2](#2-módulo-de-evolução-corporal-v2)
  - [3. Backup, Restauração e Integridade de Dados](#3-backup-restauração-e-integridade-de-dados)
  - [4. Autenticação e Nuvem](#4-autenticação-e-nuvem)
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
- [Boas Práticas e Notas de Manutenção](#boas-práticas-e-notas-de-manutenção)

---

## Visão Geral e Propósito

O **FitHome** foi projetado para transformar o treino caseiro em uma experiência estruturada, motivadora e cientificamente embasada. Ele elimina a dependência de academias convencionais ao oferecer rotinas com peso corporal e itens domésticos comuns, ao mesmo tempo em que disponibiliza ferramentas robustas de acompanhamento corporal para que o usuário monitore métricas reais de evolução física (peso, circunferências, IMC, marcos de progresso e fotografias comparativas).

---

## Funcionalidades

### 1. Treinos em Casa e Sobrecarga Progressiva
- **Catálogo de Exercícios & Mapa Muscular Interativo**:
  - Filtro por grupos musculares (peito, costas, ombros, braços, abdômen, pernas, etc.) com visualização anatômica interativa via SVG (`BodyMap`).
  - Classificação por equipamento doméstico: peso do corpo (`bodyweight`), cadeira/degrau (`chair`), mochila com sobrecarga (`backpack`), elásticos (`resistance_band`), toalha (`towel`), parede (`wall`) e halteres caseiros (`dumbbell`).
  - Filtro dedicado para treinos silenciosos e sem impacto (*Apartment-Friendly*).
- **Sessão Ativa de Treino (`ActiveWorkoutModal`)**:
  - Cronômetro decorrido em tempo real.
  - Registro de séries dinâmicas: Aquecimento (`warmup`), Normal (`normal`), Drop Set (`dropset`) e Falha (`failure`).
  - Controle de repetições ou tempo sob tensão/isometria (segundos).
  - Cálculo automático de volume de carga (kg totais movimentados) e contagem de séries concluídas.
  - Indicador de Recorde Pessoal (PR) superado durante a série com celebração visual (`canvas-confetti`).
- **Cronômetro de Descanso Embutido (`RestTimer`)**:
  - Ajuste rápido (30s, 60s, 90s, 120s) com feedback visual de contagem regressiva.
- **Rotinas Prontas (`WorkoutRoutines`)**:
  - Templates estruturados para corpo inteiro (*Full Body*), membros superiores, membros inferiores, abdômen de aço e treinos rápidos para dias corridos.
- **Histórico e Recordes Pessoais (`WorkoutHistory`)**:
  - Listagem de treinos anteriores com detalhamento de cada série.
  - Ação de "Repetir Treino" com pré-carregamento dos mesmos exercícios e cargas.
  - Mural de PRs por exercício.

### 2. Módulo de Evolução Corporal v2
- **Painel Geral (Sub-aba Resumo)**:
  - Cards de destaque com peso atual, peso inicial de referência, variação absoluta (kg) e percentual (%), meta de peso e taxa de conclusão da meta.
  - Data e status da última pesagem.
  - Atalhos imediatos para lançamento de nova pesagem ou medidas.
- **Gráficos Interativos (Sub-aba Gráficos)**:
  - Construídos com **Recharts**, responsivos e otimizados com `CartesianGrid`, `LineChart`, `Tooltip` e `ReferenceLine`.
  - Filtros de período: 30 dias (`30d`), 3 meses (`3m`), 6 meses (`6m`), 1 ano (`1y`) e todo o histórico (`all`).
  - Linha de referência da meta de peso configurada pelo usuário.
  - Gráfico evolutivo de medidas corporais com seletor de circunferência (cintura, abdômen, peito, quadril, braços, antebraços, coxas e panturrilhas).
- **Indicador e Histórico de IMC (Sub-aba IMC)**:
  - Integração direta com a altura em centímetros cadastrada na meta do usuário.
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

### 3. Backup, Restauração e Integridade de Dados
- **Exportação JSON Universal**:
  - Exporta treinos (`sessions`), recordes (`personalRecords`), pesagens (`weights`), medidas (`measurements`), metas (`goals`) e fotografias (`bodyPhotos`).
  - Geração de carimbo de data/hora no nome do arquivo: `fithome-backup-YYYY-MM-DD-HHmm.json`.
- **Restauração com Validação Estrita (`validateFitHomeBackup`)**:
  - Validação atômica e preventiva antes de qualquer alteração de estado em memória ou disco.
  - Rejeição imediata de arquivos inválidos, JSON corrompido, arrays adulterados ou campos malformados.
  - Compatibilidade retroativa completa: backups de versões anteriores sem a chave `bodyPhotos` continuam sendo restaurados perfeitamente.
  - Mesclagem sem duplicatas através de identificadores únicos (`id` ou `exerciseId`).
  - Tratamento contra estouro de quota de armazenamento (`QuotaExceededError`) com alerta ao usuário.

### 4. Autenticação e Nuvem
- **Modo Convidado (Offline-First)**:
  - Funciona imediatamente ao abrir o aplicativo, sem exigência de login.
  - Armazenamento no `localStorage` sob chaves seguras e isoladas por usuário (`guest_*` ou `${uid}_*`).
- **Google Sign-In (Firebase Auth)**:
  - Autenticação com um clique através de popup oficial do Google.
  - Sincronização em tempo real bidirecional via Firestore `onSnapshot`.
  - Migração assistida na primeira conexão: migra dados criados no modo convidado para a conta Google conectada.
  - Flag de migração idempotente (`fithome_migrated_${uid}`) que impede que exclusões legítimas na nuvem sejam recriadas por snapshots vazios ou reconexões.

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
| **Testes Unitários** | Vitest | `^5.0.4` |

---

## Arquitetura e Estrutura de Pastas

```text
/
├── .env.example                 # Exemplo documentado de variáveis de ambiente
├── firebase-applet-config.json  # Credenciais de conexão do Firebase Client SDK
├── firebase-blueprint.json      # Especificação das entidades e coleções Firestore
├── firestore.rules              # Regras de segurança de granularidade fina do Firestore
├── index.html                   # Entry point HTML com metatags otimizadas
├── metadata.json                # Metadados e capacidades da aplicação
├── package.json                 # Declaração de scripts e dependências
├── tsconfig.json                # Configurações do compilador TypeScript
├── vite.config.ts               # Configuração do Vite e plugins (React, Tailwind)
└── src/
    ├── main.tsx                 # Ponto de montagem da aplicação React
    ├── index.css                # Estilos globais e importação Tailwind (@import "tailwindcss")
    ├── App.tsx                  # Componente raiz: gerencia estado global, auth e listeners
    ├── components/              # Componentes de interface modulares
    │   ├── ActiveWorkoutModal.tsx     # Modal de treino ativo com séries e cronômetro
    │   ├── BodyEvolution.tsx          # Painel principal de evolução corporal (sub-abas)
    │   ├── BodyMap.tsx                # Mapa anatômico SVG interativo de músculos
    │   ├── ExerciseLibrary.tsx        # Biblioteca e filtros de exercícios caseiros
    │   ├── GoalModal.tsx              # Modal de configuração de meta de peso, data e altura
    │   ├── MeasurementsFormModal.tsx  # Modal de cadastro de circunferências corporais
    │   ├── PhotoCompareModal.tsx      # Comparador de fotos (lado a lado e slider)
    │   ├── PhotoUploadModal.tsx       # Modal de upload e recorte de foto corporal
    │   ├── RestTimer.tsx              # Componente de cronômetro de descanso
    │   ├── WeeklyProgress.tsx         # Painel de resumo da semana e consistência
    │   ├── WeightFormModal.tsx        # Modal de lançamento de pesagem com validação
    │   ├── WorkoutHistory.tsx         # Listagem de treinos, exportação/importação e PRs
    │   └── WorkoutRoutines.tsx        # Rotinas e templates pré-configurados para casa
    ├── data/                    # Dados estáticos e estruturas padrão
    │   ├── exercises.ts               # Catálogo de exercícios e dicas para casa
    │   ├── sampleHistory.ts           # Histórico de demonstração opcional
    │   └── templates.ts               # Templates de rotinas sugeridas
    ├── lib/                     # Integrações com serviços externos
    │   ├── firebase.ts                # Inicialização do Firebase Auth e Firestore
    │   └── firestoreService.ts        # Métodos de CRUD e listeners reativos do Firestore
    ├── types/                   # Definições de tipagem TypeScript
    │   ├── bodyEvolution.ts           # Tipos de pesagem, medidas, fotos, IMC e relatórios
    │   └── workout.ts                 # Tipos de exercícios, séries, treinos e PRs
    └── utils/                   # Funções puras utilitárias e testes unitários
        ├── backupValidator.ts         # Validador de esquemas de backup JSON
        ├── bmiUtils.ts                # Cálculo de IMC e faixas de peso saudável
        ├── bodyDateUtils.ts           # Manipulação e formatação estrita de datas locais
        ├── csvExportUtils.ts          # Utilitário de escape e download de CSV
        ├── milestonesUtils.ts         # Motor de derivação de marcos e conquistas
        ├── reportUtils.ts             # Geração de relatórios por período
        └── __tests__/                 # Suíte de testes automatizados com Vitest
            ├── backupValidator.test.ts
            ├── bmiUtils.test.ts
            ├── bodyDateUtils.test.ts
            ├── migrationSync.test.ts
            └── reportUtils.test.ts
```

---

## Pré-requisitos

- **Node.js**: Versão `18.x`, `20.x` ou superior recomendada.
- **Gerenciador de Pacotes**: `npm` (versão 9+) ou `bun`.
- **Navegador**: Qualquer navegador moderno com suporte a ES Modules (Chrome, Edge, Firefox, Safari).

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
Executa a suíte de 20 testes unitários no **Vitest**:
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

> **Privacidade por Design:** Fotos de progresso (`ProgressPhoto`) **nunca** são enviadas ao Firestore, permanecendo protegidas no armazenamento local do dispositivo do usuário.

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
1. Cada usuário possui uma chave de migração local `fithome_migrated_${userId}`.
2. Ao realizar o primeiro login com dados convidados, o app sobe a carga inicial para o Firestore e marca a flag como `true`.
3. Se o usuário apagar todas as suas pesagens ou treinos na nuvem (resultando em um snapshot remoto vazio `[]`), o sistema reconhece que o usuário já migrou e **não** recria os dados a partir de dados locais obsoletos.
4. Caso o usuário faça logout, seus dados de convidado originais permanecem intactos sob o prefixo `guest_*`.

---

## Boas Práticas e Notas de Manutenção

1. **Manipulação de Datas Locais**:
   - Nunca use `new Date("YYYY-MM-DD")` diretamente para exibição ao usuário, pois o construtor nativo do JavaScript interpreta strings ISO puras no fuso UTC, gerando o problema de "um dia a menos" nos fusos das Américas (como GMT-3 no Brasil).
   - Utilize sempre os utilitários de `src/utils/bodyDateUtils.ts` (`parseLocalDate`, `formatDateBR`, `formatDateShort`), que operam com parsing das partes de ano, mês e dia no fuso horário local do navegador.

2. **Cálculo de IMC Sem Arredondamento Prematuro**:
   - Em `src/utils/bmiUtils.ts`, a classificação do IMC (Abaixo do peso, Normal, Sobrepeso, etc.) é sempre avaliada sobre o valor em ponto flutuante bruto (`weightKg / (heightM * heightM)`).
   - O arredondamento a uma casa decimal é realizado **exclusivamente na camada de exibição visual** (`Math.round(rawBmi * 10) / 10`), evitando classificações distorcidas em valores limítrofes (ex: 24,94 vs 25,00).

3. **Validação de Backup Atômico**:
   - Ao adicionar novos campos ou coleções ao aplicativo, atualize obrigatoriamente a função `validateFitHomeBackup` em `src/utils/backupValidator.ts` e sua respectiva suíte de testes em `src/utils/__tests__/backupValidator.test.ts`.
   - Mantenha sempre a compatibilidade retroativa com backups legados onde novos campos opcionais possam não existir.

4. **Isolamento de Cache no `localStorage`**:
   - Use a função utilitária `getStorageKey(prefix, userId)` ao interagir com o armazenamento local, garantindo que usuários que compartilhem o mesmo navegador não tenham seus dados mesclados.

---

## Licença

Projeto desenvolvido para fins de acompanhamento físico e bem-estar pessoal. Consulte os termos da licença no repositório.
