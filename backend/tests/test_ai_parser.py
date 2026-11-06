import unittest
from datetime import datetime
from zoneinfo import ZoneInfo

from backend.ai_parser import parse_query


class NaturalLanguageParserTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 5, 9, 0, tzinfo=ZoneInfo("Asia/Kolkata"))

    def test_extracts_capacity_time_purpose_and_tomorrow(self):
        result = parse_query(
            "Find a classroom for 80 students tomorrow between 11 AM and 12 PM for an extra class",
            self.now,
        )
        self.assertEqual(result["capacity"], 80)
        self.assertEqual(result["purpose"], "extra_class")
        self.assertEqual(result["start_time"].isoformat(), "2026-11-06T11:00:00+05:30")
        self.assertEqual(result["end_time"].isoformat(), "2026-11-06T12:00:00+05:30")
        self.assertEqual(result["needs_clarification"], [])

    def test_parses_deeksha_lab_and_pm_range(self):
        result = parse_query("Find a lab for 35 students at Deeksha today from 1 PM to 3 PM", self.now)
        self.assertEqual(result["building_code"], "DEEKSHA")
        self.assertEqual(result["room_type"], "laboratory")
        self.assertEqual(result["purpose"], "practical")
        self.assertEqual(result["start_time"].hour, 13)
        self.assertEqual(result["end_time"].hour, 15)

    def test_does_not_invent_missing_capacity_or_ambiguous_time(self):
        result = parse_query("Find a classroom from 1 to 2 for an extra class", self.now)
        self.assertIsNone(result["capacity"])
        self.assertIn("capacity", result["needs_clarification"])
        self.assertIn("time_period", result["needs_clarification"])


if __name__ == "__main__":
    unittest.main()