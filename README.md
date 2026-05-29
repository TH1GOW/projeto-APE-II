<div align="center">
  <img src="imagens/icone1.png" alt="Logo APE" width="100">
  <h1>APE - Apoio Para Educação</h1>
  <p><strong>Conectando alunos e voluntários para transformar vidas através da educação gratuita.</strong></p>
</div>

<br>

## 📖 Sobre o Projeto

O **APE (Apoio Para Educação)** é uma plataforma social web desenvolvida para democratizar o acesso ao suporte escolar. A aplicação conecta estudantes de escolas públicas ou em situação de vulnerabilidade com voluntários dispostos a compartilhar seus conhecimentos em disciplinas como Matemática, Português, Inglês e Redação.

---

## 🚀 Funcionalidades (CRUD)

O sistema conta com fluxos completos para duas personas principais (Aluno e Voluntário):

- **[Create] Cadastro Autenticado:** Criação de perfil para Alunos (buscando ajuda) e Voluntários (oferecendo ajuda), com registro no banco de dados e validação de senhas.
- **[Read] Dashboards:** Painéis exclusivos onde alunos podem visualizar materiais e voluntários disponíveis, e voluntários podem gerenciar sua disponibilidade.
- **[Update] Atualização de Perfil:** Possibilidade de alteração de dados cadastrais no painel do usuário.
- **[Delete] Exclusão de Vínculo/Conta:** Encerramento da participação na plataforma com remoção de registros.

---

## 💻 Tecnologias e Arquitetura

O projeto adota uma arquitetura Serverless (BaaS), utilizando tecnologias nativas da web no front-end para garantir performance e consolidar fundamentos.

### Front-end
- **HTML5:** Estrutura semântica e multi-page.
- **CSS3 (Vanilla):** Sistema de design responsivo (Mobile-First) utilizando CSS Grid, Flexbox e CSS Variables (`:root`) para padronização de cores (Azul, Verde e tons Escuros) e efeitos visuais (*Glassmorphism* e transições suaves).
- **JavaScript (Vanilla):** Lógica de interface, validações de formulário e chamadas assíncronas assíncronas via API REST. Código modularizado por contexto (`aluno.js`, `aluno-auth.js`, etc).

### Back-end & Banco de Dados (BaaS)
- **Supabase:** Gerenciamento da infraestrutura backend.
  - Autenticação e gestão de sessões.
  - Banco de Dados Relacional (**PostgreSQL**) para armazenamento de perfis, conexões e materiais.

---

## 🎨 Design e UI/UX

A interface foi prototipada e desenvolvida focada em usabilidade e estética moderna:
- **Tipografia:** Fonte `Inter` (Google Fonts) para alta legibilidade.
- **Cores:** 
  - **Azul (`#2563eb`)**: Foco em educação e alunos.
  - **Verde (`#22c55e`)**: Foco em crescimento e voluntariado.
- **Interações:** *Hover states*, animações de *loading* nos botões e elementos translúcidos (Blur/Glass).

---


## 📂 Estrutura de Pastas

```text
📁 ape.2/
├── 📄 index.html              # Landing page principal
├── 📄 aluno.html              # Dashboard do aluno logado
├── 📄 voluntario.html         # Dashboard do voluntário logado
├── 📄 loginAluno.html         # Tela de login do aluno
├── 📄 cadastroAluno.html      # Tela de cadastro do aluno
├── 📁 css/                    # Arquivos de estilo (se houver isolados)
├── 📄 style.css               # Folha de estilo principal (Global)
├── 📁 js/                     # Scripts isolados por responsabilidade
│   ├── aluno-auth.js          # Lógica de Auth e persistência do aluno
│   ├── voluntario-auth.js     # Lógica de Auth e persistência do voluntário
│   └── supabase.js            # Configuração de conexão do banco
└── 📁 imagens/                # Assets estáticos, ícones e avatares
```

## 👨‍💻 Equipe de Desenvolvimento

Projeto desenvolvido para a disciplina de Sistemas Web do curso de Análise e Desenvolvimento de Sistemas do **Centro Universitário Frassinetti do Recife - UNIFAFIRE**.

- **Jean Carlos**
- **Matheus Vinícius** 
- **Thiago Luiz**
- **Achilles Borges**

---
<p align="center">Feito com 💙 para a educação.</p>
