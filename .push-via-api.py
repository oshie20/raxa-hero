#!/usr/bin/env python3
"""One-shot: upload current git tree to GitHub via Git Database API."""
import base64
import json
import subprocess
import sys
import urllib.error
import urllib.request

OWNER, REPO = "oshie20", "raxa-hero"
BRANCH = "main"


def get_token() -> str:
    proc = subprocess.run(
        ["git", "credential-osxkeychain", "get"],
        input=b"protocol=https\nhost=github.com\n\n",
        capture_output=True,
        check=True,
    )
    for line in proc.stdout.decode().splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1]
    sys.exit("No GitHub token in keychain")


def api(method, path, token, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "raxa-hero-push",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def list_files() -> list[str]:
    out = subprocess.check_output(["git", "ls-files", "-z"], text=True)
    return [p for p in out.split("\0") if p]


def blob_sha(token: str, path: str) -> str:
    raw = open(path, "rb").read()
    enc = base64.b64encode(raw).decode()
    res = api(
        "POST",
        f"/repos/{OWNER}/{REPO}/git/blobs",
        token,
        {"content": enc, "encoding": "base64"},
    )
    return res["sha"]


def build_tree(token: str, files: list[str]) -> str:
    entries: dict[str, dict] = {}
    for rel in files:
        parts = rel.split("/")
        node = entries
        for part in parts[:-1]:
            node = node.setdefault(part, {"_type": "tree", "_children": {}})["_children"]
        node[parts[-1]] = {"_type": "blob", "_path": rel}

    def walk(node: dict) -> list[dict]:
        items = []
        for name, meta in sorted(node.items()):
            if meta["_type"] == "blob":
                print(f"  blob {meta['_path']}", flush=True)
                sha = blob_sha(token, meta["_path"])
                items.append(
                    {"path": name, "mode": "100644", "type": "blob", "sha": sha}
                )
            else:
                items.append(
                    {
                        "path": name,
                        "mode": "040000",
                        "type": "tree",
                        "sha": walk(meta["_children"]),
                    }
                )
        tree = api("POST", f"/repos/{OWNER}/{REPO}/git/trees", token, {"tree": items})
        return tree["sha"]

    return walk(entries)


def main() -> None:
    token = get_token()
    files = list_files()
    print(f"Uploading {len(files)} files…", flush=True)
    tree_sha = build_tree(token, files)
    commit = api(
        "POST",
        f"/repos/{OWNER}/{REPO}/git/commits",
        token,
        {
            "message": "Initial commit: RAXA hero landing page\n\nVite + React hero section with carousel, preloader, and generated card assets.",
            "tree": tree_sha,
        },
    )
    try:
        api(
            "PATCH",
            f"/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}",
            token,
            {"sha": commit["sha"], "force": True},
        )
    except urllib.error.HTTPError as e:
        if e.code != 422:
            raise
        api(
            "POST",
            f"/repos/{OWNER}/{REPO}/git/refs",
            token,
            {"ref": f"refs/heads/{BRANCH}", "sha": commit["sha"]},
        )
    print(f"Done: https://github.com/{OWNER}/{REPO}/tree/{BRANCH}")


if __name__ == "__main__":
    main()
