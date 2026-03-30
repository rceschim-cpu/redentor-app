# CLAUDE.md — Redentor App

## Contexto do Projeto

App de gestão para a **Comunidade do Redentor** (IECLB, Curitiba-PR).
Desenvolvido em React Native com Expo, destinado a líderes e pastores da comunidade.

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.74 | Framework mobile |
| Expo | ~51 | Toolchain |
| TypeScript | ^5.3 | Tipagem |
| React Navigation v6 | ^6.x | Navegação |
| Expo Google Fonts | latest | Lora + Source Sans 3 |

**Backend (a definir):** Firebase Auth + Firestore (recomendado) ou Supabase.  
Atualmente usando dados mock em `src/data/mock.ts`.

---

## Identidade Visual

```ts
// src/theme/index.ts — cores principais
primary:    '#3E3530'  // marrom escuro quente
background: '#FAF9F7'  // off-white quente
surface:    '#FFFFFF'

// Arco do vitral (5 segmentos do logo)
archPurple: '#9B59B6'
archBlue:   '#4A90C4'
archGreen:  '#5BA56A'
archOrange: '#E07B3A'
archRed:    '#C0392B'
```

**Tipografia:**
- Títulos / headings: `Lora_600SemiBold`
- Corpo / UI: `SourceSans3_400Regular`, `SourceSans3_600SemiBold`

> Quando o manual de marca chegar, ajustar as cores exatas pela especificação oficial.
> A logo SVG deve ficar em `assets/logo.svg` (exportar via Figma/Illustrator).

---

## Estrutura de Pastas

```
redentor-app/
├── App.tsx                   ← Entry point, fontes, NavigationContainer
├── app.json                  ← Config Expo (bundle ID, splash, ícone)
├── package.json
└── src/
    ├── theme/index.ts        ← Cores, tipografia, espaçamentos
    ├── types/index.ts        ← Interfaces TypeScript (Member, Group, User)
    ├── data/mock.ts          ← Dados mockados para desenvolvimento
    ├── components/index.tsx  ← Avatar, StatusBadge, ArchBar, Card, etc.
    ├── navigation/index.tsx  ← RootNavigator, tabs, stacks
    └── screens/
        ├── LoginScreen.tsx
        ├── DashboardScreen.tsx
        ├── MembersScreens.tsx   ← MembersList + MemberDetail + AddMember
        └── GroupsScreens.tsx    ← GroupsList + GroupDetail
```

---

## Módulos — Status de Desenvolvimento

| Módulo | Telas | Status | Próximo passo |
|---|---|---|---|
| **Login** | LoginScreen | ✅ UI pronto | Integrar auth (Firebase/Supabase) |
| **Dashboard** | DashboardScreen | ✅ UI pronto | Conectar dados reais |
| **Membros** | Lista, Detalhe, Cadastro | ✅ UI pronto | CRUD real + busca no backend |
| **Pequenos Grupos** | Lista, Detalhe | ✅ UI pronto | CRUD real, vincular membros |
| **Eventos / Calendário** | — | 🔜 Não iniciado | Criar telas |
| **Links de Cultos** | — | 🔜 Não iniciado | Lista de links YouTube/Vimeo |
| **Estacionamento** | — | 🔜 Não iniciado | Gestão de vagas em tempo real |
| **Perfil do Usuário** | — | 🔜 Não iniciado | Tela de perfil + edição |

---

## Convenções de Código

- **Nomes:** Português nos dados/UI, inglês no código
- **Componentes:** PascalCase, um arquivo por domínio de telas (ex: `MembersScreens.tsx`)
- **Tipos:** Todos em `src/types/index.ts`
- **Tema:** SEMPRE usar `Colors` do tema, nunca hexadecimal inline
- **Navegação:** Stack por módulo, unificados no tab navigator

---

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar no simulador iOS
npm run ios

# Rodar no simulador Android
npm run android

# Rodar no Expo Go (físico)
npm start
# → Escanear QR Code com Expo Go
```

---

## Próximas Tarefas (por prioridade)

1. **Integrar backend** — escolher Firebase ou Supabase, configurar auth, Firestore/database
2. **Finalizar CRUD de membros** — editar membro, deletar, validações de formulário
3. **Adicionar grupo** — tela de criação de grupo com seleção de líder e membros
4. **Módulo Eventos** — calendário com react-native-calendars
5. **Módulo Cultos** — lista de links (YouTube/Vimeo/Zoom) com deep link
6. **Módulo Estacionamento** — controle de vagas com status em tempo real
7. **Ajuste de logo** — importar SVG/PNG oficial quando o manual de marca chegar
8. **Push notifications** — lembretes de reunião de grupo (Expo Notifications)
9. **Publicação** — EAS Build para Google Play + App Store

---

## Notas para o Claude Code

- Sempre manter a paleta de cores em `src/theme/index.ts`, nunca hardcodar cores
- O arco colorido do vitral é a assinatura visual — usar `<ArchBar />` nos headers
- Ao implementar o backend, criar um `src/services/` com funções separadas por domínio
- Os mock data em `src/data/mock.ts` devem ser substituídos progressivamente por chamadas reais
- O app tem login individual — cada usuário tem um role (`admin | lider | membro`) que controla o acesso
