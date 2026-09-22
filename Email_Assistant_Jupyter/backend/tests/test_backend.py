"""Unit tests covering data analysis, models validation and utilities."""

import asyncio
import tempfile
from pathlib import Path
import unittest

import pandas as pd
from pydantic import ValidationError

from backend.app.config import settings, STATIC_DIR
from backend.app.models import AnalysisRequest, AnalysisResponse, EmailRequest
from backend.app.stock_service import analyze, file_to_base64


class TestStockService(unittest.TestCase):
    """Test suite for stock calculation and helpers."""

    def test_analyze_valid_dataframe(self):
        df = pd.DataFrame({
            "Close": [100.0, 150.0, 50.0, 120.0],
            "High": [105.0, 155.0, 55.0, 125.0]
        })
        res = asyncio.run(analyze(df))
        self.assertEqual(res["max"], 150.0)
        self.assertEqual(res["min"], 50.0)
        self.assertEqual(res["mean"], 105.0)
        self.assertEqual(res["current"], 120.0)

    def test_analyze_missing_close_column(self):
        df = pd.DataFrame({"Open": [10.0, 20.0]})
        with self.assertRaises(ValueError):
            asyncio.run(analyze(df))

    def test_analyze_empty_dataframe(self):
        df = pd.DataFrame({"Close": []})
        with self.assertRaises(ValueError):
            asyncio.run(analyze(df))

    def test_file_to_base64_none_or_missing(self):
        self.assertIsNone(file_to_base64(None))
        self.assertIsNone(file_to_base64("/path/to/nonexistent/file.png"))

    def test_file_to_base64_valid_file(self):
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
            tmp.write(b"Hello World")
            tmp_path = tmp.name

        try:
            b64_str = file_to_base64(tmp_path)
            self.assertIsNotNone(b64_str)
            self.assertEqual(b64_str, "SGVsbG8gV29ybGQ=")
        finally:
            Path(tmp_path).unlink(missing_ok=True)


class TestModelsValidation(unittest.TestCase):
    """Test suite for Pydantic models."""

    def test_analysis_request_defaults(self):
        req = AnalysisRequest(ticker="msft")
        self.assertEqual(req.ticker, "msft")
        self.assertEqual(req.period, "6mo")
        self.assertTrue(req.include_charts)

    def test_email_request_valid(self):
        req = EmailRequest(
            ticker="aapl",
            period="1mo",
            recipient="test@example.com"
        )
        self.assertEqual(req.recipient, "test@example.com")
        self.assertEqual(req.period, "1mo")

    def test_email_request_invalid_email(self):
        with self.assertRaises(ValidationError):
            EmailRequest(
                ticker="aapl",
                recipient="not-an-email"
            )

    def test_analysis_response_schema(self):
        res = AnalysisResponse(
            ticker="AAPL",
            period="6mo",
            max=200.0,
            min=150.0,
            mean=175.0,
            current=190.0,
        )
        self.assertEqual(res.ticker, "AAPL")
        self.assertEqual(res.current, 190.0)
        self.assertIsNone(res.close_chart_base64)


class TestConfig(unittest.TestCase):
    """Test suite for configuration settings."""

    def test_static_dir_exists(self):
        self.assertTrue(STATIC_DIR.exists())
        self.assertTrue(STATIC_DIR.is_dir())

    def test_api_key_loaded(self):
        self.assertTrue(len(settings.API_KEY) > 0)


if __name__ == "__main__":
    unittest.main()
