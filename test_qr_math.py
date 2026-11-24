# Pure python QR code generator for standard URLs
# Generates a QR Code Version 3/4 matrix and saves as PIL Image

import math
from PIL import Image, ImageDraw

# Standard GF(256) tables for QR ECC
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

def gf_poly_mul(p, q):
    r = [0] * (len(p) + len(q) - 1)
    for j in range(len(q)):
        for i in range(len(p)):
            r[i + j] ^= gf_mul(p[i], q[j])
    return r

def rs_generator_poly(nsym):
    g = [1]
    for i in range(nsym):
        g = gf_poly_mul(g, [1, GF256_EXP[i]])
    return g

def rs_encode(msg, nsym):
    gen = rs_generator_poly(nsym)
    out = [0] * (len(msg) + nsym)
    out[:len(msg)] = msg
    for i in range(len(msg)):
        coef = out[i]
        if coef != 0:
            for j in range(len(gen)):
                out[i + j] ^= gf_mul(gen[j], coef)
    return out[len(msg):]

print("GF and RS loaded successfully")
