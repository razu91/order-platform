# Event-Driven Order Platform

A backend engineering project exploring event-driven microservices, asynchronous messaging, database consistency, and cloud-native deployment using Node.js and modern DevOps tools.

**Project Status:** In Progress

## Overview

The Event-Driven Order Platform is a learning and portfolio project designed to demonstrate how independent services communicate through events to process orders reliably.

The planned workflow includes order creation, inventory reservation, order status updates, and customer notifications. RabbitMQ will handle asynchronous communication between services.

The project is being developed incrementally, starting with the Orders Service and PostgreSQL integration.

## Technology Stack

| Category | Technologies |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| API | Express.js |
| Database | PostgreSQL |
| Messaging | RabbitMQ |
| Containers | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Configuration Management | Ansible |
| Orchestration | Kubernetes |
| Package Management | Helm |
| Cloud | AWS |

*The stack above describes the planned project scope. Technologies will be marked as implemented as development progresses.*

## Architecture

The target architecture consists of an API Gateway and three backend services.

```mermaid
flowchart TD
    Client[Client] --> Gateway[API Gateway]
    Gateway --> Orders[Orders Service]
    Orders --> OrdersDB[(Orders Database)]
    Orders -->|order.created| RabbitMQ[RabbitMQ]
    RabbitMQ --> Inventory[Inventory Service]
    Inventory --> InventoryDB[(Inventory Database)]
    Inventory -->|inventory.reserved / inventory.failed| RabbitMQ
    RabbitMQ --> Orders
    Orders -->|order.confirmed / order.rejected| RabbitMQ
    RabbitMQ --> Notifications[Notifications Service]
```

### Planned Services

- **API Gateway:** Authentication, request validation, and routing.
- **Orders Service:** Creates orders, tracks their status, and publishes order events.
- **Inventory Service:** Reserves stock and reports reservation outcomes.
- **Notifications Service:** Consumes order outcome events and sends notifications.

Each service will own its data and communicate asynchronously through RabbitMQ where appropriate.

## Order Processing Workflow

1. A client submits an order through `POST /orders`.
2. The Gateway authenticates the request and forwards it to the Orders Service.
3. Orders persists the order with `PENDING` status.
4. Orders publishes an `order.created` event.
5. Inventory reserves the requested stock and publishes `inventory.reserved` or `inventory.failed`.
6. Orders updates the order to `CONFIRMED` or `REJECTED` and publishes the corresponding outcome event.
7. Notifications consumes the outcome event and sends a message.

Reliability improvements will include idempotent event processing, retry policies, dead-letter queues, and a transactional outbox.

## Current Implementation

- [x] Node.js and TypeScript development environment
- [x] Express-based Orders Service skeleton
- [x] PostgreSQL container configuration with Docker Compose
- [x] Database connection configuration
- [x] `GET /health` endpoint with database connectivity verification
- [ ] Orders database migration
- [ ] `POST /orders` endpoint and order persistence
- [ ] RabbitMQ event publishing and consumption
- [ ] Inventory Service
- [ ] Notifications Service
- [ ] Automated tests and GitHub Actions
- [ ] Ansible provisioning
- [ ] Helm charts and Kubernetes deployment
- [ ] AWS deployment and observability

## Getting Started

### Prerequisites

- Node.js and npm
- Docker Engine
- Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/razu91/order-platform.git
cd order-platform
```

### 2. Configure environment variables

Create a root `.env` file:

```dotenv
POSTGRES_PASSWORD=replace_with_a_local_password
```

Create `services/orders/.env`:

```dotenv
PORT=3001
DATABASE_URL=postgresql://orders_user:replace_with_a_local_password@localhost:5433/orders_db
```

Use the same local database password in both files. These values are for development only; do not commit environment files or production secrets.

### 3. Start PostgreSQL

```bash
docker compose up -d
docker compose ps
```

Wait until the PostgreSQL container is healthy before starting the service.

### 4. Install dependencies

```bash
cd services/orders
npm install
```

### 5. Start the Orders Service

```bash
npm run dev
```

### 6. Verify the health endpoint

In another terminal, run:

```bash
curl -i http://localhost:3001/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "orders",
  "database": "connected"
}
```

The endpoint returns an error response if the database connection is unavailable.

## Development Roadmap

### Phase 1 — Application Foundation
- Bootstrap the Orders Service.
- Configure PostgreSQL and database migrations.
- Implement order creation and validation.

### Phase 2 — Event-Driven Communication
- Configure RabbitMQ exchanges, queues, and routing keys.
- Implement inventory reservation.
- Handle order confirmation and rejection.
- Add notification consumers.

### Phase 3 — Reliability and Testing
- Implement transactional outbox and idempotent consumers.
- Configure retries and dead-letter queues.
- Add unit, integration, and end-to-end tests.

### Phase 4 — CI/CD and Infrastructure
- Build container images.
- Automate checks and image publishing with GitHub Actions.
- Provision infrastructure with Ansible.
- Package deployments with Helm.

### Phase 5 — Kubernetes and AWS
- Deploy the services to Kubernetes.
- Configure health probes, resource limits, and secrets.
- Add centralized logging and monitoring.
- Document the deployment process.

## Engineering Goals

This project aims to demonstrate practical understanding of:

- Event-driven architecture and asynchronous messaging
- REST API design and service boundaries
- PostgreSQL transactions and data consistency
- Reliable message delivery and idempotency
- Containerization and CI/CD automation
- Infrastructure automation and Kubernetes deployment
- Observability and production-oriented engineering practices

## Repository

GitHub: https://github.com/razu91/order-platform

---

*Built incrementally as a hands-on backend engineering and DevOps portfolio project.*