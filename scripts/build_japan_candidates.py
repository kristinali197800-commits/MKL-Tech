import re,csv,io,json,pathlib,requests,unicodedata,traceback,urllib.parse
from bs4 import BeautifulSoup
from pypdf import PdfReader
OUT=pathlib.Path('osg_japan_candidates'); OUT.mkdir(exist_ok=True)
H={'User-Agent':'Mozilla/5.0 (compatible; OSG-HCP-Research/1.0)'}
def get(url):
    r=requests.get(url,headers=H,timeout=40); r.raise_for_status(); return r
def norm(s): return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s or '')).strip()
jpname=re.compile(r'^[一-龯々〆ヵヶぁ-んァ-ヶー]{1,10}[ 　]+[一-龯々〆ヵヶぁ-んァ-ヶー]{1,14}[〇○]?$')
def good_name(s):
    s=norm(s).rstrip('〇○')
    return bool(jpname.match(s)) and not any(x in s for x in ('専門医','病院','大学','学会','一覧','都道府県','診療','検索','医師','会員','認定','外科','薬剤'))
def uniq(rows):
    seen=set(); out=[]
    for r in rows:
        n=norm(r['Clinician']).rstrip('〇○'); key=re.sub(r'[\s　]','',n)
        if n and key not in seen:
            seen.add(key); r['Clinician']=n; out.append(r)
    return out
cols=['Country','Region / State / Prefecture','City','ZIP','Clinician','Credential','OSG Target Category','Local / Source Specialty','Institution','Address','Phone','Professional Email','NPI / Registry ID','License','License State','Source URL','Source Type','Snapshot','Verification']
def row(name,cat,local,cred,url,source,region='',inst='',rid='',snap='2026-08-20'):
    return {'Country':'Japan','Region / State / Prefecture':region,'City':'','ZIP':'','Clinician':norm(name).rstrip('〇○'),'Credential':cred,'OSG Target Category':cat,'Local / Source Specialty':local,'Institution':norm(inst),'Address':'','Phone':'','Professional Email':'','NPI / Registry ID':rid,'License':'','License State':'','Source URL':url,'Source Type':source,'Snapshot':snap,'Verification':'Official public professional-body/certification roster; contact fields blank when not published'}
allrows=[]; report={}; errors={}
def add(key,fn):
    global allrows
    try:
        rs=uniq(fn()); report[key]=len(rs); allrows.extend(rs)
    except Exception as e:
        report[key]=0; errors[key]=repr(e); traceback.print_exc()

def trauma():
    url='https://jast-hp.org/specialist/member-list/'; s=BeautifulSoup(get(url).text,'lxml'); rs=[]
    for tag in s.find_all(['li','td','p','span','div']):
        t=norm(tag.get_text(' ',strip=True))
        if good_name(t): rs.append(row(t,'Emergency General/Trauma/Acute Care Surgeon','Trauma Surgery / 外傷専門医','JAST Trauma Specialist',url,'Japan Association for the Surgery of Trauma official specialist roster',snap='2026-04-01'))
    return rs
add('Trauma',trauma)

def neuro():
    url='https://www.jnss.or.jp/jns_web/senmoni_all.do'; s=BeautifulSoup(get(url).text,'lxml'); rs=[]
    for tag in s.find_all(['td','li']):
        t=norm(tag.get_text(' ',strip=True))
        if good_name(t): rs.append(row(t,'Neurosurgeon','Neurosurgery / 脳神経外科専門医','JNSS Board-Certified Neurosurgeon',url,'Japan Neurosurgical Society official specialist directory'))
    return rs
add('Neurosurgeon',neuro)

def cardio():
    url='https://jcvs.jp/list/list-1/'; s=BeautifulSoup(get(url).text,'lxml'); rs=[]
    for tr in s.find_all('tr'):
        cells=[norm(x.get_text(' ',strip=True)) for x in tr.find_all(['td','th'])]
        for i,c in enumerate(cells):
            if good_name(c):
                region=cells[0] if i>0 and len(cells[0])<12 else ''; inst=cells[i+1] if i+1<len(cells) else ''
                rs.append(row(c,'Cardiothoracic Surgeon','Cardiovascular Surgery / 心臓血管外科専門医','JCVS Cardiovascular Surgery Specialist',url,'Japanese Board of Cardiovascular Surgery official specialist list',region=region,inst=inst,snap='2026-02-01')); break
    return rs
add('Cardiothoracic',cardio)

def general():
    url='https://list.jssoc.or.jp/find-doctor/?col18=%E5%8C%97%E6%B5%B7%E9%81%93'; s=BeautifulSoup(get(url).text,'lxml'); rs=[]
    for tag in s.find_all(['td','li','p','span','div','a']):
        t=norm(tag.get_text(' ',strip=True))
        if good_name(t): rs.append(row(t,'General/GI Surgeon','General Surgery / 外科専門医','JSS Board-Certified Surgeon',url,'Japan Surgical Society official specialist directory',region='北海道',snap='2026-08-01'))
    return rs
add('GeneralGI',general)

def critical():
    rs=[]
    # JSICM serves actual specialist rows on kana-filtered URLs. Pull several broad kana groups.
    for key in ['ア','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ','マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ']:
        url='https://www.jsicm.org/specialist/index.html?kname_key='+urllib.parse.quote(key)
        try:
            s=BeautifulSoup(get(url).text,'lxml')
            # the returned table is name | prefecture; also accept short exact-name cells
            for tr in s.find_all('tr'):
                cells=[norm(x.get_text(' ',strip=True)) for x in tr.find_all(['td','th'])]
                if not cells: continue
                for c in cells:
                    if good_name(c):
                        region=next((x for x in cells if re.match(r'^(北海道|東京都|京都府|大阪府|.{2,3}県)$',x)), '')
                        rs.append(row(c,'Critical Care Physician/Intensivist','Intensive Care / 集中治療科専門医','JSICM Intensive Care Specialist',url,'Japanese Society of Intensive Care Medicine official specialist list',region=region,snap='2026-04-01')); break
            if len(uniq(rs))>=800: break
        except Exception:
            continue
    return rs
add('CriticalCare',critical)

def pharmacists():
    url='https://www.jshp.or.jp/education/bynintei/by-nintei-2025-n1.pdf'; data=get(url).content
    text='\n'.join((p.extract_text() or '') for p in PdfReader(io.BytesIO(data)).pages); rs=[]
    pat=re.compile(r'(\d{2}-\d{4}-\d{2})\s+([一-龯々〆ヵヶぁ-んァ-ヶー]{1,10}[ 　]+[一-龯々〆ヵヶぁ-んァ-ヶー]{1,14})')
    for rid,n in pat.findall(text):
        if good_name(n): rs.append(row(n,'Clinical/Bedside Pharmacists','Hospital Pharmacy / 病院薬剤師','JSHPh Certified Hospital Pharmacist',url,'Japanese Society of Hospital Pharmacists official certification roster',rid=rid,snap='2025-07-01'))
    return rs
add('Pharmacists',pharmacists)

with open(OUT/'japan_candidates.csv','w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader(); w.writerows(allrows)
(OUT/'report.json').write_text(json.dumps({'counts':report,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'counts':report,'errors':errors},ensure_ascii=False,indent=2))
