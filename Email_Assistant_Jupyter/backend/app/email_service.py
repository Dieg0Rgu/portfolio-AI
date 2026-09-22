"""Email sending service using SMTP (SSL/TLS) via aiosmtplib.

Supports inline images (MIME multipart/related with Content-ID) so charts
render cleanly inside email clients.
"""

import os
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import aiosmtplib

from .config import settings


async def send_email(
    recipient: str,
    subject: str,
    html_body: str,
    inline_images: Optional[List[Tuple[str, bytes, str]]] = None,
    attachments: Optional[List[Tuple[str, bytes, str]]] = None,
) -> None:
    """Send an HTML email with optional inline images (CID) and attachments.

    inline_images: list of (cid, raw_bytes, mime_type)
    attachments: list of (filename, raw_bytes, mime_type)
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASS:
        raise RuntimeError(
            "Configuración SMTP incompleta. Verifica SMTP_HOST, SMTP_USER y SMTP_PASS en el archivo .env."
        )

    msg = EmailMessage()
    sender_name = settings.SMTP_SENDER_NAME or "Email Assistant"
    msg["From"] = formataddr((sender_name, settings.SMTP_USER))
    msg["To"] = recipient
    msg["Subject"] = subject

    # Set HTML content
    msg.set_content(html_body, subtype="html")

    # Add inline images for <img src="cid:...">
    if inline_images:
        for cid, data, mime_type in inline_images:
            maintype, subtype = mime_type.split("/", 1)
            msg.add_related(
                data,
                maintype=maintype,
                subtype=subtype,
                cid=f"<{cid}>",
                filename=f"{cid}.png",
            )

    # Add general file attachments
    if attachments:
        for filename, data, mime_type in attachments:
            maintype, subtype = mime_type.split("/", 1)
            msg.add_attachment(
                data,
                maintype=maintype,
                subtype=subtype,
                filename=filename,
            )

    # Dispatch email using aiosmtplib
    use_tls = settings.SMTP_PORT == 465
    start_tls = settings.SMTP_PORT == 587

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASS,
        start_tls=start_tls,
        use_tls=use_tls,
    )


async def send_analysis_email(
    recipient: str,
    ticker: str,
    period: str,
    stats: Dict[str, float],
    close_chart_path: str,
    high_chart_path: Optional[str] = None,
) -> None:
    """Compose and send the stock analysis email with embedded charts."""
    inline_images: List[Tuple[str, bytes, str]] = []

    # Read close chart
    if close_chart_path and Path(close_chart_path).is_file():
        with open(close_chart_path, "rb") as f:
            inline_images.append(("close_chart", f.read(), "image/png"))

    high_chart_section = ""
    if high_chart_path and Path(high_chart_path).is_file():
        with open(high_chart_path, "rb") as f:
            inline_images.append(("high_chart", f.read(), "image/png"))
        high_chart_section = """
        <h3 style="color: #2c3e50; margin-top: 25px;">Gráfica de Precios Máximos (High)</h3>
        <p><img src="cid:high_chart" alt="High Chart" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);"/></p>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
          <h2 style="color: #1a73e8; margin-top: 0;">Análisis Financiero: {ticker.upper()}</h2>
          <p style="color: #666; font-size: 14px;">Periodo analizado: <strong>{period}</strong></p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f1f3f4;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Métrica</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Valor (USD)</th>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Precio Actual</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; color: #2e7d32;">${stats['current']}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Precio Máximo</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${stats['max']}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Precio Mínimo</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${stats['min']}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Precio Promedio</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">${stats['mean']}</td>
            </tr>
          </table>

          <h3 style="color: #2c3e50; margin-top: 25px;">Gráfica de Cierre (Close)</h3>
          <p><img src="cid:close_chart" alt="Close Chart" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);"/></p>

          {high_chart_section}

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 15px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">Generado automáticamente por el Asistente de Inversiones</p>
        </div>
      </body>
    </html>
    """
    subject = f"Análisis de acciones {ticker.upper()} – Últimos {period}"
    await send_email(recipient, subject, html, inline_images=inline_images)
