# 🚀 Nexus Checklist — Sistema de Gerenciamento de Tarefas

Aplicação fullstack desenvolvida com foco em organização de tarefas, produtividade e aprendizado de arquitetura moderna utilizando Angular + Spring Boot.

O sistema permite gerenciar tarefas de forma prática, separando atividades pendentes e concluídas, além de fornecer uma interface moderna, intuitiva e escalável.

---

# 📸 Preview

## 🖥️ Interface Principal

><img width="1920" height="1080" alt="Captura de tela 2026-05-18 195503" src="https://github.com/user-attachments/assets/c65c2337-9ce1-489b-963b-1467551a7ecb" />
><img width="1920" height="1080" alt="Captura de tela 2026-05-18 195508" src="https://github.com/user-attachments/assets/6313c238-4138-4dff-b055-bc5902f29b23" />


---

# ✨ Funcionalidades

## ✅ Gerenciamento de tarefas
- Criar tarefas
- Excluir tarefas
- Marcar tarefas como concluídas
- Separação automática entre:
  - Pendentes
  - Concluídas

---

## 📅 Organização temporal
- Data automática de criação
- Ordenação de tarefas
- Controle visual de status

---

## 🎨 Interface moderna
- Layout responsivo
- Componentização no Angular
- Estrutura preparada para escalabilidade
- Feedback visual para interações

---

# 🧠 Objetivos do Projeto

Este projeto foi desenvolvido com o objetivo de aprofundar conhecimentos em:

- Arquitetura Fullstack
- Desenvolvimento de APIs REST
- Integração Angular + Spring Boot
- Estrutura MVC
- CRUD completo
- Componentização
- Organização de código
- Boas práticas de desenvolvimento

---

# 🛠️ Tecnologias Utilizadas

## 🎨 Frontend

| Tecnologia | Descrição |
|---|---|
| Angular | Framework frontend |
| TypeScript | Linguagem principal |
| HTML5 | Estrutura |
| CSS3 | Estilização |
| RxJS | Programação reativa |

---

## ⚙️ Backend

| Tecnologia | Descrição |
|---|---|
| Java | Linguagem backend |
| Spring Boot | Framework backend |
| Spring Data JPA | Persistência |
| Maven | Gerenciamento de dependências |

---

## 🗄️ Banco de Dados

| Tecnologia | Descrição |
|---|---|
| H2 Database | Banco em memória para desenvolvimento |

---

# 🧱 Arquitetura do Projeto

```bash
taskflow/
│
├── backend/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── model/
│   └── resources/
│
├── frontend/
│   ├── components/
│   ├── services/
│   ├── models/
│   ├── pages/
│   └── assets/
```

---

# 🔄 Fluxo da Aplicação

```text
Angular Frontend
       ↓
HTTP Requests
       ↓
Spring Boot API REST
       ↓
Service Layer
       ↓
Repository Layer
       ↓
Database
```

---

# ⚙️ Como Executar o Projeto

# 🔥 Backend

## Pré-requisitos
- Java 17+
- Maven

## Executando

```
mvn spring-boot:run
```

Backend disponível em:

```
http://localhost:8080
```

---

# 🎨 Frontend

## Pré-requisitos
- Node.js
- Angular CLI

## Executando

```bash
cd todo-frontend

npm install

ng serve
```

Frontend disponível em:

```bash
http://localhost:4200
```

---

# 📌 Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/tasks` | Listar tarefas |
| POST | `/tasks` | Criar tarefa |
| PUT | `/tasks/{id}` | Atualizar tarefa |
| DELETE | `/tasks/{id}` | Remover tarefa |

---

# 📚 Conceitos Aplicados

- REST API
- CRUD
- MVC
- Componentização
- Responsividade
- Integração Fullstack
- Organização de estado
- Persistência de dados
- Programação orientada a objetos

---

# 🚀 Roadmap / Melhorias Futuras

## 🔐 Segurança
- [ ] Login com JWT
- [ ] Controle de usuários
- [ ] Proteção de rotas

---

## 📈 Funcionalidades
- [ ] Sistema de categorias
- [ ] Busca de tarefas
- [ ] Filtros avançados
- [ ] Ordenação dinâmica
- [ ] Prioridade de tarefas
- [ ] Sistema de prazos

---

## 🎨 Interface
- [ ] Dark Mode
- [ ] Drag and Drop
- [ ] Dashboard com estatísticas
- [ ] Toast notifications

---

## ☁️ Deploy
- [ ] Deploy Backend
- [ ] Deploy Frontend
- [ ] Banco de dados em produção

---

# 🧪 Futuras Implementações Técnicas

- Testes unitários
- Docker
- CI/CD
- Swagger Documentation
- PostgreSQL
- Angular Material

---

# 👨‍💻 Autor

## Randson Thiago Sales da Silva Lima

Desenvolvedor Fullstack em evolução, focado em aplicações modernas utilizando Java, Spring Boot e Angular.

---

# 🔗 Contato

## GitHub
https://github.com/randon95754

## LinkedIn
https://www.instagram.com/randoonnn/

---

# ⭐ Considerações

Este projeto faz parte da minha jornada de evolução como desenvolvedor Fullstack, aplicando conceitos modernos de desenvolvimento web, integração de APIs e arquitetura escalável.
