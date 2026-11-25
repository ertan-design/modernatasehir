"""Publish only the reviewed flight files, then connect the four existing sites."""
from pathlib import Path
import base64
import json
import subprocess
import time

ROOT = Path(__file__).resolve().parent
LIVE = 'https://www.selinahbap.com/istanbul/index.html'
FILES = ('index.html', 'ucus.css', 'ucus.js', 'ucus-film.mp4', 'referans-0.jpg')


def api(repo, route, payload=None, method=None):
    command = ['gh', 'api', 'repos/ertan-design/' + repo + '/' + route]
    if payload is not None:
        command += ['--method', method or 'POST', '--input', '-']
    result = subprocess.run(command, input=json.dumps(payload) if payload is not None else None,
                            text=True, encoding='utf-8', capture_output=True, timeout=120)
    if result.returncode:
        raise RuntimeError(result.stderr[:600])
    return json.loads(result.stdout)


def publish(repo, changes, message):
    blobs = {name: api(repo, 'git/blobs', {'encoding': 'base64',
             'content': base64.b64encode(data).decode()})['sha'] for name, data in changes.items()}
    for attempt in range(3):
        head = api(repo, 'git/ref/heads/main')['object']['sha']
        commit = api(repo, 'git/commits/' + head)
        tree = api(repo, 'git/trees', {'base_tree': commit['tree']['sha'], 'tree': [
            {'path': name, 'mode': '100644', 'type': 'blob', 'sha': sha} for name, sha in blobs.items()]})
        created = api(repo, 'git/commits', {'message': message, 'tree': tree['sha'], 'parents': [head]})
        try:
            api(repo, 'git/refs/heads/main', {'sha': created['sha'], 'force': False}, 'PATCH')
            return created['sha']
        except RuntimeError:
            if attempt == 2:
                raise
            time.sleep(1)


def connect(repo):
    # Source and parent are captured together; retry recomputes HTML to preserve peer edits.
    for attempt in range(3):
        head = api(repo, 'git/ref/heads/main')['object']['sha']
        source = api(repo, 'contents/index.html?ref=' + head)
        text = base64.b64decode(source['content']).decode('utf-8')
        if LIVE in text:
            return head
        if '</nav>' not in text:
            raise RuntimeError(repo + ': navigation not found')
        text = text.replace('</nav>', '<a href="' + LIVE + '">İstanbul’a kanat aç</a></nav>', 1)
        blob = api(repo, 'git/blobs', {'encoding': 'base64', 'content': base64.b64encode(text.encode()).decode()})
        previous = api(repo, 'git/commits/' + head)
        tree = api(repo, 'git/trees', {'base_tree': previous['tree']['sha'], 'tree': [
            {'path': 'index.html', 'mode': '100644', 'type': 'blob', 'sha': blob['sha']}]})
        commit = api(repo, 'git/commits', {'message': 'Connect the Istanbul three-rooftop experience',
                                        'tree': tree['sha'], 'parents': [head]})
        try:
            api(repo, 'git/refs/heads/main', {'sha': commit['sha'], 'force': False}, 'PATCH')
            return commit['sha']
        except RuntimeError:
            if attempt == 2:
                raise
    raise RuntimeError('Concurrent changes prevented publication')


if __name__ == '__main__':
    import sys
    if sys.argv[1:] == ['--experience']:
        changes = {'public/istanbul/' + name: (ROOT / name).read_bytes() for name in FILES}
        print('selinahbap.com', publish('selinahbap.com', changes, 'Publish original Istanbul flight and daily-life request experience'))
    elif sys.argv[1:] == ['--connect']:
        for repository in ('afair-live', 'afair-studio', 'atasehirmodern-demo', 'modernatasehir'):
            print(repository, connect(repository), flush=True)
    else:
        raise SystemExit('Use --experience or --connect after validation')
