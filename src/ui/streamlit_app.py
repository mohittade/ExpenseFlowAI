"""
Streamlit UI for ExpenseFlow AI.
"""
import streamlit as st
import os
import sys
from datetime import datetime
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent.absolute()
sys.path.insert(0, str(PROJECT_ROOT))

from src.graph import run_workflow
from src.tools import get_execution_logs, retrieve_expenses, retrieve_policies
from src.tools.date_tool import parse_natural_date_range
from src.tools.calculator_tool import summarize_expenses
from src.tools.policy_tool import check_policy_limits


st.set_page_config(
    page_title="ExpenseFlow AI",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)


def init_session_state():
    """Initialize session state variables."""
    if 'workflow_result' not in st.session_state:
        st.session_state.workflow_result = None
    if 'run_id' not in st.session_state:
        st.session_state.run_id = None
    if 'approval_pending' not in st.session_state:
        st.session_state.approval_pending = False


def display_header():
    """Display the main header."""
    st.title("📊 ExpenseFlow AI")
    st.markdown("**Multi-Agent Autonomous Travel Expense Report System**")
    st.markdown("---")


def display_input_form():
    """Display the user input form."""
    st.subheader("🎯 Generate Expense Report")
    
    with st.form("expense_request_form"):
        user_request = st.text_area(
            "Enter your request in natural language:",
            value="Generate my travel expense report for July 2025 and email it to finance.",
            height=100,
            help="Examples: 'Generate my travel expense report for July 2025', 'Create expense report for last month and email to finance'"
        )
        
        col1, col2 = st.columns(2)
        with col1:
            employee_id = st.number_input("Employee ID", min_value=1, value=1)
        with col2:
            employee_name = st.text_input("Employee Name", value="John Doe")
        
        submitted = st.form_submit_button("🚀 Generate Report", type="primary", use_container_width=True)
        
        if submitted and user_request.strip():
            with st.spinner("Running multi-agent workflow..."):
                result = run_workflow(user_request.strip(), employee_id, employee_name)
                st.session_state.workflow_result = result
                st.session_state.run_id = result.get('run_id')
                st.session_state.approval_pending = not result.get('approved', False)
                st.rerun()


def display_workflow_status(result):
    """Display the workflow execution status."""
    if not result:
        return
    
    st.markdown("---")
    st.subheader("⚙️ Workflow Execution")
    
    # Status overview
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Run ID", result.get('run_id', 'N/A'))
    with col2:
        st.metric("Current Step", result.get('current_step', 'N/A').replace('_', ' ').title())
    with col3:
        status = "✅ Complete" if result.get('current_step') == 'send_email' else "🔄 Running"
        st.metric("Status", status)
    with col4:
        approved = result.get('approved', False)
        st.metric("Approval", "✅ Approved" if approved else "❌ Pending/Rejected")
    
    # Progress steps
    steps = [
        "Parse Request", "Retrieve Expenses", "Categorize Expenses",
        "Check Missing Data", "Validate Policies", "Calculate Totals",
        "Generate PDF", "Validate Report", "Request Approval", "Send Email"
    ]
    
    current_step = result.get('current_step', '')
    step_map = {
        'parse_request': 0, 'retrieve_expenses': 1, 'categorize_expenses': 2,
        'check_missing_data': 3, 'validate_policies': 4, 'calculate_totals': 5,
        'generate_pdf': 6, 'validate_report': 7, 'request_approval': 8, 'send_email': 9
    }
    current_idx = step_map.get(current_step, 0)
    
    st.markdown("**Progress:**")
    progress_cols = st.columns(len(steps))
    for i, (col, step) in enumerate(zip(progress_cols, steps)):
        with col:
            if i < current_idx:
                st.markdown(f"✅ {step}")
            elif i == current_idx:
                st.markdown(f"🔄 **{step}**")
            else:
                st.markdown(f"⏳ {step}")


def display_expense_summary(result):
    """Display expense summary metrics."""
    if not result or not result.get('summary'):
        return
    
    st.markdown("---")
    st.subheader("💰 Expense Summary")
    
    summary = result['summary']
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Grand Total", f"${summary.get('grand_total', 0):,.2f}")
    with col2:
        st.metric("Transactions", summary.get('expense_count', 0))
    with col3:
        dr = summary.get('date_range', {})
        st.metric("Date Range", f"{dr.get('start', 'N/A')} to {dr.get('end', 'N/A')}")
    with col4:
        st.metric("Categories", len(summary.get('category_totals', {})))
    
    # Category breakdown
    if summary.get('breakdown'):
        st.markdown("**Expenses by Category:**")
        breakdown_data = []
        for item in summary['breakdown']:
            breakdown_data.append({
                "Category": item['category'],
                "Count": item['count'],
                "Total": f"${item['total']:,.2f}",
                "% of Total": f"{item['percentage']:.1f}%"
            })
        st.dataframe(breakdown_data, use_container_width=True, hide_index=True)


def display_expense_details(result):
    """Display detailed expense table."""
    if not result or not result.get('expenses'):
        return
    
    st.markdown("---")
    st.subheader("📋 Detailed Expenses")
    
    expenses = result['expenses']
    detail_data = []
    for exp in expenses:
        detail_data.append({
            "Date": exp.get('date', ''),
            "Merchant": exp.get('merchant', ''),
            "Category": exp.get('category') or "⚠️ Uncategorized",
            "Amount": f"${exp.get('amount', 0):,.2f}",
            "Description": exp.get('description') or "⚠️ Missing",
            "Receipt": "✅" if exp.get('receipt_path') else "❌ Missing"
        })
    
    st.dataframe(detail_data, use_container_width=True, hide_index=True)


def display_policy_violations(result):
    """Display policy violations."""
    if not result or not result.get('violations'):
        st.success("✅ No policy violations detected")
        return
    
    st.markdown("---")
    st.subheader("⚠️ Policy Violations")
    
    violations = result['violations']
    viol_data = []
    for v in violations:
        viol_data.append({
            "Date": v.get('date', ''),
            "Merchant": v.get('merchant', ''),
            "Category": v.get('category', ''),
            "Amount": f"${v.get('amount', 0):,.2f}",
            "Limit": f"${v.get('limit', 0):,.2f}",
            "Excess": f"${v.get('excess', 0):,.2f}",
            "Severity": v.get('severity', 'medium').upper()
        })
    
    st.dataframe(viol_data, use_container_width=True, hide_index=True)
    
    if st.session_state.approval_pending:
        st.warning("⚠️ Report requires approval due to policy violations")


def display_missing_data(result):
    """Display missing data/exceptions."""
    if not result or not result.get('missing_data'):
        st.success("✅ No missing data or exceptions")
        return
    
    st.markdown("---")
    st.subheader("🔍 Missing Data / Exceptions")
    
    missing = result['missing_data']
    miss_data = []
    for m in missing:
        miss_data.append({
            "Date": m.get('date', ''),
            "Merchant": m.get('merchant', ''),
            "Issue": m.get('issue', ''),
            "Severity": m.get('severity', 'medium').upper(),
            "Details": m.get('details', '')
        })
    
    st.dataframe(miss_data, use_container_width=True, hide_index=True)
    
    if st.session_state.approval_pending:
        st.warning("⚠️ Report requires approval due to missing data")


def display_approval_section(result):
    """Display approval interface."""
    if not result:
        return
    
    st.markdown("---")
    st.subheader("👤 Human Approval")
    
    approved = result.get('approved', False)
    
    if approved:
        st.success("✅ Report approved and ready for email")
    else:
        st.error("❌ Report not approved - violations or missing data detected")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("✅ Approve Anyway", type="primary", use_container_width=True):
                # In a real system, this would update the workflow state
                st.session_state.workflow_result['approved'] = True
                st.session_state.approval_pending = False
                st.success("Report approved! You can now send the email.")
                st.rerun()
        
        with col2:
            if st.button("❌ Reject", use_container_width=True):
                st.error("Report rejected. Please review and resubmit.")


def display_pdf_download(result):
    """Display PDF download button."""
    if not result or not result.get('pdf_path'):
        return
    
    st.markdown("---")
    st.subheader("📄 Download Report")
    
    pdf_path = result['pdf_path']
    if os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
        
        st.download_button(
            label="📥 Download PDF Report",
            data=pdf_bytes,
            file_name=f"expense_report_{result['run_id']}.pdf",
            mime="application/pdf",
            use_container_width=True
        )
    else:
        st.error("PDF file not found")


def display_email_status(result):
    """Display email sending status."""
    if not result or not result.get('email_result'):
        return
    
    st.markdown("---")
    st.subheader("📧 Email Status")
    
    email_result = result['email_result']
    if email_result.get('success'):
        st.success(f"✅ Email sent successfully to finance team")
    else:
        st.error(f"❌ Email failed: {email_result.get('error', 'Unknown error')}")
        st.info("Configure SMTP credentials in .env file to enable email sending")


def display_execution_logs(result):
    """Display execution logs."""
    if not result or not result.get('run_id'):
        return
    
    with st.expander("📜 Execution Logs", expanded=False):
        logs = get_execution_logs(result['run_id'])
        if logs:
            for log in logs:
                status_icon = "✅" if log['status'] == 'completed' else "❌" if log['status'] == 'failed' else "🔄"
                st.text(f"{log['created_at']} | {log['agent_name']} | {log['action']} | {status_icon} {log['status']}")
                if log['details']:
                    st.text(f"  → {log['details']}")
        else:
            st.text("No logs available")


def display_sidebar():
    """Display sidebar with info and sample data."""
    with st.sidebar:
        st.header("ℹ️ About")
        st.markdown("""
        **ExpenseFlow AI** automates travel expense reporting using a multi-agent AI system.
        
        **Agents:**
        - 🎯 **Supervisor** - Planning & orchestration
        - 💡 **Expense Intelligence** - Retrieval & categorization
        - 🔍 **Exception Handler** - Missing data detection
        - ✅ **Validation** - Policy check & PDF generation
        """)
        
        st.markdown("---")
        st.header("📊 Sample Data")
        st.markdown("""
        The system includes sample expenses for **July 2025**:
        - 11 transactions
        - Categories: Flights, Lodging, Meals, Transport, Supplies
        - 2 policy violations (Lodging, Meals)
        - Missing categories & descriptions for testing
        """)
        
        st.markdown("---")
        st.header("⚙️ Configuration")
        st.markdown("""
        Set these in `.env`:
        - `NVIDIA_API_KEY` - For LLM categorization
        - `SMTP_SERVER/PORT/USERNAME/PASSWORD` - For email
        - `DATABASE_PATH` - SQLite location
        """)


def main():
    """Main Streamlit app."""
    init_session_state()
    display_header()
    display_sidebar()
    
    # Main content area
    if st.session_state.workflow_result is None:
        # Show input form
        display_input_form()
        
        # Show sample queries
        st.markdown("---")
        st.markdown("**Try these example requests:**")
        examples = [
            "Generate my travel expense report for July 2025 and email it to finance.",
            "Create expense report for last month.",
            "Generate travel expense report for August 2025.",
            "Create my expense report for July 2025."
        ]
        cols = st.columns(len(examples))
        for i, example in enumerate(examples):
            with cols[i]:
                if st.button(f"📝 {example[:15]}...", key=f"ex_{i}", use_container_width=True):
                    st.session_state.example_request = example
                    st.rerun()
    else:
        # Show results
        result = st.session_state.workflow_result
        
        # New request button
        if st.button("🔄 New Request", use_container_width=True):
            st.session_state.workflow_result = None
            st.session_state.run_id = None
            st.session_state.approval_pending = False
            st.rerun()
        
        display_workflow_status(result)
        display_expense_summary(result)
        display_expense_details(result)
        display_policy_violations(result)
        display_missing_data(result)
        display_approval_section(result)
        display_pdf_download(result)
        display_email_status(result)
        display_execution_logs(result)


if __name__ == "__main__":
    main()