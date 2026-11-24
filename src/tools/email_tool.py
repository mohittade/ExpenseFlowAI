"""
Email tool for sending expense reports.
"""
import smtplib
import os
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any

load_dotenv()

# Support both naming conventions (.env uses SMTP_HOST/SMTP_USER, legacy used SMTP_SERVER/SMTP_USERNAME)
SMTP_SERVER = os.getenv("SMTP_SERVER") or os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER", "")
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


def resolve_recipient_contacts(recipient_text: str) -> List[str]:
    """Resolve a prompt recipient to matching contact emails."""
    from src.tools.database_tool import retrieve_contacts

    text = (recipient_text or "").strip().lower()
    if not text:
        return get_finance_contacts()

    direct_emails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    if direct_emails:
        return list(dict.fromkeys(email.lower() for email in direct_emails))

    contacts = retrieve_contacts()
    matched = []
    aliases = {
        "hr": ("hr", "human resources", "people"),
        "finance": ("finance", "accounts", "accounts payable"),
    }

    for contact in contacts:
        name = str(contact.get("name") or "").lower()
        department = str(contact.get("department") or "").lower()
        role = str(contact.get("role") or "").lower()
        email = str(contact.get("email") or "").strip()

        if not email:
            continue

        for alias_group in aliases.values():
            if any(alias in text for alias in alias_group):
                if any(alias in department or alias in name or alias in role for alias in alias_group):
                    matched.append(email)
                    break
        else:
            if name and name in text:
                matched.append(email)

    if matched:
        return list(dict.fromkeys(matched))

    return get_finance_contacts()