from fastapi import FastAPI
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
    
    # INDEX-BASED MAPPING (The ultimate fix)
    # We map columns by their physical position to bypass any name/encoding issues
    # Physical order from CSV: id_est, carrera, sem, turno, edad, gen, prom, asist, previas, ..., plataforma, tareas, ...
    
    col_positions = {
        0: 'id_estudiante',
        1: 'carrera',
        2: 'semestre',
        6: 'promedio_anterior',
        7: 'porcentaje_asistencia',
        8: 'materias_reprobadas_previas',
        12: 'trabaja',
        15: 'acceso_internet',
        17: 'entregas_tareas_pct',
        20: 'riesgo_academico',
        21: 'deserto',
        22: 'reprobo'
    }
    
    new_cols = list(df.columns)
    for pos, name in col_positions.items():
        if pos < len(new_cols):
            new_cols[pos] = name
            
    df.columns = new_cols
    
    # Clean numeric data aggressively
    def force_num(val):
        try:
            if pd.isna(val): return 0.0
            s = str(val).replace(',', '.')
            # Extract first number found
            match = "".join(filter(lambda x: x.isdigit() or x == '.', s))
            return float(match) if match else 0.0
        except: return 0.0

    numeric_cols = ['promedio_anterior', 'porcentaje_asistencia', 'materias_reprobadas_previas', 'entregas_tareas_pct', 'deserto', 'reprobo']
    for c in numeric_cols:
        if c in df.columns:
            df[c] = df[c].apply(force_num)

    # Risk priority mapping
    if 'riesgo_academico' in df.columns:
        df['prioridad'] = df['riesgo_academico'].astype(str).str.upper().str.strip().fillna('BAJO')
    else:
        df['prioridad'] = 'BAJO'

    print("ULTIMATE DATA LOAD SUCCESS. Sample Check:")
    print(df[['id_estudiante', 'porcentaje_asistencia', 'materias_reprobadas_previas', 'entregas_tareas_pct']].head(2))
            
    return df

try:
    df = load_data()
except Exception as e:
    print(f"ULTIMATE LOAD ERROR: {e}")
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
    return filtered.to_dict(orient="records")

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
