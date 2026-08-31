"""
Email tool for sending expense reports.
"""
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


def send_report_email(
    to_emails: List[str],
    subject: str,
    body: str,
    attachment_path: Optional[str] = None,
    from_email: Optional[str] = None
) -> Dict[str, Any]:
    """Send an email with optional PDF attachment."""
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        return {"success": False, "error": "SMTP credentials not configured"}

    from_email = from_email or SMTP_USERNAME

    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = ", ".join(to_emails)
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "html"))

    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            attachment = MIMEApplication(f.read(), _subtype="pdf")
            attachment.add_header(
                "Content-Disposition",
                "attachment",
                filename=os.path.basename(attachment_path)
            )
            msg.attach(attachment)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        return {"success": True, "message": "Email sent successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_finance_contacts() -> List[str]:
    """Get finance team email addresses."""
    from src.tools.database_tool import retrieve_contacts
    contacts = retrieve_contacts(role="Approver")
    return [c["email"] for c in contacts if c.get("email")]