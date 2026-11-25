import * as SQLite from 'expo-sqlite';

export interface Produto {
  ID_PROD: number;
  NOME_PROD: string;
  QTD_PROD: number;
  PRECO_PROD: number;
}

export interface PaginaProdutos {
  itens: Produto[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
}

// Função para abrir ou criar o banco de dados
async function Banco() {
  try {
    const db = await SQLite.openDatabaseAsync('ESTOQUE.db');
    console.log('Banco de dados aberto');
    return db;
  } catch (error) {
    console.log('Erro ao abrir banco:', error);
  }
}

// Cria a tabela PRODUTO e popula com 10 registros se estiver vazia
async function createTable(db: SQLite.SQLiteDatabase) {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS PRODUTO (
        ID_PROD INTEGER PRIMARY KEY AUTOINCREMENT,
        NOME_PROD VARCHAR(100) NOT NULL,
        QTD_PROD INTEGER NOT NULL,
        PRECO_PROD REAL NOT NULL
      );
    `);
    console.log('Tabela PRODUTO pronta');

    const contagem = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM PRODUTO'
    );

    if (!contagem || contagem.total === 0) {
      await db.execAsync(`
        INSERT INTO PRODUTO (NOME_PROD, QTD_PROD, PRECO_PROD) VALUES
        ('Notebook Dell', 5, 4500.00),
        ('Mouse Sem Fio', 15, 89.90),
        ('Teclado Mecânico', 8, 250.00),
        ('Monitor 24"', 4, 899.00),
        ('Fone Bluetooth', 12, 199.90),
        ('Webcam Full HD', 6, 220.00),
        ('Cadeira Ergonômica', 3, 1100.00),
        ('Suporte para Notebook', 20, 45.00),
        ('Hub USB-C', 10, 130.00),
        ('Mochila para Laptop', 7, 180.00);
      `);
      console.log('10 produtos iniciais inseridos');
    }
  } catch (error) {
    console.log('Erro ao criar/popular tabela PRODUTO:', error);
  }
}

// Inserir novo produto (CREATE)
async function insertProduto(
  db: SQLite.SQLiteDatabase,
  nome: string,
  quantidade: number,
  preco: number
) {
  try {
    await db.runAsync(
      'INSERT INTO PRODUTO (NOME_PROD, QTD_PROD, PRECO_PROD) VALUES (?, ?, ?)',
      nome.trim(),
      quantidade,
      preco
    );
    console.log('Produto inserido');
  } catch (error) {
    console.log('Erro ao inserir produto:', error);
  }
}

// Listar produtos com paginação (READ)
async function selectProdutosPaginados(
  db: SQLite.SQLiteDatabase,
  pagina = 1,
  tamanhoPagina = 4
): Promise<PaginaProdutos> {
  try {
    const contagem = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM PRODUTO'
    );
    const totalItens = contagem?.total ?? 0;
    const totalPaginas = Math.max(1, Math.ceil(totalItens / tamanhoPagina));
    const paginaSegura = Math.min(Math.max(1, pagina), totalPaginas);
    const offset = (paginaSegura - 1) * tamanhoPagina;

    const itens = await db.getAllAsync<Produto>(
      'SELECT * FROM PRODUTO ORDER BY ID_PROD DESC LIMIT ? OFFSET ?',
      tamanhoPagina,
      offset
    );

    return {
      itens: itens ?? [],
      paginaAtual: paginaSegura,
      totalPaginas,
      totalItens,
    };
  } catch (erro) {
    console.log('Erro ao buscar produtos:', erro);
    return {
      itens: [],
      paginaAtual: 1,
      totalPaginas: 1,
      totalItens: 0,
    };
  }
}

// Exibir produto pelo ID
async function selectProdutoById(db: SQLite.SQLiteDatabase, id: number) {
  try {
    const result = await db.getFirstAsync<Produto>(
      'SELECT * FROM PRODUTO WHERE ID_PROD = ?',
      id
    );
    return result;
  } catch (erro) {
    console.log('Erro ao buscar produto por ID:', erro);
  }
}

// Buscar produtos por nome
async function selectProdutoNome(db: SQLite.SQLiteDatabase, nome: string) {
  try {
    const result = await db.getAllAsync<Produto>(
      'SELECT * FROM PRODUTO WHERE NOME_PROD LIKE ?',
      `%${nome.trim()}%`
    );
    return result;
  } catch (erro) {
    console.log('Erro ao buscar produto por nome:', erro);
  }
}

// Atualizar produto existente (UPDATE)
async function updateProduto(
  db: SQLite.SQLiteDatabase,
  id: number,
  nome: string,
  quantidade: number,
  preco: number
) {
  try {
    await db.runAsync(
      'UPDATE PRODUTO SET NOME_PROD = ?, QTD_PROD = ?, PRECO_PROD = ? WHERE ID_PROD = ?',
      nome.trim(),
      quantidade,
      preco,
      id
    );
    console.log('Produto atualizado');
  } catch (error) {
    console.log('Erro ao atualizar produto:', error);
  }
}

// Excluir produto pelo ID (DELETE)
async function deleteProduto(db: SQLite.SQLiteDatabase, id: number) {
  try {
    await db.runAsync('DELETE FROM PRODUTO WHERE ID_PROD = ?', id);
    console.log('Produto excluído');
  } catch (error) {
    console.log('Erro ao excluir produto:', error);
  }
}

// Remover tabela
async function dropTable(db: SQLite.SQLiteDatabase) {
  await db.execAsync('DROP TABLE IF EXISTS PRODUTO');
  console.log('Tabela PRODUTO excluída');
}

export {
  Banco,
  createTable,
  insertProduto,
  selectProdutosPaginados,
  selectProdutoById,
  selectProdutoNome,
  updateProduto,
  deleteProduto,
  dropTable,
};