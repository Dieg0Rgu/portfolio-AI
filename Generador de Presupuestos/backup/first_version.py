from io import BytesIO
from pathlib import Path

import streamlit as st
from fpdf import FPDF


st.set_page_config(
    page_title="Generador de presupuestos",
    page_icon="📄",
    layout="wide",
)

PLANTILLA = Path(__file__).parent / "Template.png"


def crear_pdf(
    proyecto: str,
    horas_estimadas: int,
    valor_hora: int,
    plazo_estimado: str,
    valor_total: int,
) -> bytes:
    pdf = FPDF(format="A4")
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.image(str(PLANTILLA), x=0, y=0, w=210, h=297)
    pdf.text(115, 145, proyecto)
    pdf.text(115, 160, str(horas_estimadas))
    pdf.text(115, 175, str(valor_hora))
    pdf.text(115, 190, plazo_estimado)
    pdf.text(115, 205, str(valor_total))

    return bytes(pdf.output())


st.title("Generador de presupuestos")
st.caption("Completa los datos del proyecto y genera un presupuesto profesional en PDF.")

if not PLANTILLA.exists():
    st.error("No se encontró Template.png en la carpeta del proyecto.")
    st.stop()

with st.form("formulario_presupuesto"):
    st.subheader("Datos del proyecto")

    col_proyecto, col_plazo = st.columns(2)
    with col_proyecto:
        proyecto = st.text_input(
            "Descripción del proyecto *",
            placeholder="Ej. Diseño de página web corporativa",
        )
    with col_plazo:
        plazo_estimado = st.text_input(
            "Plazo estimado *",
            placeholder="Ej. 3 semanas",
        )

    col_horas, col_valor = st.columns(2)
    with col_horas:
        horas_estimadas = st.number_input(
            "Horas estimadas *",
            min_value=1,
            step=1,
            value=None,
            placeholder="Cantidad de horas",
        )
    with col_valor:
        valor_hora = st.number_input(
            "Valor por hora *",
            min_value=1,
            step=1,
            value=None,
            placeholder="Valor en pesos",
        )

    generar = st.form_submit_button("Generar presupuesto", type="primary", width="stretch")

if generar:
    campos_incompletos = []
    if not proyecto.strip():
        campos_incompletos.append("la descripción del proyecto")
    if not plazo_estimado.strip():
        campos_incompletos.append("el plazo estimado")
    if horas_estimadas is None:
        campos_incompletos.append("las horas estimadas")
    if valor_hora is None:
        campos_incompletos.append("el valor por hora")

    if campos_incompletos:
        st.error(f"Completa {', '.join(campos_incompletos)} antes de generar el PDF.")
    else:
        valor_total = int(horas_estimadas) * int(valor_hora)
        st.session_state["presupuesto"] = {
            "proyecto": proyecto.strip(),
            "horas_estimadas": int(horas_estimadas),
            "valor_hora": int(valor_hora),
            "plazo_estimado": plazo_estimado.strip(),
            "valor_total": valor_total,
        }

presupuesto = st.session_state.get("presupuesto")
if presupuesto:
    st.divider()
    st.subheader("Vista previa")

    col_resumen, col_total = st.columns([2, 1])
    with col_resumen:
        st.write(f"**Proyecto:** {presupuesto['proyecto']}")
        st.write(f"**Horas estimadas:** {presupuesto['horas_estimadas']:,}")
        st.write(f"**Valor por hora:** ${presupuesto['valor_hora']:,}")
        st.write(f"**Plazo estimado:** {presupuesto['plazo_estimado']}")
    with col_total:
        st.metric("Valor total", f"${presupuesto['valor_total']:,}")

    pdf_bytes = crear_pdf(**presupuesto)
    st.download_button(
        label="Descargar presupuesto PDF",
        data=BytesIO(pdf_bytes),
        file_name="Presupuesto.pdf",
        mime="application/pdf",
        type="primary",
        width="stretch",
    )