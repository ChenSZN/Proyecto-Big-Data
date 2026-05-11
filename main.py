from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

def load_data():
    if not os.path.exists(CSV_PATH): return pd.DataFrame()
    encodings = ['utf-8-sig', 'latin-1', 'cp1252', 'utf-8']
    df = None
    for enc in encodings:
        try:
            df = pd.read_csv(CSV_PATH, encoding=enc, sep=',', on_bad_lines='skip', engine='python')
            break
        except: continue
    
    if df is None: return pd.DataFrame()
    df.columns = [c.lower().strip() for c in df.columns]
    
    if 'carrera' in df.columns:
        df['carrera'] = df['carrera'].astype(str).str.strip()
        df['carrera'] = df['carrera'].replace(['nan', 'NaN', 'None', ''], 'CARRERA GENERAL')

    if 'semestre' in df.columns:
        def extract_num(s):
            nums = re.findall(r'\d+', str(s))
            return int(nums[0]) if nums else np.nan
        df['semestre_num'] = df['semestre'].apply(extract_num)

    # SINCRONIZACION CON DATASET: ALTO, MEDIO, BAJO
    def calculate_priority(row):
        r_txt = str(row.get('riesgo_academico', 'BAJO')).upper().strip()
        if r_txt == 'ALTO': return "ALTO"
        if r_txt == 'MEDIO': return "MEDIO"
        return "BAJO"

    df['prioridad'] = df.apply(calculate_priority, axis=1)
    df['p_num'] = df['prioridad'].map({"ALTO": 3, "MEDIO": 2, "BAJO": 1})
            
    return df

df = load_data()

@app.get("/api/drilldown/insights")
async def get_selection_insights(carrera: str = None, semestre: str = None):
    if df.empty: return []
    f_df = df.copy()
    if carrera: f_df = f_df[f_df['carrera'] == carrera.strip()]
    if semestre:
        try: f_df = f_df[f_df['semestre_num'] == int(semestre)]
        except: pass
    
    cols = ['porcentaje_asistencia', 'promedio_anterior', 'uso_plataforma_semana', 'entregas_tareas_pct', 'materias_reprobadas_previas']
    available = [c for c in cols if c in f_df.columns]
    if len(f_df) < 5: f_df = df

    try:
        corrs = f_df[available + ['p_num']].corr()['p_num'].abs().drop('p_num').fillna(0.1)
        insights = []
        for name, val in corrs.items():
            insights.append({"subject": name.replace('_', ' ').title(), "A": round(float(val) * 100, 1), "fullMark": 100})
        return insights
    except: return []

@app.get("/api/patterns")
async def get_patterns():
    if df.empty: return []
    cols = ['porcentaje_asistencia', 'promedio_anterior', 'uso_plataforma_semana', 'entregas_tareas_pct', 'materias_reprobadas_previas']
    available = [c for c in cols if c in df.columns]
    try:
        corrs = df[available + ['p_num']].corr()['p_num'].abs().drop('p_num')
        importance = []
        colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]
        for i, (name, val) in enumerate(corrs.items()):
            importance.append({"name": name.replace('_', ' ').title(), "value": round(float(val) * 100, 1), "color": colors[i % len(colors)]})
        return sorted(importance, key=lambda x: x['value'], reverse=True)
    except: return []

@app.get("/api/drilldown/filters")
async def get_filters(carrera: str = None):
    if df.empty: return {"carreras": [], "semestres": []}
    carreras = sorted([str(c) for c in df['carrera'].unique() if str(c) not in ['nan', 'CARRERA GENERAL']])
    if 'CARRERA GENERAL' in df['carrera'].values: carreras.append('CARRERA GENERAL')
    f_df = df if not carrera else df[df['carrera'] == carrera.strip()]
    semestres = sorted([int(s) for s in f_df['semestre_num'].dropna().unique()])
    return {"carreras": carreras, "semestres": semestres}

@app.get("/api/drilldown/data")
async def get_drilldown_data(carrera: str = None, semestre: str = None, search_id: str = None):
    if df.empty: return []
    filtered = df.copy()
    if carrera: filtered = filtered[filtered['carrera'] == carrera.strip()]
    if semestre:
        try: filtered = filtered[filtered['semestre_num'] == int(semestre)]
        except: pass
    if search_id:
        filtered = filtered[filtered['id_estudiante'].astype(str).str.contains(search_id.upper(), na=False)]
    
    cols = ['id_estudiante', 'promedio_anterior', 'porcentaje_asistencia', 'prioridad', 'carrera']
    return filtered[cols].head(100).to_dict(orient="records")

@app.get("/api/stats")
async def get_stats():
    if df.empty: return {"total_estudiantes": 0, "tasa_desercion": 0, "tasa_reprobacion": 0, "prioridad_dist": {}}
    total = len(df)
    return {
        "total_estudiantes": int(total),
        "tasa_desercion": round(float((df['deserto'] == 1).sum() / total * 100), 1) if 'deserto' in df.columns else 0,
        "tasa_reprobacion": round(float((df['reprobo'] == 1).sum() / total * 100), 1) if 'reprobo' in df.columns else 0,
        "prioridad_dist": df['prioridad'].value_counts().to_dict()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
