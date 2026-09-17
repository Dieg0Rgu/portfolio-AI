"""Email sending service using SMTP (SSL).

The implementation relies on the built‑in ``smtplib`` for simplicity, but
exposes an async interface via ``asyncio.to_thread`` so that the FastAPI
handlers stay non‑blocking.
"""

import asyncio
import os
import ssl
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path
from typing import List, Tuple

import aiosmtplib

from .config import settings

async def send_email(
    recipient: str,
    subject: str,
    html_body: str,
    attachments: List[Tuple[str, bytes, str]] = None,
) -> None:
    """Send an HTML email with optional attachments.

    Parameters
    ----------
    recipient: str
        Destination e‑mail address.
    subject: str
        Subject line.
    html_body: str
        Full HTML content of the e‑mail.
    attachments: list of (filename, raw_bytes, mime_type)
        Each attachment will be added using ``add_attachment``.
    """
    msg = EmailMessage()
    sender_name = settings.SMTP_SENDER_NAME or settings.SMTP_USER
    msg["From"] = formataddr((sender_name, settings.SMTP_USER))
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.set_content(html_body, subtype="html")

    if attachments:
        for filename, data, mime_type in attachments:
            maintype, subtype = mime_type.split("/", 1)
            msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)

    # Use aiosmtplib which is async‑compatible
    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASS,
        start_tls=False,
        use_ssl=True,
    )

# Convenience wrapper that builds the HTML and attaches chart images
async def send_analysis_email(
    recipient: str,
    ticker: str,
    period: str,
    stats: dict,
    close_chart_path: str,
    high_chart_path: str = "",
) -> None:
    """Compose and send the analysis e‑mail.

    ``stats`` must contain ``max``, ``min``, ``mean`` and ``current``.
    The two chart images are attached inline (CID) and referenced in the HTML.
    """
    # Read images as bytes for attachment
    attachments = []
    cid_close = "close_chart"
    with open(close_chart_path, "rb") as f:
        attachments.append((os.path.basename(close_chart_path), f.read(), "image/png"))
    # We'll reference the first attachment via its content‑id
    html = f"""
    <html>
      <body>
        <p>Hola,</p>
        <p>Este es el análisis de la acción <strong>{ticker.upper()}</strong> para los últimos {period}.</p>
        <ul>
          <li>Precio máximo: <strong>${stats['max']}</strong></li>
          <li>Precio mínimo: <strong>${stats['min']}</strong></li>
          <li>Precio medio: <strong>${stats['mean']}</strong></li>
          <li>Precio actual: <strong>${stats['current']}</strong></li>
        </ul>
        <p>Gráfica de cierre:</p>
        <img src="cid:{cid_close}" alt="Close chart" style="max-width:100%;height:auto;"/>
    """
    if high_chart_path:
        cid_high = "high_chart"
        with open(high_chart_path, "rb") as f:
            attachments.append((os.path.basename(high_chart_path), f.read(), "image/png"))
        html += f"""
        <p>Gráfica de máximo diario (High):</p>
        <img src=\"cid:{cid_high}\" alt=\"High chart\" style=\"max-width:100%;height:auto;\"/>
        """
    html += """
        <p>Saludos,<br/>Asistente de Emails Automatizados</p>
      </body>
    </html>
    """
    subject = f"Análisis de acciones {ticker.upper()} – últimos {period}"
    await send_email(recipient, subject, html, attachments)
