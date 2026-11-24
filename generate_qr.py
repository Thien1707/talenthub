# Minimal pure-Python QR Code generator (ISO/IEC 18004 compliant for Byte Mode)
from PIL import Image

GF256_EXP = [0] * 512
GF256_LOG = [0] * 256
x = 1
for i in range(255):
    GF256_EXP[i] = x
    GF256_LOG[x] = i
    x <<= 1
    if x & 0x100:
        x ^= 0x11D
for i in range(255, 512):
    GF256_EXP[i] = GF256_EXP[i - 255]

def gf_mul(x, y):
    if x == 0 or y == 0:
        return 0
    return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]]

def rs_encode(msg, nsym):
    gen = [1]
    for i in range(nsym):
        g = [1, GF256_EXP[i]]
        r = [0] * (len(gen) + len(g) - 1)
        for j in range(len(g)):
            for k in range(len(gen)):
                r[k + j] ^= gf_mul(gen[k], g[j])
        gen = r
    out = [0] * (len(msg) + nsym)
    out[:len(msg)] = msg
    for i in range(len(msg)):
        coef = out[i]
        if coef != 0:
            for j in range(len(gen)):
                out[i + j] ^= gf_mul(gen[j], coef)
    return out[len(msg):]

# Version 3-M: 29x29 matrix, 44 data codewords, 26 EC codewords (2 blocks of 22 data, 13 EC)
# Capacity for byte mode: up to 42 bytes.
# Version 4-M: 33x33 matrix, 64 data codewords, 36 EC codewords (2 blocks of 32 data, 18 EC)
# Let's use Version 4-L: 80 data codewords, 20 EC codewords (1 block of 80 data, 20 EC)
# Fits text up to 78 chars! "https://talenthub-gray.vercel.app" is 33 chars.

def create_qr_v4_l(text: str, output_path: str, scale=10):
    data = text.encode('utf-8')
    assert len(data) <= 78, "Data too long for V4-L"
    
    # 1. Bit stream: Mode indicator (0100 for Byte) + Character count (8 bits for V4)
    bits = [0, 1, 0, 0]
    c_len = len(data)
    for i in range(7, -1, -1):
        bits.append((c_len >> i) & 1)
    for b in data:
        for i in range(7, -1, -1):
            bits.append((b >> i) & 1)
    
    # Terminator: up to 4 zeros
    term_len = min(4, 80 * 8 - len(bits))
    bits.extend([0] * term_len)
    
    # Pad to byte boundary
    while len(bits) % 8 != 0:
        bits.append(0)
    
    # Pad codewords: 0xEC, 0x11
    pad_bytes = [0xEC, 0x11]
    pad_idx = 0
    codewords = []
    for i in range(0, len(bits), 8):
        byte = 0
        for j in range(8):
            byte = (byte << 1) | bits[i + j]
        codewords.append(byte)
    
    while len(codewords) < 80:
        codewords.append(pad_bytes[pad_idx % 2])
        pad_idx += 1
    
    # 2. Error correction: 1 block of 80 data bytes, 20 EC bytes
    ec_bytes = rs_encode(codewords, 20)
    all_codewords = codewords + ec_bytes
    
    # 3. Construct 33x33 matrix
    size = 33
    matrix = [[None] * size for _ in range(size)]
    is_function = [[False] * size for _ in range(size)]
    
    # Finder patterns at (0,0), (0, size-7), (size-7, 0)
    def place_finder(r, c):
        for dr in range(7):
            for dc in range(7):
                if dr in (0, 6) or dc in (0, 6) or (2 <= dr <= 4 and 2 <= dc <= 4):
                    matrix[r + dr][c + dc] = 1
                else:
                    matrix[r + dr][c + dc] = 0
                is_function[r + dr][c + dc] = True
        # Separators
        for dr in range(-1, 8):
            for dc in range(-1, 8):
                if 0 <= r + dr < size and 0 <= c + dc < size:
                    if not is_function[r + dr][c + dc]:
                        matrix[r + dr][c + dc] = 0
                        is_function[r + dr][c + dc] = True

    place_finder(0, 0)
    place_finder(0, size - 7)
    place_finder(size - 7, 0)
    
    # Alignment pattern for V4 at row 24, col 24 (center at 24)
    def place_alignment(r, c):
        for dr in range(-2, 3):
            for dc in range(-2, 3):
                if abs(dr) == 2 or abs(dc) == 2 or (dr == 0 and dc == 0):
                    matrix[r + dr][c + dc] = 1
                else:
                    matrix[r + dr][c + dc] = 0
                is_function[r + dr][c + dc] = True
    place_alignment(24, 24)
    
    # Timing patterns
    for i in range(8, size - 8):
        val = 1 if i % 2 == 0 else 0
        if not is_function[6][i]:
            matrix[6][i] = val
            is_function[6][i] = True
        if not is_function[i][6]:
            matrix[i][6] = val
            is_function[i][6] = True
            
    # Dark module
    matrix[size - 8][8] = 1
    is_function[size - 8][8] = True
    
    # Reserve format info areas
    for i in range(9):
        if not is_function[8][i]: is_function[8][i] = True
        if not is_function[i][8]: is_function[i][8] = True
    for i in range(size - 8, size):
        if not is_function[8][i]: is_function[8][i] = True
        if not is_function[i][8]: is_function[i][8] = True
        
    # Place data bits
    all_bits = []
    for cw in all_codewords:
        for i in range(7, -1, -1):
            all_bits.append((cw >> i) & 1)
            
    bit_idx = 0
    c = size - 1
    up = True
    while c > 0:
        if c == 6:  # skip vertical timing column
            c -= 1
        cols = [c, c - 1]
        rows = range(size - 1, -1, -1) if up else range(size)
        for r in rows:
            for col in cols:
                if not is_function[r][col]:
                    if bit_idx < len(all_bits):
                        matrix[r][col] = all_bits[bit_idx]
                        bit_idx += 1
                    else:
                        matrix[r][col] = 0
        up = not up
        c -= 2
        
    # Apply Mask 0: (row + col) % 2 == 0
    for r in range(size):
        for c in range(size):
            if not is_function[r][c]:
                if (r + c) % 2 == 0:
                    matrix[r][c] ^= 1
                    
    # Format info for L-0: EC=L (01), Mask=000 -> 01000 -> BCH encoded -> 011111001011010
    fmt = 0b011111001011010
    fmt_bits = [(fmt >> (14 - i)) & 1 for i in range(15)]
    
    # Top-left format bits
    coords_tl = [(8,0),(8,1),(8,2),(8,3),(8,4),(8,5),(8,7),(8,8),(7,8),(5,8),(4,8),(3,8),(2,8),(1,8),(0,8)]
    for (r, col), b in zip(coords_tl, fmt_bits):
        matrix[r][col] = b
        
    # Other format bits: bottom-left & top-right
    coords_bl = [(size-1-i, 8) for i in range(7)]
    coords_tr = [(8, size-8+i) for i in range(8)]
    for (r, col), b in zip(coords_bl + coords_tr, fmt_bits):
        matrix[r][col] = b

    # Render image
    border = 4
    img_size = (size + 2 * border) * scale
    img = Image.new("RGB", (img_size, img_size), "white")
    pixels = img.load()
    for r in range(size):
        for c in range(size):
            if matrix[r][c] == 1:
                for dr in range(scale):
                    for dc in range(scale):
                        pixels[(c + border) * scale + dc, (r + border) * scale + dr] = (0, 0, 0)
                        
    img.save(output_path, "PNG")
    print(f"QR generated successfully at {output_path} ({img_size}x{img_size})")

if __name__ == "__main__":
    create_qr_v4_l("https://talenthub-gray.vercel.app", "D:/TalentHub/qr_demo.png")
