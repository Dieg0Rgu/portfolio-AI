

import os
import streamlit as st
from fpdf import FPDF

# Configuración inicial de la página
st.set_page_config(
    page_title="Generador de Presupuestos",
    page_icon="📄",
    layout="wide"
)

def generar_pdf(proyecto: str, horas: int, valor_h: int, plazo: str, total: int) -> bytes:
    """Genera el PDF con la plantilla y coordenadas exactas."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Inserción de la plantilla si existe
    if os.path.exists("Template.png"):
        pdf.image("Template.png", x=0, y=0, w=210, h=297)

    # Posicionamiento exacto de los textos
    pdf.text(115, 145, str(proyecto))
    pdf.text(115, 160, str(horas))
    pdf.text(115, 175, f"${valor_h:,.0f}")
    pdf.text(115, 190, str(plazo))
    pdf.text(115, 205, f"${total:,.0f}")

    # Retorna los bytes del PDF de forma compatible con FPDF y FPDF2
    salida = pdf.output(dest="S")
    if isinstance(salida, str):
        return salida.encode("latin-1")
    return bytes(salida)

# Encabezado principal
st.title("💼 Generador de Presupuestos")
st.caption("Complete los datos requeridos para previsualizar y emitir el documento oficial.")
st.divider()

# Distribución en 2 columnas: Formulario y Vista Previa
col_form, col_resumen = st.columns([1.1, 0.9], gap="large")

with col_form:
    st.subheader("📋 Datos del Proyecto")
    
    proyecto = st.text_input(
        "Descripción del proyecto *",
        placeholder="Ej: Desarrollo de Sistema Web",
        help="Ingrese el nombre o alcance principal del proyecto."
    )
    
    col_num1, col_num2 = st.columns(2)
    with col_num1:
        horas_estimadas = st.number_input(
            "Horas estimadas *",
            min_value=0,
            step=1,
            value=0,
            help="Total de horas dedicadas estimadas."
        )
    with col_num2:
        valor_hora = st.number_input(
            "Valor por hora ($) *",
            min_value=0,
            step=1000,
            value=0,
            help="Costo por cada hora de trabajo."
        )
        
    plazo_estimado = st.text_input(
        "Plazo estimado *",
        placeholder="Ej: 2 semanas, 30 días",
        key="plazo",
        help="Tiempo previsto de entrega."
    )

with col_resumen:
    st.subheader("🔍 Resumen y Validación")
    
    valor_total = int(horas_estimadas * valor_hora)
    
    # Tarjeta de métrica destacada
    st.metric(label="Valor Total Estimado", value=f"${valor_total:,.0f}")
    
    # Desglose estructurado
    st.markdown("##### Vista Previa de la Información")
    st.markdown(f"- **Proyecto:** {proyecto if proyecto else '*(Pendiente)*'}")
    st.markdown(f"- **Horas calculadas:** {horas_estimadas} hrs")
    st.markdown(f"- **Tarifa por hora:** ${valor_hora:,.0f}")
    st.markdown(f"- **Plazo de ejecución:** {plazo_estimado if plazo_estimado else '*(Pendiente)*'}")
    
    # Validaciones obligatorias
    errores = []
    if not proyecto.strip():
        errores.append("La descripción del proyecto es obligatoria.")
    if horas_estimadas <= 0:
        errores.append("Las horas estimadas deben ser mayores a 0.")
    if valor_hora <= 0:
        errores.append("El valor por hora debe ser mayor a 0.")
    if not plazo_estimado.strip():
        errores.append("El plazo estimado es obligatorio.")
    if not os.path.exists("Template.png"):
        st.warning("⚠️ No se encontró 'Template.png' en el directorio. El PDF se creará sin fondo.")

    st.write("")
    
    # Renderizado condicional del botón de descarga según validaciones
    if errores:
        for err in errores:
            st.info(f"• {err}")
        st.button("📄 Generar y Descargar PDF", disabled=True, use_container_width=True)
    else:
        st.success("✅ Todos los campos han sido completados correctamente.")
        pdf_bytes = generar_pdf(
            proyecto=proyecto.strip(),
            horas=int(horas_estimadas),
            valor_h=int(valor_hora),
            plazo=plazo_estimado.strip(),
            total=valor_total
        )
        
        nombre_archivo = f"Presupuesto_{proyecto.strip().replace(' ', '_')}.pdf"
        
        st.download_button(
            label="⬇️ Descargar Presupuesto en PDF",
            data=pdf_bytes,
            file_name=nombre_archivo,
            mime="application/pdf",
            use_container_width=True,
            type="primary"
        )