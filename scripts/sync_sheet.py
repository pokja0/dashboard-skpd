# -*- coding: utf-8 -*-
"""Sinkronkan Google Sheet publik ke CSV lokal lalu bangun ulang rekap.json.

Contoh:
    python scripts/sync_sheet.py
    python scripts/sync_sheet.py --watch --interval 300

URL dapat diganti lewat environment variable SHEET_CSV_URL.
"""
import argparse
import hashlib
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = Path(os.environ.get('REKAP_CSV', ROOT / 'data' / 'rekap-tim-staf-sekda.csv'))
DEFAULT_URL = (
    'https://docs.google.com/spreadsheets/d/'
    '1Ryi-NH8Bb1PB3E0ejlTvf3_YDNzsOb7WL0mY8cSpCvo/export?format=csv&gid=874698858'
)
SHEET_URL = os.environ.get('SHEET_CSV_URL', DEFAULT_URL)


def fetch_csv(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (compatible; DashboardSulbar/1.0)',
            'Accept': 'text/csv,*/*',
        },
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        data = response.read()
    head = data[:300].lstrip().lower()
    if head.startswith(b'<!doctype') or b'<html' in head:
        raise RuntimeError(
            'Sheet mengembalikan HTML, bukan CSV. Pastikan sheet dapat diakses publik '
            'atau gunakan URL export CSV yang benar.'
        )
    return data


def normalise_csv(value: bytes) -> bytes:
    return value if value.endswith(b'\n') else value + b'\n'


def hash_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def rebuild() -> None:
    subprocess.run(
        [sys.executable, str(ROOT / 'scripts' / 'build_data.py')],
        cwd=ROOT,
        check=True,
    )


def sync_once() -> bool:
    data = normalise_csv(fetch_csv(SHEET_URL))
    current = normalise_csv(CSV_PATH.read_bytes()) if CSV_PATH.exists() else b''
    if hash_bytes(data) == hash_bytes(current):
        print('Tidak ada perubahan pada Google Sheet.')
        return False

    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary = CSV_PATH.with_suffix('.csv.tmp')
    temporary.write_bytes(data)
    temporary.replace(CSV_PATH)

    print(f'CSV diperbarui: {CSV_PATH}')
    rebuild()
    print('rekap.json diperbarui. Muat ulang halaman untuk melihat data terbaru.')
    return True


def main() -> int:
    global SHEET_URL
    parser = argparse.ArgumentParser(description='Sinkronkan Google Sheet ke dashboard.')
    parser.add_argument('--watch', action='store_true', help='Pantau sheet secara berkala.')
    parser.add_argument('--interval', type=int, default=300, help='Interval pantau dalam detik.')
    parser.add_argument('--url', default=SHEET_URL, help='URL CSV Google Sheet.')
    args = parser.parse_args()

    SHEET_URL = args.url

    if not args.watch:
        try:
            sync_once()
            return 0
        except Exception as error:
            print(f'Gagal sinkronisasi: {error}', file=sys.stderr)
            return 1

    print(f'Memantau sheet setiap {args.interval} detik. Tekan Ctrl+C untuk berhenti.')
    while True:
        try:
            sync_once()
        except KeyboardInterrupt:
            print('\nDihentikan.')
            return 0
        except Exception as error:
            print(f'Gagal sinkronisasi: {error}', file=sys.stderr)
        try:
            time.sleep(max(5, args.interval))
        except KeyboardInterrupt:
            print('\nDihentikan.')
            return 0


if __name__ == '__main__':
    raise SystemExit(main())
