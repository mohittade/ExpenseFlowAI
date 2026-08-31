# System Architecture

## High-Level Architecture

```text
                         USER
                           │
                           ▼
                  ┌─────────────────┐
                  │ STREAMLIT UI    │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    LANGGRAPH    │
                  │   ORCHESTRATOR  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   SUPERVISOR    │
                  │     AGENT       │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   Expense Agent    Exception Agent   Validation Agent
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ TOOL LAYER   │
                    ├──────────────┤
                    │ Database     │
                    │ Date Tool    │
                    │ Calculator   │
                    │ Policy Check │
                    │ PDF Tool     │
                    │ Email Tool   │
                    └──────┬───────┘
                           │
                           ▼
                       OUTPUTS
Design Principle

The LLM is responsible for:

Reasoning
Planning
Decision making
Handling ambiguity
Validation reasoning

Python tools are responsible for:

Database operations
Date calculations
Mathematical calculations
PDF generation
Email delivery

This hybrid approach ensures both intelligence and reliability.