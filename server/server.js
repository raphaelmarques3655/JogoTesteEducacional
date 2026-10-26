const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

const PORT = 3001;

app.use(cors());

app.use(
  express.json({
    limit: '15mb'
  })
);

const DATA_FILE =
  path.join(
    __dirname,
    'dados.json'
  );

const BACKUP_FILE =
  path.join(
    __dirname,
    'dados-backup.json'
  );

/*
==========================================
ESTRUTURA PADRÃO
==========================================
*/

function estruturaInicial() {
  return {
    alunos: [],
    progresso: {},
    aprendizagem: {}
  };
}

/*
==========================================
NORMALIZAR DADOS
==========================================
*/

function normalizarDados(
  dados
) {
  return {
    alunos:
      Array.isArray(
        dados?.alunos
      )
        ? dados.alunos
        : [],

    progresso:
      dados?.progresso &&
      typeof dados.progresso ===
        'object' &&
      !Array.isArray(
        dados.progresso
      )
        ? dados.progresso
        : {},

    aprendizagem:
      dados?.aprendizagem &&
      typeof dados.aprendizagem ===
        'object' &&
      !Array.isArray(
        dados.aprendizagem
      )
        ? dados.aprendizagem
        : {}
  };
}

/*
==========================================
GARANTIR dados.json
==========================================
*/

function garantirArquivo() {
  if (
    !fs.existsSync(
      DATA_FILE
    )
  ) {
    fs.writeFileSync(
      DATA_FILE,

      JSON.stringify(
        estruturaInicial(),
        null,
        2
      ),

      'utf8'
    );
  }
}

/*
==========================================
CARREGAR DADOS
==========================================
*/

function carregarDados() {
  try {
    garantirArquivo();

    const conteudo =
      fs.readFileSync(
        DATA_FILE,
        'utf8'
      );

    if (
      !conteudo.trim()
    ) {
      return estruturaInicial();
    }

    return normalizarDados(
      JSON.parse(
        conteudo
      )
    );
  } catch (error) {
    console.error(
      'Erro ao carregar dados.json:',
      error
    );

    /*
      Tenta recuperar backup
    */

    try {
      if (
        fs.existsSync(
          BACKUP_FILE
        )
      ) {
        console.log(
          'Recuperando dados-backup.json...'
        );

        const backup =
          fs.readFileSync(
            BACKUP_FILE,
            'utf8'
          );

        const dadosBackup =
          normalizarDados(
            JSON.parse(
              backup
            )
          );

        fs.writeFileSync(
          DATA_FILE,

          JSON.stringify(
            dadosBackup,
            null,
            2
          ),

          'utf8'
        );

        return dadosBackup;
      }
    } catch (
      backupError
    ) {
      console.error(
        'Erro ao recuperar backup:',
        backupError
      );
    }

    return estruturaInicial();
  }
}

/*
==========================================
SALVAR
==========================================
*/

function salvarDados(dados) {
  try {
    const normalizados =
      normalizarDados(dados);

    // Faz backup do arquivo anterior
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(
        DATA_FILE,
        BACKUP_FILE
      );
    }

    // Grava diretamente no dados.json
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        normalizados,
        null,
        2
      ),
      'utf8'
    );

    console.log(
      `✅ dados.json salvo - ${normalizados.alunos.length} alunos`
    );
  } catch (error) {
    console.error(
      '❌ ERRO AO SALVAR dados.json:',
      error
    );

    throw error;
  }
}

/*
==========================================
FORMATO ALUNO
==========================================
*/

function alunoParaResposta(
  aluno
) {
  const nome =
    aluno.nome ??
    aluno.name ??
    '';

  const criadoEm =
    aluno.criadoEm ??
    aluno.createdAt ??
    new Date()
      .toISOString();

  return {
    id:
      String(
        aluno.id
      ),

    nome,

    name:
      nome,

    avatar:
      aluno.avatar ??
      '🧒',

    criadoEm,

    createdAt:
      criadoEm
  };
}

/*
==========================================
TESTE
==========================================
*/

app.get(
  '/api/teste',

  (
    req,
    res
  ) => {
    const dados =
      carregarDados();

    res.json({
      mensagem:
        'Servidor Alfabetiza+ funcionando com dados.json!',

      banco:
        'dados.json',

      alunos:
        dados.alunos.length
    });
  }
);

/*
==========================================
LISTAR ALUNOS
==========================================
*/

app.get(
  '/api/alunos',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      res.json(
        dados.alunos.map(
          alunoParaResposta
        )
      );
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao buscar alunos'
        });
    }
  }
);

/*
==========================================
BUSCAR UM ALUNO
==========================================
*/

app.get(
  '/api/alunos/:id',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      const aluno =
        dados.alunos.find(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            String(
              req.params.id
            )
        );

      if (
        !aluno
      ) {
        return res
          .status(404)
          .json({
            mensagem:
              'Aluno não encontrado'
          });
      }

      res.json(
        alunoParaResposta(
          aluno
        )
      );
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao buscar aluno'
        });
    }
  }
);

/*
==========================================
CADASTRAR ALUNO
==========================================
*/

app.post(
  '/api/alunos',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      const nome =
        String(
          req.body.nome ??
          req.body.name ??
          ''
        ).trim();

      if (
        !nome
      ) {
        return res
          .status(400)
          .json({
            mensagem:
              'O nome é obrigatório'
          });
      }

      const novoAluno = {
        id:
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        nome,

        avatar:
          req.body.avatar ||
          '🧒',

        criadoEm:
          new Date()
            .toISOString()
      };

      dados.alunos.push(
        novoAluno
      );

      /*
        Cria espaço do aluno
      */

      dados.progresso[
        novoAluno.id
      ] = null;

      dados.aprendizagem[
        novoAluno.id
      ] = null;

      salvarDados(
        dados
      );

      res
        .status(201)
        .json(
          alunoParaResposta(
            novoAluno
          )
        );
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao criar aluno'
        });
    }
  }
);

/*
==========================================
ATUALIZAR ALUNO
==========================================
*/

app.put(
  '/api/alunos/:id',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      const aluno =
        dados.alunos.find(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            String(
              req.params.id
            )
        );

      if (
        !aluno
      ) {
        return res
          .status(404)
          .json({
            mensagem:
              'Aluno não encontrado'
          });
      }

      if (
        req.body.nome !==
          undefined ||
        req.body.name !==
          undefined
      ) {
        const nome =
          String(
            req.body.nome ??
            req.body.name
          ).trim();

        if (
          !nome
        ) {
          return res
            .status(400)
            .json({
              mensagem:
                'Nome inválido'
            });
        }

        aluno.nome =
          nome;
      }

      if (
        req.body.avatar !==
        undefined
      ) {
        aluno.avatar =
          req.body.avatar;
      }

      salvarDados(
        dados
      );

      res.json(
        alunoParaResposta(
          aluno
        )
      );
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao atualizar aluno'
        });
    }
  }
);

/*
==========================================
EXCLUIR ALUNO
==========================================
*/

app.delete(
  '/api/alunos/:id',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      const id =
        String(
          req.params.id
        );

      dados.alunos =
        dados.alunos.filter(
          (
            aluno
          ) =>
            String(
              aluno.id
            ) !==
            id
        );

      delete dados.progresso[
        id
      ];

      delete dados.aprendizagem[
        id
      ];

      salvarDados(
        dados
      );

      res.json({
        mensagem:
          'Aluno removido'
      });
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao remover aluno'
        });
    }
  }
);

/*
==========================================
PROGRESSO
==========================================
*/

app.get(
  '/api/progresso/:id',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      const id =
        String(
          req.params.id
        );

      const progresso =
        Object.prototype
          .hasOwnProperty
          .call(
            dados.progresso,
            id
          )
          ? dados.progresso[
              id
            ]
          : null;

      res.json(
        progresso
      );
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao buscar progresso'
        });
    }
  }
);

app.put(
  '/api/progresso/:id',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      const id =
        String(
          req.params.id
        );

      dados.progresso[
        id
      ] =
        req.body;

      salvarDados(
        dados
      );

      res.json(
        dados.progresso[
          id
        ]
      );
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao salvar progresso'
        });
    }
  }
);

/*
==========================================
APRENDIZAGEM / SONDAGEM
==========================================
*/

app.get(
  '/api/aprendizagem/:id',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      const id =
        String(
          req.params.id
        );

      const aprendizagem =
        Object.prototype
          .hasOwnProperty
          .call(
            dados.aprendizagem,
            id
          )
          ? dados.aprendizagem[
              id
            ]
          : null;

      res.json(
        aprendizagem
      );
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao buscar aprendizagem'
        });
    }
  }
);

app.put(
  '/api/aprendizagem/:id',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      const id =
        String(
          req.params.id
        );

      dados.aprendizagem[
        id
      ] =
        req.body;

      salvarDados(
        dados
      );

      res.json(
        dados.aprendizagem[
          id
        ]
      );
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao salvar aprendizagem'
        });
    }
  }
);

/*
==========================================
ALUNO COMPLETO
==========================================
*/

app.get(
  '/api/alunos/:id/completo',

  (
    req,
    res
  ) => {
    try {
      const dados =
        carregarDados();

      const id =
        String(
          req.params.id
        );

      const aluno =
        dados.alunos.find(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            id
        );

      if (
        !aluno
      ) {
        return res
          .status(404)
          .json({
            mensagem:
              'Aluno não encontrado'
          });
      }

      res.json({
        aluno:
          alunoParaResposta(
            aluno
          ),

        progresso:
          dados.progresso[
            id
          ] ??
          null,

        aprendizagem:
          dados.aprendizagem[
            id
          ] ??
          null
      });
    } catch (error) {
      console.error(
        error
      );

      res
        .status(500)
        .json({
          mensagem:
            'Erro ao buscar dados do aluno'
        });
    }
  }
);

/*
==========================================
STATUS
==========================================
*/

app.get(
  '/api/status',

  (
    req,
    res
  ) => {
    const dados =
      carregarDados();

    res.json({
      online: true,

      armazenamento:
        'dados.json',

      alunos:
        dados.alunos.length,

      progressos:
        Object.keys(
          dados.progresso
        ).length,

      aprendizagens:
        Object.keys(
          dados.aprendizagem
        ).length
    });
  }
);

/*
==========================================
DOWNLOAD DE BACKUP
==========================================
*/

app.get(
  '/api/backup',

  (
    req,
    res
  ) => {
    garantirArquivo();

    res.download(
      DATA_FILE,

      `alfabetiza-backup-${Date.now()}.json`
    );
  }
);

/*
==========================================
INICIAR SERVIDOR==========================================
*/

app.listen(
  PORT,

  '0.0.0.0',

  () => {
    const dados =
      carregarDados();

    console.log(
      ''
    );

    console.log(
      '=========================================='
    );

    console.log(
      ' ALFABETIZA+'
    );

    console.log(
      '=========================================='
    );

    console.log(
      `Servidor: porta ${PORT}`
    );

    console.log(
      'Banco: dados.json'
    );

    console.log(
      `Alunos carregados: ${dados.alunos.length}`
    );

    console.log(
      ''
    );

    console.log(
      `Teste: http://localhost:${PORT}/api/teste`
    );

    console.log(
      `Alunos: http://localhost:${PORT}/api/alunos`
    );

    console.log(
      '=========================================='
    );

    console.log(
      ''
    );
  }
);