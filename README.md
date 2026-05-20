![Angular](https://img.shields.io/badge/Angular-20-red)
![Spring Boot](https://img.shields.io/badge/SpringBoot-3-green)
![Java](https://img.shields.io/badge/Java-17-orange)
![Deploy](https://img.shields.io/badge/Deploy-Online-success)

# 🚀 Nexus Checklist — Sistema de Gerenciamento de Tarefas

Aplicação fullstack desenvolvida com foco em organização de tarefas, produtividade e aprendizado de arquitetura moderna utilizando Angular + Spring Boot.

O sistema permite gerenciar tarefas de forma prática, separando atividades pendentes e concluídas, além de fornecer uma interface moderna, intuitiva e escalável.

---

# 📸 Preview

## 🖥️ Interface Principal

> <img width="1920" height="1080" alt="Captura de tela 2026-05-18 195503" src="https://github.com/user-attachments/assets/c65c2337-9ce1-489b-963b-1467551a7ecb" />
> <img width="1920" height="1080" alt="Captura de tela 2026-05-18 195508" src="https://github.com/user-attachments/assets/6313c238-4138-4dff-b055-bc5902f29b23" />

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

| Tecnologia | Descrição           |
| ---------- | ------------------- |
| Angular    | Framework frontend  |
| TypeScript | Linguagem principal |
| HTML5      | Estrutura           |
| CSS3       | Estilização         |
| RxJS       | Programação reativa |

---

## ⚙️ Backend

| Tecnologia      | Descrição                     |
| --------------- | ----------------------------- |
| Java            | Linguagem backend             |
| Spring Boot     | Framework backend             |
| Spring Data JPA | Persistência                  |
| Maven           | Gerenciamento de dependências |

---

## 🗄️ Banco de Dados

| Tecnologia  | Descrição                                      |
| ----------- | ---------------------------------------------- |
| H2 Database | Banco utilizado em ambiente de desenvolvimento |

---

# ☁️ Deploy

| Camada        | Plataforma |
| ------------- | ---------- |
| Frontend      | Vercel     |
| Backend       | Render     |
| Versionamento | GitHub     |

---

## Deploy Frontend

O frontend Angular foi hospedado na Vercel com integração contínua via GitHub.

## Deploy Backend

A API Spring Boot foi hospedada no Render utilizando deploy automático via repositório GitHub.

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

| Método | Endpoint      | Descrição        |
| ------ | ------------- | ---------------- |
| GET    | `/tasks`      | Listar tarefas   |
| POST   | `/tasks`      | Criar tarefa     |
| PUT    | `/tasks/{id}` | Atualizar tarefa |
| DELETE | `/tasks/{id}` | Remover tarefa   |

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

# 🌐 Aplicação Online

| Serviço     | Link                                    |
| ----------- | --------------------------------------- |
| Frontend    | https://projeto-todo-iota.vercel.app/   |
| Backend API | https://projeto-todo-yv8n.onrender.com/ |

---

# ⚠️ Observações Importantes

## 📱 Responsividade (Mobile)

A aplicação ainda não está totalmente otimizada para dispositivos móveis.

Alguns componentes podem apresentar:
- Layout desalinhado em telas pequenas
- Elementos com espaçamento reduzido
- Experiência visual não totalmente adaptada ao mobile

A responsividade está prevista como melhoria futura no roadmap do projeto.

---

## ⏳ Inicialização do Backend (Render)

O backend está hospedado na plataforma Render (plano gratuito), que possui limitação de *cold start*.

Isso significa que:

- A primeira requisição após um período de inatividade pode levar aproximadamente **30s a 1min**
- Durante esse tempo, a API pode parecer indisponível temporariamente
- Após a inicialização, o sistema volta a responder normalmente

Esse comportamento é esperado devido às restrições da camada gratuita da plataforma de deploy.

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
- [x] Prioridade de tarefas
- [ ] Sistema de prazos

---

## 🎨 Interface

- [x] Dark Mode
- [ ] Dashboard com estatísticas
- [ ] Toast notifications

---

## ☁️ Deploy

- [x] Deploy Backend no Render
- [x] Deploy Frontend no Vercel
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

## Instagram

https://www.instagram.com/randoonnn/

---

# ⭐ Considerações

O Nexus Checklist foi desenvolvido com foco em consolidar conhecimentos em desenvolvimento fullstack moderno, arquitetura REST e integração entre aplicações Angular e Spring Boot.

O projeto também serviu como experiência prática em deploy cloud utilizando Vercel e Render, além de organização de código escalável e componentização frontend.
