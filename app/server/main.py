import os, io, base64, tempfile, json, re
from typing import List, Optional
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import nibabel as nib

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).parent.parent
WORK_DIR = Path(os.getenv("WORK_DIR", str(PROJECT_ROOT / "work")))
MODEL_PATH = WORK_DIR / "best.pt"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CHANNEL_ORDER = ["flair", "t1ce", "t1", "t2"]
LABEL_MAP = {1: 1, 2: 2, 3: 4}
CROP_SIZE = 160
OUT_SIZE = 128
MIN_TUMOR_VOX = 50
MIN_SLICES = 5

# ---------------------------------------------------------------------------
# MODEL
# ---------------------------------------------------------------------------
class ConvBlock(nn.Module):
    def __init__(self, i, o):
        super().__init__()
        self.b = nn.Sequential(
            nn.Conv2d(i, o, 3, padding=1), nn.BatchNorm2d(o), nn.ReLU(inplace=True),
            nn.Conv2d(o, o, 3, padding=1), nn.BatchNorm2d(o), nn.ReLU(inplace=True))
    def forward(self, x):
        return self.b(x)

class UNet2D(nn.Module):
    def __init__(self):
        super().__init__()
        w = (32, 64, 128, 256)
        self.e1 = ConvBlock(4, w[0]); self.e2 = ConvBlock(w[0], w[1])
        self.e3 = ConvBlock(w[1], w[2]); self.e4 = ConvBlock(w[2], w[3])
        self.pool = nn.MaxPool2d(2)
        self.up = nn.Upsample(scale_factor=2, mode="bilinear", align_corners=False)
        self.d3 = ConvBlock(w[3] + w[2], w[2]); self.d2 = ConvBlock(w[2] + w[1], w[1])
        self.d1 = ConvBlock(w[1] + w[0], w[0])
        self.out = nn.Conv2d(w[0], 4, 1)
        self.drop = nn.Dropout(0.2)
        self.idh_head = nn.Sequential(nn.Linear(w[0], 128), nn.ReLU(inplace=True),
                                      nn.Dropout(0.2), nn.Linear(128, 2))
    def forward(self, x):
        e1 = self.e1(x); e2 = self.e2(self.pool(e1)); e3 = self.e3(self.pool(e2)); e4 = self.e4(self.pool(e3))
        d3 = self.d3(torch.cat([self.up(e4), e3], 1))
        d2 = self.d2(torch.cat([self.up(d3), e2], 1))
        d1 = self.d1(torch.cat([self.up(d2), e1], 1))
        f = d1.mean(dim=(2, 3))
        return self.out(d1), self.idh_head(self.drop(f))

# ---------------------------------------------------------------------------
# LOAD MODEL
# ---------------------------------------------------------------------------
model = UNet2D().to(DEVICE)
model.eval()

if MODEL_PATH.exists():
    ckpt = torch.load(MODEL_PATH, map_location=DEVICE)
    model.load_state_dict(ckpt["model"])
    print(f"Loaded model from {MODEL_PATH}, best WT-Dice: {ckpt.get('val_wt', 'N/A')}")
else:
    print(f"WARNING: {MODEL_PATH} not found. Model is untrained.")

# ---------------------------------------------------------------------------
# PREPROCESSING HELPERS
# ---------------------------------------------------------------------------
def zscore(vol):
    brain = vol[vol > 0]
    if brain.size < 100:
        return vol.astype(np.float32)
    out = (vol - brain.mean()) / (brain.std() + 1e-8)
    out[vol == 0] = 0
    return out.astype(np.float32)

def nib_load(data: bytes):
    with tempfile.NamedTemporaryFile(suffix=".nii.gz", delete=False) as f:
        f.write(data)
        p = f.name
    try:
        return np.asanyarray(nib.load(p).dataobj)
    finally:
        os.unlink(p)

def find_file_by_name(files: List[UploadFile], keywords: List[str], exclude: List[str] = None):
    exclude = exclude or []
    for f in files:
        b = f.filename.lower()
        if any(k in b for k in keywords) and not any(e in b for e in exclude):
            return f
    return None

def resolve_files(files: List[UploadFile]):
    return {
        "flair": find_file_by_name(files, ["flair"]),
        "t1ce": find_file_by_name(files, ["t1c", "t1ce", "t1gd", "t1_gd", "t1+c"]),
        "t1": find_file_by_name(files, ["t1"], exclude=["t1c", "t1ce", "t1gd", "t1_gd", "t1+c"]),
        "t2": find_file_by_name(files, ["t2"], exclude=["flair"]),
        "seg": find_file_by_name(files, ["tumor_segmentation", "tumor"], exclude=["parenchyma"]),
    }

def preprocess_subject(files: List[UploadFile]):
    resolved = resolve_files(files)
    if resolved["flair"] is None:
        raise ValueError("FLAIR sequence not found. Please upload files with 'flair' in the name.")
    
    # Load all available modalities first
    loaded = {}
    for k in CHANNEL_ORDER:
        f = resolved[k]
        if f is not None:
            f.file.seek(0)
            loaded[k] = zscore(nib_load(f.file.read()))
    
    ref_shape = loaded["flair"].shape
    vols = []
    for k in CHANNEL_ORDER:
        if k in loaded:
            vols.append(loaded[k])
        else:
            vols.append(np.zeros(ref_shape, dtype=np.float32))
    
    shape = vols[0].shape
    if any(v.shape != shape for v in vols):
        raise ValueError(f"Shape mismatch across modalities. Expected {shape}, got {[v.shape for v in vols]}")
    
    seg = None
    if resolved["seg"] is not None:
        resolved["seg"].file.seek(0)
        seg = nib_load(resolved["seg"].file.read()).astype(np.int16)
        for k, v in LABEL_MAP.items():
            seg[seg == k] = v
        if seg.shape != shape:
            seg = None
    
    C = CROP_SIZE
    imgs, labs, centers = [], [], []
    for z in range(shape[2]):
        lab_sl = seg[:, :, z] if seg is not None else vols[0][:, :, z] > 0
        if (lab_sl > 0).sum() < MIN_TUMOR_VOX:
            continue
        ys, xs = np.where(lab_sl > 0)
        cy, cx = int(ys.mean()), int(xs.mean())
        y0, x0 = cy - C // 2, cx - C // 2
        y0, x0 = max(0, min(y0, shape[0] - C)), max(0, min(x0, shape[1] - C))
        sl = np.stack([v[y0:y0 + C, x0:x0 + C, z] for v in vols], axis=-1)
        imgs.append(sl.astype(np.float32))
        labs.append((lab_sl[y0:y0 + C, x0:x0 + C] if seg is not None else np.zeros((C, C), dtype=np.uint8)))
        centers.append((y0, x0, z))
    
    if len(imgs) < MIN_SLICES:
        raise ValueError(f"Only {len(imgs)} tumor slices found (min {MIN_SLICES}). Tumor may be too small or files incorrect.")
    
    return np.stack(imgs), np.stack(labs) if seg is not None else None, centers

def center_crop(img, lab=None):
    m = (CROP_SIZE - OUT_SIZE) // 2
    img = img[m:m + OUT_SIZE, m:m + OUT_SIZE]
    lab = lab[m:m + OUT_SIZE, m:m + OUT_SIZE] if lab is not None else None
    return img, lab

# ---------------------------------------------------------------------------
# VISUALIZATION
# ---------------------------------------------------------------------------
def slice_to_png(arr: np.ndarray, cmap="gray") -> str:
    """Normalize array to 0-255 and return base64 PNG."""
    arr = arr.astype(np.float32)
    amin, amax = arr.min(), arr.max()
    if amax > amin:
        arr = (arr - amin) / (amax - amin)
    else:
        arr = np.zeros_like(arr)
    arr = (arr * 255).astype(np.uint8)
    im = Image.fromarray(arr)
    if cmap == "rgb":
        im = im.convert("RGB")
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")

def mask_to_rgba(mask: np.ndarray) -> str:
    """Create colored mask overlay. 1=NET(red), 2=edema(green), 4=ET(blue)."""
    h, w = mask.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    # NET - red
    rgba[mask == 1] = [255, 40, 40, 220]
    # Edema - green
    rgba[mask == 2] = [40, 255, 40, 220]
    # ET - blue
    rgba[mask == 4] = [40, 80, 255, 240]
    im = Image.fromarray(rgba, mode="RGBA")
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")

# ---------------------------------------------------------------------------
# INFERENCE
# ---------------------------------------------------------------------------
def run_inference(imgs: np.ndarray, mode: str = "full-4"):
    """imgs: (N, 160, 160, 4)"""
    mode_map = {
        "full-4": [1, 1, 1, 1],
        "flair-only": [1, 0, 0, 0],
        "t2+flair": [1, 0, 0, 1],
        "no-t1ce": [1, 0, 1, 1],
    }
    keep = mode_map.get(mode, [1, 1, 1, 1])
    
    processed = []
    for i in range(len(imgs)):
        img, _ = center_crop(imgs[i])
        processed.append(img.transpose(2, 0, 1) * np.array(keep)[:, None, None])
    
    x = torch.from_numpy(np.stack(processed)).float().to(DEVICE)
    
    seg_logits = []
    idh_probs = []
    with torch.no_grad(), torch.autocast("cuda", dtype=torch.bfloat16) if DEVICE.type == "cuda" else torch.no_grad():
        for i in range(0, len(x), 8):
            seg, p_idh = model(x[i:i + 8])
            seg_logits.append(seg.float().cpu())
            idh_probs.append(F.softmax(p_idh.float(), 1)[:, 1].cpu().numpy())
    
    seg_pred = torch.cat(seg_logits).argmax(1).numpy()
    seg_pred = np.where(seg_pred == 3, 4, seg_pred).astype(np.uint8)
    idh_prob = float(np.concatenate(idh_probs).mean())
    idh_conf = max(idh_prob, 1 - idh_prob)
    triage = "accept" if idh_conf >= 0.6 else "refer"
    
    return seg_pred, idh_prob, idh_conf, triage

# ---------------------------------------------------------------------------
# FASTAPI APP
# ---------------------------------------------------------------------------
app = FastAPI(title="Brain Tumor Segmentation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InferenceResponse(BaseModel):
    subject_id: str
    slice_count: int
    mode: str
    slices: List[dict]
    idh: dict
    tumor_volume_voxels: int
    tumor_volume_cc: float

@app.get("/api/health")
def health():
    return {"status": "ok", "device": str(DEVICE), "model_loaded": MODEL_PATH.exists()}

@app.post("/api/infer", response_model=InferenceResponse)
async def infer(
    files: List[UploadFile] = File(...),
    mode: str = Form("full-4"),
    subject_id: Optional[str] = Form(None),
):
    if not files:
        raise ValueError("No files uploaded")
    
    sid = subject_id or files[0].filename.split(".")[0]
    
    # Preprocess
    imgs, labs, centers = preprocess_subject(files)
    
    # Inference
    seg_pred, idh_prob, idh_conf, triage = run_inference(imgs, mode)
    
    # Build slice data
    slice_data = []
    for i in range(len(imgs)):
        img_cropped, _ = center_crop(imgs[i])
        # Use FLAIR channel for display
        display_img = img_cropped[:, :, 0]
        mask = seg_pred[i]
        slice_data.append({
            "index": i,
            "original": f"data:image/png;base64,{slice_to_png(display_img)}",
            "mask": f"data:image/png;base64,{mask_to_rgba(mask)}",
            "mask_classes": {"1": "NET", "2": "edema", "4": "ET"},
        })
    
    # Tumor volume in voxels (1mm^3 per voxel)
    tumor_voxels = int((seg_pred > 0).sum())
    tumor_cc = tumor_voxels * 0.001  # 1 voxel = 1 mm^3 = 0.001 cm^3 = 0.001 cc... actually 1 mm^3 = 0.001 cc
    # Actually 1 cm^3 = 1000 mm^3, so 1 mm^3 = 0.001 cm^3 = 0.001 cc (milliliter)
    tumor_cc = tumor_voxels * 0.001
    
    return InferenceResponse(
        subject_id=sid,
        slice_count=len(imgs),
        mode=mode,
        slices=slice_data,
        idh={
            "probability": round(idh_prob, 4),
            "prediction": "mutant" if idh_prob >= 0.5 else "wildtype",
            "confidence": round(idh_conf, 4),
            "triage": triage,
        },
        tumor_volume_voxels=tumor_voxels,
        tumor_volume_cc=round(tumor_cc, 2),
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
