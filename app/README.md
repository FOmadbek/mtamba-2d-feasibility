# Brain Tumor Segmentation + IDH Analysis

Full-stack deployment of the MTamba 2D feasibility model.

## Project Structure

```
.
├── src/                  # React frontend
│   ├── components/
│   │   ├── UploadPage.tsx      # File upload + mode selection
│   │   ├── ViewerPage.tsx      # Results layout
│   │   ├── MriViewer.tsx       # Slice display + mask overlay
│   │   ├── MetricsSidebar.tsx  # IDH / volume / triage
│   │   ├── DicomSidebar.tsx    # Series list
│   │   └── Navbar.tsx
│   └── App.tsx
├── server/               # Python FastAPI backend
│   ├── main.py           # Upload, preprocess, inference
│   └── requirements.txt
├── work/                 # Model checkpoint (best.pt)
│   └── best.pt
└── dist/                 # Built frontend
```

## Prerequisites

- Python 3.10+ with PyTorch (CUDA if available)
- Node.js 20+
- Trained model: `work/best.pt` (from the Jupyter notebook)

## Setup

### 1. Backend (Python)

```bash
cd server
pip install -r requirements.txt
```

### 2. Frontend (Node)

```bash
npm install
```

## Running

### Terminal 1 — Backend

```bash
cd server
uvicorn main:app --reload --port 8000
```

Health check: http://localhost:8000/api/health

### Terminal 2 — Frontend

```bash
npm run dev
```

Open http://localhost:3000

## Usage

1. Upload 4 NIfTI files (FLAIR, T1CE, T1, T2) or a folder containing them.
2. Select inference mode:
   - **Full 4-modalities**: best accuracy
   - **FLAIR only**: single-scan low-resource mode
   - **T2 + FLAIR**: no contrast dye
   - **No T1CE**: contrast-free
3. Click "Run Segmentation & IDH Analysis"
4. Results:
   - **MRI viewer**: navigate slices, toggle mask overlay
   - **IDH status**: mutant/wildtype probability
   - **Triage**: auto-accept or refer to radiologist
   - **Tumor volume**: in cc

## API

`POST /api/infer`

Form data:
- `files`: NIfTI files (.nii / .nii.gz)
- `mode`: one of `full-4`, `flair-only`, `t2+flair`, `no-t1ce`

Response:
- `subject_id`, `slice_count`, `slices[]` (base64 PNGs), `idh` (prob/confidence/triage), `tumor_volume_cc`

## Notes

- The model expects files with keywords in their names: `flair`, `t1c`/`t1ce`, `t1`, `t2`.
- Missing modalities are auto-filled with zeros based on the selected mode.
- If `best.pt` is not found, the server starts but inference will be random.
