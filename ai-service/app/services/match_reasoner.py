import logging

logger = logging.getLogger(__name__)

REASONING_PROMPT = """You are an HR assistant evaluating candidate fit.

Job requirement: {query}

Candidate profile:
- Summary: {summary}
- Top skills: {skills}
- Experience: {experience}

In 2-3 sentences, explain why this candidate is a strong match for the requirement.
Focus on specific skills and experience that align. Be concrete and professional."""


async def explain_match(
    query: str,
    profile_summary: str,
    skills: list[str],
    experience: str,
    api_key: str,
    model: str
) -> str:
    if not api_key:
        return _mock_reasoning(query, skills)

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)

        prompt = REASONING_PROMPT.format(
            query=query,
            summary=profile_summary,
            skills=", ".join(skills[:8]),
            experience=experience
        )

        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200
        )
        return response.choices[0].message.content or _mock_reasoning(query, skills)
    except Exception as e:
        logger.error("OpenAI reasoning failed: %s", e)
        return _mock_reasoning(query, skills)


def _mock_reasoning(query: str, skills: list[str]) -> str:
    skill_str = ", ".join(skills[:3]) if skills else "relevant technologies"
    return (
        f"This candidate demonstrates strong proficiency in {skill_str}, "
        f"which directly aligns with the requirement for '{query}'. "
        f"Their hands-on experience and technical depth make them a compelling match."
    )
