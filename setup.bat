@echo off
echo Configurando el entorno con el Dataset Oficial ITNL...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error al instalar dependencias.
    pause
    exit /b
)
echo Iniciando el Dashboard Inteligente...
python -m streamlit run app/main.py
pause
