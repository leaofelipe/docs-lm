# Plano de Orquestração - docs-lm

## 📋 Objetivo

Criar **2 serviços orquestradores** que utilizem os serviços existentes sem quebrar a estrutura atual:

1. **DocumentProcessor** - Orquestra o processamento de documentos
2. **RAGService** - Orquestra o RAG e consultas

## Instruções:

1. Utilize comentários e Logs apenas em inglês.
2. Não utilize emojis em Logs e Comentários
3. Não adicione documentação estilo MKDocs no Projeto

## 🏗️ Estrutura do Projeto

### Estrutura Mantida + Novos Orquestradores

```
src/
├── services/                  # NOVO: Serviços orquestradores
│   ├── documentProcessor.js   # Orquestra: loader + embeddings + vectorStore
│   └── ragService.js         # Orquestra: vectorStore + llm + chains
├── chains/                   # MANTIDO: Implementação atual
│   ├── ragChain.js
│   └── systemPrompt.js
├── embeddings/              # MANTIDO: Implementação atual
│   └── embeddingService.js
├── llm/                     # MANTIDO: Implementação atual
│   └── anthropicService.js
├── loaders/                 # MANTIDO: Implementação atual
│   └── documentLoader.js
├── vectorStore/             # SUBSTITUÍDO: ChromaDB exclusivo
│   └── chromaStore.js       # ÚNICO: ChromaDB puro (memória + persistente)
├── demos/
│   └── demo.js             # SIMPLIFICADO: Usa apenas os 2 orquestradores
└── main.js                 # MANTIDO: Entry point
```

## 🔧 Serviço Orquestrador 1: DocumentProcessor

### Responsabilidades

- **Orquestrar** os serviços existentes para processar documentos
- **Não substitui** nenhum serviço atual
- **Utiliza** DocumentLoader + EmbeddingService + ChromaStore (memória ou persistente)

### Interface Pública

```javascript
export class DocumentProcessor {
  constructor() {
    this.documentLoader = new DocumentLoader()
    this.embeddingService = new EmbeddingService()
    this.chromaStore = null // ChromaDB em memória ou persistente
  }

  async initialize(persistent = false)
  async processAllDocuments()

### Funcionalidades Avançadas ChromaDB

- **Modo Memória**: ChromaDB em RAM para desenvolvimento rápido
- **Modo Persistente**: ChromaDB com storage em disco para produção
- **Migração de Dados**: Preserva dados ao alternar entre modos
- **Filtros Avançados**: Suporte a metadados e filtros complexos
- **Backup/Restore**: Export/import de dados da collection
- **Performance**: Busca otimizada com scores de similaridade
- **Gestão de Collections**: Criação, listagem e limpeza automática
  async processDocumentByPath(filePath)
  async refreshDatabase()
  async getProcessingStatus()
  async switchToPersistent()
  async switchToMemory()
}
```

### Funcionalidades

- Orquestra: load → embed → store (ChromaDB exclusivo)
- Detecção de novos/modificados documentos
- Logging detalhado do progresso
- Suporte para ChromaDB em memória e persistente
- Migração automática entre modos de armazenamento

## 🔧 Serviço Orquestrador 2: RAGService

### Responsabilidades

- **Orquestrar** os serviços existentes para consultas RAG
- **Não substitui** RAGChain nem AnthropicService
- **Utiliza** ChromaStore + AnthropicService + RAGChain

### Interface Pública

```javascript
export class RAGService {
  constructor() {
    this.anthropicService = new AnthropicService()
    this.chromaStore = null
    this.ragChain = null
  }

  async initialize(persistent = false)
  async ask(question, options = {})
  async askWithSources(question)
  async similaritySearch(query, k = 4)
  clearHistory()
  getHistory()
  async switchToPersistent()
  async switchToMemory()
}
```

### Funcionalidades

- Delega para RAGChain.ask() e RAGChain.askWithSources()
- Gerencia inicialização automática dos serviços
- Preparado para integração MCP
- Cache inteligente de consultas

## 📁 ChromaStore Exclusivo

### Arquivo Único: vectorStore/chromaStore.js

- **Substitui completamente** o memoryStore.js do LangChain
- **ChromaDB puro** sem dependência do LangChain vector stores
- **Dois modos**: memória (development) e persistente (production)
- **Interface unificada** para ambos os modos
- **Migração automática** entre modos sem perda de dados

```javascript
export class ChromaStore {
  constructor(embeddingFunction) {
    this.embeddingFunction = embeddingFunction
    this.client = null
    this.collection = null
    this.isPersistent = false
  }

  async initialize(persistent = false, collectionName = 'docs_collection')
  async initializeMemoryMode()
  async initializePersistentMode(persistPath)
  async addDocuments(documents)
  async similaritySearch(query, k = 4, filter = {})
  async searchWithScores(query, k = 4)
  async deleteDocuments(ids)
  async updateDocuments(documents)
  async getDocumentCount()
  async listCollections()
  async exportData()
  async importData(data)
  async switchMode(persistent, preserveData = true)
  getRetriever(options = {})
  verifyInitialization()
}
```

## 🔄 Demo Simplificado

### Versão Orquestrada (NOVO)

```javascript
import { DocumentProcessor } from '../services/documentProcessor.js'
import { RAGService } from '../services/ragService.js'

async function demo() {
  // 1. Processar documentos
  const processor = new DocumentProcessor()
  await processor.initialize()
  await processor.processAllDocuments()

  // 2. Usar RAG
  const rag = new RAGService()
  await rag.initialize()
  const response = await rag.ask('O que são eventos do player?')
  console.log(response)
}
```

### Versão Individual (MANTIDA)

```javascript
// Código atual continua funcionando 100% (apenas para referência histórica)
// IMPORTANTE: MemoryStore foi removido, use apenas ChromaDB
const documentLoader = new DocumentLoader()
const embeddingService = new EmbeddingService()
const chromaStore = new ChromaStore(embeddingService.embeddings) // Mudança: ChromaStore
const anthropicService = new AnthropicService()
const ragChain = new RAGChain(anthropicService.llm, retriever)
// ... resto da implementação atual
```

## 📦 Dependências

### Dependências ChromaDB (Obrigatórias)

```json
{
  "chromadb": "^1.8.1"
}
```

**Observação**: Removidas dependências do LangChain vector stores (`@langchain/chroma`)

### Environment Variables

```bash
# Existentes (continuam funcionando)
DATA_PATH=./data/docs
ANTHROPIC_API_KEY=xxx
HUGGINGFACE_API_KEY=xxx
EMBEDDING_MODEL=xxx
EMBEDDING_PROVIDER=hf-inference

# ChromaDB exclusivo (obrigatórios)
USE_PERSISTENT_STORAGE=false
CHROMA_PERSIST_PATH=./database/chromadb/persist
CHROMA_COLLECTION_NAME=docs_collection
CHROMA_MEMORY_LIMIT=512
```

## 🎯 Benefícios da Abordagem

### 1. Migração Transparente

- MemoryStore do LangChain **totalmente substituído**
- ChromaDB puro sem dependências do LangChain vector stores
- Interface unificada para memória e persistência
- Migração automática entre modos sem reprocessamento

### 2. Orquestração Limpa

- DocumentProcessor: 1 call para processar tudo
- RAGService: 1 call para consultar
- Esconde complexidade de inicialização

### 3. Flexibilidade

- Pode usar orquestradores OU serviços individuais
- ChromaDB em memória para desenvolvimento rápido
- ChromaDB persistente para produção
- Permite migração dinâmica entre modos

### 4. Preparação MCP

- RAGService expõe interface simples
- DocumentProcessor permite refresh sob demanda
- APIs prontas para integração externa

### 5. Performance Otimizada

- ChromaDB nativo sem overhead do LangChain
- Busca vetorial otimizada com filtros avançados
- Gestão de memória configurável
- Backup automático em `database/chromadb/backups/`

## 📋 Plano de Implementação

### Fase 1: DocumentProcessor

- [x] Criar `services/documentProcessor.js`
- [x] Orquestra DocumentLoader + EmbeddingService + ChromaStore
- [x] Testes básicos de funcionamento
- [x] Migração do MemoryStore para ChromaDB

### Fase 2: RAGService

- [x] Criar `services/ragService.js`
- [x] Orquestra AnthropicService + RAGChain + ChromaStore
- [x] Testes básicos de funcionamento
- [x] Integração com nova interface do ChromaDB
- [x] ChromaRetriever customizado para compatibilidade LangChain

### Fase 3: ChromaStore Puro

- [x] Adicionar dependência ChromaDB
- [x] Criar `vectorStore/chromaStore.js` (ChromaDB puro)
- [x] Implementar modo memória e persistente
- [x] Remover dependências do LangChain vector stores
- [x] Testes de performance e funcionalidade

### Fase 4: Integração ChromaDB

- [x] Atualizar orquestradores para usar apenas ChromaStore
- [x] Configuração via environment variables
- [x] Testes de migração MemoryStore → ChromaDB
- [x] Implementar migração dinâmica entre modos
- [x] Remover memoryStore.js completamente

### Fase 5: Demo e Documentação

- [ ] Atualizar `demos/demo.js` com ChromaDB exclusivo

### Fase 6: Otimizações

- [ ] Cache inteligente no RAGService
- [ ] Processamento incremental no DocumentProcessor
- [ ] Monitoring e logging melhorados com ChromaDB
- [ ] Performance benchmarks ChromaDB vs LangChain
- [ ] Otimizações de memória e filtros avançados

## 🎯 Resultado Final

- **MemoryStore LangChain**: Totalmente substituído por ChromaDB puro
- **Novos orquestradores**: Simplificam uso comum (2 serviços apenas)
- **ChromaDB Exclusivo**: Melhor performance sem overhead do LangChain
- **MCP Ready**: RAGService pronto para exposição externa
- **Migração Transparente**: Mudança suave do LangChain para ChromaDB
- **Dual Mode**: ChromaDB em memória (dev) + persistente (prod)

## 🚀 Casos de Uso

### Para Desenvolvimento Rápido

```javascript
// Usar ChromaDB em memória
const processor = new DocumentProcessor()
await processor.initialize(false) // persistent = false
```

### Para Produção

```javascript
// Usar ChromaDB persistente
const processor = new DocumentProcessor()
await processor.initialize(true) // persistent = true
```

### Para Migração Dinâmica

```javascript
// Alternar entre modos preservando dados
const processor = new DocumentProcessor()
await processor.initialize(false) // Inicia em memória
// ... trabalhar com dados ...
await processor.switchToPersistent() // Migra para persistente
```

### Para MCP Integration

```javascript
// RAGService pronto para exposição
const rag = new RAGService()
await rag.initialize()
// Expor rag.ask() via MCP protocol
```

Esta abordagem oferece **ChromaDB puro e otimizado** com **flexibilidade total entre memória e persistência**, removendo dependências desnecessárias do LangChain vector stores e oferecendo melhor performance e controle granular sobre o armazenamento vetorial.
