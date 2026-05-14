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

# RENDER-PROOF PATHING
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Try multiple possible locations for the CSV
possible_paths = [
    os.path.join(BASE_DIR, "dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv"),
    os.path.join(os.path.dirname(BASE_DIR), "dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv"),
    "dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv"
]

def load_data():
    csv_file = None
    for p in possible_paths:
        if os.path.exists(p):
            csv_file = p
            print(f"FOUND CSV AT: {p}")
            break
            
    if not csv_file:
        print("CSV NOT FOUND IN ANY LOCATION")
        return pd.DataFrame()
    
    try:
        # Use latin-1 as verified
        df = pd.read_csv(csv_file, encoding='latin-1')
        
        # PHYSICAL COLUMN MAPPING (The absolute most reliable way)
        # 0:id, 1:carrera, 2:semestre, 6:prom_ant, 7:asist, 8:previas, 12:trabaja, 17:tareas, 20:riesgo, 21:deserto, 22:reprobo
        col_map = {
            0: 'id_estudiante', 1: 'carrera', 2: 'semestre', 6: 'promedio_anterior',
            7: 'porcentaje_asistencia', 8: 'materias_reprobadas_previas',
            12: 'trabaja', 17: 'entregas_tareas_pct', 20: 'riesgo_academico',
            21: 'deserto', 22: 'reprobo'
        }
        
        new_cols = list(df.columns)
        for idx, name in col_map.items():
            if idx < len(new_cols):
                new_cols[idx] = name
        df.columns = new_cols
        
        # Numeric Force
        for c in ['promedio_anterior', 'porcentaje_asistencia', 'materias_reprobadas_previas', 'entregas_tareas_pct', 'deserto', 'reprobo']:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c].astype(str).str.replace(',', '.'), errors='coerce').fillna(0)
        
        if 'riesgo_academico' in df.columns:
            df['prioridad'] = df['riesgo_academico'].astype(str).str.upper().str.strip().fillna('BAJO')
        else:
            df['prioridad'] = 'BAJO'
            
        return df
    except Exception as e:
        print(f"LOAD ERROR: {e}")
        return pd.DataFrame()

df = load_data()

@app.get("/")
async def root():
    return {"status": "online", "rows": len(df), "csv_found": not df.empty}

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
    import os
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
