from pptx import Presentation

prs = Presentation(r'D:\TalentHub\Poster_mau_CDTN2_60x90.pptx')
slide = prs.slides[0]

for idx in [0, 1, 3, 4, 5, 7, 10, 14, 15, 26, 27, 29, 31, 38, 41, 42, 43]:
    shape = slide.shapes[idx]
    print(f'=== Shape #{idx} [{shape.name}] ===')
    if shape.has_text_frame:
        for p_idx, p in enumerate(shape.text_frame.paragraphs):
            for r_idx, r in enumerate(p.runs):
                font_name = r.font.name
                font_size = r.font.size.pt if r.font.size else None
                bold = r.font.bold
                color = None
                try:
                    if r.font.color and r.font.color.rgb:
                        color = str(r.font.color.rgb)
                except Exception:
                    pass
                print(f'  P{p_idx} R{r_idx}: {repr(r.text)} | Font: {font_name}, {font_size}pt, bold={bold}, color={color}')
