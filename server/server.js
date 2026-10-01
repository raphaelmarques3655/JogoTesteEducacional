const express =
  require('express');

const cors =
  require('cors');

const db =
  require('./db');

const app =
  express();

const PORT =
  3001;

app.use(
  cors()
);

app.use(
  express.json({
    limit: '10mb'
  })
);

app.get(
  '/api/teste',
  async (
    req,
    res
  ) => {
    try {
      const [
        rows
      ] =
        await db.query(
          'SELECT 1 AS ok'
        );

      res.json({
        mensagem:
          'Servidor Alfabetiza+ funcionando com MySQL!',

        banco:
          rows[0].ok === 1
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao conectar com MySQL'
      });
    }
  }
);

/* =========================
   ALUNOS
========================= */

app.get(
  '/api/alunos',
  async (
    req,
    res
  ) => {
    try {
      const [
        rows
      ] =
        await db.query(
          `
          SELECT
            id,
            nome,
            avatar,
            criado_em
          FROM alunos
          ORDER BY criado_em ASC
          `
        );

      const alunos =
        rows.map(
          (
            aluno
          ) => ({
            id:
              String(
                aluno.id
              ),

            nome:
              aluno.nome,

            avatar:
              aluno.avatar,

            criadoEm:
              aluno.criado_em
          })
        );

      res.json(
        alunos
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao buscar alunos'
      });
    }
  }
);

app.post(
  '/api/alunos',
  async (
    req,
    res
  ) => {
    try {
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
              'O nome do aluno é obrigatório.'
          });
      }

      const id =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      const avatar =
        req.body.avatar ||
        '🧒';

      const criadoEm =
        new Date();

      await db.query(
        `
        INSERT INTO alunos
        (
          id,
          nome,
          avatar,
          criado_em
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          id,
          nome,
          avatar,
          criadoEm
        ]
      );

      res
        .status(201)
        .json({
          id,
          nome,
          avatar,

          criadoEm:
            criadoEm.toISOString()
        });
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao criar aluno'
      });
    }
  }
);

app.put(
  '/api/alunos/:id',
  async (
    req,
    res
  ) => {
    try {
      const [
        rows
      ] =
        await db.query(
          `
          SELECT *
          FROM alunos
          WHERE id = ?
          `,
          [
            req.params.id
          ]
        );

      if (
        rows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            mensagem:
              'Aluno não encontrado.'
          });
      }

      const aluno =
        rows[0];

      const nome =
        req.body.nome ??
        req.body.name ??
        aluno.nome;

      const avatar =
        req.body.avatar ??
        aluno.avatar;

      await db.query(
        `
        UPDATE alunos
        SET
          nome = ?,
          avatar = ?
        WHERE id = ?
        `,
        [
          String(
            nome
          ).trim(),

          avatar,

          req.params.id
        ]
      );

      res.json({
        id:
          req.params.id,

        nome:
          String(
            nome
          ).trim(),

        avatar,

        criadoEm:
          aluno.criado_em
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao atualizar aluno'
      });
    }
  }
);

app.delete(
  '/api/alunos/:id',
  async (
    req,
    res
  ) => {
    try {
      await db.query(
        `
        DELETE FROM alunos
        WHERE id = ?
        `,
        [
          req.params.id
        ]
      );

      res.json({
        mensagem:
          'Aluno removido'
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao remover aluno'
      });
    }
  }
);

/* =========================
   PROGRESSO
========================= */

app.get(
  '/api/progresso/:id',
  async (
    req,
    res
  ) => {
    try {
      const [
        rows
      ] =
        await db.query(
          `
          SELECT dados
          FROM progresso
          WHERE aluno_id = ?
          `,
          [
            req.params.id
          ]
        );

      if (
        rows.length ===
        0
      ) {
        return res.json(
          null
        );
      }

      const dados =
        typeof rows[0]
          .dados ===
        'string'
          ? JSON.parse(
              rows[0]
                .dados
            )
          : rows[0]
              .dados;

      res.json(
        dados
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao buscar progresso'
      });
    }
  }
);

app.put(
  '/api/progresso/:id',
  async (
    req,
    res
  ) => {
    try {
      const dados =
        JSON.stringify(
          req.body
        );

      await db.query(
        `
        INSERT INTO progresso
        (
          aluno_id,
          dados
        )
        VALUES (?, ?)

        ON DUPLICATE KEY UPDATE
          dados = VALUES(dados)
        `,
        [
          req.params.id,
          dados
        ]
      );

      res.json(
        req.body
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao salvar progresso'
      });
    }
  }
);

/* =========================
   APRENDIZAGEM
========================= */

app.get(
  '/api/aprendizagem/:id',
  async (
    req,
    res
  ) => {
    try {
      const [
        rows
      ] =
        await db.query(
          `
          SELECT dados
          FROM aprendizagem
          WHERE aluno_id = ?
          `,
          [
            req.params.id
          ]
        );

      if (
        rows.length ===
        0
      ) {
        return res.json(
          null
        );
      }

      const dados =
        typeof rows[0]
          .dados ===
        'string'
          ? JSON.parse(
              rows[0]
                .dados
            )
          : rows[0]
              .dados;

      res.json(
        dados
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao buscar aprendizagem'
      });
    }
  }
);

app.put(
  '/api/aprendizagem/:id',
  async (
    req,
    res
  ) => {
    try {
      const dados =
        JSON.stringify(
          req.body
        );

      await db.query(
        `
        INSERT INTO aprendizagem
        (
          aluno_id,
          dados
        )
        VALUES (?, ?)

        ON DUPLICATE KEY UPDATE
          dados = VALUES(dados)
        `,
        [
          req.params.id,
          dados
        ]
      );

      res.json(
        req.body
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao salvar aprendizagem'
      });
    }
  }
);

/* =========================
   COMPLETO
========================= */

app.get(
  '/api/alunos/:id/completo',
  async (
    req,
    res
  ) => {
    try {
      const [
        alunoRows
      ] =
        await db.query(
          `
          SELECT *
          FROM alunos
          WHERE id = ?
          `,
          [
            req.params.id
          ]
        );

      if (
        alunoRows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            mensagem:
              'Aluno não encontrado.'
          });
      }

      const [
        progressoRows
      ] =
        await db.query(
          `
          SELECT dados
          FROM progresso
          WHERE aluno_id = ?
          `,
          [
            req.params.id
          ]
        );

      const [
        aprendizagemRows
      ] =
        await db.query(
          `
          SELECT dados
          FROM aprendizagem
          WHERE aluno_id = ?
          `,
          [
            req.params.id
          ]
        );

      const aluno =
        alunoRows[0];

      const progresso =
        progressoRows.length
          ? typeof progressoRows[0]
                .dados ===
              'string'
            ? JSON.parse(
                progressoRows[0]
                  .dados
              )
            : progressoRows[0]
                .dados
          : null;

      const aprendizagem =
        aprendizagemRows.length
          ? typeof aprendizagemRows[0]
                .dados ===
              'string'
            ? JSON.parse(
                aprendizagemRows[0]
                  .dados
              )
            : aprendizagemRows[0]
                .dados
          : null;

      res.json({
        aluno: {
          id:
            String(
              aluno.id
            ),

          nome:
            aluno.nome,

          avatar:
            aluno.avatar,

          criadoEm:
            aluno.criado_em
        },

        progresso,

        aprendizagem
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      res.status(
        500
      ).json({
        mensagem:
          'Erro ao buscar dados completos'
      });
    }
  }
);

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      ''
    );

    console.log(
      'Servidor Alfabetiza+ rodando com MySQL!'
    );

    console.log(
      `Porta: ${PORT}`
    );
  }
);