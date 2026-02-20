from typing import List, Dict, Any
from langchain_core.documents import Document

SECURITY_SENSITIVE_PATTERNS = [
    "disable logging",
    "turn off logging",
    "hide activity",
    "bypass logging",
    "access host machine",
    "host shell",
    "hypervisor",
    "reset all environments",
    "delete logs",
]

HOST_ACCESS_PATTERNS = [
    "access host",
    "host machine",
    "hypervisor",
    "underlying infrastructure",
]

DESTRUCTIVE_PATTERNS = [
    "reset all",
    "wipe environments",
    "delete all labs",
]

UNAUTHORIZED_TECHNICAL_PATTERNS = [
    "/etc/hosts",
    "edit hosts file",
    "change system clock",
    "sync time manually",
]

def evaluate_guardrails(message: str, user_role: str) -> Dict[str, Any]:
    msg = message.lower()

    for pattern in SECURITY_SENSITIVE_PATTERNS:
        if pattern in msg:
            return {
                "blocked": True,
                "reason": "Security policy prevents this action.",
                "severity": "HIGH",
                "needs_escalation": True,
            }

    for pattern in HOST_ACCESS_PATTERNS:
        if pattern in msg:
            return {
                "blocked": True,
                "reason": "Host/infrastructure access is not permitted.",
                "severity": "HIGH",
                "needs_escalation": True,
            }

    if user_role.lower() in ["trainee", "instructor"]:
        for pattern in UNAUTHORIZED_TECHNICAL_PATTERNS:
            if pattern in msg:
                return {
                    "blocked": True,
                    "reason": "This action is restricted for your role.",
                    "severity": "MEDIUM",
                    "needs_escalation": False,
                }

    for pattern in DESTRUCTIVE_PATTERNS:
        if pattern in msg:
            return {
                "blocked": True,
                "reason": "Destructive system actions are restricted.",
                "severity": "CRITICAL",
                "needs_escalation": True,
            }

    return {
        "blocked": False,
        "reason": None,
        "severity": None,
        "needs_escalation": False,
    }


def validate_kb_grounding(docs: List[Document]) -> bool:
    """Ensure we retrieved something meaningful"""
    return docs is not None and len(docs) > 0
