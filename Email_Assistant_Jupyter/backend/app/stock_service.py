"""Service layer for fetching stock data and generating analysis and charts.

I/O operations (yfinance downloading, matplotlib plotting, and file reading)
are offloaded to a thread pool via asyncio.to_thread to keep FastAPI's event loop non-blocking.
"""

import asyncio
import base64
from pathlib import Path
from typing import Dict, Optional, Tuple

import os
os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import yfinance as yf

from .config import STATIC_DIR


async def fetch_data(ticker: str, period: str = "6mo") -> pd.DataFrame:
    """Download historical stock data using yfinance in a worker thread."""
    def _download():
        t = yf.Ticker(ticker.strip().upper())
        df = t.history(period=period)
        return df

    data = await asyncio.to_thread(_download)
    if data is None or data.empty:
        raise ValueError(f"No se encontraron datos para la acción '{ticker}' con periodo '{period}'.")
    return data


async def analyze(data: pd.DataFrame) -> Dict[str, float]:
    """Compute summary statistics (max, min, mean, current) from price data."""
    if "Close" not in data.columns or data["Close"].dropna().empty:
        raise ValueError("El conjunto de datos no contiene una columna 'Close' válida.")

    close_series = data["Close"].dropna()
    result = {
        "max": float(round(close_series.max(), 2)),
        "min": float(round(close_series.min(), 2)),
        "mean": float(round(close_series.mean(), 2)),
        "current": float(round(close_series.iloc[-1], 2)),
    }
    return result


async def generate_chart(data: pd.DataFrame, column: str, ticker: str) -> str:
    """Generate a PNG chart for the specified column and save it under STATIC_DIR."""
    if column not in data.columns:
        raise ValueError(f"La columna '{column}' no está presente en los datos.")

    ticker_upper = ticker.strip().upper()
    filename = f"{column.lower()}_{ticker_upper}.png"
    filepath = STATIC_DIR / filename

    def _plot_and_save():
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.plot(data.index, data[column], label=f"{column} Price", color="#1f77b4", linewidth=1.8)
        ax.set_title(f"{ticker_upper} – {column} ({len(data)} periodos)", fontsize=12, fontweight="bold")
        ax.set_xlabel("Fecha")
        ax.set_ylabel("Precio (USD)")
        ax.grid(True, linestyle="--", alpha=0.6)
        ax.legend()
        fig.tight_layout()
        fig.savefig(filepath, format="png", dpi=100)
        plt.close(fig)

    await asyncio.to_thread(_plot_and_save)
    return str(filepath)


async def prepare_analysis(ticker: str, period: str = "6mo") -> Tuple[Dict[str, float], str, Optional[str]]:
    """Fetch data, compute statistics, and render chart images."""
    clean_ticker = ticker.strip().upper()
    data = await fetch_data(clean_ticker, period)
    stats = await analyze(data)

    close_path = await generate_chart(data, "Close", clean_ticker)
    high_path = None
    if "High" in data.columns and not data["High"].dropna().empty:
        high_path = await generate_chart(data, "High", clean_ticker)

    return stats, close_path, high_path


def file_to_base64(path: Optional[str]) -> Optional[str]:
    """Convert an image file to a base64 encoded string."""
    if not path or not Path(path).is_file():
        return None
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")
