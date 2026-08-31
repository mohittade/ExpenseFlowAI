"""
PDF tool for generating expense reports.
"""
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import os


def generate_expense_report(
    expenses: List[Dict[str, Any]],
    summary: Dict[str, Any],
    policy_violations: List[Dict[str, Any]],
    missing_data: List[Dict[str, Any]],
    employee_name: str = "Employee",
    output_path: str = "expense_report.pdf"
) -> str:
    """Generate a PDF expense report."""
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=1*inch,
        bottomMargin=1*inch
    )

    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=6,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1a3c5e')
    )
    story.append(Paragraph("Travel Expense Report", title_style))
    story.append(Spacer(1, 6))

    # Subtitle with date range
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#4a4a4a')
    )
    date_range = summary.get("date_range", {})
    date_str = f"{date_range.get('start', 'N/A')} to {date_range.get('end', 'N/A')}"
    story.append(Paragraph(f"Period: {date_str}", subtitle_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
    story.append(Paragraph(f"Employee: {employee_name}", subtitle_style))
    story.append(Spacer(1, 20))

    # Summary section
    story.append(Paragraph("Expense Summary", styles['Heading2']))
    story.append(Spacer(1, 10))

    summary_data = [
        ["Metric", "Value"],
        ["Total Expenses", f"${summary.get('grand_total', 0):,.2f}"],
        ["Number of Transactions", str(summary.get('expense_count', 0))],
        ["Date Range", f"{date_range.get('start', 'N/A')} - {date_range.get('end', 'N/A')}"],
    ]

    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a3c5e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0f4f8')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d0d8e0')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))

    # Category breakdown
    story.append(Paragraph("Expenses by Category", styles['Heading2']))
    story.append(Spacer(1, 10))

    breakdown = summary.get("breakdown", [])
    if breakdown:
        cat_data = [["Category", "Count", "Total", "% of Total"]]
        for item in breakdown:
            cat_data.append([
                item["category"],
                str(item["count"]),
                f"${item['total']:,.2f}",
                f"{item['percentage']:.1f}%"
            ])
        # Add total row
        cat_data.append(["TOTAL", str(summary.get('expense_count', 0)), f"${summary.get('grand_total', 0):,.2f}", "100.0%"])

        cat_table = Table(cat_data, colWidths=[2.5*inch, 1*inch, 1.5*inch, 1.5*inch])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a3c5e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -2), colors.HexColor('#f0f4f8')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8eef5')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d0d8e0')),
        ]))
        story.append(cat_table)
    else:
        story.append(Paragraph("No categorized expenses found.", styles['Normal']))

    story.append(Spacer(1, 20))

    # Detailed expenses
    story.append(Paragraph("Detailed Expenses", styles['Heading2']))
    story.append(Spacer(1, 10))

    if expenses:
        exp_data = [["Date", "Merchant", "Category", "Amount", "Description"]]
        for exp in expenses:
            exp_data.append([
                exp.get("date", ""),
                exp.get("merchant", "")[:30],
                exp.get("category") or "Uncategorized",
                f"${exp.get('amount', 0):,.2f}",
                (exp.get("description", "") or "")[:40]
            ])

        exp_table = Table(exp_data, colWidths=[1*inch, 1.5*inch, 1.2*inch, 1*inch, 2*inch])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a3c5e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fafbfc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d0d8e0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f7fa')]),
        ]))
        story.append(exp_table)
    else:
        story.append(Paragraph("No expenses found for this period.", styles['Normal']))

    story.append(Spacer(1, 20))

    # Policy violations
    story.append(Paragraph("Policy Violations", styles['Heading2']))
    story.append(Spacer(1, 10))

    if policy_violations:
        viol_data = [["Date", "Merchant", "Category", "Amount", "Limit", "Excess"]]
        for v in policy_violations:
            viol_data.append([
                v.get("date", ""),
                v.get("merchant", "")[:25],
                v.get("category", ""),
                f"${v.get('amount', 0):,.2f}",
                f"${v.get('limit', 0):,.2f}",
                f"${v.get('excess', 0):,.2f}"
            ])

        viol_table = Table(viol_data, colWidths=[1*inch, 1.5*inch, 1.2*inch, 1*inch, 1*inch, 1*inch])
        viol_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#c0392b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fdf2f2')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e8b4b4')),
        ]))
        story.append(viol_table)
    else:
        story.append(Paragraph("No policy violations detected.", styles['Normal']))

    story.append(Spacer(1, 20))

    # Missing data
    story.append(Paragraph("Missing Data / Exceptions", styles['Heading2']))
    story.append(Spacer(1, 10))

    if missing_data:
        miss_data = [["Date", "Merchant", "Issue", "Details"]]
        for m in missing_data:
            miss_data.append([
                m.get("date", ""),
                m.get("merchant", "")[:25],
                m.get("issue", ""),
                m.get("details", "")[:50]
            ])

        miss_table = Table(miss_data, colWidths=[1*inch, 1.5*inch, 1.5*inch, 2.5*inch])
        miss_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f39c12')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fef9e7')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f5d08c')),
        ]))
        story.append(miss_table)
    else:
        story.append(Paragraph("No missing data or exceptions.", styles['Normal']))

    # Footer
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#888888')
    )
    story.append(Paragraph("Generated by ExpenseFlow AI - Autonomous Expense Reporting System", footer_style))

    doc.build(story)
    return output_path