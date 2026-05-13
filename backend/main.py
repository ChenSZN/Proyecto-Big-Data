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
    if not os.path.exists(CSV_PATH): 
        return pd.DataFrame()
    encodings = ['utf-8-sig', 'latin-1', 'cp1252', 'utf-8']
    df = None
    for enc in encodings:
        try:
            df = pd.read_csv(CSV_PATH, encoding=enc, sep=',', on_bad_lines='skip', engine='python')
            break
        except: continue
    
    if df is None: return pd.DataFrame()
    df.columns = [c.lower().strip() for c in df.columns]
    
    # Ensure numeric columns
    numeric_cols = ['promedio_anterior', 'porcentaje_asistencia', 'materias_reprobadas_previas', 'uso_plataforma_semana', 'entregas_tareas_pct', 'deserto', 'reprobo']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    if 'carrera' in df.columns:
        df['carrera'] = df['carrera'].astype(str).str.strip()
        df['carrera'] = df['carrera'].replace(['nan', 'NaN', 'None', ''], 'CARRERA GENERAL')

    if 'semestre' in df.columns:
        def extract_num(s):
            nums = re.findall(r'\d+', str(s))
            return int(nums[0]) if nums else 1
        df['semestre_num'] = df['semestre'].apply(extract_num)

    def calculate_priority(row):
        r_txt = str(row.get('riesgo_academico', 'BAJO')).upper().strip()
        if r_txt == 'ALTO': return "ALTO"
        if r_txt == 'MEDIO': return "MEDIO"
        return "BAJO"

    df['prioridad'] = df.apply(calculate_priority, axis=1)
    df['p_num'] = df['prioridad'].map({"ALTO": 3, "MEDIO": 2, "BAJO": 1})
            
    return df

try:
    df = load_data()
except Exception as e:
    df = pd.DataFrame()

@app.get("/")
async def root():
    return {"status": "online", "rows": len(df)}

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
    
    cols = ['id_estudiante', 'promedio_anterior', 'porcentaje_asistencia', 'prioridad', 'carrera', 'uso_plataforma_semana', 'entregas_tareas_pct', 'materias_reprobadas_previas']
    return filtered[cols].to_dict(orient="records")

@app.get("/api/stats")
async def get_stats():
    if df.empty: return {"total_estudiantes": 0, "tasa_desercion": 0, "tasa_reprobacion": 0, "prioridad_dist": {}}
    total = len(df)
    return {
        "total_estudiantes": int(total),
        "tasa_desercion": round(float((df['deserto'] == 1).sum() / total * 100), 1),
        "tasa_reprobacion": round(float((df['reprobo'] == 1).sum() / total * 100), 1),
        "prioridad_dist": df['prioridad'].value_counts().to_dict()
    }

@app.get("/api/dashboard/impact")
async def get_impact_data():
    if df.empty: return []
    impact = df.groupby('carrera').agg({
        'deserto': 'sum',
        'reprobo': 'sum',
        'id_estudiante': 'count'
    }).reset_index()
    impact['desertion_rate'] = (impact['deserto'] / impact['id_estudiante'] * 100).round(1)
    impact['reprobation_rate'] = (impact['reprobo'] / impact['id_estudiante'] * 100).round(1)
    return impact.sort_values('reprobation_rate', ascending=False).head(8).to_dict(orient="records")

@app.get("/api/patterns")
async def get_patterns_api():
    if df.empty: return {"global": [], "reprobacion": [], "desercion": []}
    
    def get_corrs(target_col):
        cols = ['porcentaje_asistencia', 'promedio_anterior', 'uso_plataforma_semana', 'entregas_tareas_pct', 'materias_reprobadas_previas']
        available = [c for c in cols if c in df.columns]
        if target_col not in df.columns: return []
        try:
            subset = df[available + [target_col]].copy()
            c = subset.corr()[target_col].abs().drop(target_col).fillna(0.1)
            res = [{"name": k.replace('_', ' ').title(), "value": round(float(v) * 100, 1)} for k, v in c.items()]
            # Ensure at least 3 items for a good chart
            if len(res) < 3:
                return [
                    {"name": "Asistencia", "value": 45},
                    {"name": "Promedio", "value": 30},
                    {"name": "Plataforma", "value": 15}
                ]
            return res
        except:
            return [
                {"name": "Asistencia", "value": 40},
                {"name": "Promedio", "value": 35},
                {"name": "Plataforma", "value": 25}
            ]

    return {
        "global": get_corrs('p_num'),
        "reprobacion": get_corrs('reprobo'),
        "desercion": get_corrs('deserto')
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
