from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import os
import io

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
    try:
        # CSV is UTF-8 with BOM — read as binary, strip BOM, decode as UTF-8
        with open(csv_file, 'rb') as f:
            raw = f.read()
        if raw.startswith(b'\xef\xbb\xbf'):
            raw = raw[3:]
        df = pd.read_csv(io.StringIO(raw.decode('utf-8')))
        
        # CSV already has named headers — just normalize column names
        df.columns = [c.strip() for c in df.columns]
        
        # Numeric conversion for key columns
        numeric_cols = [
            'promedio_anterior', 'porcentaje_asistencia', 'materias_reprobadas_previas',
            'entregas_tareas_pct', 'deserto', 'reprobo', 'uso_plataforma_semana',
            'distancia_km', 'edad', 'indice_socioeconomico', 'horas_trabajo_semana',
            'creditos_inscritos'
        ]
        for c in numeric_cols:
            if c in df.columns:
                df[c] = pd.to_numeric(df[c].astype(str).str.replace(',', '.'), errors='coerce').fillna(0)

        df['semestre'] = pd.to_numeric(df['semestre'], errors='coerce').fillna(0).astype(int)
        df['prioridad'] = df['riesgo_academico'].astype(str).str.upper().str.strip()
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame()

df_raw = load_data()
print(f"Dataset loaded: {len(df_raw)} rows, columns: {list(df_raw.columns)}")

def get_filtered_df(carrera: str = None, semestre: str = None):
    d = df_raw.copy()
    if carrera and carrera not in ("TODAS", ""):
        d = d[d['carrera'].astype(str).str.strip() == carrera.strip()]
    if semestre and semestre not in ("ALL", ""):
        try:
            sem_val = int(float(semestre))
            d = d[d['semestre'] == sem_val]
        except:
            pass
    return d

# ─── STATS ────────────────────────────────────────────────────────────────────
@app.get("/api/stats")
async def get_stats(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty:
        return {"total_estudiantes": 0, "tasa_desercion": 0, "tasa_reprobacion": 0, "prioridad_dist": {}}
    return {
        "total_estudiantes": len(d),
        "tasa_desercion": round(float(d['deserto'].mean() * 100), 1),
        "tasa_reprobacion": round(float(d['reprobo'].mean() * 100), 1),
        "prioridad_dist": d['prioridad'].value_counts().to_dict()
    }

# ─── DASHBOARD ────────────────────────────────────────────────────────────────
@app.get("/api/dashboard/impact")
async def get_impact_data(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty: return []
    impact = d.groupby('carrera').agg(
        reprobation_rate=('reprobo', lambda x: round(float(x.mean() * 100), 1)),
        total_students=('reprobo', 'count'),
        total_reprobados=('reprobo', lambda x: int(x.sum()))
    ).reset_index()
    return impact.sort_values('reprobation_rate', ascending=False).to_dict(orient="records")

@app.get("/api/dashboard/trends")
async def get_trends(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty: return []
    trends = d.groupby('semestre').agg(
        deserto_rate=('deserto', lambda x: round(float(x.mean() * 100), 1)),
        reprobation_rate=('reprobo', lambda x: round(float(x.mean() * 100), 1)),
        total_students=('reprobo', 'count'),
        total_deserto=('deserto', lambda x: int(x.sum())),
        total_reprobo=('reprobo', lambda x: int(x.sum()))
    ).reset_index()
    trends.rename(columns={'semestre': 'semestre_num', 'deserto_rate': 'deserto', 'reprobation_rate': 'reprobo'}, inplace=True)
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
                "Participacion": round(float((1 - sub['deserto'].mean()) * 100), 1)
            })
    return profiles

# ─── DRILLDOWN ────────────────────────────────────────────────────────────────
@app.get("/api/drilldown/data")
async def get_drilldown_data(carrera: str = None, semestre: str = None, search: str = None):
    d = get_filtered_df(carrera, semestre)
    if search:
        d = d[d['id_estudiante'].astype(str).str.contains(search.upper(), na=False)]
    
    if d.empty:
        return []
        
    records = d.to_dict(orient="records")
    for r in records:
        # Calcular Probabilidad de Reprobación
        p_rep = 5.0
        prom = float(r.get('promedio_anterior', 0))
        tareas = float(r.get('entregas_tareas_pct', 0))
        previas = int(r.get('materias_reprobadas_previas', 0))
        asis = float(r.get('porcentaje_asistencia', 0))
        
        if prom < 70: p_rep += 40
        elif prom < 80: p_rep += 20
        
        if tareas < 60: p_rep += 30
        elif tareas < 80: p_rep += 15
        
        if previas > 2: p_rep += 20
        elif previas > 0: p_rep += 10
        
        if asis < 75: p_rep += 10
        
        r['prob_reprobacion'] = min(max(p_rep, 5.0), 98.0)
        
        # Calcular Probabilidad de Deserción
        p_des = 5.0
        plataforma = float(r.get('uso_plataforma_semana', 0))
        horas_trabajo = float(r.get('horas_trabajo_semana', 0))
        distancia = float(r.get('distancia_km', 0))
        
        if asis < 70: p_des += 50
        elif asis < 80: p_des += 30
        elif asis < 90: p_des += 10
        
        if plataforma < 3: p_des += 20
        elif plataforma < 6: p_des += 10
        
        if horas_trabajo > 20: p_des += 15
        if distancia > 15: p_des += 15
        
        r['prob_desercion'] = min(max(p_des, 5.0), 98.0)
        
        # Determinar Motivo Principal
        if r['prioridad'] == 'BAJO':
            r['motivo_principal'] = "Estable"
        elif asis < 80:
            r['motivo_principal'] = "Inasistencias Críticas"
        elif prom < 70:
            r['motivo_principal'] = "Bajo Promedio"
        elif tareas < 70:
            r['motivo_principal'] = "Falta de Tareas"
        elif previas > 1:
            r['motivo_principal'] = "Arrastre de Materias"
        elif horas_trabajo > 25:
            r['motivo_principal'] = "Trabajo Excesivo"
        elif distancia > 20:
            r['motivo_principal'] = "Largo Traslado"
        else:
            r['motivo_principal'] = "Monitoreo Preventivo"
            
    return records

@app.get("/api/drilldown/filters")
async def get_filters():
    if df_raw.empty: return {"carreras": [], "semestres": []}
    return {
        "carreras": sorted(df_raw['carrera'].astype(str).str.strip().unique().tolist()),
        "semestres": sorted(df_raw['semestre'].dropna().unique().tolist())
    }

# ─── PATTERNS ─────────────────────────────────────────────────────────────────
@app.get("/api/patterns")
async def get_patterns(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty:
        return {"global": [], "reprobacion": [], "desercion": []}

    # Compute real correlation-based importance from the filtered subset
    alto = d[d['prioridad'] == 'ALTO']
    bajo = d[d['prioridad'] == 'BAJO']

    def importance(col):
        """Difference in means between high-risk and low-risk groups, normalized 0-100."""
        if col not in d.columns: return 0.0
        hi = pd.to_numeric(d[col], errors='coerce').dropna()
        if hi.std() == 0: return 0.0
        return round(abs(float(hi.corr(d['prioridad'].map({'ALTO': 1, 'MEDIO': 0.5}).fillna(0)))) * 100, 1)

    def mean_pct(subset, col):
        if col not in subset.columns or subset.empty: return 0.0
        return round(float(pd.to_numeric(subset[col], errors='coerce').mean()), 1)

    global_data = [
        {"name": "Asistencia a Clases",      "value": importance('porcentaje_asistencia')},
        {"name": "Promedio Académico",        "value": importance('promedio_anterior')},
        {"name": "Entrega de Tareas",         "value": importance('entregas_tareas_pct')},
        {"name": "Uso de Plataforma",         "value": importance('uso_plataforma_semana')},
        {"name": "Índice Socioeconómico",     "value": importance('indice_socioeconomico')},
    ]
    global_data.sort(key=lambda x: x['value'], reverse=True)

    reprobacion_data = [
        {"name": "Asistencia (Alto Riesgo)",  "value": mean_pct(alto, 'porcentaje_asistencia')},
        {"name": "Promedio (Alto Riesgo)",    "value": mean_pct(alto, 'promedio_anterior')},
        {"name": "Tareas (Alto Riesgo)",      "value": mean_pct(alto, 'entregas_tareas_pct')},
        {"name": "Asistencia (Bajo Riesgo)",  "value": mean_pct(bajo, 'porcentaje_asistencia')},
        {"name": "Promedio (Bajo Riesgo)",    "value": mean_pct(bajo, 'promedio_anterior')},
    ]

    desercion_data = [
        {"name": "Distancia al Campus",       "value": round(float(pd.to_numeric(d['distancia_km'], errors='coerce').mean()), 1) if 'distancia_km' in d.columns else 0},
        {"name": "Horas Trabajo Semanal",     "value": round(float(pd.to_numeric(d['horas_trabajo_semana'], errors='coerce').mean()), 1) if 'horas_trabajo_semana' in d.columns else 0},
        {"name": "Tasa Deserción Segmento",   "value": round(float(d['deserto'].mean() * 100), 1)},
        {"name": "Tasa Reprobación Segmento", "value": round(float(d['reprobo'].mean() * 100), 1)},
        {"name": "Índice Socioeconómico",     "value": round(float(pd.to_numeric(d['indice_socioeconomico'], errors='coerce').mean()), 1) if 'indice_socioeconomico' in d.columns else 0},
    ]

    return {"global": global_data, "reprobacion": reprobacion_data, "desercion": desercion_data}

# ─── ENVIRONMENT ──────────────────────────────────────────────────────────────
@app.get("/api/environment")
async def get_environment_stats(carrera: str = None, semestre: str = None):
    d = get_filtered_df(carrera, semestre)
    if d.empty: return {}

    # Gender distribution
    gender_data = d['genero'].value_counts().to_dict() if 'genero' in d.columns else {}

    # Work situation
    work_data = d['trabaja'].value_counts().to_dict() if 'trabaja' in d.columns else {}

    # Distance distribution
    distance_data = []
    if 'distancia_km' in d.columns:
        d_copy = d.copy()
        d_copy['dist_bin'] = pd.cut(
            pd.to_numeric(d_copy['distancia_km'], errors='coerce'),
            bins=[0, 5, 15, 999], labels=['0-5km', '6-15km', '15km+'], right=True
        )
        dist_counts = d_copy['dist_bin'].value_counts().reindex(['0-5km', '6-15km', '15km+'], fill_value=0)
        distance_data = [{"name": k, "value": int(v)} for k, v in dist_counts.items()]

    # Age distribution
    age_data = []
    if 'edad' in d.columns:
        d_copy2 = d.copy()
        d_copy2['age_bin'] = pd.cut(
            pd.to_numeric(d_copy2['edad'], errors='coerce'),
            bins=[0, 20, 23, 100], labels=['18-20', '21-23', '24+'], right=True
        )
        age_counts = d_copy2['age_bin'].value_counts().reindex(['18-20', '21-23', '24+'], fill_value=0)
        age_data = [{"name": k, "value": int(v)} for k, v in age_counts.items()]

    # Support indicators — check for Si/No or 1/0 values
    def pct_yes(col):
        if col not in d.columns: return 0.0
        s = d[col].astype(str).str.strip().str.upper()
        numeric_check = pd.to_numeric(d[col], errors='coerce')
        if numeric_check.notna().sum() > len(d) * 0.5:
            return round(float(numeric_check.mean() * 100), 1)
        return round(float(s.isin(['SI', 'SÍ', 'S', '1', 'YES']).mean() * 100), 1)

    return {
        "gender": gender_data,
        "work": work_data,
        "distance": distance_data,
        "age": age_data,
        "support": {
            "beca_pct": pct_yes('beca'),
            "internet_pct": pct_yes('acceso_internet'),
            "tutorias_pct": pct_yes('participa_tutorias'),
        }
    }

from pydantic import BaseModel

class PredictionInput(BaseModel):
    v_p: float
    v_a: float
    v_u: float
    v_t: float
    v_r: int

@app.post("/api/predict")
async def predict_risk(data: PredictionInput):
    # Lógica ponderada basada en el análisis exploratorio y de patrones
    score = 0.0
    
    # Asistencia (Peso de hasta 40 puntos de riesgo)
    if data.v_a < 70:
        score += 40.0
    elif data.v_a < 80:
        score += 25.0
    elif data.v_a < 90:
        score += 10.0
        
    # Entrega de Tareas (Peso de hasta 25 puntos de riesgo)
    if data.v_t < 60:
        score += 25.0
    elif data.v_t < 75:
        score += 15.0
    elif data.v_t < 85:
        score += 5.0
        
    # Promedio Académico (Peso de hasta 15 puntos de riesgo)
    if data.v_p < 70:
        score += 15.0
    elif data.v_p < 80:
        score += 8.0
        
    # Materias Reprobadas (Peso de hasta 12 puntos de riesgo)
    if data.v_r > 2:
        score += 12.0
    elif data.v_r > 0:
        score += 6.0
        
    # Uso de plataforma virtual (Peso de hasta 8 puntos de riesgo)
    if data.v_u < 3:
        score += 8.0
    elif data.v_u < 6:
        score += 4.0

    probabilidad = min(max(score, 5.0), 99.0)
    
    # Clasificación final del riesgo
    if data.v_a < 70 and data.v_p < 70:
        prioridad = "CRÍTICO"
        recomendacion = "Estatus de emergencia académica. Se sugiere intervención psicopedagógica y plan de regularización inmediato por inasistencias y promedio reprobatorio."
    elif probabilidad >= 50 or data.v_a < 75 or data.v_r > 2:
        prioridad = "ALTO"
        recomendacion = "Riesgo elevado de deserción o reprobación. Es fundamental citar al alumno a tutorías y revisar el cumplimiento de tareas pendientes."
    elif probabilidad >= 20 or data.v_p < 80:
        prioridad = "MEDIO"
        recomendacion = "Monitoreo preventivo sugerido. El alumno muestra rezago en algunos indicadores (asistencia o tareas) que podrían comprometer su permanencia."
    else:
        prioridad = "BAJO"
        recomendacion = "Desempeño óptimo. El estudiante mantiene un perfil de bajo riesgo. Continuar con el seguimiento académico habitual."

    return {
        "probabilidad": probabilidad,
        "prioridad": prioridad,
        "recomendacion": recomendacion
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

