# Alfabetiza+

O **Alfabetiza+** é um aplicativo educacional criado para ajudar no processo de alfabetização infantil.

Ele possui atividades de letras, sílabas, palavras, leitura, escrita, matemática, jogos educativos, acompanhamento de progresso e uma área exclusiva para o professor.

O sistema também pode ser acessado por **outros computadores, celulares e tablets conectados à mesma rede**.

---

# O que o sistema possui

- Cadastro de alunos
- Nome e avatar para cada aluno
- Área do aluno
- Área do professor
- Sondagem inicial
- Identificação do nível de alfabetização
- Atividades com letras
- Atividades com sílabas
- Atividades com palavras
- Leitura
- Escrita
- Matemática
- Áudio com instruções
- Jogos educativos
- Minijogo de plataforma
- Suporte para jogar no celular
- Pontos
- Estrelas
- Conquistas
- Histórico de atividades
- Progresso individual de cada aluno
- Relatório para o professor
- Alteração manual do nível do aluno
- Acesso por computadores e celulares da mesma rede

---

# Antes de começar

Para usar o projeto em um computador novo, você precisa instalar apenas:

1. **Node.js**
2. **Git**
3. Um navegador, como Google Chrome, Edge ou Opera

O VS Code é recomendado apenas caso você queira editar o projeto.

Você **não precisa instalar**:

- MySQL
- MySQL Workbench
- XAMPP
- Banco de dados

Os dados são salvos no arquivo:

```text
server/dados.json
```

---

# Passo 1 — Instalar o Node.js

Entre no site oficial do Node.js e instale a versão LTS.

Depois da instalação, abra o **Prompt de Comando (CMD)**.

Pesquise no menu iniciar:

```text
CMD
```

Abra o Prompt de Comando e digite:

```bash
node -v
```

Depois:

```bash
npm -v
```

Se aparecerem números de versão, por exemplo:

```text
v22.15.0
10.9.2
```

está funcionando.

---

# Passo 2 — Instalar o Git

Instale o Git no computador.

Depois, abra novamente o CMD e teste:

```bash
git --version
```

Se aparecer algo parecido com:

```text
git version 2.50.0
```

está funcionando.

---

# Passo 3 — Baixar o Alfabetiza+

Abra o CMD.

Entre na pasta do usuário:

```bat
cd C:\Users\USER
```

> Em alguns computadores o nome pode ser `Aluno`, `Usuario`, seu nome ou outro nome.

Agora execute:

```bash
git clone https://github.com/raphaelmarques3655/JogoTesteEducacional.git
```

Aguarde terminar.

Depois entre na pasta do projeto:

```bash
cd JogoTesteEducacional
```

---

# Passo 4 — Instalar o site

Ainda dentro da pasta do projeto, execute:

```bash
npm install
```

Aguarde a instalação terminar.

Pode levar alguns minutos na primeira vez.

---

# Passo 5 — Instalar o servidor

Agora entre na pasta do servidor:

```bash
cd server
```

Execute:

```bash
npm install
```

Aguarde terminar.

Pronto.

O projeto está instalado.

---

# Como abrir o Alfabetiza+

Para o sistema funcionar, precisamos deixar **duas coisas abertas ao mesmo tempo**:

1. O servidor
2. O site

Por isso, serão necessários **dois CMDs**.

---

# CMD 1 — Ligar o servidor

Abra o primeiro CMD.

Digite:

```bat
cd C:\Users\USER\JogoTesteEducacional\server
```

Depois:

```bash
npm start
```

Se estiver funcionando corretamente, deve aparecer uma mensagem indicando que o servidor está rodando na porta:

```text
3001
```

Não feche esse CMD.

Deixe ele aberto enquanto estiver usando o Alfabetiza+.

---

# CMD 2 — Ligar o site

Abra um segundo CMD.

Digite:

```bat
cd C:\Users\USER\JogoTesteEducacional
```

Depois execute:

```bash
npm run dev -- --host
```

Deve aparecer algo parecido com:

```text
Local:   http://localhost:5173/
Network: http://192.168.0.101:5173/
```

Não feche esse CMD.

---

# Como abrir no computador principal

No computador onde os dois CMDs estão rodando, abra o navegador.

Digite:

```text
http://localhost:5173/
```

Pronto.

O Alfabetiza+ será aberto.

---

# Como abrir no celular ou em outro computador

O computador, celular ou tablet precisa estar conectado à **mesma rede Wi-Fi ou rede local** do computador principal.

No CMD onde está rodando o site aparecerá algo parecido com:

```text
Network: http://192.168.0.101:5173/
```

Pegue exatamente esse endereço.

No celular ou outro computador, abra o navegador e digite:

```text
http://192.168.0.101:5173/
```

O número pode mudar.

Por exemplo:

```text
http://192.168.0.15:5173/
```

ou:

```text
http://192.168.1.20:5173/
```

ou:

```text
http://10.137.11.230:5173/
```

Sempre utilize o endereço que aparecer depois de:

```text
Network:
```

---

# Importante

O computador principal precisa continuar:

- ligado
- conectado à rede
- com o CMD do servidor aberto
- com o CMD do site aberto

Se o computador principal for desligado ou os CMDs forem fechados, os outros dispositivos não conseguirão acessar o sistema.

---

# Resumo simples

No computador principal, sempre faça isso:

## Primeiro CMD

```bat
cd C:\Users\USER\JogoTesteEducacional\server
npm start
```

## Segundo CMD

```bat
cd C:\Users\USER\JogoTesteEducacional
npm run dev -- --host
```

Depois abra:

```text
http://localhost:5173/
```

Ou, em outro dispositivo da mesma rede, abra o endereço `Network`.

---

# Como saber se o servidor está funcionando

No computador principal, abra no navegador:

```text
http://localhost:3001/api/teste
```

Se aparecer uma resposta do servidor, está funcionando.

Também é possível verificar os alunos cadastrados:

```text
http://localhost:3001/api/alunos
```

---

# Se o site abrir, mas os alunos não aparecerem

Primeiro, no outro computador ou celular, tente abrir:

```text
http://IP_DO_COMPUTADOR:3001/api/alunos
```

Exemplo:

```text
http://192.168.0.101:3001/api/alunos
```

Se não abrir, provavelmente o Firewall do Windows está bloqueando o Node.js.

No computador principal:

1. Abra o Firewall do Windows.
2. Procure pelas permissões de aplicativos.
3. Localize o **Node.js**.
4. Permita o acesso em redes privadas.

As portas utilizadas pelo projeto são:

```text
5173 - Site
3001 - Servidor
```

---

# Onde os dados ficam salvos

O sistema não utiliza MySQL.

Os dados ficam salvos em:

```text
JogoTesteEducacional
└── server
    └── dados.json
```

Nesse arquivo ficam informações como:

- alunos cadastrados
- avatares
- pontos
- estrelas
- progresso
- atividades
- sondagem
- nível do aluno
- histórico

O servidor também pode criar:

```text
dados-backup.json
```

para manter uma cópia de segurança.

---

# Atenção ao trocar de computador principal

O arquivo `dados.json` fica no computador que está rodando o servidor.

Isso significa que, se você instalar o projeto em outro computador, ele usará o `dados.json` presente naquele computador.

Para manter exatamente os mesmos dados entre computadores diferentes, é necessário copiar ou atualizar o arquivo:

```text
server/dados.json
```

---

# Minijogo no celular

O Alfabetiza+ possui um minijogo de plataforma.

Para jogar no celular:

1. Abra o Alfabetiza+ pelo endereço `Network`.
2. Entre no minijogo.
3. Toque em **Tela cheia**.
4. Gire o celular para a horizontal.
5. Use os botões da tela.

Existem controles para:

```text
◀ Esquerda

▶ Direita

PULAR
```

Se o navegador do celular não aceitar tela cheia normal, o próprio jogo utiliza um modo expandido.

---

# Como atualizar o projeto

Se o projeto já estiver instalado e houver alterações novas no GitHub, abra o CMD.

Entre na pasta:

```bat
cd C:\Users\USER\JogoTesteEducacional
```

Execute:

```bash
git pull
```

Depois, para garantir que todas as dependências estejam atualizadas:

```bash
npm install
```

Entre também no servidor:

```bash
cd server
```

E execute:

```bash
npm install
```

---

# Se aparecer erro ao atualizar

Se o `git pull` informar que existem alterações locais, não apague arquivos importantes sem verificar antes.

O arquivo mais importante para os dados dos alunos é:

```text
server/dados.json
```

Faça uma cópia dele antes de alterações maiores.

---

# Tecnologias utilizadas

O Alfabetiza+ foi desenvolvido utilizando:

- React
- TypeScript
- Vite
- Node.js
- Express
- HTML5 Canvas
- JSON
- LocalStorage

---

# Estrutura básica do projeto

```text
JogoTesteEducacional
│
├── src
│   ├── components
│   │   └── PlatformGame.tsx
│   │
│   └── App.tsx
│
├── server
│   ├── server.js
│   ├── dados.json
│   └── package.json
│
├── package.json
└── README.md
```

---

# Autores


**Raphael Marques**

**Gabriel Dal Ponte**

**Fabio Gustavo**

**Guilherme Rinaldi da Silva**

Projeto desenvolvido no contexto do curso de **Análise e Desenvolvimento de Sistemas — SENAI**.