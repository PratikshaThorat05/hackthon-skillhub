import re
import logging
import asyncio
import httpx
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=4)

GITHUB_API = "https://api.github.com"


def _fetch_sync(username: str, token: str | None) -> str:
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    with httpx.Client(headers=headers, timeout=15) as client:
        # 1. User profile
        user_resp = client.get(f"{GITHUB_API}/users/{username}")
        if user_resp.status_code == 404:
            raise ValueError(f"GitHub user '{username}' not found. Check the username and try again.")
        if user_resp.status_code == 403:
            raise ValueError("GitHub API rate limit exceeded. Add a GITHUB_TOKEN to .env to increase the limit.")
        user_resp.raise_for_status()
        user = user_resp.json()

        # 2. Public repos sorted by recently updated
        repos_resp = client.get(f"{GITHUB_API}/users/{username}/repos", params={"sort": "updated", "per_page": 30, "type": "owner"})
        repos_resp.raise_for_status()
        repos = [r for r in repos_resp.json() if not r.get("fork")]  # exclude forks

        # 3. Languages for top 15 repos
        lang_counts: dict[str, int] = {}
        for repo in repos[:15]:
            lang_resp = client.get(f"{GITHUB_API}/repos/{username}/{repo['name']}/languages")
            if lang_resp.status_code == 200:
                for lang, bytes_count in lang_resp.json().items():
                    lang_counts[lang] = lang_counts.get(lang, 0) + bytes_count

        # 4. Recent commit messages from top 5 active repos
        commit_samples: list[str] = []
        for repo in repos[:5]:
            commits_resp = client.get(f"{GITHUB_API}/repos/{username}/{repo['name']}/commits", params={"per_page": 5, "author": username})
            if commits_resp.status_code == 200:
                for c in commits_resp.json():
                    msg = c.get("commit", {}).get("message", "").split("\n")[0].strip()
                    if msg:
                        commit_samples.append(f"{repo['name']}: {msg}")

    return _format_github_data(user, repos, lang_counts, commit_samples)


def _format_github_data(user: dict, repos: list, lang_counts: dict, commits: list[str]) -> str:
    parts: list[str] = []

    name = user.get("name") or user.get("login", "")
    if name:
        parts.append(f"Name: {name}")
    parts.append(f"GitHub Username: {user.get('login', '')}")
    if user.get("bio"):
        parts.append(f"Bio: {user['bio']}")
    if user.get("company"):
        parts.append(f"Company: {user['company']}")
    if user.get("location"):
        parts.append(f"Location: {user['location']}")
    if user.get("blog"):
        parts.append(f"Website: {user['blog']}")
    parts.append(f"Public Repos: {user.get('public_repos', 0)}")

    # Languages ranked by total bytes
    if lang_counts:
        sorted_langs = sorted(lang_counts.items(), key=lambda x: x[1], reverse=True)
        top_langs = [l for l, _ in sorted_langs[:15]]
        parts.append(f"\nPrimary Programming Languages: {', '.join(top_langs)}")

    # Repos
    if repos:
        parts.append("\nPublic Repositories (most recent):")
        for repo in repos[:20]:
            line = f"  - {repo['name']}"
            if repo.get("description"):
                line += f": {repo['description']}"
            topics = repo.get("topics", [])
            if topics:
                line += f" [Topics: {', '.join(topics[:8])}]"
            if repo.get("language"):
                line += f" [{repo['language']}]"
            stars = repo.get("stargazers_count", 0)
            if stars > 0:
                line += f" ★{stars}"
            parts.append(line)

    # Commit samples
    if commits:
        parts.append("\nRecent Commit Activity:")
        for c in commits[:15]:
            parts.append(f"  - {c}")

    # Aggregate topics across all repos
    all_topics: set[str] = set()
    for repo in repos:
        all_topics.update(repo.get("topics", []))
    if all_topics:
        parts.append(f"\nTechnologies & Topics: {', '.join(sorted(all_topics))}")

    if not parts:
        raise ValueError("No data found for this GitHub user.")

    return "\n".join(parts)


async def fetch_github_text(url_or_username: str, token: str | None = None) -> str:
    """Accept either a full GitHub URL or bare username."""
    url_or_username = url_or_username.strip().rstrip("/")
    match = re.search(r'github\.com/([^/?#\s]+)', url_or_username)
    username = match.group(1) if match else url_or_username

    if not re.match(r'^[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,37}[a-zA-Z0-9])?$', username):
        raise ValueError(f"Invalid GitHub username: '{username}'")

    logger.info("Fetching GitHub profile for: %s", username)
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(_executor, lambda: _fetch_sync(username, token))
    except ValueError:
        raise
    except httpx.HTTPStatusError as ex:
        raise ValueError(f"GitHub API error: {ex.response.status_code}")
    except Exception as ex:
        raise ValueError(f"Could not fetch GitHub profile: {ex}")
