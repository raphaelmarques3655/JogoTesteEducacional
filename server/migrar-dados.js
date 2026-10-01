const fs = require('fs');
const path = require('path');

const db = require('./db');

const DATA_FILE = path.join(
  __dirname,
  'dados.json'
);

async function migrar() {
  let connection;

  try {
    console.log('');
    console.log('===================================');
    console.log(' MIGRAÇÃO dados.json -> MySQL');
    console.log('===================================');
    console.log('');

    if (!fs.existsSync(DATA_FILE)) {
      throw new Error(
        'Arquivo dados.json não encontrado.'
      );
    }

    const conteudo =
      fs.readFileSync(
        DATA_FILE,
        'utf8'
      );

    const dados =
      JSON.parse(conteudo);

    const alunos =
      Array.isArray(dados.alunos)
        ? dados.alunos
        : [];

    const progresso =
      dados.progresso &&
      typeof dados.progresso === 'object'
        ? dados.progresso
        : {};

    const aprendizagem =
      dados.aprendizagem &&
      typeof dados.aprendizagem === 'object'
        ? dados.aprendizagem
        : {};

    console.log(
      `Alunos encontrados: ${alunos.length}`
    );

    connection =
      await db.getConnection();

    await connection.beginTransaction();

    let alunosMigrados = 0;
    let progressosMigrados = 0;
    let aprendizagensMigradas = 0;

    for (const aluno of alunos) {
      const id =
        String(
          aluno.id
        );

      const nome =
        String(
          aluno.nome ??
          aluno.name ??
          'Aluno'
        );

      const avatar =
        aluno.avatar ??
        '🧒';

      let criadoEm =
        aluno.criadoEm ??
        aluno.createdAt ??
        aluno.criado_em ??
        null;

      /*
        Se a data não existir
        ou estiver inválida,
        usa a data atual.
      */

      if (!criadoEm) {
        criadoEm =
          new Date();
      } else {
        const data =
          new Date(criadoEm);

        criadoEm =
          Number.isNaN(
            data.getTime()
          )
            ? new Date()
            : data;
      }

      /*
        ALUNO
      */

      await connection.query(
        `
        INSERT INTO alunos
        (
          id,
          nome,
          avatar,
          criado_em
        )
        VALUES (?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
          nome = VALUES(nome),
          avatar = VALUES(avatar),
          criado_em = VALUES(criado_em)
        `,
        [
          id,
          nome,
          avatar,
          criadoEm
        ]
      );

      alunosMigrados++;

      console.log(
        `✅ Aluno: ${nome}`
      );

      /*
        PROGRESSO
      */

      const progressoAluno =
        progresso[id];

      if (
        progressoAluno !== undefined &&
        progressoAluno !== null
      ) {
        await connection.query(
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
            id,
            JSON.stringify(
              progressoAluno
            )
          ]
        );

        progressosMigrados++;

        console.log(
          '   ↳ progresso migrado'
        );
      }

      /*
        APRENDIZAGEM
      */

      const aprendizagemAluno =
        aprendizagem[id];

      if (
        aprendizagemAluno !== undefined &&
        aprendizagemAluno !== null
      ) {
        await connection.query(
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
            id,
            JSON.stringify(
              aprendizagemAluno
            )
          ]
        );

        aprendizagensMigradas++;

        console.log(
          '   ↳ aprendizagem migrada'
        );
      }

      console.log('');
    }

    await connection.commit();

    console.log('');
    console.log('===================================');
    console.log(' MIGRAÇÃO FINALIZADA');
    console.log('===================================');

    console.log(
      `Alunos: ${alunosMigrados}`
    );

    console.log(
      `Progressos: ${progressosMigrados}`
    );

    console.log(
      `Aprendizagens: ${aprendizagensMigradas}`
    );

    console.log('');
    console.log(
      '✅ Dados migrados para o MySQL.'
    );
    console.log('');
  } catch (error) {
    console.error('');
    console.error(
      '❌ ERRO NA MIGRAÇÃO'
    );

    console.error(
      error
    );

    if (connection) {
      try {
        await connection.rollback();

        console.log(
          'Alterações canceladas.'
        );
      } catch (rollbackError) {
        console.error(
          'Erro ao desfazer alterações:',
          rollbackError
        );
      }
    }
  } finally {
    if (connection) {
      connection.release();
    }

    await db.end();

    process.exit();
  }
}

migrar();