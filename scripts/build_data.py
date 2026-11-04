# -*- coding: utf-8 -*-
"""Build the dashboard dataset from the Rekap Tim Staf Sekda CSV.

Usage:
    python scripts/build_data.py [source.csv] [output.json]

Default source : data/rekap-tim-staf-sekda.csv
Default output : src/lib/data/rekap.json

The source may be a plain CSV export or a text dump that contains the CSV
after some metadata. Only the standard library is used.
"""
import csv, difflib, io, json, os, re, sys, unicodedata
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(os.environ.get('REKAP_CSV', ROOT / 'data' / 'rekap-tim-staf-sekda.csv'))
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'src' / 'lib' / 'data' / 'rekap.json'

UNITS = [
    ("bpkad", "BPKAD", "Badan Pengelola Keuangan dan Aset Daerah", "MOHAMMAD ALI CHANDRA, SE, M.Si", "Badan"),
    ("biro-hukum", "Biro Hukum", "Biro Hukum Sekretariat Daerah", "SUHENDRA, S.H., CFrA.", "Sekretariat Daerah"),
    ("kominfo", "Kominfo", "Dinas Komunikasi, Informatika, Statistik dan Persandian", "MUHAMMAD RIDWAN DJAFAR, S.IP., M.Si", "Dinas"),
    ("biro-organisasi", "Biro Organisasi", "Biro Organisasi Sekretariat Daerah", "NUR RAHMA PARAMPASI, S.Sos, M.Si", "Sekretariat Daerah"),
    ("inspektorat", "Inspektorat", "Inspektorat Daerah", "NATSIR", "Lembaga"),
    ("biro-tapem", "Biro Tapem", "Biro Pemerintahan dan Kesejahteraan Rakyat Sekretariat Daerah", "MURDANIL", "Sekretariat Daerah"),
    ("bapperida", "Bapperida", "Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah", "Drs. AMUJIB, M.M", "Badan"),
    ("bkpsdm", "BKPSDM", "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia", "Drs. H. HERDIN ISMAIL, MM", "Badan"),
    ("disnakertrans", "Disnakertrans", "Dinas Transmigrasi dan Tenaga Kerja", "H. ANDI FARID AMRI, S.Sos., MM.", "Dinas"),
    ("asisten-3", "Asisten III", "Asisten III Administrasi Umum Sekretariat Daerah", "H. HABIBI AZIS, S.STP., M.M", "Sekretariat Daerah"),
    ("dinsos", "Dinsos PPPA & PMD", "Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak, serta Pemberdayaan Masyarakat dan Desa", "Hj.DARMAWATI, S.Pi.,M.M.", "Dinas"),
    ("kesbangpol", "Kesbangpol", "Badan Kesatuan Bangsa dan Politik", "MUH. DARWIS DAMIR, SE, MM", "Badan"),
    ("dinkes", "Dinkes", "Dinas Kesehatan, Pengendalian Penduduk dan Keluarga Berencana", "dr. Hj. NURSYAMSI RAHIM", "Dinas"),
    ("setwan", "Sekretariat DPRD", "Sekretariat Dewan Perwakilan Rakyat Daerah", "ARIANTO AP, MM", "Lembaga"),
    ("perkim", "Perkim & Perhubungan", "Dinas Perumahan dan Kawasan Permukiman, Pertanahan dan Perhubungan", "MADDARESKI SALATIN", "Dinas"),
    ("disdik", "Disdikbud", "Dinas Pendidikan dan Kebudayaan", "MUHAMMAD NEHRU SAGENA, S.IP.,M.Si", "Dinas"),
    ("biro-umum", "Biro Umum", "Biro Umum Sekretariat Daerah", "ANSHAR MALLE, S.Sos,. M.Si", "Sekretariat Daerah"),
    ("asisten-2", "Asisten II", "Asisten II Perekonomian dan Pembangunan Sekretariat Daerah", "RACHMAD, SE.,M.Si", "Sekretariat Daerah"),
    ("asisten-1", "Asisten I", "Asisten I Pemerintahan dan Kesejahteraan Rakyat Sekretariat Daerah", "MUH. JAUN, S.I.P., MM.", "Sekretariat Daerah"),
    ("pu", "PU & Penataan Ruang", "Dinas Pekerjaan Umum dan Penataan Ruang", "SURYA YULIAWAN SARIFUDDIN, ST, MM", "Dinas"),
    ("satpol", "Satpol PP & Damkar", "Satuan Polisi Pamong Praja dan Pemadam Kebakaran", "Drs. AKSAN, M.M.", "Lembaga"),
    ("dpmptsp", "DPMPTSP", "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu", "Drs. KAIN LOTONG SEMBE, M.M", "Dinas"),
    ("dlhk", "DLHK", "Dinas Lingkungan Hidup dan Kehutanan", "H.ZULKIFLI MANGGAZALI, SE, M.Si", "Dinas"),
    ("bpbd", "BPBD", "Badan Penanggulangan Bencana Daerah", "MUHAMMAD YASIR FATTAH, SE, M.Si", "Badan"),
    ("esdm", "ESDM", "Dinas Energi dan Sumber Daya Mineral", "BUJAERAMY HASAN, SH., M.Si", "Dinas"),
    ("perkebunan", "Perkebunan", "Dinas Perkebunan", "FAIZAL THAMRIN", "Dinas"),
    ("staf-pem", "Staf Ahli Pemerintahan", "Staf Ahli Gubernur Bidang Pemerintahan, Hukum dan Politik", "drg. ASRAN MASDY, SKG, MAP", "Sekretariat Daerah"),
    ("kkp", "KKP", "Dinas Kelautan dan Perikanan", "SAFARUDDIN SANUSI DM, S.Sos., M.A.P", "Dinas"),
    ("staf-ekbang", "Staf Ahli Ekbang", "Staf Ahli Gubernur Bidang Ekonomi, Keuangan dan Pembangunan", "Drs. FARID WAJDI, M.Pd", "Sekretariat Daerah"),
    ("diskop", "Diskop & Perindag", "Dinas Koperasi dan UKM, Perindustrian dan Perdagangan", "MASRIADI NADI ATJO", "Dinas"),
    ("biro-pbj", "Biro PBJ", "Biro Pengadaan Barang dan Jasa Sekretariat Daerah", "M.YAMIN SALEH, S.H., M.Adm.Pemb", "Sekretariat Daerah"),
    ("staf-kesra", "Staf Ahli Kesra", "Staf Ahli Gubernur Bidang Kemasyarakatan dan Sumber Daya Manusia", "dr. H. MUHAMMAD IHWAN", "Sekretariat Daerah"),
    ("tp", "Tanaman Pangan & Peternakan", "Dinas Tanaman Pangan, Hortikultura dan Peternakan", "HAMDANI HAMDI, S.Ip., M.Si.", "Dinas"),
    ("dispora", "Disporapar", "Dinas Kepemudaan, Olahraga, Pariwisata dan Ekonomi Kreatif", "BAU AKRAM DAI, SE., M.Si.", "Dinas"),
    ("rsud", "RSUD", "Rumah Sakit Umum Daerah", "dr. MUSADRI AMIR ABDULLAH, Sp.PD", "Lembaga"),
    ("biro-ekbang", "Biro Ekbang", "Biro Perekonomian dan Administrasi Pembangunan Sekretariat Daerah", "Dr. Firman S.Pi, MP", "Sekretariat Daerah"),
    ("perpus", "Perpustakaan & Kearsipan", "Dinas Perpustakaan dan Kearsipan", "MUSTARI MULA, S.Sos, M.AP", "Dinas"),
    ("dukcapil", "Dukcapil", "Dinas Kependudukan dan Pencatatan Sipil", "MUH. JAUN, S.IP.,MM", "Dinas"),
    ("bapenda", "Bapenda", "Badan Pendapatan Daerah", "Drs. H. ABDUL WAHAB HASAN SULUR, M.Si", "Badan"),
    ("dinas-pangan", "Dinas Pangan", "Dinas Pangan", "Dr. SUYUTI MARZUKI, SPi,MT,M.Sc", "Dinas"),
    ("penghubung", "Badan Penghubung", "Badan Penghubung / Perwakilan Pemerintah Provinsi Sulawesi Barat di Jakarta", "Hj. GEMILANG SUKMA M. M, SP., M.AP", "Badan"),
]
UNIT_BY_ID = {u[0]: u for u in UNITS}

def norm(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode()
    s = s.lower()
    s = re.sub(r'\bplt\.?\b', ' ', s)
    s = re.sub(r'^\s*kepala\b', ' ', s)
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def map_unit(text):
    t = norm(text)
    if not t:
        return None
    rules = [
        ('biro-hukum', ['biro hukum']),
        ('biro-organisasi', ['biro organisasi']),
        ('biro-tapem', ['biro pemerintahan']),
        ('biro-umum', ['biro umum']),
        ('biro-ekbang', ['biro perekonomian']),
        ('biro-pbj', ['biro pengadaan']),
        ('asisten-3', ['asisten iii administrasi', 'asisten 3', 'asisten administrasi umum']),
        ('asisten-2', ['asisten ii perekonomian', 'asisten 2', 'asisten bid perekonomian', 'asisten perekonomian']),
        ('asisten-1', ['asisten i pemerintahan', 'asisten 1', 'asisten pemerintahan', 'asistren pemerintahan']),
        ('staf-ekbang', ['staf ahli gubernur bidang ekonomi', 'staf ahli bidang ekonomi', 'staf ahli ekonomi']),
        ('staf-kesra', ['staf ahli gubernur bidang kemasyarakatan', 'staf ahli bidang kemasyarakatan', 'staf ahli kemasyarakatan', 'staf ahli bid kemasyarakatan']),
        ('staf-pem', ['staf ahli gubernur bidang pemerintahan', 'staf ahli bidang pemerintahan', 'staf ahli pemerintahan']),
        ('bapperida', ['badan perencanaan pembangunan', 'bapperida']),
        ('bpkad', ['badan pengelola keuangan', 'badan pengelolaan keuangan', 'bpkad']),
        ('bkpsdm', ['badan kepegawaian']),
        ('bapenda', ['badan pendapatan daerah', 'bapenda']),
        ('kesbangpol', ['badan kesatuan bangsa', 'kesbangpol']),
        ('bpbd', ['badan penanggulangan bencana', 'bpbd']),
        ('penghubung', ['badan penghubung', 'perwakilan pemerintah provinsi']),
        ('inspektorat', ['inspektorat']),
        ('setwan', ['sekretaris dewan', 'sekretariat dprd', 'dprd']),
        ('satpol', ['satuan polisi pamong praja', 'satpol']),
        ('rsud', ['rumah sakit umum', 'rsud']),
        ('kominfo', ['komunikasi informatika', 'kominfo']),
        ('disdik', ['pendidikan dan kebudayaan']),
        ('dinsos', ['dinas sosial', 'dinsospppmd']),
        ('tp', ['tanaman pangan']),
        ('dinas-pangan', ['dinas pangan', 'dinas pagan']),
        ('pu', ['pekerjaan umum', 'penataan ruang']),
        ('dinkes', ['kesehatan pengendalian penduduk', 'dinas kesehatan']),
        ('disnakertrans', ['transmigrasi dan tenaga kerja', 'transmigrasi']),
        ('diskop', ['koperasi dan usaha kecil', 'koperasi dan ukm', 'perindustrian dan perdagangan']),
        ('kkp', ['kelautan dan perikanan']),
        ('dlhk', ['lingkungan hidup dan kehutanan', 'lingkungan hidup']),
        ('perkebunan', ['perkebunan']),
        ('perkim', ['perumahan kawasan pemukiman', 'perumahan dan kawasan', 'perumahan rakyat']),
        ('dispora', ['kepemudaan olahraga', 'pariwisata dan ekonomi kreatif', 'dinas pariwisata']),
        ('perpus', ['perpustakaan dan kearsipan']),
        ('dukcapil', ['kependudukan dan pencatatan sipil']),
        ('dpmptsp', ['penanaman modal', 'pelayanan terpadu satu pintu', 'ptsp']),
        ('esdm', ['energi dan sumber daya mineral', 'energi dan sumberdaya mineral', 'esdm']),
    ]
    for uid, keys in rules:
        if any(k in t for k in keys):
            return uid
    return None

# head-name aliases (normalized, token-based fallback)
HEAD_ALIASES = [
    ('bpkad', ['mohammadalichandra', 'ali chandra']),
    ('biro-hukum', ['suhendra']),
    ('kominfo', ['ridwandjafar']),
    ('biro-organisasi', ['nurrahmaparampasi']),
    ('inspektorat', ['natsir']),
    ('biro-tapem', ['murdanil']),
    ('bapperida', ['amujib']),
    ('bkpsdm', ['herdinismail']),
    ('disnakertrans', ['andifaridamri']),
    ('asisten-3', ['habibiazis']),
    ('dinsos', ['darmawati']),
    ('kesbangpol', ['darwisdamir']),
    ('dinkes', ['nursyamsirahim']),
    ('setwan', ['ariantoap']),
    ('perkim', ['maddareski']),
    ('disdik', ['nehrusagena']),
    ('biro-umum', ['ansharmalle']),
    ('asisten-2', ['rachmad']),
    ('asisten-1', ['muhjaun', 'jaun']),
    ('pu', ['suryayulianwan', 'suryayuliawan']),
    ('satpol', ['aksan']),
    ('dpmptsp', ['amir', 'kainlotongsembe', 'kainlotongsambe']),
    ('dlhk', ['zulkiflimanggazali']),
    ('bpbd', ['yasirfattah']),
    ('esdm', ['bujaeramy', 'kainlotongsambe']),
    ('perkebunan', ['faizalthamrin']),
    ('staf-pem', ['asranmasdy']),
    ('kkp', ['safaruddinsanusi']),
    ('staf-ekbang', ['faridwajdi']),
    ('diskop', ['masriadinadiatjo']),
    ('biro-pbj', ['yaminsaleh']),
    ('staf-kesra', ['muhammadihwan']),
    ('tp', ['hamdanihamdi']),
    ('dispora', ['bauakramdai', 'akramdai']),
    ('rsud', ['musadri']),
    ('biro-ekbang', ['firman']),
    ('perpus', ['mustarimula']),
    ('dukcapil', ['muhjaun', 'jaun']),
    ('bapenda', ['abdulwahabhasansulur']),
    ('dinas-pangan', ['suyutimarzuki']),
    ('penghubung', ['gemilangsukma']),
]
def map_head(text):
    t = norm(text).replace(' ', '')
    for uid, keys in HEAD_ALIASES:
        if any(k.replace(' ', '') in t for k in keys):
            return uid
    return None

# Riwayat kepala yang sudah dicatat sebagai draft. Tanggal masih perlu
# diverifikasi ke sumber resmi; status verified tetap False sampai dicek.
LEADERSHIP = {
    'dpmptsp': [
        {
            'name': 'AMIR, S.Sos, MM',
            'role': 'Plt. Kepala',
            'from': '2026-01-02',
            'to': '2026-03-10',
            'verified': False,
            'note': 'Label absensi Plt. sampai 9 Mar 2026; perjalanan 23 Feb 2026.',
        },
        {
            'name': 'Drs. KAIN LOTONG SEMBE, M.M',
            'role': 'Kepala',
            'from': '2026-03-11',
            'to': '2026-11-03',
            'verified': False,
            'note': 'Label absensi Kepala mulai 11 Mar 2026; perjalanan 12 Mar 2026.',
        },
    ],
}

NAME_TITLES = {
    'dr', 'drs', 'dra', 'hj', 'h', 'ir', 'prof', 'drg', 's', 'si', 'ip',
    'se', 'mm', 'msi', 'm', 'pd', 'spi', 'skg', 'map', 'sh', 'st', 'mt',
    'msc', 'cfra', 'sos', 'sip', 'sp', 'ma', 'a', 'ssos', 'sip', 'se',
}

def person_key(name):
    tokens = [w for w in norm(name).split() if w not in NAME_TITLES and len(w) > 1]
    return ' '.join(tokens)

DEST_ALIASES = {
    'polman': 'Polewali Mandar',
    'polewali mandar': 'Polewali Mandar',
    'majene': 'Majene',
    'jakarta': 'Jakarta',
    'jakarta selatan': 'Jakarta',
    'makassar': 'Makassar',
    'makassatr': 'Makassar',
    'mamasa': 'Mamasa',
    'mamuju': 'Mamuju',
    'mamuju tengah': 'Mamuju Tengah',
    'mateng': 'Mamuju Tengah',
    'pasangkayu': 'Pasangkayu',
    'palu': 'Palu',
    'kendari': 'Kendari',
    'gorontalo': 'Gorontalo',
    'bali': 'Bali',
    'jawa barat': 'Jawa Barat',
    'jawa tengah': 'Jawa Tengah',
    'jawa timur': 'Jawa Timur',
    'yogyakarta': 'Yogyakarta',
    'bogor': 'Bogor',
    'semarang': 'Semarang',
    'parepare': 'Parepare',
    'banten': 'Banten',
}

def canon_destination(raw):
    x = (raw or '').strip().lower()
    x = re.split(r'[\n,;/]|\s+dan\s+|\s+&\s+', x)[0].strip()
    x = re.sub(r'\s+', ' ', x)
    return DEST_ALIASES.get(x, x.title() if x else 'Tidak dicatat')

SENDER_ALIASES = [
    ('Kemendagri', ['kemendagri', 'mendagri', 'dirjen bina keuda', 'dirjen bina pemda', 'dirjen bina pembangunan daerah', 'dirjen perimbangan keuangan']),
    ('Gubernur Sulbar', ['gubernur', 'gubemur']),
    ('BPJS Kesehatan', ['bpjs kesehatan']),
    ('BPJS Ketenagakerjaan', ['bpjs ketenagakerjaan']),
    ('Bank Indonesia', ['bank indonesia']),
    ('BPKP', ['bpkp']),
    ('BPS', ['bps provinsi', 'badan pusat statistik']),
    ('ANRI', ['anri']),
    ('Polda Sulbar', ['polda sulbar']),
    ('Kemenpan RB', ['kemenpan rb', 'kemenpanrb']),
    ('Ombudsman', ['ombudsman']),
    ('KORPRI', ['korpri']),
    ('Bappenas', ['bappenas']),
    ('Kementerian Keuangan', ['kemenkeu', 'kementerian keuangan']),
    ('Kejaksaan', ['kejaksaan', 'kejati']),
    ('Bupati Mamasa', ['bupati mamasa']),
]

def canon_sender(raw):
    text = (raw or '').strip()
    uid = map_unit(text)
    if uid:
        return UNIT_BY_ID[uid][1]
    n = norm(text)
    for label, keys in SENDER_ALIASES:
        if any(k in n for k in keys):
            return label
    # tidy common acronyms / casing
    if len(text) <= 6 and text.isupper():
        return text
    return text.title()

# ---------------- load ----------------
s = open(SRC, encoding='utf-8').read()
rows = list(csv.reader(io.StringIO(s[s.find('Tanggal,Peserta Rapat'):])))
header, data = rows[0], rows[1:]

DATE_FIXES = Counter()

def dparse(x):
    x = (x or '').strip()
    if not x: return None
    try:
        d = datetime.strptime(x, '%d/%m/%Y')
        if 2020 <= d.year <= 2030:
            return d
    except ValueError:
        pass
    # repair malformed source dates such as 23/04//2026, 19/08/0206,
    # 30/007/2026, 22/101/2026 and 01/11/20276
    parts = [p for p in re.split(r'[/-]', x) if p.strip()]
    if len(parts) >= 3:
        try:
            day = int(parts[0])
            month = int(parts[1])
            if month > 12:
                month = int(parts[1][:2])
            year = int(parts[2])
            if year < 2020 or year > 2030:
                year = 2026
            d = datetime(year, month, day)
            DATE_FIXES[(x, d.strftime('%d/%m/%Y'))] += 1
            return d
        except Exception:
            return None
    return None

def ikey(d): return f'{d.year}-{d.month:02d}'

def iso(d): return d.strftime('%Y-%m-%d') if d else ''

STATUSES = ['Hadir', 'Dinas Luar', 'Diwakili', 'Sakit', 'Izin', 'Tanpa Keterangan']
PRESENT_STATUSES = {'Hadir', 'Diwakili', 'Dinas Luar', 'Sakit'}

# ---------------- attendance ----------------
att = [r for r in data if r[1].strip()]
attendance = defaultdict(lambda: Counter())
att_months = defaultdict(lambda: defaultdict(Counter))
att_unknown = Counter()
meetings = {}
meeting_index = {}
meeting_list = []
att_records = defaultdict(list)
for r in att:
    uid = map_unit(r[1])
    d = dparse(r[0])
    st = r[3].strip() or 'Tanpa Keterangan'
    if st not in STATUSES: st = 'Tanpa Keterangan'
    if not uid:
        att_unknown[r[1].strip()] += 1
        continue
    c = attendance[uid]
    c[st] += 1; c['total'] += 1
    if st in PRESENT_STATUSES: c['present'] += 1
    if d:
        m = att_months[uid][ikey(d)]
        m[st] += 1; m['total'] += 1
        if st in PRESENT_STATUSES: m['present'] += 1
    key = (r[0].strip(), r[2].strip())
    if key not in meetings:
        meetings[key] = d
    if key not in meeting_index:
        meeting_index[key] = len(meeting_list)
        meeting_list.append({'d': iso(d), 'title': r[2].strip()})
    att_records[uid].append({
        'd': iso(d),
        'status': st,
        'm': meeting_index[key],
    })

# ---------------- disposition ----------------
disp_raw = list(enumerate([r for r in data if r[8].strip()], start=2))
disp_seen = {}
disp_duplicates = []
for row_no, r in disp_raw:
    key = (r[8].strip(), r[7].strip(), r[9].strip(), r[10].strip())
    if key not in disp_seen:
        disp_seen[key] = (row_no, r)
    else:
        kept_no, kept = disp_seen[key]
        if kept[14].strip() != 'Selesai' and r[14].strip() == 'Selesai':
            disp_duplicates.append({
                'row': kept_no,
                'keptRow': row_no,
                'date': r[8].strip(),
                'target': r[7].strip(),
                'subject': r[10].strip(),
                'status': r[14].strip(),
            })
            disp_seen[key] = (row_no, r)
        else:
            disp_duplicates.append({
                'row': row_no,
                'keptRow': kept_no,
                'date': r[8].strip(),
                'target': r[7].strip(),
                'subject': r[10].strip(),
                'status': r[14].strip(),
            })
disp_rows = list(disp_seen.values())
disp = [r for _, r in disp_rows]
disp_rownums = {id(r): row_no for row_no, r in disp_rows}
disp_unit = defaultdict(lambda: Counter())
disp_months = defaultdict(lambda: defaultdict(Counter))
disp_items = defaultdict(list)
disp_records = defaultdict(list)
disp_excluded = Counter()
disp_excluded_rows = []
for r in disp:
    row_no = disp_rownums.get(id(r), 0)
    target = r[7].strip()
    uid = None
    for part in re.split(r'[,/]', target):
        uid = map_unit(part)
        if uid: break
    if not uid: uid = map_unit(target)
    if not uid:
        disp_excluded[target] += 1
        disp_excluded_rows.append({
            'row': row_no,
            'date': r[8].strip(),
            'target': target,
            'subject': r[10].strip(),
        })
        continue
    st = r[14].strip()
    c = disp_unit[uid]
    c['total'] += 1
    if st == 'Selesai': c['done'] += 1
    else: c['pending'] += 1
    d = dparse(r[8])
    if d:
        m = disp_months[uid][ikey(d)]
        m['total'] += 1
        m['done' if st == 'Selesai' else 'pending'] += 1
    due = dparse(r[13])
    disp_items[uid].append({
        'date': r[8].strip(), 'sender': r[9].strip(), 'subject': r[10].strip(),
        'due': r[13].strip(), 'status': st, 'progress': r[12].strip(),
        'target': target,
    })
    disp_records[uid].append({
        'd': iso(d), 'sender': r[9].strip(), 'subject': r[10].strip(),
        'due': iso(due), 'status': st, 'progress': r[12].strip(),
    })

# ---------------- travel ----------------
trav_raw = list(enumerate([r for r in data if r[22].strip()], start=2))
trav = []
trav_seen = {}
trav_duplicates = []
trav_missing_names = []
for row_no, r in trav_raw:
    if not r[16].strip() or not r[17].strip():
        trav_missing_names.append({
            'row': row_no,
            'name': r[16].strip(),
            'unit': r[17].strip(),
            'date': r[22].strip(),
            'subject': r[19].strip(),
        })
    key = (r[16].strip(), r[17].strip(), r[22].strip(), r[23].strip(), r[19].strip())
    if key in trav_seen:
        trav_duplicates.append({
            'row': row_no,
            'keptRow': trav_seen[key],
            'name': r[16].strip(),
            'unit': r[17].strip(),
            'date': r[22].strip(),
            'subject': r[19].strip(),
        })
        continue
    trav_seen[key] = row_no
    trav.append(r)
travel = defaultdict(lambda: Counter())
trav_months = defaultdict(lambda: defaultdict(Counter))
trav_items = defaultdict(list)
trav_records = defaultdict(list)
trav_unknown = Counter()
destinations = Counter()
for r in trav:
    uid = map_unit(r[17]) or map_head(r[16])
    if not uid:
        trav_unknown[(r[16].strip(), r[17].strip())] += 1
        continue
    days = 0
    m = re.search(r'(\d+)', r[21])
    if m: days = int(m.group(1))
    kind = 'Luar Daerah' if 'luar' in r[18].lower() else 'Dalam Daerah'
    c = travel[uid]
    c['total'] += 1; c['days'] += days
    c['outside' if kind == 'Luar Daerah' else 'inside'] += 1
    d = dparse(r[22])
    end = dparse(r[23])
    if d:
        mm = trav_months[uid][ikey(d)]
        mm['total'] += 1; mm['days'] += days
        mm['outside' if kind == 'Luar Daerah' else 'inside'] += 1
    trav_items[uid].append({
        'name': r[16].strip(), 'unit': r[17].strip(), 'kind': kind,
        'subject': r[19].strip(), 'destination': r[20].strip(),
        'days': days, 'start': r[22].strip(), 'end': r[23].strip(),
    })
    trav_records[uid].append({
        'd': iso(d), 'end': iso(end), 'days': days, 'kind': kind,
        'name': r[16].strip(), 'dest': canon_destination(r[20]), 'subject': r[19].strip(),
    })
    destinations[canon_destination(r[20])] += 1

# ---------------- head-change candidates ----------------
name_groups = defaultdict(lambda: defaultdict(lambda: {'name': '', 'rows': [], 'dates': []}))
for row_no, r in enumerate(data, start=2):
    raw_name = r[16].strip()
    if not raw_name or not r[22].strip():
        continue
    uid = map_unit(r[17]) or map_head(raw_name)
    d = dparse(r[22])
    if not uid or not d:
        continue
    key = person_key(raw_name)
    if not key:
        continue
    entry = name_groups[uid][key]
    entry['name'] = raw_name
    entry['rows'].append(row_no)
    entry['dates'].append(iso(d))

head_changes = []
for uid, groups in name_groups.items():
    if len(groups) <= 1:
        continue
    names = []
    for entry in groups.values():
        dates = sorted(entry['dates'])
        names.append({
            'name': entry['name'],
            'count': len(entry['rows']),
            'first': dates[0],
            'last': dates[-1],
            'rows': sorted(entry['rows']),
        })
    names.sort(key=lambda x: (x['first'], x['name']))
    keys = list(groups.keys())
    similarity = min(
        difflib.SequenceMatcher(None, a, b).ratio()
        for index, a in enumerate(keys)
        for b in keys[index + 1:]
    )
    kind = 'change' if similarity < 0.5 else 'variant'
    note = 'Perlu verifikasi tanggal jabatan dan status Plt./definitif.'
    if kind == 'variant':
        note = 'Kemungkinan varian ejaan nama yang sama; cek konsistensi penulisan.'
    if uid == 'dpmptsp':
        note = 'AMIR tercatat sebagai Plt. sampai 9 Mar 2026; KAIN tercatat sebagai Kepala mulai 11 Mar 2026. Baris AMIR pada Jun–Agu perlu dicek.'
    head_changes.append({
        'unitId': uid,
        'unitShort': UNIT_BY_ID[uid][1],
        'names': names,
        'rows': sorted({row for n in names for row in n['rows']}),
        'kind': kind,
        'note': note,
    })
head_changes.sort(key=lambda x: x['unitShort'])
head_change_by_unit = {item['unitId']: item for item in head_changes}

# ---------------- audit ----------------
DATE_COLUMNS = {
    0: 'Tanggal',
    8: 'Tanggal Disposisi',
    13: 'Tenggat Waktu',
    22: 'Tanggal Pergi',
    23: 'Tanggal Kembali',
}
date_fixes = []
for row_no, r in enumerate(data, start=2):
    for col, name in DATE_COLUMNS.items():
        raw = r[col].strip()
        if not raw:
            continue
        valid = False
        try:
            parsed = datetime.strptime(raw, '%d/%m/%Y')
            valid = 2020 <= parsed.year <= 2030
        except ValueError:
            valid = False
        if not valid:
            fixed = dparse(raw)
            if fixed:
                date_fixes.append({
                    'row': row_no,
                    'column': name,
                    'raw': raw,
                    'fixed': fixed.strftime('%d/%m/%Y'),
                })

raw_labels = set()
for r in data:
    if r[1].strip(): raw_labels.add(r[1].strip())
    if r[7].strip(): raw_labels.add(r[7].strip())
    if r[17].strip(): raw_labels.add(r[17].strip())

audit = {
    'duplicates': {
        'dispositions': disp_duplicates,
        'travel': trav_duplicates,
    },
    'dateFixes': date_fixes,
    'missingNames': trav_missing_names,
    'headChanges': head_changes,
    'excludedDispositions': {
        'count': len(disp_excluded_rows),
        'byTarget': [{'target': k, 'count': v} for k, v in disp_excluded.most_common()],
        'rows': disp_excluded_rows,
    },
    'rawLabelCount': len(raw_labels),
    'unitCount': len(UNITS),
    'attendanceRows': len(att),
    'dispositionRows': len(disp),
    'travelRows': len(trav),
}

# ---------------- assemble ----------------
MONTHS = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11']
MONTH_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov']

# global monthly
g_att = {m: {'month': m, 'meetings': 0, 'records': 0, 'present': 0} for m in MONTHS}
for (date_str, perihal), d in meetings.items():
    if d: g_att[ikey(d)]['meetings'] += 1
for r in att:
    d = dparse(r[0])
    if not d: continue
    st = r[3].strip() or 'Tanpa Keterangan'
    g = g_att[ikey(d)]
    g['records'] += 1
    if st in PRESENT_STATUSES: g['present'] += 1

g_disp = {m: {'month': m, 'total': 0, 'done': 0, 'pending': 0} for m in MONTHS}
disp_skipped = Counter()
for r in disp:
    # only mapped records
    target = r[7].strip(); uid = None
    for part in re.split(r'[,/]', target):
        uid = map_unit(part)
        if uid: break
    if not uid:
        uid = map_unit(target)
    d = dparse(r[8])
    if not uid or not d:
        disp_skipped[(target, r[8].strip(), bool(uid), bool(d))] += 1
        continue
    g = g_disp[ikey(d)]
    g['total'] += 1
    if r[14].strip() == 'Selesai': g['done'] += 1
    else: g['pending'] += 1

g_trav = {m: {'month': m, 'total': 0, 'days': 0, 'inside': 0, 'outside': 0} for m in MONTHS}
for r in trav:
    uid = map_unit(r[17]) or map_head(r[16])
    if not uid: continue
    d = dparse(r[22])
    if not d: continue
    days = int(re.search(r'(\d+)', r[21]).group(1)) if re.search(r'(\d+)', r[21]) else 0
    g = g_trav[ikey(d)]
    g['total'] += 1; g['days'] += days
    if 'luar' in r[18].lower(): g['outside'] += 1
    else: g['inside'] += 1

att_total = sum(c['total'] for c in attendance.values())
att_present = sum(c['present'] for c in attendance.values())
disp_total = sum(c['total'] for c in disp_unit.values())
disp_done = sum(c['done'] for c in disp_unit.values())
trav_total = sum(c['total'] for c in travel.values())
trav_days = sum(c['days'] for c in travel.values())
trav_out = sum(c['outside'] for c in travel.values())
trav_in = sum(c['inside'] for c in travel.values())
status_global = Counter()
for c in attendance.values():
    for st in STATUSES: status_global[st] += c[st]

# ranks
def rank(values, reverse=True):
    # values: list of (id, value); standard competition rank
    out = {}
    ordered = sorted(values, key=lambda x: (-x[1] if reverse else x[1], x[0]))
    last_val = None; last_rank = 0
    for i, (uid, v) in enumerate(ordered, 1):
        if v != last_val:
            last_rank = i; last_val = v
        out[uid] = {'rank': last_rank, 'of': len(ordered)}
    return out

att_rank = rank([(u[0], round(attendance[u[0]]['present'] / attendance[u[0]]['total'] * 100, 1) if attendance[u[0]]['total'] else 0) for u in UNITS])
disp_rank = rank([(u[0], round(disp_unit[u[0]]['done'] / disp_unit[u[0]]['total'] * 100, 1) if disp_unit[u[0]]['total'] else -1) for u in UNITS])
trav_rank = rank([(u[0], travel[u[0]]['total']) for u in UNITS])

def reward_score(att_pct, disp_pct):
    # Komponen yang tidak memiliki catatan dianggap 100% agar nilai R&P tetap ada.
    att_value = 100 if att_pct is None else att_pct
    disp_value = 100 if disp_pct is None else disp_pct
    return round(((att_value + disp_value) / 2) * 30 / 100, 1)

reward_rank = rank([
    (u[0], reward_score(
        round(attendance[u[0]]['present'] / attendance[u[0]]['total'] * 100, 1) if attendance[u[0]]['total'] else None,
        round(disp_unit[u[0]]['done'] / disp_unit[u[0]]['total'] * 100, 1) if disp_unit[u[0]]['total'] else None,
    ))
    for u in UNITS
])

units = []
for uid, short, full, head, group in UNITS:
    a = attendance[uid]; d = disp_unit[uid]; t = travel[uid]
    a_total = a['total']; d_total = d['total']; t_total = t['total']
    a_pct = round(100 * a['present'] / a_total, 1) if a_total else 0
    d_pct = round(100 * d['done'] / d_total, 1) if d_total else None
    unit = {
        'id': uid, 'short': short, 'name': full, 'head': head, 'group': group,
        'attendance': {
            'total': a_total, 'present': a['present'],
            'pct': a_pct,
            'statuses': {st: a[st] for st in STATUSES},
        },
        'disposition': {
            'total': d_total, 'done': d['done'], 'pending': d['pending'],
            'pct': d_pct,
        },
        'reward': reward_score(a_pct if a_total else None, d_pct),
        'leadership': LEADERSHIP.get(uid, []),
        'headChanged': bool(LEADERSHIP.get(uid)) or (
            uid in head_change_by_unit and head_change_by_unit[uid]['kind'] == 'change'
        ),
        'headCandidates': head_change_by_unit.get(uid, {}).get('names', []),
        'headChangeNote': head_change_by_unit.get(uid, {}).get('note', ''),
        'travel': {
            'total': t_total, 'days': t['days'], 'inside': t['inside'], 'outside': t['outside'],
            'outsidePct': round(100 * t['outside'] / t_total, 1) if t_total else 0,
            'avgDays': round(t['days'] / t_total, 1) if t_total else 0,
        },
        'rank': {
            'attendance': att_rank[uid], 'disposition': disp_rank[uid], 'travel': trav_rank[uid],
            'reward': reward_rank.get(uid, {'rank': 0, 'of': len(reward_rank)}),
        },
        'monthly': {
            'attendance': [{**{'month': m}, **att_months[uid].get(m, {'total': 0, 'present': 0})} for m in MONTHS],
            'disposition': [{**{'month': m}, **disp_months[uid].get(m, {'total': 0, 'done': 0, 'pending': 0})} for m in MONTHS],
            'travel': [{**{'month': m}, **trav_months[uid].get(m, {'total': 0, 'days': 0, 'inside': 0, 'outside': 0})} for m in MONTHS],
        },
        'records': {
            'attendance': att_records[uid],
            'dispositions': disp_records[uid],
            'travel': trav_records[uid],
        },
    }
    units.append(unit)

senders = Counter()
for r in disp:
    target = r[7].strip(); uid = None
    for part in re.split(r'[,/]', target):
        uid = map_unit(part)
        if uid: break
    if not uid: uid = map_unit(target)
    if uid and r[9].strip(): senders[canon_sender(r[9])] += 1

# insights
pending_units = sorted([u for u in units if u['disposition']['pending'] > 0], key=lambda u: -u['disposition']['pending'])
low_att = sorted([u for u in units if u['attendance']['total'] >= 50], key=lambda u: u['attendance']['pct'])[:5]
top_att = sorted(units, key=lambda u: (-u['attendance']['present'], u['short']))[:5]

payload = {
    'meta': {
        'title': 'Rekap Kepala Perangkat Daerah 2026',
        'subtitle': 'Kehadiran rapat, penyelesaian disposisi, dan perjalanan dinas',
        'periodLabel': 'Januari–Oktober 2026',
        'periodStart': '2026-01-02',
        'periodEnd': '2026-11-03',
        'generatedAt': '2026-11-04',
        'source': 'Rekap Tim Staf Sekda',
        'sourceUrl': 'https://docs.google.com/spreadsheets/d/1Ryi-NH8Bb1PB3E0ejlTvf3_YDNzsOb7WL0mY8cSpCvo/edit?gid=874698858#gid=874698858',
        'months': MONTHS,
        'monthLabels': MONTH_LABELS,
        'unitCount': len(units),
        'meetingCount': len(meetings),
    },
    'summary': {
        'attendance': {
            'total': att_total, 'present': att_present,
            'pct': round(100 * att_present / att_total, 1) if att_total else 0,
            'meetings': len(meetings), 'statuses': {st: status_global[st] for st in STATUSES},
        },
        'disposition': {
            'total': disp_total, 'done': disp_done, 'pending': disp_total - disp_done,
            'pct': round(100 * disp_done / disp_total, 1) if disp_total else 0,
            'units': sum(1 for u in units if u['disposition']['total'] > 0),
            'pendingUnits': len(pending_units),
        },
        'travel': {
            'total': trav_total, 'days': trav_days, 'inside': trav_in, 'outside': trav_out,
            'outsidePct': round(100 * trav_out / trav_total, 1) if trav_total else 0,
            'avgDays': round(trav_days / trav_total, 1) if trav_total else 0,
        },
    },
    'monthly': {'attendance': [g_att[m] for m in MONTHS], 'disposition': [g_disp[m] for m in MONTHS], 'travel': [g_trav[m] for m in MONTHS]},
    'meetings': meeting_list,
    'audit': audit,
    'units': units,
    'insights': {
        'pendingTop': [{'id': u['id'], 'short': u['short'], 'pending': u['disposition']['pending'], 'total': u['disposition']['total'], 'pct': u['disposition']['pct']} for u in pending_units[:5]],
        'lowAttendance': [{'id': u['id'], 'short': u['short'], 'pct': u['attendance']['pct'], 'present': u['attendance']['present'], 'total': u['attendance']['total']} for u in low_att],
        'topAttendance': [{'id': u['id'], 'short': u['short'], 'present': u['attendance']['present'], 'total': u['attendance']['total'], 'pct': u['attendance']['pct']} for u in top_att],
        'topSenders': [{'name': k, 'count': v} for k, v in senders.most_common(8)],
        'topDestinations': [{'name': k, 'count': v} for k, v in destinations.most_common(8)],
    },
}

OUT.parent.mkdir(parents=True, exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))

# ---------------- report ----------------
print(f'Written : {OUT}')
print(f'Units   : {len(units)}')
print(f'Meetings: {len(meetings)}')
print(f'Attendance: {att_total} records, {att_present} present ({payload["summary"]["attendance"]["pct"]}%)')
print(f'Disposition: {disp_total} letters, {disp_done} done, {disp_total - disp_done} pending')
print(f'Travel   : {trav_total} trips, {trav_days} days')
if att_unknown:
    print('Unmapped attendance:', att_unknown)
if trav_unknown:
    print('Unmapped travel:', trav_unknown)

