# NestJS Boilerplate

This is a project developed using **NestJS** with support for end-to-end (E2E) testing, continuous integration via **GitHub Actions**, and configuration for running in Docker.

**Licence**

[![NPM](https://img.shields.io/npm/l/express?style=for-the-badge)](https://github.com/Junior580/nestjs-app/blob/main/LICENCE)

**Workflow Status**

[![NPM](https://img.shields.io/github/actions/workflow/status/junior580/barber-backend/coverage.yml?style=for-the-badge)](https://github.com/Junior580/barber-backend/actions)


## Technologies

- **NestJS** - Framework for building efficient, scalable Node.js applications
- **TypeORM** - ORM for database integration
- **PostgreSQL** - Database
- **Supertest** - Tool for integration testing
- **GitHub Actions** - For CI/CD
- **Docker** - For containerization

## Prerequisites

Before running the project, make sure you have the following tools installed:

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

## Project Setup

### Step 1: Clone the Repository
Clone the repository to your local machine:

```bash
git clone https://github.com/Junior580/nestjs-app
cd nestjs-app
```

### Step 2: Install Dependencies
To run the database locally with Docker, run the following command:

```bash
npm install
```

### Step 3: Set Up the Database
To run the database locally with Docker, run the following command:

```bash
docker-compose up -d
```

### Step 4: Run Migrations
If you have migrations to run, use the command:

```bash
npm run migration:run
```

### Step 5: Run the Application Locally
To run the application in development mode:

```bash
npm run start:dev
```

### Step 6: Run Tests
To run the E2E tests, execute:

```bash
npm run test:e2e
```

