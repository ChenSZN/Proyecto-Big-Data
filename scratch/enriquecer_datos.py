import pandas as pd
import random

# Diccionario de tildes para normalizar
def normalizar(texto):
    replacements = (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"))
    for a, b in replacements:
        texto = texto.lower().replace(a, b).replace(a.upper(), b.upper())
    return texto.upper().strip()

ESTRUCTURA = {
    "Ingeniería en Sistemas Computacionales": {
        "mapeo": {
            "Ing. Roberto Martinez": ["Fundamentos de Programacion", "Programacion Orientada a Objetos"],
            "Dr. Luis Garcia": ["Calculo Diferencial", "Calculo Integral", "Calculo Vectorial"],
            "M.C. Ana Rodriguez": ["Matematicas Discretas", "Estructura de Datos"],
            "Ing. Sofia Lopez": ["Sistemas Operativos", "Topicos Avanzados de Programacion"],
            "Dr. Jorge Perez": ["Ecuaciones Diferenciales", "Principios de IoT"]
        }
    },
    "Ingeniería Industrial": {
        "mapeo": {
            "Ing. Carlos Sanchez": ["Introduccion a la Ingenieria Industrial", "Procesos de Fabricacion"],
            "Dra. Elena Torres": ["Quimica", "Termodinamica"],
            "M.I. Pedro Ramirez": ["Probabilidad y Estadistica", "Estadistica Inferencial I"],
            "Ing. Monica Ruiz": ["Dibujo Industrial", "Metrologia y Normalizacion"],
            "Ing. Javier Hernandez": ["Estadistica Inferencial II", "Algoritmos y Programacion"]
        }
    },
    "Ingeniería Civil": {
        "mapeo": {
            "Ing. Manuel Espinoza": ["Introduccion a la Ingenieria Civil", "Estatica"],
            "Ing. Ricardo Flores": ["Calculo Diferencial", "Calculo Integral"],
            "Arq. Claudia Morales": ["Geologia", "Topografia"],
            "Ing. Antonio Castro": ["Mecanica de Materiales", "Analisis Estructural"],
            "Ing. Beatriz Vargas": ["Hidraulica de Canales", "Materiales y Procesos Constructivos"]
        }
    },
    "Licenciatura en Administración": {
        "mapeo": {
            "Lic. Patricia Guzman": ["Fundamentos de Administracion", "Gestion del Talento Humano"],
            "M.A. Fernando Ortiz": ["Contabilidad Orientada a los Negocios", "Finanzas en las Organizaciones"],
            "Lic. Gabriela Silva": ["Economia", "Mercadotecnia"],
            "Dr. Hugo Mendez": ["Estadistica para la Administracion I", "Estadistica para la Administracion II"],
            "Lic. Irene Paredes": ["Derecho Laboral", "Investigacion de Operaciones"]
        }
    }
}

def enriquecer_dataset_final(input_file):
    print("Iniciando enriquecimiento UTF-8...")
    df = pd.read_csv(input_file)
    carreras = list(ESTRUCTURA.keys())
    
    for i, row in df.iterrows():
        carrera = random.choice(carreras)
        maestro = random.choice(list(ESTRUCTURA[carrera]['mapeo'].keys()))
        materia = random.choice(ESTRUCTURA[carrera]['mapeo'][maestro])
        
        df.at[i, 'carrera'] = carrera
        df.at[i, 'maestro'] = maestro
        df.at[i, 'materia'] = materia
        df.at[i, 'semestre'] = random.randint(1, 4)

    # Guardar forzando UTF-8 y sin tildes para evitar errores de codificación
    df.to_csv(input_file, index=False, encoding='utf-8')
    print("Dataset normalizado guardado en UTF-8.")

if __name__ == "__main__":
    enriquecer_dataset_final("dataset_desercion_reprobacion_tecnologico_nuevo_laredo.csv")
