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
    try:
        df = pd.read_csv(CSV_PATH, encoding='utf-8-sig')
    except:
        try:
            df = pd.read_csv(CSV_PATH, encoding='latin-1')
        except:
            return pd.DataFrame()
    
    df.columns = [c.lower().strip() for c in df.columns]
    
    if 'carrera' in df.columns:
        df['carrera'] = df['carrera'].astype(str).str.strip().replace(['nan', ''], 'CARRERA GENERAL')

    numeric_cols = [
        'promedio_anterior', 'porcentaje_asistencia', 'materias_reprobadas_previas', 
        'uso_plataforma_semana', 'entregas_tareas_pct', 'deserto', 'reprobo', 
        'edad', 'distancia_km', 'horas_trabajo_semana', 'indice_socioeconomico'
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    df['prioridad'] = df['riesgo_academico'].astype(str).str.upper().str.strip().fillna('BAJO')
    df['p_num'] = df['prioridad'].map({"ALTO": 3, "MEDIO": 2, "BAJO": 1}).fillna(1)
            
    return df

try:
    df = load_data()
except:
    df = pd.DataFrame()

@app.get("/")
async def root():
    return {"status": "online", "rows": len(df)}

@app.get("/api/environment")
async def get_environment_stats():
    if df.empty: return {}
    
    gender = df['genero'].value_counts().to_dict()
    work = df['trabaja'].value_counts().to_dict()
    
    distance = [
        {"name": "0-5km", "value": int(((df['distancia_km'] >= 0) & (df['distancia_km'] <= 5)).sum())},
        {"name": "6-15km", "value": int(((df['distancia_km'] > 5) & (df['distancia_km'] <= 15)).sum())},
        {"name": "15km+", "value": int((df['distancia_km'] > 15).sum())}
    ]
    
    age = [
        {"name": "18-20", "value": int(((df['edad'] >= 18) & (df['edad'] <= 20)).sum())},
        {"name": "21-23", "value": int(((df['edad'] > 20) & (df['edad'] <= 23)).sum())},
        {"name": "24+", "value": int((df['edad'] > 23).sum())}
    ]

    # REAL Institutional Support Stats
    beca_count = int((df['beca'] == 'Si').sum())
    beca_pct = round(float(beca_count / len(df) * 100), 1)
    
    internet_count = int((df['acceso_internet'] == 'Si').sum())
    internet_pct = round(float(internet_count / len(df) * 100), 1)
    
    tutorias_count = int((df['participa_tutorias'] == 'Si').sum())
    tutorias_pct = round(float(tutorias_count / len(df) * 100), 1)

    return {
        "gender": gender,
        "work": work,
        "distance": distance,
        "age": age,
        "support": {
            "beca_pct": beca_pct,
            "internet_pct": internet_pct,
            "tutorias_pct": tutorias_pct
        }
    }

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
        "tasa_desercion": round(float(df['deserto'].mean() * 100), 1),
        "tasa_reprobacion": round(float(df['reprobo'].mean() * 100), 1),
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
