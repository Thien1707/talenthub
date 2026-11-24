from pptx import Presentation

prs = Presentation(r'D:\TalentHub\Poster_mau_CDTN2_60x90.pptx')
slide = prs.slides[0]

for idx in [2, 3, 4, 8, 9, 11, 13, 16, 19, 22, 30, 31, 39]:
    shape = slide.shapes[idx]
    fill = shape.fill
    print(f'Shape #{idx} [{shape.name}] fill type: {fill.type}')
    try:
        print(f'   color: {fill.fore_color.rgb}')
    except Exception as e:
        print(f'   no rgb: {e}')
