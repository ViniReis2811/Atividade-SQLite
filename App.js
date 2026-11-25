import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Banco,
  createTable,
  deleteProduto,
  insertProduto,
  selectProdutosPaginados,
  updateProduto,
} from './Banco/Config';

const ITENS_POR_PAGINA = 4;

export default function App() {
  const [db, setDb] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [preco, setPreco] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItens, setTotalItens] = useState(0);

  const carregarLista = useCallback(async (database, pagina = 1) => {
    // Verifica se a instância do banco de dados está disponível
    if (!database) return;

    // Pede ao Config.tsx apenas os registros da página solicitada
    const dados = await selectProdutosPaginados(database, pagina, ITENS_POR_PAGINA);
    
    // Atualiza o estado com os dados recebidos
    setProdutos(dados.itens);
    setPaginaAtual(dados.paginaAtual);
    setTotalPaginas(dados.totalPaginas);
    setTotalItens(dados.totalItens);
  }, []);

  useEffect(() => {
    async function Main() {
      const instanciaDb = await Banco(); // Abre ou cria o arquivo SQLite e retorna a conexão (instanciaDb)
      if (instanciaDb) {
        setDb(instanciaDb);
        await createTable(instanciaDb); // Garante que a tabela de produtos exista e, se estiver vazia, insere os produtos iniciais
        await carregarLista(instanciaDb, 1); // Carrega a primeira página de produtos do banco de dados
      }
    }
    Main();
  }, [carregarLista]);

  const limparCampos = () => {
    setNome('');
    setQuantidade('');
    setPreco('');
    setEditandoId(null);
  };

  const handleSalvar = async () => {
    const qtdConvertida = Number(quantidade);
    const precoConvertido = Number(String(preco).replace(',', '.'));

    if (!nome.trim() || !quantidade.trim() || !preco.trim()) {
      Alert.alert('Atenção', 'Preencha nome, quantidade e preço.');
      return;
    }

    if (
      Number.isNaN(qtdConvertida) ||
      qtdConvertida < 0 ||
      Number.isNaN(precoConvertido) ||
      precoConvertido < 0
    ) {
      Alert.alert('Atenção', 'Informe quantidade e preço válidos.');
      return;
    }

    if (editandoId !== null) {
      await updateProduto(db, editandoId, nome, qtdConvertida, precoConvertido);
      Alert.alert('Sucesso', 'Produto atualizado!');
      limparCampos();
      await carregarLista(db, paginaAtual);
    } else {
      await insertProduto(db, nome, qtdConvertida, precoConvertido);
      Alert.alert('Sucesso', 'Produto cadastrado!');
      limparCampos();
      await carregarLista(db, 1);
    }
  };

  const handleEditar = (item) => {
    setEditandoId(item.ID_PROD);
    setNome(item.NOME_PROD);
    setQuantidade(String(item.QTD_PROD));
    setPreco(String(item.PRECO_PROD));
  };

  const handleExcluir = (item) => {
    Alert.alert('Confirmar exclusão', `Deseja remover "${item.NOME_PROD}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteProduto(db, item.ID_PROD);
          await carregarLista(db, paginaAtual);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.titulo}>Estoque de Produtos</Text>
      <Text style={styles.subtitulo}>Total de registros no SQLite: {totalItens}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nome do produto"
          value={nome}
          onChangeText={setNome}
        />

        <View style={styles.linha}>
          <TextInput
            style={[styles.input, styles.metade]}
            placeholder="Quantidade"
            keyboardType="numeric"
            value={quantidade}
            onChangeText={setQuantidade}
          />
          <TextInput
            style={[styles.input, styles.metade]}
            placeholder="Preço (ex: 79.90)"
            keyboardType="decimal-pad"
            value={preco}
            onChangeText={setPreco}
          />
        </View>

        <TouchableOpacity style={styles.btnPrincipal} onPress={handleSalvar}>
          <Text style={styles.btnTexto}>
            {editandoId !== null ? 'Salvar Alteração' : 'Cadastrar Produto'}
          </Text>
        </TouchableOpacity>

        {editandoId !== null && (
          <TouchableOpacity style={styles.btnSecundario} onPress={limparCampos}>
            <Text style={styles.btnSecundarioTexto}>Cancelar Edição</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={produtos}
        keyExtractor={(item) => String(item.ID_PROD)}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum produto cadastrado.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNome}>{item.NOME_PROD}</Text>
              <Text style={styles.cardDados}>
                Qtd: {item.QTD_PROD}  |  R$ {Number(item.PRECO_PROD).toFixed(2)}
              </Text>
            </View>

            <View style={styles.acoes}>
              <TouchableOpacity
                style={[styles.btnAcao, styles.btnEditar]}
                onPress={() => handleEditar(item)}
              >
                <Text style={styles.btnTexto}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAcao, styles.btnExcluir]}
                onPress={() => handleExcluir(item)}
              >
                <Text style={styles.btnTexto}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.paginacao}>
        <TouchableOpacity
          style={[styles.btnPag, paginaAtual <= 1 && styles.btnDesabilitado]}
          disabled={paginaAtual <= 1}
          onPress={() => carregarLista(db, paginaAtual - 1)}
        >
          <Text style={styles.btnTexto}>Anterior</Text>
        </TouchableOpacity>

        <Text style={styles.textoPag}>
          Página {paginaAtual} de {totalPaginas}
        </Text>

        <TouchableOpacity
          style={[styles.btnPag, paginaAtual >= totalPaginas && styles.btnDesabilitado]}
          disabled={paginaAtual >= totalPaginas}
          onPress={() => carregarLista(db, paginaAtual + 1)}
        >
          <Text style={styles.btnTexto}>Próxima</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 12 },
  titulo: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  subtitulo: { fontSize: 13, textAlign: 'center', color: '#4B5563', marginBottom: 12 },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  linha: { flexDirection: 'row', justifyContent: 'space-between' },
  metade: { width: '48.5%' },
  btnPrincipal: {
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecundario: { paddingVertical: 8, alignItems: 'center', marginTop: 4 },
  btnSecundarioTexto: { color: '#4B5563', fontWeight: '600' },
  lista: { paddingBottom: 10 },
  vazio: { textAlign: 'center', color: '#6B7280', marginTop: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardNome: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  cardDados: { fontSize: 13, color: '#4B5563', marginTop: 3 },
  acoes: { flexDirection: 'row', gap: 6 },
  btnAcao: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 6 },
  btnEditar: { backgroundColor: '#D97706' },
  btnExcluir: { backgroundColor: '#DC2626' },
  btnTexto: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  paginacao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  btnPag: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnDesabilitado: { backgroundColor: '#9CA3AF' },
  textoPag: { fontWeight: '600', color: '#111827' },
});