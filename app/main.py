import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import os

# Configuración institucional
st.set_page_config(
    page_title="SAT ITNL | Gestión de Permanencia",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- CSS DE BLOQUEO TOTAL ABSOLUTO ---
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    .stApp { background-color: #FFFFFF !important; }
    [data-testid="stAppViewContainer"] section.main * { color: #1E3D59 !important; font-family: 'Poppins', sans-serif !important; }
    [data-testid="stMarkdownContainer"] * { color: #1E3D59 !important; }
    h1, h2, h3, .section-title { color: #1E3D59 !important; font-weight: 800 !important; }
    .section-title { border-left: 10px solid #FF6E40 !important; padding-left: 20px !important; margin-bottom: 30px !important; display: block; font-size: 2.2rem; }
    .stAlert, .stAlert * { color: #000000 !important; }
    [data-testid="stWidgetLabel"] *, label p { color: #1E3D59 !important; font-weight: 700 !important; }
    [data-testid="stSidebar"] *, [data-testid="stSidebar"] span { color: #FFFFFF !important; }
    .stButton > button, .stButton > button * { color: #FFFFFF !important; }
    [data-baseweb="select"] div, ul[role="listbox"] * { background-color: #FFFFFF !important; color: #1E3D59 !important; }
    </style>
    """, unsafe_allow_html=True)

# Lógica de Diagnóstico Refinada (Incorpora Patrones de Comportamiento Digital)
def obtener_diagnostico(promedio, asistencia, reprobadas, tareas, plataforma):
    # Puntos de Riesgo de Comportamiento
    riesgo_comportamiento = tareas < 70 or plataforma < 3
    desconexion_total = tareas < 50 and plataforma < 2

    if (promedio < 70 and asistencia < 70) or desconexion_total:
        return "⚠️ CRÍTICO", "Intervención de emergencia. El alumno muestra desconexión total o incumplimiento académico grave."
    elif promedio < 70 or asistencia < 70 or reprobadas > 2 or tareas < 65:
        return "🔴 ALTO", "Riesgo de reprobación elevado. El patrón de entrega de tareas o asistencia es insuficiente."
    elif promedio <= 79 or asistencia <= 79 or riesgo_comportamiento:
        return "🟡 PREVENTIVO", "Zona de riesgo moderado. Se detectan alertas en el comportamiento digital o promedio (70-79)."
    else:
        return "🟢 ESTABLE", "Desempeño y comportamiento óptimo. El alumno cumple con los estándares institucionales."

# Carga de datos
@st.cache_data
def load_data():
    path = 'dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv'
    if os.path.exists(path):
        df = pd.read_csv(path)
        
        # Inyectar Materias y Maestros de forma determinista
        materias_por_carrera = {
            'Ingeniería en Sistemas Computacionales': [
                'Estructura de Datos', 'Programación Orientada a Objetos', 'Sistemas Operativos', 
                'Base de Datos', 'Redes de Computadoras', 'Inteligencia Artificial', 'Ingeniería de Software'
            ],
            'Ingeniería Industrial': [
                'Cálculo Diferencial', 'Estadística Industrial', 'Procesos de Fabricación', 
                'Logística y Suministros', 'Ergonomía', 'Gestión de Calidad'
            ],
            'Licenciatura en Administración': [
                'Administración de Empresas', 'Contabilidad Financiera', 'Recursos Humanos', 
                'Mercadotecnia', 'Comportamiento Organizacional', 'Finanzas'
            ]
        }
        materias_generales = ['Cálculo Integral', 'Física', 'Química', 'Taller de Ética', 'Fundamentos de Investigación']
        maestros_pool = ['Dr. Arriaga', 'M.C. Rodriguez', 'Ing. Garcia', 'Dra. Sanchez', 'M.A. Lopez', 'Ing. Martinez', 'Dr. Perez']

        def asignar_materia(row):
            np.random.seed(int(row['id_estudiante'].split('-')[-1]) if '-' in str(row['id_estudiante']) else hash(str(row['id_estudiante'])) % 10000)
            carrera = row['carrera']
            opciones = materias_por_carrera.get(carrera, materias_generales)
            return np.random.choice(opciones)

        def asignar_maestro(row):
            np.random.seed(hash(row['materia']) % 10000)
            return np.random.choice(maestros_pool)

        df['materia'] = df.apply(asignar_materia, axis=1)
        df['maestro'] = df.apply(asignar_maestro, axis=1)

        df['Estatus'] = df['deserto'].map({0: 'Permanencia', 1: 'Deserción'})
        df['Prioridad'] = df.apply(lambda r: obtener_diagnostico(
            r['promedio_anterior'], 
            r['porcentaje_asistencia'], 
            r['materias_reprobadas_previas'],
            r['entregas_tareas_pct'],
            r['uso_plataforma_semana']
        )[0], axis=1)
        return df
    return None

df = load_data()

# Navegación Sidebar
with st.sidebar:
    st.markdown("<h2 style='text-align: center; color: white;'>ITNL - ISC</h2>", unsafe_allow_html=True)
    st.markdown("---")
    menu = st.radio("SISTEMA DE GESTIÓN", 
                    ["Vista Ejecutiva", "Análisis de Factores", "Drill-Down Académico", "Modelo Predictivo", "Listado de Intervención", "Simulador de Riesgo"])
    st.markdown("---")
    st.write("Mayo 2026")

if df is not None:
    plt.rcParams.update({'figure.facecolor': 'white', 'text.color': '#1E3D59'})

    if menu == "Vista Ejecutiva":
        st.markdown("<h1 class='section-title'>Análisis de Permanencia Estudiantil</h1>", unsafe_allow_html=True)
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Estudiantes", f"{len(df):,}")
        k2.metric("Índice Deserción", f"{df['deserto'].mean()*100:.1f}%")
        k3.metric("Casos Críticos", len(df[df['Prioridad'] == "⚠️ CRÍTICO"]))
        k4.metric("Promedio Institucional", f"{df['promedio_anterior'].mean():.1f}")
        st.markdown("---")
        cl, cr = st.columns([7, 3])
        with cl:
            st.subheader("Distribución Académica por Carrera")
            fig, ax = plt.subplots(figsize=(10, 5))
            sns.countplot(data=df, y='carrera', hue='carrera', palette='Blues_r', ax=ax, legend=False)
            st.pyplot(fig)
        with cr:
            st.subheader("Semáforo de Riesgo (ITNL)")
            counts = df['Prioridad'].value_counts()
            for nivel, total in counts.items():
                st.write(f"**{nivel}:** {total} alumnos")

    elif menu == "Análisis de Factores":
        st.markdown("<h1 class='section-title'>Estudio de Factores de Riesgo</h1>", unsafe_allow_html=True)
        sel = st.selectbox("Filtrar Carrera:", ["Todas"] + list(df['carrera'].unique()))
        df_f = df if sel == "Todas" else df[df['carrera'] == sel]
        t1, t2 = st.tabs(["Rendimiento Académico", "Esfuerzo Digital"])
        with t1:
            c1, c2, c3 = st.columns(3)
            with c1:
                st.write("### Asistencia vs Estatus")
                fig, ax = plt.subplots()
                sns.boxplot(data=df_f, x='Estatus', y='porcentaje_asistencia', palette='vlag', ax=ax)
                st.pyplot(fig)
            with c2:
                st.write("### Entrega de Tareas (%)")
                fig, ax = plt.subplots()
                sns.boxplot(data=df_f, x='Estatus', y='entregas_tareas_pct', palette='viridis', ax=ax)
                st.pyplot(fig)
            with c3:
                st.write("### Distribución de Calificaciones")
                fig, ax = plt.subplots()
                sns.histplot(data=df_f, x='promedio_anterior', hue='Estatus', kde=True, ax=ax)
                st.pyplot(fig)

    elif menu == "Drill-Down Académico":
        st.markdown("<h1 class='section-title'>Drill-Down: Riesgo por Materia</h1>", unsafe_allow_html=True)
        st.write("Navegue a través de la jerarquía institucional para identificar focos rojos.")

        # Jerarquía de Navegación
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            carrera_sel = st.selectbox("1. Seleccione Carrera", ["Todas"] + sorted(list(df['carrera'].unique())))
            df_drill = df if carrera_sel == "Todas" else df[df['carrera'] == carrera_sel]

        with col2:
            semestres = sorted(list(df_drill['semestre'].unique()))
            semestre_sel = st.selectbox("2. Seleccione Semestre", ["Todos"] + semestres)
            if semestre_sel != "Todos":
                df_drill = df_drill[df_drill['semestre'] == semestre_sel]

        with col3:
            materias = sorted(list(df_drill['materia'].unique()))
            materia_sel = st.selectbox("3. Seleccione Materia", ["Todas"] + materias)
            if materia_sel != "Todas":
                df_drill = df_drill[df_drill['materia'] == materia_sel]

        with col4:
            maestros = sorted(list(df_drill['maestro'].unique()))
            maestro_sel = st.selectbox("4. Seleccione Maestro", ["Todos"] + maestros)
            if maestro_sel != "Todos":
                df_drill = df_drill[df_drill['maestro'] == maestro_sel]

        st.markdown("---")

        # Visualización de Resultados del Drill-Down
        m1, m2, m3 = st.columns(3)
        riesgo_alto_critico = df_drill[df_drill['Prioridad'].isin(["⚠️ CRÍTICO", "🔴 ALTO"])]
        
        m1.metric("Alumnos en Segmento", len(df_drill))
        m2.metric("En Riesgo Alto/Crítico", len(riesgo_alto_critico))
        m3.metric("Probabilidad Deserción", f"{(df_drill['deserto'].mean()*100):.1f}%")

        c_left, c_right = st.columns([6, 4])
        
        with c_left:
            st.subheader("Concentración de Riesgo")
            if not df_drill.empty:
                fig, ax = plt.subplots(figsize=(10, 4))
                sns.countplot(data=df_drill, x='Prioridad', order=["⚠️ CRÍTICO", "🔴 ALTO", "🟡 PREVENTIVO", "🟢 ESTABLE"], palette={'⚠️ CRÍTICO': 'black', '🔴 ALTO': 'red', '🟡 PREVENTIVO': 'orange', '🟢 ESTABLE': 'green'}, ax=ax)
                st.pyplot(fig)
            else:
                st.info("No hay datos para esta selección.")

        with c_right:
            st.subheader("Top Alumnos con Mayor Riesgo")
            if not riesgo_alto_critico.empty:
                st.dataframe(
                    riesgo_alto_critico[['id_estudiante', 'promedio_anterior', 'porcentaje_asistencia', 'Prioridad']]
                    .sort_values(by='promedio_anterior')
                    .head(10),
                    use_container_width=True
                )
            else:
                st.success("No se detectaron alumnos en riesgo crítico para este filtro.")

        if materia_sel != "Todas" and maestro_sel == "Todos":
            st.subheader(f"Análisis por Maestro en {materia_sel}")
            maestro_stats = df_drill.groupby('maestro').agg({
                'id_estudiante': 'count',
                'deserto': 'mean',
                'promedio_anterior': 'mean'
            }).reset_index()
            maestro_stats.columns = ['Maestro', 'Total Alumnos', 'Índice Deserción', 'Promedio Grupal']
            st.table(maestro_stats.sort_values(by='Índice Deserción', ascending=False))

    elif menu == "Modelo Predictivo":
        st.markdown("<h1 class='section-title'>Inteligencia Predictiva</h1>", unsafe_allow_html=True)
        if st.button("EJECUTAR ANÁLISIS DE INDICADORES"):
            X = df.drop(['id_estudiante', 'deserto', 'reprobo', 'riesgo_academico', 'Estatus', 'Prioridad'], axis=1)
            X = pd.get_dummies(X)
            y = df['deserto']
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
            st.success(f"Análisis Finalizado. Fiabilidad: {model.score(X_test, y_test)*100:.1f}%")
            st.subheader("Variables Determinantes")
            imp = pd.Series(model.feature_importances_, index=X.columns).sort_values().tail(10)
            fig, ax = plt.subplots()
            imp.plot(kind='barh', color='#1E3D59', ax=ax)
            st.pyplot(fig)

    elif menu == "Listado de Intervención":
        st.markdown("<h1 class='section-title'>Listado de Prioridad Académica</h1>", unsafe_allow_html=True)
        nivel_f = st.multiselect("Filtrar por Estatus:", ["⚠️ CRÍTICO", "🔴 ALTO", "🟡 PREVENTIVO", "🟢 ESTABLE"], default=["⚠️ CRÍTICO", "🔴 ALTO", "🟡 PREVENTIVO"])
        df_listado = df[df['Prioridad'].isin(nivel_f)]
        st.dataframe(df_listado[['id_estudiante', 'carrera', 'promedio_anterior', 'porcentaje_asistencia', 'materias_reprobadas_previas', 'Prioridad']], use_container_width=True)
        st.markdown("---")
        st.subheader("Protocolos Institucionales Sugeridos")
        st.error("**⚠️ CRÍTICO / 🔴 ALTO:** Alumnos con indicadores de reprobación inmediata.")
        st.warning("**🟡 PREVENTIVO:** Alumnos en zona gris (70-79). Requieren orientación para evitar la caída en el promedio.")

    elif menu == "Simulador de Riesgo":
        st.markdown("<h1 class='section-title'>Simulador de Riesgo Preventivo</h1>", unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            st.subheader("Indicadores Académicos")
            v_p = st.slider("Promedio Institucional", 0.0, 100.0, 75.0)
            v_a = st.slider("Nivel de Asistencia (%)", 0.0, 100.0, 85.0)
            v_r = st.number_input("Materias Reprobadas", 0, 15, 0)
        with c2:
            st.subheader("Patrón de Comportamiento")
            v_t = st.slider("Entrega de Tareas (%)", 0.0, 100.0, 90.0)
            v_pl = st.slider("Uso de Plataforma (hrs/sem)", 0.0, 20.0, 5.0)
            v_b = st.selectbox("¿Cuenta con Beca?", ["Sí", "No"])

        if st.button("GENERAR DIAGNÓSTICO DE RIESGO"):
            nivel, desc = obtener_diagnostico(v_p, v_a, v_r, v_t, v_pl)
            st.markdown("---")
            st.subheader(f"Estatus Resultante: {nivel}")
            if "⚠️" in nivel or "🔴" in nivel:
                st.error(desc)
            elif "🟡" in nivel:
                st.warning(desc)
            else:
                st.success(desc)
else:
    st.error("Repositorio institucional no encontrado.")
