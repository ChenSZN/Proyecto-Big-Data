export interface ExplainerItem {
  title: string;
  concept: string;
  formula: string;
  pandasCode: string;
  sqlCode: string;
}

export const explainerRegistry: Record<string, ExplainerItem> = {
  total_estudiantes: {
    title: "Total de Alumnos",
    concept: "Representa el volumen total de matrícula o registros estudiantiles disponibles en el conjunto de datos institucional para el período académico actual. Este número sirve como denominador base para todos los cálculos de tasas del sistema.",
    formula: "Población Total (N) = Número Total de Registros en la Tabla",
    pandasCode: `import pandas as pd

# Cargar el conjunto de datos
df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Contar la cantidad de registros (estudiantes)
total_estudiantes = len(df)
print(f"Total de estudiantes: {total_estudiantes}")`,
    sqlCode: `-- Contar el total de filas en la tabla de estudiantes
SELECT COUNT(*) AS total_estudiantes 
FROM estudiantes;`
  },
  tasa_desercion: {
    title: "Tasa de Deserción",
    concept: "Porcentaje de estudiantes que han interrumpido definitivamente sus estudios (abandonado la institución) respecto al total de la población estudiantil en el segmento analizado.",
    formula: "Tasa Deserción = (Alumnos Desertores / Alumnos Totales) * 100",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# 'deserto' es una columna binaria (1 si abandonó, 0 si continúa)
tasa_desercion = df['deserto'].mean() * 100
tasa_desercion_redondeada = round(tasa_desercion, 1)

print(f"Tasa de Deserción: {tasa_desercion_redondeada}%")`,
    sqlCode: `-- El promedio de una columna binaria (0 o 1) multiplicado por 100 
-- equivale al porcentaje de la clase que desertó
SELECT ROUND(AVG(deserto) * 100, 1) AS tasa_desercion 
FROM estudiantes;`
  },
  tasa_reprobacion: {
    title: "Tasa de Reprobación",
    concept: "Porcentaje de estudiantes que reprobaron al menos una asignatura durante el ciclo evaluado, lo cual es considerado uno de los desencadenantes principales de la deserción escolar en el ITNL.",
    formula: "Tasa Reprobación = (Alumnos Reprobados / Alumnos Totales) * 100",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# 'reprobo' es una columna binaria (1 si reprobó, 0 si no)
tasa_reprobacion = df['reprobo'].mean() * 100
tasa_reprobacion_redondeada = round(tasa_reprobacion, 1)

print(f"Tasa de Reprobación: {tasa_reprobacion_redondeada}%")`,
    sqlCode: `-- Calcula el promedio de la variable binaria 'reprobo'
SELECT ROUND(AVG(reprobo) * 100, 1) AS tasa_reprobacion 
FROM estudiantes;`
  },
  tasa_retencion: {
    title: "Tasa de Retención",
    concept: "Porcentaje de estudiantes que continúan activamente inscritos en la institución educativa. Es la métrica complementaria a la deserción y representa el éxito de las políticas de permanencia.",
    formula: "Tasa Retención = 100 - Tasa Deserción",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# La tasa de permanencia es el porcentaje opuesto a la deserción
tasa_retencion = (1 - df['deserto'].mean()) * 100
print(f"Tasa de Retención: {round(tasa_retencion, 1)}%")`,
    sqlCode: `-- Resta el porcentaje medio de deserción a 100
SELECT ROUND((1 - AVG(deserto)) * 100, 1) AS tasa_retencion 
FROM estudiantes;`
  },
  impacto_carrera: {
    title: "Análisis de Impacto por Carrera",
    concept: "Agrupa a los estudiantes por su carrera técnica o de ingeniería y calcula la tasa de reprobación en cada grupo. Esto permite identificar qué programas académicos están experimentando las mayores dificultades curriculares y requieren atención prioritaria.",
    formula: "Tasa por Carrera = (Alumnos Reprobados en Carrera X / Alumnos Totales en Carrera X) * 100",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Agrupar por carrera y calcular el porcentaje promedio de reprobación
impacto = df.groupby('carrera').agg({'reprobo': 'mean'}).reset_index()
impacto['reprobation_rate'] = (impacto['reprobo'] * 100).round(1)

# Ordenar de mayor a menor tasa de reprobación
impacto_ordenado = impacto.sort_values('reprobation_rate', ascending=False)
print(impacto_ordenado[['carrera', 'reprobation_rate']])`,
    sqlCode: `-- Agrupamiento y ordenamiento de reprobados por carrera
SELECT carrera, ROUND(AVG(reprobo) * 100, 1) AS tasa_reprobacion
FROM estudiantes
GROUP BY carrera
ORDER BY tasa_reprobacion DESC;`
  },
  evolucion_semestre: {
    title: "Evolución de Riesgo por Semestre",
    concept: "Muestra las tasas de deserción y reprobación agregadas por semestre cursado. Permite visualizar si el riesgo académico se concentra en los primeros semestres (por problemas de adaptación) o en semestres avanzados.",
    formula: "Tasa Semestre S = (Alumnos con Evento en Semestre S / Alumnos Totales en Semestre S) * 100",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Agrupar por semestre académico
tendencias = df.groupby('semestre').agg({'deserto': 'mean', 'reprobo': 'mean'}).reset_index()
tendencias['deserto'] = (tendencias['deserto'] * 100).round(1)
tendencias['reprobo'] = (tendencias['reprobo'] * 100).round(1)

# Ordenar cronológicamente
tendencias = tendencias.sort_values('semestre')
print(tendencias)`,
    sqlCode: `-- Comparación de tendencias de riesgo a lo largo de los semestres
SELECT semestre, 
       ROUND(AVG(deserto) * 100, 1) AS tasa_desercion,
       ROUND(AVG(reprobo) * 100, 1) AS tasa_reprobacion
FROM estudiantes
GROUP BY semestre
ORDER BY semestre ASC;`
  },
  rendimiento_segmento: {
    title: "Métricas por Segmento de Riesgo",
    concept: "Compara los promedios aritméticos de los principales indicadores conductuales y académicos entre los estudiantes clasificados con Prioridad ALTA de riesgo frente a los de Prioridad BAJA. Expone el abismo de rendimiento entre ambos perfiles.",
    formula: "Promedio Indicador_I (Riesgo R) = Suma(Valor_I en R) / Total(Estudiantes en R)",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Mapear prioridad si no existe
# df['prioridad'] = df['riesgo_academico']

for risk in ['ALTO', 'BAJO']:
    sub = df[df['riesgo_academico'].str.upper() == risk]
    if not sub.empty:
        print(f"--- Perfil de Riesgo {risk} ---")
        print(f"Asistencia Promedio: {sub['porcentaje_asistencia'].mean():.1f}%")
        print(f"Promedio Académico: {sub['promedio_anterior'].mean():.1f}")
        print(f"Plataforma Semanal: {sub['uso_plataforma_semana'].mean():.1f} hrs")
        print(f"Tareas Entregadas: {sub['entregas_tareas_pct'].mean():.1f}%")`,
    sqlCode: `-- Comparación de perfiles de riesgo mediante agregaciones
SELECT riesgo_academico,
       ROUND(AVG(porcentaje_asistencia), 1) AS avg_asistencia,
       ROUND(AVG(promedio_anterior), 1) AS avg_promedio,
       ROUND(AVG(uso_plataforma_semana), 1) AS avg_uso_plataforma,
       ROUND(AVG(entregas_tareas_pct), 1) AS avg_entregas_tareas
FROM estudiantes
WHERE riesgo_academico IN ('ALTO', 'BAJO')
GROUP BY riesgo_academico;`
  },
  peso_asistencia: {
    title: "Influencia de la Asistencia",
    concept: "La correlación de Pearson demuestra que el ausentismo escolar es el principal factor desencadenante del fracaso escolar en el Tecnológico. Alumnos con asistencia menor al 75% tienen una probabilidad de reprobación críticamente superior.",
    formula: "Correlación (Asistencia, Deserción) = Covarianza(A, D) / (StdDev(A) * StdDev(D))",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Medir la correlación estadística entre porcentaje de asistencia y la deserción
correlacion = df['porcentaje_asistencia'].corr(df['deserto'])
peso_porcentual = abs(correlacion) * 100

print(f"Peso del factor Asistencia: {peso_porcentual:.1f}% de correlación con deserción")`,
    sqlCode: `-- Cálculo matemático de correlación lineal (Pearson) en SQL
SELECT 
  (AVG(porcentaje_asistencia * deserto) - AVG(porcentaje_asistencia) * AVG(deserto)) / 
  (STDDEV(porcentaje_asistencia) * STDDEV(deserto)) * 100 AS correlacion_asistencia_desercion
FROM estudiantes;`
  },
  impacto_plataforma: {
    title: "Impacto del Uso de la Plataforma",
    concept: "El tiempo dedicado a la plataforma virtual (Moodle/Teams) sirve como indicador del nivel de autoestudio y compromiso digital continuo del estudiante fuera de las aulas.",
    formula: "Correlación (Uso Plataforma, Deserción) = Covarianza(U, D) / (StdDev(U) * StdDev(D))",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Correlación entre horas de plataforma y deserción
correlacion = df['uso_plataforma_semana'].corr(df['deserto'])
peso_porcentual = abs(correlacion) * 100

print(f"Peso del factor Plataforma: {peso_porcentual:.1f}%")`,
    sqlCode: `-- Cálculo de correlación para el uso de plataforma
SELECT 
  (AVG(uso_plataforma_semana * deserto) - AVG(uso_plataforma_semana) * AVG(deserto)) / 
  (STDDEV(uso_plataforma_semana) * STDDEV(deserto)) * 100 AS correlacion_plataforma
FROM estudiantes;`
  },
  entrega_tareas_prog: {
    title: "Impacto de la Entrega de Tareas",
    concept: "Porcentaje de tareas completadas a tiempo. Es un indicador directo del esfuerzo académico diario. La falta de entregas (<65%) dispara la reprobación exponencialmente.",
    formula: "Correlación (Entrega Tareas, Deserción) = Covarianza(T, D) / (StdDev(T) * StdDev(D))",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Correlación entre porcentaje de tareas entregadas y deserción
correlacion = df['entregas_tareas_pct'].corr(df['deserto'])
peso_porcentual = abs(correlacion) * 100

print(f"Peso del factor Tareas: {peso_porcentual:.1f}%")`,
    sqlCode: `-- Cálculo de correlación para entrega de tareas
SELECT 
  (AVG(entregas_tareas_pct * deserto) - AVG(entregas_tareas_pct) * AVG(deserto)) / 
  (STDDEV(entregas_tareas_pct) * STDDEV(deserto)) * 100 AS correlacion_tareas
FROM estudiantes;`
  },
  tabla_estudiantes: {
    title: "Explorador de Alumnos (Drill-Down)",
    concept: "Permite explorar y auditar de forma individual e interactiva la información académica de la población de estudiantes. La búsqueda y filtros se ejecutan en el servidor para evitar sobrecargar el navegador del cliente.",
    formula: "Búsqueda = Filtrar filas donde id_estudiante coincida con el patrón de búsqueda",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Filtro en cascada (Ejemplo: Carrera de Sistemas en 4º semestre)
carrera_f = "INGENIERÍA EN SISTEMAS COMPUTACIONALES"
semestre_f = 4
search_query = "AL"

# Aplicar filtros
filtrado = df[(df['carrera'] == carrera_f) & (df['semestre'] == semestre_f)]

# Aplicar búsqueda por prefijo de ID
if search_query:
    filtrado = filtrado[filtrado['id_estudiante'].str.contains(search_query.upper(), na=False)]

print(filtrado[['id_estudiante', 'promedio_anterior', 'porcentaje_asistencia', 'riesgo_academico']])`,
    sqlCode: `-- Búsqueda filtrada para el Drill-down
SELECT id_estudiante, carrera, promedio_anterior, porcentaje_asistencia, riesgo_academico
FROM estudiantes
WHERE carrera = 'INGENIERÍA EN SISTEMAS COMPUTACIONALES'
  AND semestre = 4
  AND id_estudiante LIKE '%AL%';`
  },
  filtro_prioridad: {
    title: "Filtros de Prioridad de Riesgo",
    concept: "Segmenta a los estudiantes en niveles de riesgo específicos (BAJO, MEDIO, ALTO) aplicando la lógica del semáforo institucional basada en asistencia, promedio de calificaciones y materias reprobadas previamente.",
    formula: "Reglas lógicas del Semáforo de Alerta Escolar",
    pandasCode: `def clasificar_riesgo(row):
    promedio = row['promedio_anterior']
    asistencia = row['porcentaje_asistencia']
    reprobadas = row['materias_reprobadas_previas']
    
    if promedio < 70 and asistencia < 70:
        return "⚠️ CRÍTICO"
    elif promedio < 70 or asistencia < 70 or reprobadas > 2:
        return "ALTO"
    elif promedio <= 79 or asistencia <= 79:
        return "MEDIO"
    else:
        return "BAJO"

# Aplicación de reglas sobre el DataFrame
# df['Prioridad'] = df.apply(clasificar_riesgo, axis=1)
# print(df['Prioridad'].value_counts())`,
    sqlCode: `-- Clasificación mediante estructura condicional CASE
SELECT id_estudiante,
  CASE 
    WHEN promedio_anterior < 70 AND porcentaje_asistencia < 70 THEN 'CRÍTICO'
    WHEN promedio_anterior < 70 OR porcentaje_asistencia < 70 OR materias_reprobadas_previas > 2 THEN 'ALTO'
    WHEN promedio_anterior <= 79 OR porcentaje_asistencia <= 79 THEN 'MEDIO'
    ELSE 'BAJO'
  END AS nivel_riesgo
FROM estudiantes;`
  },
  distribucion_genero: {
    title: "Distribución de Género",
    concept: "Visualiza la proporción de estudiantes masculinos y femeninos registrados. Es de gran utilidad para analizar tendencias de deserción y reprobación con perspectiva de género en las diversas carreras técnicas.",
    formula: "Proporción Género G = (Alumnos del Género G / Total de Alumnos) * 100",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Conteo de ocurrencias de cada género
genero_counts = df['genero'].value_counts()
print(genero_counts)`,
    sqlCode: `-- Conteo grupal de género
SELECT genero, COUNT(*) AS cantidad, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS porcentaje
FROM estudiantes
GROUP BY genero;`
  },
  situacion_laboral: {
    title: "Situación Laboral de Alumnos",
    concept: "Clasifica a los alumnos según si trabajan de manera paralela a sus estudios. La necesidad de trabajar reduce significativamente las horas disponibles para el estudio y la plataforma digital, incrementando el riesgo de deserción.",
    formula: "Tasa Ocupación = (Alumnos que Trabajan / Total de Alumnos) * 100",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Cantidad y porcentaje de alumnos que laboran
trabaja_counts = df['trabaja'].value_counts()
print(trabaja_counts)`,
    sqlCode: `-- Conteo de alumnos trabajadores
SELECT trabaja, COUNT(*) AS total
FROM estudiantes
GROUP BY trabaja;`
  },
  rango_edad: {
    title: "Distribución por Rangos de Edad",
    concept: "Agrupa y cuantifica a los estudiantes por segmentos etarios. Esto ayuda a comprender si la deserción afecta mayoritariamente a estudiantes jóvenes recién egresados de preparatoria o a alumnos adultos.",
    formula: "Intervalos: [18-20] Jóvenes, [21-23] Tradicionales, [24+] Adultos",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Agrupar edades en contenedores (bins)
df['age_bin'] = pd.cut(df['edad'], bins=[0, 20, 23, 100], labels=['18-20', '21-23', '24+'])
age_counts = df['age_bin'].value_counts().reindex(['18-20', '21-23', '24+'])

print(age_counts)`,
    sqlCode: `-- Agrupamiento por categorías de edad
SELECT 
  CASE 
    WHEN edad <= 20 THEN '18-20'
    WHEN edad >= 21 AND edad <= 23 THEN '21-23'
    ELSE '24+'
  END AS rango_edad,
  COUNT(*) AS total_estudiantes
FROM estudiantes
GROUP BY rango_edad;`
  },
  distancia_campus: {
    title: "Movilidad: Distancia al Campus",
    concept: "Clasifica a los estudiantes en función de la distancia (en kilómetros) de su residencia al campus. El tiempo prolongado de traslado (en el segmento >15km) genera cansancio e inasistencias reiteradas.",
    formula: "Grupos de Distancia: Residente Cercano (0-5km), Medio (6-15km) y Foráneo (15km+)",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Categorizar distancia residencial
df['dist_bin'] = pd.cut(df['distancia_km'], bins=[0, 5, 15, 999], labels=['0-5km', '6-15km', '15km+'])
dist_counts = df['dist_bin'].value_counts()

print(dist_counts)`,
    sqlCode: `-- Clasificación de distancia de traslado
SELECT 
  CASE 
    WHEN distancia_km <= 5 THEN '0-5km'
    WHEN distancia_km > 5 AND distancia_km <= 15 THEN '6-15km'
    ELSE '15km+'
  END AS distancia_rango,
  COUNT(*) AS total
FROM estudiantes
GROUP BY distancia_rango;`
  },
  factores_permanencia: {
    title: "Factores de Apoyo y Permanencia",
    concept: "Muestra el porcentaje de estudiantes que cuentan con apoyos clave que mitigan el riesgo de abandono escolar, tales como: Beca económica, Internet en casa, y Tutorías preventivas de profesores.",
    formula: "Cobertura Factor F = (Estudiantes con Apoyo F / Total de Estudiantes) * 100",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

def calcular_cobertura(columna):
    # Detectar porcentaje de respuestas positivas
    s = df[columna].astype(str).str.strip().str.upper()
    cobertura = s.isin(['SI', 'SÍ', 'S', '1', 'YES']).mean() * 100
    return round(cobertura, 1)

print(f"Tasa de internet: {calcular_cobertura('acceso_internet')}%")
print(f"Tasa de beca: {calcular_cobertura('beca')}%")
print(f"Tasa de tutorías: {calcular_cobertura('participa_tutorias')}%")`,
    sqlCode: `-- Porcentaje de alumnos con apoyos activos
SELECT 
  ROUND(AVG(CASE WHEN acceso_internet IN ('SI','SÍ','1','YES') THEN 1 ELSE 0 END) * 100, 1) AS internet_pct,
  ROUND(AVG(CASE WHEN beca IN ('SI','SÍ','1','YES') THEN 1 ELSE 0 END) * 100, 1) AS beca_pct,
  ROUND(AVG(CASE WHEN participa_tutorias IN ('SI','SÍ','1','YES') THEN 1 ELSE 0 END) * 100, 1) AS tutorias_pct
FROM estudiantes;`
  },
  patrones_ml: {
    title: "Patrones de Riesgo por Machine Learning",
    concept: "Ejecuta un análisis de importancia de factores del repositorio para identificar qué variables son las más correlacionadas con la reprobación. Utiliza correlación de Pearson frente al semáforo de prioridad estudiantil.",
    formula: "Importancia de Factor V = |Correlación Pearson(V, Prioridad_Num)| * 100",
    pandasCode: `import pandas as pd

df = pd.read_csv("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")

# Mapear prioridad cualitativa a escala numérica cuantitativa
df['prioridad_num'] = df['riesgo_academico'].map({'ALTO': 1.0, 'MEDIO': 0.5, 'BAJO': 0.0}).fillna(0)

def calcular_importancia(col):
    # Correlación numérica
    corr = df[col].corr(df['prioridad_num'])
    return round(abs(corr) * 100, 1)

factores = ['porcentaje_asistencia', 'promedio_anterior', 'entregas_tareas_pct', 'uso_plataforma_semana']
for f in factores:
    print(f"Importancia de {f}: {calcular_importancia(f)}%")`,
    sqlCode: `-- Análisis multivariado básico: Correlaciones con el riesgo numérico
WITH ConPrioridad AS (
  SELECT *,
         CASE WHEN riesgo_academico = 'ALTO' THEN 1.0 
              WHEN riesgo_academico = 'MEDIO' THEN 0.5 
              ELSE 0.0 END AS prioridad_num
  FROM estudiantes
)
SELECT 
  (AVG(porcentaje_asistencia * prioridad_num) - AVG(porcentaje_asistencia) * AVG(prioridad_num)) / 
  (STDDEV(porcentaje_asistencia) * STDDEV(prioridad_num)) * 100 AS corr_asistencia,
  (AVG(promedio_anterior * prioridad_num) - AVG(promedio_anterior) * AVG(prioridad_num)) / 
  (STDDEV(promedio_anterior) * STDDEV(prioridad_num)) * 100 AS corr_promedio
FROM ConPrioridad;`
  },
  predict_simulador: {
    title: "Algoritmo del Simulador Predictivo",
    concept: "Calcula una puntuación de riesgo agregada ponderando las estadísticas de comportamiento académico del estudiante. Dependiendo del puntaje obtenido, clasifica el riesgo en niveles de prioridad y genera recomendaciones automatizadas.",
    formula: "Puntaje Riesgo = Asistencia(40%) + Tareas(25%) + Promedio(15%) + Reprobadas(12%) + Plataforma(8%)",
    pandasCode: `def simular_riesgo(promedio, asistencia, plataforma, tareas, reprobadas):
    score = 0.0
    
    # Asistencia (Peso 40%)
    if asistencia < 70: score += 40.0
    elif asistencia < 80: score += 25.0
    elif asistencia < 90: score += 10.0
        
    # Tareas (Peso 25%)
    if tareas < 60: score += 25.0
    elif tareas < 75: score += 15.0
    elif tareas < 85: score += 5.0
        
    # Promedio (Peso 15%)
    if promedio < 70: score += 15.0
    elif promedio < 80: score += 8.0
        
    # Reprobadas (Peso 12%)
    if reprobadas > 2: score += 12.0
    elif reprobadas > 0: score += 6.0
        
    # Plataforma (Peso 8%)
    if plataforma < 3: score += 8.0
    elif plataforma < 6: score += 4.0

    probabilidad = min(max(score, 5.0), 99.0)
    return probabilidad

prob_riesgo = simular_riesgo(promedio=75, asistencia=85, plataforma=5, tareas=70, reprobadas=0)
print(f"Probabilidad de Fallo: {prob_riesgo}%")`,
    sqlCode: `-- Cálculo interactivo del simulador en SQL
SELECT id_estudiante,
  -- Sumar pesos condicionales de riesgo
  (CASE WHEN porcentaje_asistencia < 70 THEN 40.0 WHEN porcentaje_asistencia < 80 THEN 25.0 WHEN porcentaje_asistencia < 90 THEN 10.0 ELSE 0.0 END +
   CASE WHEN entregas_tareas_pct < 60 THEN 25.0 WHEN entregas_tareas_pct < 75 THEN 15.0 WHEN entregas_tareas_pct < 85 THEN 5.0 ELSE 0.0 END +
   CASE WHEN promedio_anterior < 70 THEN 15.0 WHEN promedio_anterior < 80 THEN 8.0 ELSE 0.0 END +
   CASE WHEN materias_reprobadas_previas > 2 THEN 12.0 WHEN materias_reprobadas_previas > 0 THEN 6.0 ELSE 0.0 END +
   CASE WHEN uso_plataforma_semana < 3 THEN 8.0 WHEN uso_plataforma_semana < 6 THEN 4.0 ELSE 0.0 END) AS score_simulado
FROM estudiantes
LIMIT 5;`
  }
};
