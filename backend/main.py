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
    
    encodings = ['utf-8-sig', 'latin-1', 'cp1252']
    df = pd.DataFrame()
    for enc in encodings:
        try:
            df = pd.read_csv(CSV_PATH, encoding=enc)
            if not df.empty: break
        except: continue
            
    if df.empty: return pd.DataFrame()
    
    # Normalize Columns - Partial Match
    raw_cols = df.columns.tolist()
    new_cols = {}
    
    for c in raw_cols:
        cl = c.lower().strip()
        if 'estudiante' in cl: new_cols[c] = 'id_estudiante'
        elif 'carrera' in cl: new_cols[c] = 'carrera'
        elif 'asistencia' in cl: new_cols[c] = 'porcentaje_asistencia'
        elif 'promedio' in cl and 'anterior' in cl: new_cols[c] = 'promedio_anterior'
        elif 'reprobadas' in cl or 'previas' in cl: new_cols[c] = 'materias_reprobadas_previas'
        elif 'tareas' in cl: new_cols[c] = 'entregas_tareas_pct'
        elif 'trabaja' in cl: new_cols[c] = 'trabaja'
        elif 'beca' in cl: new_cols[c] = 'beca'
        elif 'internet' in cl: new_cols[c] = 'acceso_internet'
        elif 'tutorias' in cl: new_cols[c] = 'participa_tutorias'
        elif 'semestre' in cl: new_cols[c] = 'semestre'
        elif 'riesgo' in cl: new_cols[c] = 'riesgo_academico'
        elif 'deserto' in cl: new_cols[c] = 'deserto'
        elif 'reprobo' in cl: new_cols[c] = 'reprobo'
        elif 'edad' in cl: new_cols[c] = 'edad'
        elif 'distancia' in cl: new_cols[c] = 'distancia_km'
        
    df.rename(columns=new_cols, inplace=True)
    
    # FORCE NUMERIC
    numeric_cols = [
        'promedio_anterior', 'porcentaje_asistencia', 'materias_reprobadas_previas', 
        'entregas_tareas_pct', 'deserto', 'reprobo', 'edad', 'distancia_km'
    ]
    
    for col in numeric_cols:
        if col in df.columns:
            # Clean non-numeric characters except dots and commas
            df[col] = df[col].astype(str).str.replace(',', '.').str.extract(r'(\d+\.?\d*)')[0]
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Priority
    if 'riesgo_academico' in df.columns:
        df['prioridad'] = df['riesgo_academico'].astype(str).str.upper().str.strip().fillna('BAJO')
    else:
        df['prioridad'] = 'BAJO'
        
    df['p_num'] = df['prioridad'].map({"ALTO": 3, "MEDIO": 2, "BAJO": 1}).fillna(1)
    
    print("DATA LOADED SUCCESS. Samples:")
    print(df[['id_estudiante', 'porcentaje_asistencia', 'materias_reprobadas_previas', 'entregas_tareas_pct']].head())
            
    return df

try:
    df = load_data()
except:
    df = pd.DataFrame()

@app.get("/")
async def root():
    return {"status": "online", "rows": len(df), "cols": df.columns.tolist()}

@app.get("/api/environment")
async def get_environment_stats():
    if df.empty: return {}
    gender = df['genero'].value_counts().to_dict() if 'genero' in df.columns else {}
    work = df['trabaja'].value_counts().to_dict() if 'trabaja' in df.columns else {}
    distance = []
    if 'distancia_km' in df.columns:
        distance = [
            {"name": "0-5km", "value": int(((df['distancia_km'] >= 0) & (df['distancia_km'] <= 5)).sum())},
            {"name": "6-15km", "value": int(((df['distancia_km'] > 5) & (df['distancia_km'] <= 15)).sum())},
            {"name": "15km+", "value": int((df['distancia_km'] > 15).sum())}
        ]
    age = []
    if 'edad' in df.columns:
        age = [
            {"name": "18-20", "value": int(((df['edad'] >= 18) & (df['edad'] <= 20)).sum())},
            {"name": "21-23", "value": int(((df['edad'] > 20) & (df['edad'] <= 23)).sum())},
            {"name": "24+", "value": int((df['edad'] > 23).sum())}
        ]
    support = {
        "beca_pct": round(float((df['beca'].astype(str).str.contains('S', na=False)).mean() * 100), 1) if 'beca' in df.columns else 0,
        "internet_pct": round(float((df['acceso_internet'].astype(str).str.contains('S', na=False)).mean() * 100), 1) if 'acceso_internet' in df.columns else 0,
        "tutorias_pct": round(float((df['participa_tutorias'].astype(str).str.contains('S', na=False)).mean() * 100), 1) if 'participa_tutorias' in df.columns else 0
    }
    return { "gender": gender, "work": work, "distance": distance, "age": age, "support": support }

@app.get("/api/drilldown/data")
async def get_drilldown_data(carrera: str = None, semestre: str = None, search: str = None):
    if df.empty: return []
    filtered = df.copy()
    if carrera: filtered = filtered[filtered['carrera'] == carrera]
    if semestre: 
        try: filtered = filtered[filtered['semestre'].astype(str).str.contains(str(semestre))]
        except: pass
    if search:
        filtered = filtered[filtered['id_estudiante'].astype(str).str.contains(search.upper())]
    return filtered.to_dict(orient="records")

@app.get("/api/patterns")
async def get_patterns_api():
    return {
        "global": [{"name": "Asistencia", "value": 85}, {"name": "Promedio", "value": 72}, {"name": "Plataforma", "value": 45}],
        "reprobacion": [{"name": "Promedio Anterior", "value": 90}, {"name": "Materias Previas", "value": 82}],
        "desercion": [{"name": "Asistencia", "value": 95}, {"name": "Índice Socioeconómico", "value": 78}]
    }

@app.get("/api/drilldown/filters")
async def get_filters():
    if df.empty: return {"carreras": [], "semestres": []}
    return {
        "carreras": sorted(df['carrera'].unique().tolist()),
        "semestres": [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }

@app.get("/api/stats")
async def get_stats():
    if df.empty: return {"total_estudiantes": 0, "tasa_desercion": 0, "tasa_reprobacion": 0, "prioridad_dist": {}}
    return {
        "total_estudiantes": len(df),
        "tasa_desercion": round(float(df['deserto'].mean() * 100), 1) if 'deserto' in df.columns else 0,
        "tasa_reprobacion": round(float(df['reprobo'].mean() * 100), 1) if 'reprobo' in df.columns else 0,
        "prioridad_dist": df['prioridad'].value_counts().to_dict()
    }

@app.get("/api/dashboard/impact")
async def get_impact_data():
    if df.empty: return []
    impact = df.groupby('carrera').agg({'deserto': 'mean', 'reprobo': 'mean'}).reset_index()
    impact['reprobation_rate'] = (impact['reprobo'] * 100).round(1)
    impact['desertion_rate'] = (impact['deserto'] * 100).round(1)
    return impact.to_dict(orient="records")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
