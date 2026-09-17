"""Service layer for fetching stock data and generating analysis.

The functions are deliberately async‑compatible: heavy I/O (yfinance download
and matplotlib rendering) is delegated to a thread‑pool via
``asyncio.to_thread`` so FastAPI can keep its event‑loop responsive.
"""

import io
import os
import asyncio
from pathlib import Path
from typing import Dict, Tuple

import yfinance as yf
import matplotlib

# Use a non‑interactive backend suitable for headless environments
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from .config import STATIC_DIR

async def fetch_data(ticker: str, period: str = "6mo") -> yf.Ticker:
    """Download historical data for *ticker* over *period*.

    Returns the ``yfinance.Ticker`` object (which holds a ``pandas.DataFrame``
    at ``ticker.history``).  The operation runs in a thread pool because
    ``yfinance`` performs blocking network I/O.
    """
    # ``yf.Ticker`` itself is lightweight; the heavy work is in ``history``
    def _download():
        return yf.download([ticker], period=period)

    data = await asyncio.to_thread(_download)
    return data

async def analyze(data) -> Dict[str, float]:
    """Compute basic statistics from the dataframe.

    Expects a ``pandas.DataFrame`` with at least ``Close`` column.
    Returns a dict with ``max``, ``min``, ``mean`` and ``current`` (latest
    closing price).
    """
    # Guard against empty data
    if data.empty:
        raise ValueError("No price data returned for the given ticker/period.")

    close_series = data["Close"]
    result = {
        "max": round(close_series.max(), 2),
        "min": round(close_series.min(), 2),
        "mean": round(close_series.mean(), 2),
        "current": round(close_series.iloc[-1], 2),
    }
    return result

async def generate_chart(data, column: str, ticker: str) -> str:
    """Create a PNG chart for *column* (e.g. ``"Close"``) and save it.

    The image is saved under ``STATIC_DIR`` with a name that includes the
    ticker and the column, e.g. ``close_AAPL.png``.  The function returns the
    absolute file path as a string.
    """
    if column not in data.columns:
        raise ValueError(f"Column '{column}' not present in the data.")

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(data.index, data[column], label=column)
    ax.set_title(f"{ticker} – {column} price (last 6 months)")
    ax.set_xlabel("Date")
    ax.set_ylabel("Price (USD)")
    ax.grid(True)
    ax.legend()

    filename = f"{column.lower()}_{ticker.upper()}.png"
    filepath = STATIC_DIR / filename
    # Save to PNG
    await asyncio.to_thread(fig.savefig, filepath, format="png", bbox_inches="tight")
    plt.close(fig)
    return str(filepath)

async def prepare_analysis(ticker: str, period: str = "6mo") -> Tuple[Dict[str, float], str, str]:
    """Convenience wrapper returning analysis dict and two chart paths.

    Returns ``(stats, close_chart_path, high_chart_path)``.
    """
    data = await fetch_data(ticker, period)
    stats = await analyze(data)
    close_path = await generate_chart(data, "Close", ticker)
    # Some tickers may not have a High column (e.g., missing data). Guard.
    high_path = ""
    if "High" in data.columns:
        high_path = await generate_chart(data, "High", ticker)
    return stats, close_path, high_path

# Helper to encode a file to base64 (used for API response)
import base64

def file_to_base64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")
