from typing import Tuple
from app.models.db import Tier, Severity, UserRole


class TierService:

    TIER_0_KEYWORDS = [
        "password reset",
        "forgot password",
        "documentation",
        "how to",
        "where is",
        "guide",
        "help me understand",
    ]

    TIER_1_KEYWORDS = [
        "lab access",
        "can't access",
        "cannot access",
        "login issue",
        "login problem",
        "permission denied",
        "timeout",
        "slow",
        "not loading",
    ]

    TIER_2_KEYWORDS = [
        "authentication loop",
        "redirect",
        "keeps logging out",
        "wrong environment",
        "wrong toolset",
        "configuration issue",
        "container",
        "init failed",
        "startup failed",
    ]

    TIER_3_KEYWORDS = [
        "vm crash",
        "vm froze",
        "kernel panic",
        "data loss",
        "lost work",
        "system down",
        "infrastructure",
    ]

    CRITICAL_KEYWORDS = [
        "data loss",
        "lost work",
        "system down",
        "platform down",
        "can't work",
        "completely blocked",
        "critical",
        "emergency",
    ]

    HIGH_KEYWORDS = [
        "kernel panic",
        "vm crash",
        "container failure",
        "startup failed",
        "security breach",
        "unauthorized access",
        "compromised",
    ]

    MEDIUM_KEYWORDS = [
        "slow",
        "timeout",
        "error",
        "issue",
        "problem",
        "not working",
        "login loop",
        "redirect",
        "keeps logging out",
        "stuck",
        "frozen",
    ]

    def classify_tier_and_severity(
        self,
        message: str,
        user_role: UserRole,
        context: dict,
        kb_coverage: bool = True,
        repeated_failure: bool = False,
        need_escalation: bool = False,
    ) -> Tuple[Tier, Severity, bool]:

        message_lower = message.lower()

        severity = self._classify_severity(message_lower)

        tier = self._classify_tier(
            message_lower,
            severity,
            kb_coverage,
            repeated_failure,
            need_escalation,
        )

        needs_escalation = self._needs_escalation(
            tier,
            severity,
            repeated_failure,
            kb_coverage,
            need_escalation,
        )

        return tier, severity, needs_escalation

    def _classify_severity(self, message_lower: str) -> Severity:

        if any(keyword in message_lower for keyword in self.CRITICAL_KEYWORDS):
            return Severity.CRITICAL

        if any(keyword in message_lower for keyword in self.HIGH_KEYWORDS):
            return Severity.HIGH

        if any(keyword in message_lower for keyword in self.MEDIUM_KEYWORDS):
            return Severity.MEDIUM

        return Severity.LOW

    def _classify_tier(
        self,
        message_lower: str,
        severity: Severity,
        kb_coverage: bool,
        repeated_failure: bool,
        need_escalation: bool,
    ) -> Tier:

        if severity == Severity.CRITICAL:
            return Tier.TIER_2

        if repeated_failure:
            return Tier.TIER_2

        if need_escalation:
            return Tier.TIER_2

        if not kb_coverage:
            return Tier.TIER_2

        if any(k in message_lower for k in self.TIER_3_KEYWORDS):
            return Tier.TIER_3

        if any(k in message_lower for k in self.TIER_2_KEYWORDS):
            return Tier.TIER_2

        if any(k in message_lower for k in self.TIER_1_KEYWORDS):
            return Tier.TIER_1

        if any(k in message_lower for k in self.TIER_0_KEYWORDS):
            return Tier.TIER_0

        return Tier.TIER_1

    def _needs_escalation(
        self,
        tier: Tier,
        severity: Severity,
        repeated_failure: bool,
        kb_coverage: bool,
        need_escalation: bool,
    ) -> bool:

        if severity == Severity.CRITICAL:
            return True

        if tier == Tier.TIER_3:
            return True

        if repeated_failure:
            return True

        if need_escalation:
            return True

        if not kb_coverage and severity in [Severity.HIGH, Severity.MEDIUM]:
            return True

        return False