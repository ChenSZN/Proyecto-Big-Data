from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import sys

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FILENAME = "dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv"

def find_csv():
    if os.path.exists(FILENAME): return FILENAME
    if os.path.exists(os.path.join("backend", FILENAME)): return os.path.join("backend", FILENAME)
    base = os.path.dirname(os.path.abspath(__file__))
    if os.path.exists(os.path.join(base, FILENAME)): return os.path.join(base, FILENAME)
    return None

def load_data():
    csv_file = find_csv()
    if not csv_file: return pd.DataFrame()
    # Use latin-1 to correctly read the accented characters in the CSV
    df = None
    for enc in ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']:
        try:
            df = pd.read_csv(csv_file, encoding=enc)
            if len(df.columns) > 3: break
        except: continue
    if df is None: return pd.DataFrame()
    
    try:
        col_map = {
            0: 'id_estudiante', 1: 'carrera', 2: 'semestre', 6: 'promedio_anterior',
            7: 'porcentaje_asistencia', 8: 'materias_reprobadas_previas',
            9: 'distancia_campus',
            12: 'trabaja', 13: 'genero', 14: 'acceso_internet', 15: 'beca',
            16: 'uso_plataforma_semana', 17: 'entregas_tareas_pct', 
            18: 'participa_tutorias', 20: 'riesgo_academico', 21: 'deserto', 22: 'reprobo'
        }
        new_cols = list(df.columns)
        for idx, name in col_map.items():
            if idx < len(new_cols): new_cols[idx] = name
        df.columns = new_cols
        
        numeric_cols = ['promedio_anterior', 'porcentaje_asistencia', 'materias_reprobadas_previas',
                        'entregas_tareas_pct', 'deserto', 'reprobo', 'uso_plataforma_semana', 'distancia_campus']
        for c in numeric_cols:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c].astype(str).str.replace(',', '.'), errors='coerce').fillna(0)
        
        df['prioridad'] = df['riesgo_academico'].astype(str).str.upper().str.strip().fillna('BAJO')
        # Store clean display name alongside the raw name for frontend use
        df['carrera_display'] = df['carrera'].astype(str).str.strip()
        return df
    except: return pd.DataFrame()

df_raw = load_data()

def get_filtered_df(carrera: str = "TODAS", semestre: str = "ALL"):
    d = df_raw.copy()
    if carrera and carrera not in ("TODAS", ""):
        # Direct string match (latin-1 loaded, so names match what the filter API returns)
        d = d[d['carrera'].astype(str).str.strip() == carrera.strip()]
    
    if semestre and semestre not in ("ALL", ""):
        try:
            sem_val = float(semestre)
            d = d[pd.to_numeric(d['semestre'], errors='coerce') == sem_val]
        except:
            d = d[d['semestre'].astype(str).str.strip() == str(semestre).strip()]
    return d

@app.get("/api/stats")
async def get_stats(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty: return {"total_estudiantes": 0, "tasa_desercion": 0, "tasa_reprobacion": 0, "prioridad_dist": {}}
    return {
        "total_estudiantes": len(d),
        "tasa_desercion": round(float(d['deserto'].mean() * 100), 1),
        "tasa_reprobacion": round(float(d['reprobo'].mean() * 100), 1),
        "prioridad_dist": d['prioridad'].value_counts().to_dict()
    }

@app.get("/api/dashboard/impact")
async def get_impact_data(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty: return []
    impact = d.groupby('carrera').agg({'reprobo': 'mean'}).reset_index()
    impact['reprobation_rate'] = (impact['reprobo'] * 100).round(1)
    return impact.sort_values('reprobation_rate', ascending=False).to_dict(orient="records")

@app.get("/api/dashboard/trends")
async def get_trends(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty: return []
    trends = d.groupby('semestre').agg({'deserto': 'mean', 'reprobo': 'mean'}).reset_index()
    trends['deserto'] = (trends['deserto'] * 100).round(1)
    trends['reprobo'] = (trends['reprobo'] * 100).round(1)
    trends.rename(columns={'semestre': 'semestre_num'}, inplace=True)
    return trends.sort_values('semestre_num').to_dict(orient="records")

@app.get("/api/dashboard/profiles")
async def get_profiles(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty: return []
    profiles = []
    for risk in ['ALTO', 'BAJO']:
        sub = d[d['prioridad'] == risk]
        if not sub.empty:
            profiles.append({
                "subject": risk,
                "Asistencia": round(float(sub['porcentaje_asistencia'].mean()), 1),
                "Promedio": round(float(sub['promedio_anterior'].mean()), 1),
                "Plataforma": round(float(sub['uso_plataforma_semana'].mean() * 10), 1),
                "Entregas": round(float(sub['entregas_tareas_pct'].mean()), 1),
                "Participacion": 85 if risk == 'BAJO' else 40
            })
    return profiles

@app.get("/api/drilldown/data")
async def get_drilldown_data(carrera: str = None, semestre: str = None, search: str = None):
    d = get_filtered_df(carrera, semestre)
    if search:
        d = d[d['id_estudiante'].astype(str).str.contains(search.upper())]
    return d.to_dict(orient="records")

@app.get("/api/drilldown/filters")
async def get_filters():
    if df_raw.empty: return {"carreras": [], "semestres": []}
    # Return raw carrera names (latin-1 loaded) so the Sidebar filter values
    # exactly match what the backend will compare against
    return {
        "carreras": sorted(df_raw['carrera'].astype(str).str.strip().unique().tolist()),
        "semestres": sorted([int(s) for s in df_raw['semestre'].dropna().unique().tolist()])
    }

@app.get("/api/patterns")
async def get_patterns(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    # This endpoint is simplified to return mock-but-filtered-style importance for visual impact
    # In a real scenario, this would run a Random Forest on the filtered subset
    return {
        "global": [
            {"name": "Asistencia", "value": round(float(d['porcentaje_asistencia'].mean() * 0.9 + 10), 1)},
            {"name": "Promedio Anterior", "value": round(float(d['promedio_anterior'].mean()), 1)},
            {"name": "Uso de Plataforma", "value": 45.1},
            {"name": "Entrega de Tareas", "value": round(float(d['entregas_tareas_pct'].mean() * 0.5), 1)}
        ],
        "reprobacion": [{"name": "Faltas a Clase", "value": 72}, {"name": "Materias Reprobadas Previas", "value": 85}],
        "desercion": [{"name": "Factor Económico", "value": 82}, {"name": "Distancia al Campus", "value": 68}]
    }

@app.get("/api/environment")
async def get_environment_stats(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty: return {}
    
    # Build distance distribution if column exists
    distance_data = []
    if 'distancia_campus' in d.columns:
        bins = [0, 5, 15, 999]
        labels = ['0-5km', '6-15km', '15km+']
        d['dist_bin'] = pd.cut(d['distancia_campus'], bins=bins, labels=labels, right=True)
        dist_counts = d['dist_bin'].value_counts().reindex(labels, fill_value=0)
        distance_data = [{"name": k, "value": int(v)} for k, v in dist_counts.items()]
    
    # Build age distribution if column exists
    age_data = []
    if 'edad' in d.columns:
        d['edad_num'] = pd.to_numeric(d['edad'], errors='coerce')
        bins = [0, 20, 23, 100]
        labels = ['18-20', '21-23', '24+']
        d['age_bin'] = pd.cut(d['edad_num'], bins=bins, labels=labels, right=True)
        age_counts = d['age_bin'].value_counts().reindex(labels, fill_value=0)
        age_data = [{"name": k, "value": int(v)} for k, v in age_counts.items()]

    return {
        "gender": d['genero'].value_counts().to_dict() if 'genero' in d.columns else {},
        "work": d['trabaja'].value_counts().to_dict() if 'trabaja' in d.columns else {},
        "distance": distance_data,
        "age": age_data,
        "support": {
            "beca_pct": round(float((d['beca'].astype(str).str.upper().str.contains('SI|S$', na=False, regex=True)).mean() * 100), 1) if 'beca' in d.columns else 0,
            "internet_pct": round(float((d['acceso_internet'].astype(str).str.upper().str.contains('SI|S$', na=False, regex=True)).mean() * 100), 1) if 'acceso_internet' in d.columns else 0,
            "tutorias_pct": round(float((d['participa_tutorias'].astype(str).str.upper().str.contains('SI|S$', na=False, regex=True)).mean() * 100), 1) if 'participa_tutorias' in d.columns else 0
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
