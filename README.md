# ExpenseFlow AI - Multi-Agent Autonomous Travel Expense Report System

A production-ready multi-agent system for automated travel expense report generation with LangGraph orchestration, persistent state management, resilience patterns, and comprehensive observability.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│   FastAPI API   │────▶│  LangGraph Workflow  │────▶│  Redis State Store  │
│  (Auth, Health) │     │  (Agent Orchestration)│     │  (Persistence)      │
└─────────────────┘     └──────────────────┘     └────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │  Supervisor │    │ Expense Int │    │  Exception  │
    │   Agent     │    │  Agent      │    │   Agent     │
    └─────────────┘    └─────────────┘    └─────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                      ┌─────────────┐
                      │ Validation  │
                      │   Agent     │
                      └─────────────┘
                              │
                              ▼
                      ┌─────────────┐
                      │  PDF Report │
                      │  & Email    │
                      └─────────────┘
```

## Features Implemented

### 🔄 **Persistent State Management**
- Redis-backed workflow state store with TTL
- Distributed locking for concurrent workflow safety
- Workflow resume capability from any step
- Execution logs persisted per run

### 🛡️ **Resilience Patterns**
- **Retry Logic**: Exponential backoff for LLM calls (configurable)
- **Circuit Breaker**: Prevents cascade failures for LLM, DB, Email services
- **Timeouts**: Configurable timeouts for all external calls
- **Graceful Degradation**: Mock responses when services unavailable

### 🔐 **Authentication & Authorization**
- JWT-based authentication with access/refresh tokens
- Role-based access control (RBAC) with scopes:
  - `read` - View reports, logs, workflow state
  - `write` - Generate reports, resume workflows
  - `approve` - Approve/reject reports
  - `admin` - Full access

### 📊 **Observability**
- **Structured JSON Logging** with correlation IDs
- **Distributed Tracing** via OpenTelemetry (OTLP)
- **Health Checks**: Liveness, readiness, and per-agent health
- **Metrics** via Prometheus/Grafana

### 🧪 **Contract Testing**
- Pydantic schemas for all agent inputs/outputs
- Automated validation of inter-agent data flow
- Input sanitization to prevent prompt injection

### ⚙️ **Configuration Management**
- Environment-based configuration with Pydantic Settings
- Feature flags for gradual rollouts
- Type-safe configuration with validation

## Quick Start

### Prerequisites
- Python 3.11+
- Redis 7+
- (Optional) Docker & Docker Compose

### Local Development

1. **Clone and install dependencies:**
```bash
git clone <repo>
cd ExpenseFlowAI
pip install -r requirements.txt
```

2. **Start Redis:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your NVIDIA_API_KEY and other settings
```

4. **Initialize database:**
```bash
python -c "from src.utils.database import init_database; init_database()"
```

5. **Run the API:**
```bash
python -m src.main --backend
# Or: uvicorn backend.main:app --reload --port 8000
```

### Docker Compose (Full Stack)
```bash
docker-compose up -d
```
This starts:
- Redis (state store)
- OpenTelemetry Collector (tracing)
- Prometheus (metrics)
- Grafana (visualization)
- Backend API

Access:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090

## API Usage

### Authentication
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=employee&password=employee123"

# Response: {"access_token": "...", "refresh_token": "...", "token_type": "bearer"}
```

### Generate Report
```bash
curl -X POST http://localhost:8000/api/generate-report \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"user_request": "Generate my travel expense report for July 2025", "employee_id": 1}'
```

### Check Workflow State
```bash
curl -X GET http://localhost:8000/api/workflow/<run_id>/state \
  -H "Authorization: Bearer <access_token>"
```

### Approve Report
```bash
curl -X POST http://localhost:8000/api/approve-report \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"run_id": "<run_id>", "approved": true}'
```

### Health Checks
```bash
# Overall health
curl http://localhost:8000/health

# Readiness (for K8s)
curl http://localhost:8000/health/ready

# Agent health
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/agents/health
```

## Default Users
| Username | Password | Scopes |
|----------|----------|--------|
| admin | admin123 | read, write, approve, admin |
| employee | employee123 | read, write |
| finance | finance123 | read, write, approve |

## Project Structure
```
ExpenseFlowAI/
├── src/
│   ├── agents/           # Agent implementations
│   │   ├── supervisor_agent.py
│   │   ├── expense_intelligence_agent.py
│   │   ├── exception_agent.py
│   │   └── validation_agent.py
│   ├── graph/
│   │   └── workflow.py   # LangGraph workflow definition
│   ├── tools/            # Utility tools
│   ├── utils/
│   │   ├── llm_client.py # LLM client with resilience
│   │   └── database.py
│   ├── auth.py           # JWT authentication
│   ├── config.py         # Configuration management
│   ├── state_store.py    # Redis state persistence
│   ├── resilience.py     # Retry, circuit breaker
│   ├── sanitize.py       # Input sanitization
│   ├── logging_config.py # Structured logging
│   └── main.py           # CLI entry point
├── backend/
│   └── main.py           # FastAPI application
├── tests/
│   └── test_agent_contracts.py  # Contract tests
├── docker-compose.yml    # Full stack deployment
├── Dockerfile.backend    # Backend container
├── requirements.txt      # Python dependencies
├── .env.example          # Environment template
└── README.md
```

## Agent Contracts

Each agent has a well-defined input/output schema validated by Pydantic:

| Agent | Input | Output |
|-------|-------|--------|
| Supervisor | `user_request` | `WorkflowPlan` |
| Expense Intelligence | `date_range`, `employee_id` | `Expenses[]` |
| Expense Intelligence | `Expenses[]` | `CategorizedExpenses[]` |
| Exception | `Expenses[]` | `MissingDataResult` |
| Validation | `Expenses[]` | `PolicyViolations[]` |
| Validation | `Expenses[]` | `ExpenseSummary` |
| Validation | `Expenses[]`, `Summary`, `Violations` | `ReportPath` |
| Supervisor | `ReportSummary` | `ApprovalResult` |
| Supervisor | `PDFPath`, `Emails[]` | `EmailResult` |

## Configuration

Key environment variables:

```bash
# LLM
NVIDIA_API_KEY=your_key
LLM_MAX_RETRIES=3
LLM_RETRY_MIN_WAIT=2.0

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-32-char-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Observability
OTEL_ENDPOINT=http://localhost:4317
LOG_LEVEL=INFO

# Features
ENABLE_HUMAN_APPROVAL=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

## Testing

```bash
# Run contract tests
pytest tests/test_agent_contracts.py -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

## Monitoring

### Key Metrics to Watch
- `workflow_duration_seconds` - End-to-end workflow latency
- `llm_call_duration_seconds` - LLM API latency
- `circuit_breaker_state` - 0=closed, 1=half-open, 2=open
- `workflow_success_total` / `workflow_failure_total` - Success rates
- `redis_connected` - State store availability

### Grafana Dashboards
Import the provided dashboards or create custom ones using the Prometheus metrics.

## Security Considerations

1. **Change default secrets** in `.env` before production
2. **Use HTTPS** in production (reverse proxy with TLS)
3. **Rotate JWT secrets** periodically
4. **Limit CORS origins** to your frontend domains
5. **Enable rate limiting** (add `slowapi` middleware)
6. **Audit logs** are structured for SIEM integration

## Production Deployment

1. **Use managed Redis** (AWS ElastiCache, Azure Cache for Redis)
2. **Use managed PostgreSQL** instead of SQLite
3. **Deploy to Kubernetes** with the provided health checks
4. **Configure external OTLP endpoint** (Jaeger, Tempo, Datadog)
5. **Set up alerting** on circuit breaker state and error rates
6. **Enable WAF** for API protection

## License

MIT License - See LICENSE file for details.