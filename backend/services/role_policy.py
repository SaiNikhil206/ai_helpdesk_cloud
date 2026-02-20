ROLE_CONFIG = {
    "trainee": {
        "max_tier": "TIER_1",
        "style": "simple",
        "allow_technical_depth": False,
    },
    "instructor": {
        "max_tier": "TIER_1",
        "style": "guided",
        "allow_technical_depth": False,
    },
    "operator": {
        "max_tier": "TIER_2",
        "style": "technical",
        "allow_technical_depth": True,
    },
    "support engineer": {
        "max_tier": "TIER_3",
        "style": "expert",
        "allow_technical_depth": True,
    },
    "admin": {
        "max_tier": "TIER_3",
        "style": "expert",
        "allow_technical_depth": True,
    },
}

def apply_role_constraints(role: str, tier: str) -> str:
    role_key = role.lower()
    config = ROLE_CONFIG.get(role_key)

    if not config:
        return tier

    max_tier = config["max_tier"]
    tier_order = ["TIER_0", "TIER_1", "TIER_2", "TIER_3"]

    if tier_order.index(tier) > tier_order.index(max_tier):
        return max_tier

    return tier

def adjust_answer_for_role(answer: str, role: str) -> str:
    role = role.lower()

    if role == "trainee":
        return f"Here's what you can try:\n{answer}"

    if role == "instructor":
        return f"I'll guide you through this:\n{answer}"

    return answer


def role_guardrail_message(role: str) -> str:
    role = role.lower()

    if role == "trainee":
        return "I'm unable to help with that request due to platform safety policies."

    if role == "instructor":
        return "That request is restricted under CyberLab safety rules."

    if role == "operator":
        return "That action is restricted by CyberLab security controls."

    return "This request is blocked by platform security policy."
