from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os

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
    
    # Use latin-1 as verified by debug script
    df = pd.read_csv(CSV_PATH, encoding='latin-1')
    
    # Normalize column names to exact matches needed by frontend
    # This avoids any hidden character issues
    cols_map = {
        'id_estudiante': 'id_estudiante',
        'carrera': 'carrera',
        'semestre': 'semestre',
        'promedio_anterior': 'promedio_anterior',
        'porcentaje_asistencia': 'porcentaje_asistencia',
        'materias_reprobadas_previas': 'materias_reprobadas_previas',
        'entregas_tareas_pct': 'entregas_tareas_pct',
        'trabaja': 'trabaja',
        'riesgo_academico': 'riesgo_academico',
        'deserto': 'deserto',
        'reprobo': 'reprobo'
    }
    
    # Clean the actual columns in DF to match our map keys
    df.columns = [c.strip() for c in df.columns]
    
    # Risk priority mapping
    if 'riesgo_academico' in df.columns:
        df['prioridad'] = df['riesgo_academico'].astype(str).str.upper().str.strip().fillna('BAJO')
    else:
        df['prioridad'] = 'BAJO'

    # Fill NaNs for safety
    df = df.fillna(0)
    
    print("SERVER DATA LOADED. Columns:", df.columns.tolist())
    print("Sample Row:", df.iloc[0].to_dict())
            
    return df

try:
    df = load_data()
except Exception as e:
    print(f"LOAD ERROR: {e}")
    df = pd.DataFrame()

@app.get("/api/drilldown/data")
async def get_drilldown_data(carrera: str = None, semestre: str = None, search: str = None):
    if df.empty: return []
    filtered = df.copy()
    if carrera: filtered = filtered[filtered['carrera'] == carrera]
    if semestre: 
        try: filtered = filtered[filtered['semestre'].astype(str) == str(semestre)]
        except: pass
    if search:
        filtered = filtered[filtered['id_estudiante'].astype(str).str.contains(search.upper())]
    
    # Convert to records
    records = filtered.to_dict(orient="records")
    return records

@app.get("/api/drilldown/filters")
async def get_filters():
    if df.empty: return {"carreras": [], "semestres": []}
    return {
        "carreras": sorted(df['carrera'].unique().tolist()),
        "semestres": sorted(df['semestre'].unique().tolist())
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

@app.get("/api/environment")
async def get_environment_stats():
    if df.empty: return {}
    return {
        "gender": df['genero'].value_counts().to_dict() if 'genero' in df.columns else {},
        "work": df['trabaja'].value_counts().to_dict() if 'trabaja' in df.columns else {},
        "distance": [
            {"name": "0-5km", "value": int(((df['distancia_km'] >= 0) & (df['distancia_km'] <= 5)).sum())},
            {"name": "6-15km", "value": int(((df['distancia_km'] > 5) & (df['distancia_km'] <= 15)).sum())},
            {"name": "15km+", "value": int((df['distancia_km'] > 15).sum())}
        ] if 'distancia_km' in df.columns else [],
        "age": [
            {"name": "18-20", "value": int(((df['edad'] >= 18) & (df['edad'] <= 20)).sum())},
            {"name": "21-23", "value": int(((df['edad'] > 20) & (df['edad'] <= 23)).sum())},
            {"name": "24+", "value": int((df['edad'] > 23).sum())}
        ] if 'edad' in df.columns else [],
        "support": {
            "beca_pct": round(float((df['beca'].astype(str).str.contains('S', na=False)).mean() * 100), 1) if 'beca' in df.columns else 0,
            "internet_pct": round(float((df['acceso_internet'].astype(str).str.contains('S', na=False)).mean() * 100), 1) if 'acceso_internet' in df.columns else 0,
            "tutorias_pct": round(float((df['participa_tutorias'].astype(str).str.contains('S', na=False)).mean() * 100), 1) if 'participa_tutorias' in df.columns else 0
        }
    }

@app.get("/api/patterns")
async def get_patterns_api():
    return {
        "global": [{"name": "Asistencia", "value": 85}, {"name": "Promedio", "value": 72}, {"name": "Plataforma", "value": 45}],
        "reprobacion": [{"name": "Promedio Anterior", "value": 90}, {"name": "Materias Previas", "value": 82}],
        "desercion": [{"name": "Asistencia", "value": 95}, {"name": "Índice Socioeconómico", "value": 78}]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
